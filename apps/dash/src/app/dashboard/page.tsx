import React from 'react';
import { getAuthSessionContext } from '../../lib/supabase/session';
import { createClient } from '../../lib/supabase/server';

export const runtime = 'nodejs';

export default async function DashboardPage() {
  const session = await getAuthSessionContext();
  const supabase = await createClient();

  // Consultar empresas accesibles bajo las políticas RLS del usuario actual
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, rfc, nombre, catalogo_base, created_at');

  // Consultar miembros del despacho
  const { data: miembros } = await supabase
    .from('despacho_miembros')
    .select('id, rol, empresa_id, user_id, created_at');

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#FAFAF9] p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header de Sesión y Rol */}
        <div className="flex items-center justify-between border-b border-[#44403C] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C2410C] text-white flex items-center justify-center font-bold font-mono">
              Ch
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif">Chekdor v2.0 Dashboard</h1>
              <p className="text-xs text-[#A8A29E] font-mono">
                Aislamiento Multi-Tenant Postgres RLS • Next.js 16.4 Node Runtime
              </p>
            </div>
          </div>

          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#292524] hover:bg-[#44403C] border border-[#57534E] text-xs font-mono rounded text-[#D6D3D1]"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>

        {/* Tarjetas de Contexto RLS y Claims JWT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#292524] border border-[#44403C] rounded-lg p-4">
            <span className="text-[11px] font-mono uppercase text-[#A8A29E] tracking-wider block">
              Rol del Usuario (RBAC)
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded uppercase ${
                  session?.rol === 'contador'
                    ? 'bg-[#C2410C]/20 border border-[#C2410C] text-[#FB923C]'
                    : session?.rol === 'contador_junior'
                    ? 'bg-blue-950/40 border border-blue-700 text-blue-300'
                    : 'bg-purple-950/40 border border-purple-700 text-purple-300'
                }`}
              >
                {session?.rol || 'contador'}
              </span>
              <span className="text-xs text-[#78716C] font-mono">
                {session?.rol === 'contador'
                  ? 'Admin Despacho (CRUD)'
                  : session?.rol === 'contador_junior'
                  ? 'Operativo / Incidencias'
                  : 'Solo Lectura Empresa'}
              </span>
            </div>
          </div>

          <div className="bg-[#292524] border border-[#44403C] rounded-lg p-4">
            <span className="text-[11px] font-mono uppercase text-[#A8A29E] tracking-wider block">
              ID Despacho (JWT Claim)
            </span>
            <p className="mt-2 text-xs font-mono text-[#E7E5E4] truncate">
              {session?.despachoId || 'No asignado'}
            </p>
          </div>

          <div className="bg-[#292524] border border-[#44403C] rounded-lg p-4">
            <span className="text-[11px] font-mono uppercase text-[#A8A29E] tracking-wider block">
              Empresa Restringida
            </span>
            <p className="mt-2 text-xs font-mono text-[#E7E5E4] truncate">
              {session?.empresaId ? session.empresaId : 'Todas las del despacho'}
            </p>
          </div>
        </div>

        {/* Sección de Empresas Autorizadas por RLS */}
        <div className="bg-[#292524] border border-[#44403C] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-serif">Empresas Cliente Autorizadas</h2>
              <p className="text-xs text-[#A8A29E] font-mono">
                Filtradas estrictamente por PostgreSQL RLS en tiempo de ejecución
              </p>
            </div>
            <span className="text-xs font-mono text-[#D6D3D1] bg-[#1C1917] px-2.5 py-1 rounded border border-[#44403C]">
              Total visibles: {empresas?.length || 0}
            </span>
          </div>

          {(!empresas || empresas.length === 0) ? (
            <div className="text-center py-8 text-[#A8A29E] text-xs font-mono">
              No hay empresas registradas en este despacho. Todo inicia vacío.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#44403C] text-[#A8A29E] font-mono">
                    <th className="py-2 px-3">RFC</th>
                    <th className="py-2 px-3">Razón Social</th>
                    <th className="py-2 px-3">Catálogo Base</th>
                    <th className="py-2 px-3">ID Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#44403C]/50 font-mono">
                  {empresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#1C1917]/40">
                      <td className="py-2.5 px-3 font-semibold text-[#FB923C]">{emp.rfc}</td>
                      <td className="py-2.5 px-3">{emp.nombre}</td>
                      <td className="py-2.5 px-3">{emp.catalogo_base}</td>
                      <td className="py-2.5 px-3 text-[#78716C]">{emp.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sección de Invitaciones por Magic Link (Solo Contador) */}
        {session?.rol === 'contador' && (
          <div className="bg-[#292524] border border-[#44403C] rounded-lg p-6">
            <h2 className="text-lg font-bold font-serif mb-1">Invitar Usuario por Magic Link</h2>
            <p className="text-xs text-[#A8A29E] font-mono mb-4">
              Envía un enlace de acceso sin contraseña para incorporar contadores junior o administradores de empresa.
            </p>

            <form action="/auth/invite" method="POST" className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#D6D3D1] mb-1">Email Invitado</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="junior@despacho.com.mx"
                  className="w-full px-3 py-2 bg-[#1C1917] border border-[#44403C] rounded text-xs text-[#FAFAF9]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#D6D3D1] mb-1">Rol a Asignar</label>
                <select
                  name="rol"
                  required
                  className="w-full px-3 py-2 bg-[#1C1917] border border-[#44403C] rounded text-xs text-[#FAFAF9]"
                >
                  <option value="contador_junior">contador_junior (Incidencias y exportar)</option>
                  <option value="admin_empresa">admin_empresa (Solo lectura asistencia)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-[#C2410C] hover:bg-[#EA580C] text-white rounded text-xs font-mono font-medium"
                >
                  Enviar Magic Link
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
