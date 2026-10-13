/**
 * Manejo y Validación de Sesión, Claims JWT y Aislamiento de Empresas
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Runtime: Node.js
 */
import { createClient } from './server';
import { AuthSessionContext, UserRole } from '../../types/auth';

export const runtime = 'nodejs';

/**
 * Obtiene el contexto de sesión autenticado y los claims del tenant
 */
export async function getAuthSessionContext(): Promise<AuthSessionContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Extraer claims desde JWT o app_metadata / user_metadata
  const appMeta = user.app_metadata || {};
  const userMeta = user.user_metadata || {};

  let despachoId = appMeta.despacho_id || userMeta.despacho_id;
  let rol: UserRole = (appMeta.rol || userMeta.rol || 'contador') as UserRole;
  let empresaId = appMeta.empresa_id || userMeta.empresa_id || null;

  // Si no vienen en claims directos, consultar la tabla despacho_miembros
  if (!despachoId) {
    const { data: miembro } = await supabase
      .from('despacho_miembros')
      .select('despacho_id, rol, empresa_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (miembro) {
      despachoId = miembro.despacho_id;
      rol = miembro.rol;
      empresaId = miembro.empresa_id;
    } else {
      // Buscar si es owner directo del despacho
      const { data: despacho } = await supabase
        .from('despachos')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (despacho) {
        despachoId = despacho.id;
        rol = 'contador';
      }
    }
  }

  if (!despachoId) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email || '',
    despachoId,
    rol,
    empresaId,
  };
}

/**
 * Valida que el usuario tenga uno de los roles permitidos.
 * Lanza excepción si el rol no tiene privilegios.
 */
export async function assertRole(allowedRoles: UserRole[]): Promise<AuthSessionContext> {
  const session = await getAuthSessionContext();
  if (!session) {
    throw new Error('401 Unauthorized: Sesión requerida');
  }

  if (!allowedRoles.includes(session.rol)) {
    throw new Error(`403 Forbidden: El rol '${session.rol}' no tiene permisos para esta acción`);
  }

  return session;
}

/**
 * Candado anti-cruce de empresas:
 * Valida que la empresa pertenezca al despacho del usuario y que un admin_empresa
 * no intente acceder a otra razón social distinta a la suya.
 */
export async function assertEmpresaAccess(empresaId: string): Promise<AuthSessionContext> {
  const session = await getAuthSessionContext();
  if (!session) {
    throw new Error('401 Unauthorized: Sesión requerida');
  }

  // Restricción para admin_empresa: solo su empresa
  if (session.rol === 'admin_empresa') {
    if (session.empresaId !== empresaId) {
      throw new Error('403 Forbidden: Intento de cruce entre empresas no autorizado para admin_empresa');
    }
    return session;
  }

  // Para contador y contador_junior: verificar que la empresa pertenece al despacho
  const supabase = await createClient();
  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('id, despacho_id')
    .eq('id', empresaId)
    .single();

  if (error || !empresa || empresa.despacho_id !== session.despachoId) {
    throw new Error('403 Forbidden: La empresa no pertenece al despacho del usuario autenticado');
  }

  return session;
}
