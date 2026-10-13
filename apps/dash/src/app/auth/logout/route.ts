/**
 * Route Handler: Cierre de Sesión
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Runtime: Node.js (no Edge)
 */
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const requestUrl = new URL(request.url);
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin), {
    status: 303,
  });
}
