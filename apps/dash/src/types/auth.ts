/**
 * Chekdor v2.0 - Tipos de Autenticación, Roles y Tenants
 * Supabase Auth + Multi-Tenant RLS por Despacho y Empresa
 */

export type UserRole = 'contador' | 'contador_junior' | 'admin_empresa';

export interface DespachoClaims {
  despacho_id: string;
  rol: UserRole;
  empresa_id?: string | null;
}

export interface DespachoMiembro {
  id: string;
  despacho_id: string;
  user_id: string;
  rol: UserRole;
  empresa_id?: string | null;
  invitado_por?: string | null;
  created_at: string;
  user?: {
    email?: string;
  };
}

export interface InviteUserRequest {
  email: string;
  rol: 'contador_junior' | 'admin_empresa';
  empresa_id?: string; // Requerido si el rol es admin_empresa
  redirectTo?: string;
}

export interface AuthSessionContext {
  userId: string;
  email: string;
  despachoId: string;
  rol: UserRole;
  empresaId?: string | null;
}
