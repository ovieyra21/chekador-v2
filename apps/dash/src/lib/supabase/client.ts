/**
 * Cliente Supabase para el navegador (Client Components)
 * Chekdor v2.0 - apps/dash Next.js 16.4
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.chekdor.internal';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-chekdor-2026';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
