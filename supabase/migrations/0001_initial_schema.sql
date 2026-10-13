-- ====================================================================
-- CHEKDOR v2.0 - SUPABASE MIGRATION 0001: INITIAL SCHEMA
-- Cumplimiento LFT DOF 1 mayo 2026 art 132 fr XXXIV obligatorio 1-ene-2027
-- Multa art 994 fr IV Bis $28,285-$565,700 MXN por trabajador
-- ====================================================================

-- 1. Habilitar extensión pgcrypto para UUIDs y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- TABLA: DESPACHOS CONTABLES
-- ====================================================================
CREATE TABLE public.despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- TABLA: EMPRESAS CLIENTE
-- ====================================================================
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID NOT NULL REFERENCES public.despachos(id) ON DELETE CASCADE,
    rfc TEXT NOT NULL CHECK (rfc ~ '^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$'),
    nombre TEXT NOT NULL,
    catalogo_base TEXT NOT NULL CHECK (catalogo_base IN ('510-001', '6000-01-001')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta rápida multi-tenant
CREATE INDEX idx_empresas_despacho_id ON public.empresas(despacho_id);
CREATE INDEX idx_empresas_rfc ON public.empresas(rfc);

-- ====================================================================
-- TABLA: TRABAJADORES (Padrón Laboral SAT / IMSS)
-- ====================================================================
CREATE TABLE public.trabajadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    rfc TEXT NOT NULL,
    curp TEXT NOT NULL CHECK (char_length(curp) = 18),
    nss TEXT NOT NULL CHECK (char_length(nss) = 11),
    nombre TEXT NOT NULL,
    salario_diario NUMERIC(12, 2) NOT NULL CHECK (salario_diario > 0),
    sbc NUMERIC(12, 2) NOT NULL CHECK (sbc >= salario_diario),
    banco TEXT NOT NULL,
    cuenta_clabe TEXT NOT NULL CHECK (char_length(cuenta_clabe) = 18),
    nfc_uid TEXT UNIQUE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_trabajadores_empresa_id ON public.trabajadores(empresa_id);
CREATE INDEX idx_trabajadores_nfc_uid ON public.trabajadores(nfc_uid);

-- ====================================================================
-- TABLA: MARCAJES (Registro Electrónico Inmutable de Asistencia)
-- LFT Reforma 1 mayo 2026 art 132 fr XXXIV - Prueba Plena Art. 805 LFT
-- ====================================================================
CREATE TABLE public.marcajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trabajador_id UUID NOT NULL REFERENCES public.trabajadores(id) ON DELETE RESTRICT,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    hash_sha256 TEXT NOT NULL,
    dispositivo_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_marcajes_empresa_id ON public.marcajes(empresa_id);
CREATE INDEX idx_marcajes_trabajador_id ON public.marcajes(trabajador_id);
CREATE INDEX idx_marcajes_timestamp_utc ON public.marcajes(timestamp_utc);

-- TRIGGER POSTGRESQL INMUTABLE: BLOQUEA UPDATE Y DELETE FOR EACH STATEMENT
CREATE OR REPLACE FUNCTION trg_bloquear_mutacion_marcajes()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACION LFT ART 132 FR XXXIV: La tabla marcajes es estrictamente inmutable. Queda prohibido cualquier UPDATE o DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_marcajes
BEFORE UPDATE ON public.marcajes
FOR EACH STATEMENT EXECUTE FUNCTION trg_bloquear_mutacion_marcajes();

CREATE TRIGGER trg_no_delete_marcajes
BEFORE DELETE ON public.marcajes
FOR EACH STATEMENT EXECUTE FUNCTION trg_bloquear_mutacion_marcajes();

-- ====================================================================
-- TABLA: LFT TOPES (Parámetros Legales Anuales LFT y Tarifa ISR)
-- ====================================================================
CREATE TABLE public.lft_topes (
    ejercicio INT PRIMARY KEY,
    jornada_max INT NOT NULL DEFAULT 12,
    extra_max_dia INT NOT NULL DEFAULT 4,
    tope_semanal INT NOT NULL DEFAULT 9,
    uma NUMERIC(10, 2) NOT NULL DEFAULT 113.14,
    tarifa_isr JSONB NOT NULL
);

-- ====================================================================
-- TABLA: CATALOGO CUENTAS (Mapeo Contable por Empresa)
-- ====================================================================
CREATE TABLE public.catalogo_cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL CHECK (concepto IN ('sueldo', 'extra', 'prima', 'isr', 'imss', 'neto')),
    cuenta_contable TEXT NOT NULL,
    CONSTRAINT uq_empresa_concepto UNIQUE (empresa_id, concepto)
);

CREATE INDEX idx_catalogo_cuentas_empresa_id ON public.catalogo_cuentas(empresa_id);

