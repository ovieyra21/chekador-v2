/**
 * Cliente Supabase Administrativo con Service Role Key
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Utilizado para emitir invitaciones por Magic Link (sin password) y gestión de roles
 * Runtime: Node.js (Privilegiado del Servidor)
 */
import { createClient } from '@supabase/supabase-js';
import { InviteUserRequest } from '../../types/auth';

export const runtime = 'nodejs';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.chekdor.internal';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key-chekdor-2026';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Invita a un usuario a un despacho específico mediante Magic Link.
 * No requiere contraseña previa.
 */
export async function invitarUsuarioDespacho(
  despachoId: string,
  invitadorUserId: string,
  request: InviteUserRequest
) {
  const adminSupabase = createAdminClient();

  if (request.rol === 'admin_empresa' && !request.empresa_id) {
    throw new Error('El rol admin_empresa requiere especificar obligatoriamente un empresa_id');
  }

  const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(request.email, {
    redirectTo: request.redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
    data: {
      is_invited: true,
      despacho_id: despachoId,
      rol: request.rol,
      empresa_id: request.empresa_id || null,
      invitado_por: invitadorUserId,
    },
  });

  if (error) {
    throw new Error(`Error al enviar invitación por Magic Link: ${error.message}`);
  }

  return data.user;
}
