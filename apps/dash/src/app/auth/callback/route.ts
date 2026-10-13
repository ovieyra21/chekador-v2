/**
 * Route Handler: Auth Callback para Magic Links y PKCE Exchange
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Runtime: Node.js (no Edge)
 */
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Si hay error en el exchange, redirigir al login con mensaje
  return NextResponse.redirect(
    new URL('/auth/login?error=enlace_magico_invalido_o_expirado', requestUrl.origin)
  );
}
