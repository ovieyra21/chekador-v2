/**
 * Next.js 16.4 Middleware - Chekdor v2.0
 * Runtime: Node.js default (no Edge)
 * Gestiona autenticación con Supabase, actualización de cookies,
 * RBAC por rol ('contador' | 'contador_junior' | 'admin_empresa')
 * y prevención de cruce de datos entre empresas.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { UserRole } from './types/auth';

// Runtime explícito Node.js (no Edge)
export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto archivos estáticos, favicon y assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Rutas públicas de autenticación
  const isAuthRoute =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup') ||
    pathname.startsWith('/auth/callback');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.chekdor.internal';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-chekdor-2026';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validar sesión con el token JWT
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Redirigir a login si no hay sesión y se intenta acceder a ruta protegida
  if (!user && !isAuthRoute && pathname !== '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Si ya está autenticado e intenta ir a login/signup, redirigir al dashboard
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Si está autenticado, validar permisos RBAC y Tenancy
  if (user) {
    const appMeta = user.app_metadata || {};
    const userMeta = user.user_metadata || {};

    const despachoId = (appMeta.despacho_id || userMeta.despacho_id) as string | undefined;
    const rol = (appMeta.rol || userMeta.rol || 'contador') as UserRole;
    const empresaIdAsignada = (appMeta.empresa_id || userMeta.empresa_id) as string | undefined;

    // Inyectar claims verificados en las cabeceras de la petición hacia Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    if (despachoId) requestHeaders.set('x-despacho-id', despachoId);
    requestHeaders.set('x-user-role', rol);
    if (empresaIdAsignada) requestHeaders.set('x-empresa-id', empresaIdAsignada);

    // Candado para rol 'admin_empresa':
    // Solo puede ver asistencia y resumen neto de nómina de SU empresa asignada.
    // Bloqueado para contabilidad, pólizas CONTPAQi de despacho y configuración.
    if (rol === 'admin_empresa') {
      const isRestrictedForAdminEmpresa =
        pathname.startsWith('/contabilidad') ||
        pathname.startsWith('/configuracion') ||
        pathname.startsWith('/invitaciones');

      if (isRestrictedForAdminEmpresa) {
        const forbiddenUrl = request.nextUrl.clone();
        forbiddenUrl.pathname = '/dashboard';
        forbiddenUrl.searchParams.set('error', 'acceso_restringido_rol');
        return NextResponse.redirect(forbiddenUrl);
      }

      // Validar que no intente consultar otra empresa mediante query param ?empresa_id=...
      const requestedEmpresaId = request.nextUrl.searchParams.get('empresa_id');
      if (requestedEmpresaId && requestedEmpresaId !== empresaIdAsignada) {
        const forbiddenUrl = request.nextUrl.clone();
        forbiddenUrl.pathname = '/dashboard';
        forbiddenUrl.searchParams.set('error', 'cruce_empresas_no_autorizado');
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    // Candado para rol 'contador_junior':
    // No puede acceder a configuración de despacho ni invitar nuevos usuarios
    if (rol === 'contador_junior') {
      const isRestrictedForJunior =
        pathname.startsWith('/configuracion/despacho') ||
        pathname.startsWith('/invitaciones');

      if (isRestrictedForJunior) {
        const forbiddenUrl = request.nextUrl.clone();
        forbiddenUrl.pathname = '/dashboard';
        forbiddenUrl.searchParams.set('error', 'requiere_permiso_contador_titular');
        return NextResponse.redirect(forbiddenUrl);
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response;
}
