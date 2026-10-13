import React from 'react';
import { Despacho, Empresa } from '../types';

export type NavTab = 'empresas' | 'trabajadores' | 'asistencia' | 'nomina' | 'contabilidad' | 'configuracion';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  despacho: Despacho;
  empresasCount: number;
  empresaSeleccionada: Empresa | null;
  onLogoutDespacho: () => void;
  onOpenAuditoria: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  despacho,
  empresasCount,
  empresaSeleccionada,
  onLogoutDespacho,
  onOpenAuditoria,
}) => {
  return (
    <aside className="w-[240px] bg-[#2C1F1A] text-neutral-300 flex flex-col justify-between shrink-0 border-r border-[#3D2B24] select-none">
      <div>
        {/* Logo Header */}
        <div className="p-4 sm:p-5 border-b border-[#3D2B24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#C65D3A] flex items-center justify-center text-white font-serif font-bold text-base shadow-sm">
              Ch
            </div>
            <div>
              <div className="font-serif font-semibold text-white tracking-wide text-base leading-tight">
                Chekdor
              </div>
              <div className="text-[10px] font-mono text-neutral-400 tracking-wider">
                ADAPTADOR FISCAL
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#3D2B24] text-neutral-300">
            v2.0
          </span>
        </div>

        {/* Despacho Selector / Header info */}
        <div className="px-4 py-3 border-b border-[#3D2B24]/70 bg-[#241915]">
          <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
            Despacho Contable
          </div>
          <div className="text-xs font-medium text-white truncate flex items-center justify-between mt-0.5">
            <span className="truncate" title={despacho.nombre}>
              {despacho.nombre}
            </span>
            <span
              onClick={onLogoutDespacho}
              title="Cerrar sesión del despacho"
              className="text-neutral-400 hover:text-white cursor-pointer ml-1 p-0.5 text-[11px] font-mono"
            >
              Salir
            </span>
          </div>
          {empresaSeleccionada && (
            <div className="mt-1.5 pt-1.5 border-t border-[#3D2B24]/40 text-[11px] text-amber-200/90 truncate font-mono">
              Empresa: {empresaSeleccionada.nombre.split(' ')[0]}...
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {/* Empresas */}
          <button
            onClick={() => onSelectTab('empresas')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'empresas'
                ? 'bg-[#3D2B24] text-white border-l-2 border-[#C65D3A]'
                : 'text-neutral-300 hover:text-white hover:bg-[#3D2B24]/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                className={`w-5 h-5 ${currentTab === 'empresas' ? 'text-[#C65D3A]' : 'text-neutral-400'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M12 6h.01" />
                <path d="M12 10h.01" />
                <path d="M12 14h.01" />
                <path d="M16 10h.01" />
                <path d="M16 14h.01" />
                <path d="M8 10h.01" />
                <path d="M8 14h.01" />
              </svg>
              <span>Empresas</span>
            </div>
            <span className="text-[10px] font-mono bg-black/40 text-neutral-400 px-1.5 py-0.5 rounded">
              {empresasCount}
            </span>
          </button>

          {/* Trabajadores */}
          <button
            onClick={() => onSelectTab('trabajadores')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'trabajadores'
                ? 'bg-[#3D2B24] text-white border-l-2 border-[#C65D3A]'
                : 'text-neutral-300 hover:text-white hover:bg-[#3D2B24]/60'
            }`}
          >
            <svg
              className={`w-5 h-5 ${currentTab === 'trabajadores' ? 'text-[#C65D3A]' : 'text-neutral-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Trabajadores</span>
          </button>

          {/* Asistencia (LFT Art 132) */}
          <button
            onClick={() => onSelectTab('asistencia')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'asistencia'
                ? 'bg-[#3D2B24] text-white border-l-2 border-[#C65D3A]'
                : 'text-neutral-300 hover:text-white hover:bg-[#3D2B24]/60'
            }`}
          >
            <svg
              className={`w-5 h-5 ${currentTab === 'asistencia' ? 'text-[#C65D3A]' : 'text-neutral-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Asistencia</span>
          </button>

          {/* Nómina */}
          <button
            onClick={() => onSelectTab('nomina')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'nomina'
                ? 'bg-[#3D2B24] text-white border-l-2 border-[#C65D3A]'
                : 'text-neutral-300 hover:text-white hover:bg-[#3D2B24]/60'
            }`}
          >
            <svg
              className={`w-5 h-5 ${currentTab === 'nomina' ? 'text-[#C65D3A]' : 'text-neutral-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <line x1="8" x2="16" y1="12" y2="12" />
              <line x1="12" x2="12" y1="8" y2="16" />
            </svg>
            <span>Nómina</span>
          </button>

          {/* Contabilidad */}
          <button
            onClick={() => onSelectTab('contabilidad')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'contabilidad'
                ? 'bg-[#3D2B24] text-white border-l-2 border-[#C65D3A]'
                : 'text-neutral-300 hover:text-white hover:bg-[#3D2B24]/60'
            }`}
          >
            <svg
              className={`w-5 h-5 ${currentTab === 'contabilidad' ? 'text-[#C65D3A]' : 'text-neutral-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
            <span>Contabilidad</span>
          </button>

          {/* Configuración & Scripts */}
          <button
            onClick={() => onSelectTab('configuracion')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'configuracion'
                ? 'bg-[#3D2B24] text-white border-l-2 border-[#C65D3A]'
                : 'text-neutral-300 hover:text-white hover:bg-[#3D2B24]/60'
            }`}
          >
            <svg
              className={`w-5 h-5 ${currentTab === 'configuracion' ? 'text-[#C65D3A]' : 'text-neutral-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Configuración</span>
          </button>
        </nav>
      </div>

      {/* Bottom Info in Sidebar */}
      <div className="p-4 border-t border-[#3D2B24] text-xs">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span>PostgreSQL RLS</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#16A34A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span> Activo
          </span>
        </div>
        <div className="text-[11px] font-mono text-neutral-400 bg-black/40 p-2 rounded border border-[#3D2B24] break-all leading-relaxed">
          auth.despacho = '{despacho.tokenAuth.slice(0, 4)}...{despacho.tokenAuth.slice(-4)}'
        </div>
        <div className="mt-3 pt-3 border-t border-[#3D2B24]/50 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Licencia Despacho</span>
          <span className="text-neutral-300 font-mono">
            {despacho.licenciaLimiteEmpleados} Empl.
          </span>
        </div>
      </div>
    </aside>
  );
};