-- ====================================================================
-- SEGURIDAD ROW-LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ====================================================================
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lft_topes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_cuentas ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento por tenant
CREATE POLICY despachos_owner_policy ON public.despachos
    FOR ALL
    USING (owner_user_id = auth.uid());

CREATE POLICY empresas_tenant_policy ON public.empresas
    FOR ALL
    USING (
        despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        OR id = (auth.jwt() ->> 'empresa_id')::uuid
    );

CREATE POLICY trabajadores_tenant_policy ON public.trabajadores
    FOR ALL
    USING (
        empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
        OR empresa_id IN (
            SELECT id FROM public.empresas 
            WHERE despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        )
    );

CREATE POLICY marcajes_tenant_policy ON public.marcajes
    FOR ALL
    USING (
        empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
        OR empresa_id IN (
            SELECT id FROM public.empresas 
            WHERE despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        )
    );

CREATE POLICY catalogo_cuentas_tenant_policy ON public.catalogo_cuentas
    FOR ALL
    USING (
        empresa_id = (auth.jwt() ->> 'empresa_id')::uuid
        OR empresa_id IN (
            SELECT id FROM public.empresas 
            WHERE despacho_id IN (SELECT id FROM public.despachos WHERE owner_user_id = auth.uid())
        )
    );

CREATE POLICY lft_topes_read_policy ON public.lft_topes
    FOR SELECT
    USING (true);

-- ====================================================================
-- SEED DATA INICIAL
-- 1. Despacho demo
-- 2. Empresa demo Comercializadora del Bajío RFC DEMO260101AB1
-- 3. Parámetros LFT Topes 2026 (UMA 113.14 + Tarifa ISR Quincenal 2026)
-- 4. Catálogo de cuentas contables 510-001
-- * NO DATOS DE TRABAJADORES AÚN (Tabla trabajadores vacía)
-- ====================================================================

-- 1. Despacho base
INSERT INTO public.despachos (id, owner_user_id, nombre)
VALUES (
    'd0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'Sánchez & Asociados S.C.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Empresa demo Comercializadora del Bajío
INSERT INTO public.empresas (id, despacho_id, rfc, nombre, catalogo_base)
VALUES (
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'd0000000-0000-0000-0000-000000000001'::uuid,
    'DEMO260101AB1',
    'Comercializadora del Bajío S.A. de C.V.',
    '510-001'
) ON CONFLICT (id) DO NOTHING;

-- 3. LFT Topes 2026
INSERT INTO public.lft_topes (ejercicio, jornada_max, extra_max_dia, tope_semanal, uma, tarifa_isr)
VALUES (
    2026,
    12,
    4,
    9,
    113.14,
    '[
        {"limite_inferior": 0.01, "limite_superior": 368.10, "cuota_fija": 0.00, "porcentaje": 1.92},
        {"limite_inferior": 368.11, "limite_superior": 3124.35, "cuota_fija": 7.05, "porcentaje": 6.40},
        {"limite_inferior": 3124.36, "limite_superior": 5490.75, "cuota_fija": 183.45, "porcentaje": 10.88},
        {"limite_inferior": 5490.76, "limite_superior": 6382.80, "cuota_fija": 440.85, "porcentaje": 16.00},
        {"limite_inferior": 6382.81, "limite_superior": 6532.95, "cuota_fija": 583.50, "porcentaje": 16.00},
        {"limite_inferior": 6532.96, "limite_superior": 7642.95, "cuota_fija": 586.20, "porcentaje": 17.92},
        {"limite_inferior": 7642.96, "limite_superior": 13238.10, "cuota_fija": 785.10, "porcentaje": 21.36},
        {"limite_inferior": 13238.11, "limite_superior": 17482.05, "cuota_fija": 1980.30, "porcentaje": 23.52},
        {"limite_inferior": 17482.06, "limite_superior": 33383.10, "cuota_fija": 2978.55, "porcentaje": 30.00},
        {"limite_inferior": 33383.11, "limite_superior": 44510.70, "cuota_fija": 7748.85, "porcentaje": 32.00},
        {"limite_inferior": 44510.71, "limite_superior": 99999999.00, "cuota_fija": 11309.70, "porcentaje": 35.00}
    ]'::jsonb
) ON CONFLICT (ejercicio) DO UPDATE
SET uma = EXCLUDED.uma, tarifa_isr = EXCLUDED.tarifa_isr;

-- 4. Catálogo Cuentas 510-001 para la empresa demo
INSERT INTO public.catalogo_cuentas (empresa_id, concepto, cuenta_contable)
VALUES 
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'sueldo', '510-001-001'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'extra',  '510-001-002'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'prima',  '510-001-003'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'isr',    '210-001-001'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'imss',   '210-002-001'),
    ('e0000000-0000-0000-0000-000000000001'::uuid, 'neto',   '110-001-002')
ON CONFLICT (empresa_id, concepto) DO NOTHING;
