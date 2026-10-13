/**
 * Route Handler: Registro de Usuario y Creación Automática de Despacho
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Runtime: Node.js (no Edge)
 */
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, despacho_nombre } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Registro con Supabase Auth
    // El trigger en PostgreSQL 'handle_new_auth_user' creará automáticamente
    // el despacho en public.despachos y asignará el rol 'contador'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          despacho_nombre: despacho_nombre || `Despacho ${email.split('@')[0]}`,
          is_invited: false,
          rol: 'contador',
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado. Despacho creado automáticamente mediante trigger.',
      user: data.user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
