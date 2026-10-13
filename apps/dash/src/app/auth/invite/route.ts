/**
 * Route Handler: Invitación por Magic Link (Sin Contraseña)
 * Chekdor v2.0 - apps/dash Next.js 16.4
 * Runtime: Node.js (no Edge)
 * Restringido a rol 'contador' (titular del despacho)
 */
import { NextResponse } from 'next/server';
import { assertRole } from '../../../lib/supabase/session';
import { invitarUsuarioDespacho } from '../../../lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1. Validar que quien invita tenga rol 'contador'
    const session = await assertRole(['contador']);

    const body = await request.json();
    const { email, rol, empresa_id } = body;

    if (!email || !rol) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      );
    }

    if (rol !== 'contador_junior' && rol !== 'admin_empresa') {
      return NextResponse.json(
        { error: "El rol invitado debe ser 'contador_junior' o 'admin_empresa'" },
        { status: 400 }
      );
    }

    if (rol === 'admin_empresa' && !empresa_id) {
      return NextResponse.json(
        { error: "Para el rol 'admin_empresa' debe especificarse obligatoriamente la empresa_id asignada" },
        { status: 400 }
      );
    }

    // 2. Invitar vía Magic Link sin password
    const invitedUser = await invitarUsuarioDespacho(
      session.despachoId,
      session.userId,
      {
        email,
        rol,
        empresa_id,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Invitación por Magic Link enviada a ${email} con rol ${rol}`,
      user: invitedUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar invitación';
    const status = message.includes('403') ? 403 : message.includes('401') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
