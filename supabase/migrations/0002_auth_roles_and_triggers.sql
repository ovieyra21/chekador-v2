-- ====================================================================
-- CHEKDOR v2.0 - SUPABASE MIGRATION 0002: AUTH, ROLES & RLS
-- Flujo: Registro email+password -> Trigger crea despacho owner_user_id = auth.user
-- Roles: contador (admin despacho), contador_junior, admin_empresa
-- Invitaciones por Magic Link sin password
-- JWT con despacho_id y aislamiento estricto anti-cruce entre empresas
-- ====================================================================

-- 1. Tipo de Roles de Usuario
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('contador', 'contador_junior', 'admin_empresa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla de Membresías y Roles dentro del Despacho
CREATE TABLE IF NOT EXISTS public.despacho_miembros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID NOT NULL REFERENCES public.despachos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rol public.user_role NOT NULL DEFAULT 'contador',
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE, -- Restricción para admin_empresa
    invitado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_despacho_usuario UNIQUE (despacho_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_despacho_miembros_user_id ON public.despacho_miembros(user_id);
CREATE INDEX IF NOT EXISTS idx_despacho_miembros_despacho_id ON public.despacho_miembros(despacho_id);
CREATE INDEX IF NOT EXISTS idx_despacho_miembros_empresa_id ON public.despacho_miembros(empresa_id);

-- Habilitar RLS en despacho_miembros
ALTER TABLE public.despacho_miembros ENABLE ROW LEVEL SECURITY;

CREATE POLICY despacho_miembros_select_policy ON public.despacho_miembros
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR despacho_id IN (
            SELECT id FROM public.despachos WHERE owner_user_id = auth.uid()
        )
    );

CREATE POLICY despacho_miembros_admin_policy ON public.despacho_miembros
    FOR ALL
    USING (
        despacho_id IN (
            SELECT id FROM public.despachos WHERE owner_user_id = auth.uid()
            UNION
            SELECT despacho_id FROM public.despacho_miembros WHERE user_id = auth.uid() AND rol = 'contador'
        )
    );

-- 3. Funciones auxiliares de sesión y JWT (Seguridad RLS)
CREATE OR REPLACE FUNCTION public.current_user_despacho_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'despacho_id', '')::uuid,
        (SELECT despacho_id FROM public.despacho_miembros WHERE user_id = auth.uid() LIMIT 1),
        (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid() LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'rol', '')::public.user_role,
        (SELECT rol FROM public.despacho_miembros WHERE user_id = auth.uid() LIMIT 1),
        'contador'::public.user_role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_empresa_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'empresa_id', '')::uuid,
        (SELECT empresa_id FROM public.despacho_miembros WHERE user_id = auth.uid() LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Trigger en auth.users: Crea Despacho automáticamente al registrarse email+password
--    o asigna rol e invitación si fue registrado vía Magic Link
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
    v_despacho_id UUID;
    v_despacho_nombre TEXT;
    v_rol public.user_role;
    v_empresa_id UUID;
    v_is_invited BOOLEAN;
BEGIN
    v_is_invited := COALESCE((new.raw_user_meta_data->>'is_invited')::boolean, false);

    IF v_is_invited THEN
        -- Usuario invitado (Magic Link): Se integra al despacho existente sin crear uno nuevo
        v_despacho_id := (new.raw_user_meta_data->>'despacho_id')::uuid;
        v_rol := COALESCE((new.raw_user_meta_data->>'rol')::public.user_role, 'contador_junior'::public.user_role);
        v_empresa_id := NULLIF(new.raw_user_meta_data->>'empresa_id', '')::uuid;

        INSERT INTO public.despacho_miembros (despacho_id, user_id, rol, empresa_id, invitado_por)
        VALUES (
            v_despacho_id,
            new.id,
            v_rol,
            v_empresa_id,
            NULLIF(new.raw_user_meta_data->>'invitado_por', '')::uuid
        ) ON CONFLICT (despacho_id, user_id) DO UPDATE
        SET rol = EXCLUDED.rol, empresa_id = EXCLUDED.empresa_id;

    ELSE
        -- Usuario titular (email+password): Crea su despacho contable y se le asigna rol 'contador'
        v_despacho_nombre := COALESCE(
            NULLIF(new.raw_user_meta_data->>'despacho_nombre', ''),
            'Despacho Contable ' || split_part(new.email, '@', 1)
        );

        INSERT INTO public.despachos (owner_user_id, nombre)
        VALUES (new.id, v_despacho_nombre)
        RETURNING id INTO v_despacho_id;

        INSERT INTO public.despacho_miembros (despacho_id, user_id, rol)
        VALUES (v_despacho_id, new.id, 'contador')
        ON CONFLICT (despacho_id, user_id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Hook de Custom Claims para enriquecer el JWT de Supabase
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
    claims jsonb;
    v_user_id uuid;
    v_despacho_id uuid;
    v_rol text;
    v_empresa_id uuid;
BEGIN
    claims := event->'claims';
    v_user_id := (event->>'user_id')::uuid;

    SELECT despacho_id, rol::text, empresa_id
    INTO v_despacho_id, v_rol, v_empresa_id
    FROM public.despacho_miembros
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_despacho_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{despacho_id}', to_jsonb(v_despacho_id::text));
        claims := jsonb_set(claims, '{rol}', to_jsonb(v_rol));
        IF v_empresa_id IS NOT NULL THEN
            claims := jsonb_set(claims, '{empresa_id}', to_jsonb(v_empresa_id::text));
        END IF;
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

-- 6. ACTUALIZACIÓN DE POLÍTICAS RLS CON CONTROL DE ROLES ESTRICTO

-- EMPRESAS: Aislamiento por despacho_id y restricción admin_empresa
DROP POLICY IF EXISTS empresas_tenant_policy ON public.empresas;

CREATE POLICY empresas_select_policy ON public.empresas
    FOR SELECT
    USING (
        -- Si es admin_empresa, únicamente ve la empresa que tiene asignada
        (public.current_user_role() = 'admin_empresa' AND id = public.current_user_empresa_id())
        OR
        -- Si es contador o contador_junior, ve las empresas de su despacho
        (public.current_user_role() IN ('contador', 'contador_junior') AND despacho_id = public.current_user_despacho_id())
    );

CREATE POLICY empresas_insert_update_delete_policy ON public.empresas
    FOR ALL
    USING (
        -- Solo el contador puede crear/modificar empresas dentro de su despacho
        public.current_user_role() = 'contador'
        AND despacho_id = public.current_user_despacho_id()
    );

-- TRABAJADORES: No permite queries cruzar empresas
DROP POLICY IF EXISTS trabajadores_tenant_policy ON public.trabajadores;

CREATE POLICY trabajadores_select_policy ON public.trabajadores
    FOR SELECT
    USING (
        (public.current_user_role() = 'admin_empresa' AND empresa_id = public.current_user_empresa_id())
        OR
        (public.current_user_role() IN ('contador', 'contador_junior') AND empresa_id IN (
            SELECT id FROM public.empresas WHERE despacho_id = public.current_user_despacho_id()
        ))
    );

CREATE POLICY trabajadores_mutation_policy ON public.trabajadores
    FOR ALL
    USING (
        -- Solo el contador puede modificar datos maestros de trabajadores
        public.current_user_role() = 'contador'
        AND empresa_id IN (
            SELECT id FROM public.empresas WHERE despacho_id = public.current_user_despacho_id()
        )
    );

-- MARCAJES: Inmutables por trigger + RLS por rol
DROP POLICY IF EXISTS marcajes_tenant_policy ON public.marcajes;

CREATE POLICY marcajes_select_policy ON public.marcajes
    FOR SELECT
    USING (
        (public.current_user_role() = 'admin_empresa' AND empresa_id = public.current_user_empresa_id())
        OR
        (public.current_user_role() IN ('contador', 'contador_junior') AND empresa_id IN (
            SELECT id FROM public.empresas WHERE despacho_id = public.current_user_despacho_id()
        ))
    );

CREATE POLICY marcajes_insert_policy ON public.marcajes
    FOR INSERT
    WITH CHECK (
        -- Tanto contador como contador_junior pueden asentar marcajes de su despacho
        public.current_user_role() IN ('contador', 'contador_junior')
        AND empresa_id IN (
            SELECT id FROM public.empresas WHERE despacho_id = public.current_user_despacho_id()
        )
    );

-- CATALOGO DE CUENTAS: Exclusivo contable
DROP POLICY IF EXISTS catalogo_cuentas_tenant_policy ON public.catalogo_cuentas;

CREATE POLICY catalogo_cuentas_select_policy ON public.catalogo_cuentas
    FOR SELECT
    USING (
        public.current_user_role() IN ('contador', 'contador_junior')
        AND empresa_id IN (
            SELECT id FROM public.empresas WHERE despacho_id = public.current_user_despacho_id()
        )
    );

CREATE POLICY catalogo_cuentas_mutation_policy ON public.catalogo_cuentas
    FOR ALL
    USING (
        public.current_user_role() = 'contador'
        AND empresa_id IN (
            SELECT id FROM public.empresas WHERE despacho_id = public.current_user_despacho_id()
        )
    );
