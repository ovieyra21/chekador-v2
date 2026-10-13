/**
 * Cliente Supabase para el Servidor (Server Components, Route Handlers, Server Actions)
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Runtime estricto: Node.js (no Edge)
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.chekdor.internal';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-chekdor-2026';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions)
          );
        } catch {
          // Si se llama desde un Server Component puro, setAll puede ignorarse;
          // el Middleware se encarga de refrescar las cookies en la respuesta HTTP.
        }
      },
    },
  });
}
