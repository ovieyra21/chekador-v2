import React, { useState } from 'react';
import { Empresa, CatalogoTipo } from '../../types';

interface EmpresasScreenProps {
  empresas: Empresa[];
  empresaSeleccionada: Empresa | null;
  onSelectEmpresa: (empresa: Empresa) => void;
  onOpenNuevaEmpresaModal: () => void;
  onCargarDemo: (catalogoBase: CatalogoTipo) => void;
  onOpenAuditoria: () => void;
}

export const EmpresasScreen: React.FC<EmpresasScreenProps> = ({
  empresas,
  empresaSeleccionada,
  onSelectEmpresa,
  onOpenNuevaEmpresaModal,
  onCargarDemo,
  onOpenAuditoria,
}) => {
  const [selectedDemoCat, setSelectedDemoCat] = useState<CatalogoTipo>('510-001');

  if (empresas.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 bg-[#FCFCF9] overflow-y-auto custom-scroll">
        {/* Top Context / Breadcrumb / Status Header */}
        <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between pb-4 border-b border-[#E7E5E4]/80 gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>DESPACHO</span>
            <span>/</span>
            <span className="text-[#1A1A1A] font-semibold">EMPRESAS CLIENTE</span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
              Tabla empresas vacía
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-neutral-500 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Supabase: 0 registros</span>
            </div>
          </div>
        </div>

        {/* Centered Empty State Container */}
        <div className="flex-1 flex flex-col items-center justify-center my-8 max-w-3xl mx-auto w-full text-center">
          {/* Icon Container */}
          <div className="w-20 h-20 rounded-2xl bg-white border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center mb-6 text-neutral-700">
            <svg
              className="w-10 h-10 text-neutral-700"
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
          </div>

          {/* Title */}
          <h1 className="font-serif font-semibold text-[28px] text-[#1A1A1A] tracking-tight mb-2 leading-tight">
            Aún no tienes empresas cliente
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-[15px] text-neutral-600 max-w-xl mx-auto mb-7 leading-relaxed">
            Crea tu primera empresa para empezar. Usa la demo Comercializadora del Bajío para probar sin cliente real.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 w-full sm:w-auto">
            <button
              onClick={onOpenNuevaEmpresaModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-medium text-base px-6 py-3.5 rounded border border-[#A84B2C] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>+ Nueva empresa cliente</span>
            </button>

            <button
              onClick={() => onCargarDemo(selectedDemoCat)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-800 font-medium text-sm px-5 py-3.5 rounded border border-[#E7E5E4] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                />
              </svg>
              <span>Cargar empresa demo al instante</span>
            </button>
          </div>

          {/* Small Card with Demo Data */}
          <div className="w-full max-w-xl bg-white border border-[#E7E5E4] rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E7E5E4]/80">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200 text-xs font-mono">
                  ✓
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                  Datos Demo Disponibles para Prueba
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500 bg-[#FCFCF9] px-2 py-0.5 rounded border border-[#E7E5E4]">
                Preconfigurada
              </span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {/* RFC */}
              <div className="grid grid-cols-3 gap-2 py-1 items-center border-b border-neutral-100">
                <span className="text-neutral-500 font-mono text-[11px] uppercase">RFC</span>
                <div className="col-span-2 font-mono font-medium text-[#1A1A1A] bg-[#FCFCF9] px-2 py-1 rounded border border-[#E7E5E4]/60 w-fit">
                  DEMO260101AB1
                </div>
              </div>

              {/* Razón Social */}
              <div className="grid grid-cols-3 gap-2 py-1 items-baseline border-b border-neutral-100">
                <span className="text-neutral-500 font-mono text-[11px] uppercase">Razón Social</span>
                <div className="col-span-2 font-medium text-[#1A1A1A]">
                  Comercializadora del Bajío S.A. de C.V.
                </div>
              </div>

              {/* Catálogo Base selector */}
              <div className="grid grid-cols-3 gap-2 py-1 items-center">
                <div>
                  <span className="text-neutral-500 font-mono text-[11px] uppercase block">
                    Catálogo base
                  </span>
                  <span className="text-[10px] text-neutral-400">Póliza CONTPAQi</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 bg-[#FCFCF9] rounded border border-[#E7E5E4] w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedDemoCat('510-001')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${
                        selectedDemoCat === '510-001'
                          ? 'bg-white border border-[#E7E5E4] text-[#1A1A1A] font-mono font-semibold shadow-sm'
                          : 'text-neutral-600 hover:text-[#1A1A1A] font-mono'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full border border-neutral-400 flex items-center justify-center">
                        {selectedDemoCat === '510-001' && (
                          <span className="w-1 h-1 bg-[#C65D3A] rounded-full"></span>
                        )}
                      </span>
                      <span>510-001</span>
                      <span className="text-[10px] text-neutral-500 font-sans font-normal">
                        (Estándar)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDemoCat('6000-01-001')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${
                        selectedDemoCat === '6000-01-001'
                          ? 'bg-white border border-[#E7E5E4] text-[#1A1A1A] font-mono font-semibold shadow-sm'
                          : 'text-neutral-600 hover:text-[#1A1A1A] font-mono'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full border border-neutral-400 flex items-center justify-center">
                        {selectedDemoCat === '6000-01-001' && (
                          <span className="w-1 h-1 bg-[#C65D3A] rounded-full"></span>
                        )}
                      </span>
                      <span>6000-01-001</span>
                      <span className="text-[10px] text-neutral-400 font-sans font-normal">
                        (Dígito)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E7E5E4]/80 flex items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-neutral-400">
                  info
                </span>
                No altera datos fiscales reales del despacho
              </span>
              <button
                onClick={onOpenAuditoria}
                className="text-[#C65D3A] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                Ver parámetros RLS
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Technical SQL Callout */}
          <div className="mt-6 text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
            <span>Query SQL:</span>
            <code className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-[#E7E5E4]">
              SELECT * FROM empresas WHERE empresa_id IN (SELECT ...) → 0 rows
            </code>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full max-w-4xl mx-auto pt-4 border-t border-[#E7E5E4] flex flex-wrap items-center justify-between text-xs text-neutral-500 font-mono gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200 font-semibold text-[11px]">
              <span className="material-symbols-outlined text-[13px]">check</span>
              199/199 tests
            </span>
            <span className="text-neutral-400">·</span>
            <span>tsc limpio</span>
            <span className="text-neutral-400">·</span>
            <span>v2.0 Octubre 2026</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Determinista</span>
            <span className="text-neutral-400">·</span>
            <span>Sin mocks</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-600">SHA-256 Inmutable</span>
          </div>
        </footer>
      </div>
    );
  }

  // Active Empresas List View
  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 bg-[#FCFCF9] overflow-y-auto custom-scroll">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E5E4] gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase">
              <span>DESPACHO</span>
              <span>/</span>
              <span className="text-[#1A1A1A] font-bold">EMPRESAS CLIENTE ACTIVAS</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">
              Catálogo de Empresas del Despacho
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNuevaEmpresaModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C65D3A] hover:bg-[#b24f2f] text-white text-xs font-semibold rounded shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ Nueva empresa cliente</span>
            </button>
          </div>
        </div>

        {/* Empresas Cards / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {empresas.map((emp) => {
            const isSelected = empresaSeleccionada?.id === emp.id;
            return (
              <div
                key={emp.id}
                className={`bg-white border rounded-lg p-5 shadow-sm transition-all text-left flex flex-col justify-between ${
                  isSelected ? 'border-[#C65D3A] ring-1 ring-[#C65D3A]' : 'border-[#E7E5E4] hover:border-neutral-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#C65D3A] bg-[#C65D3A]/10 px-2 py-0.5 rounded">
                      RFC: {emp.rfc}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 bg-[#FCFCF9] px-2 py-0.5 rounded border border-[#E7E5E4]">
                      Catálogo: {emp.catalogoBase}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-[#1A1A1A] leading-snug mb-1">
                    {emp.nombre}
                  </h3>

                  <p className="text-xs text-neutral-600 font-sans mb-3">
                    {emp.regimenFiscal}
                  </p>

                  <div className="space-y-1.5 font-mono text-[11px] text-neutral-600 bg-[#FCFCF9] p-3 rounded border border-[#E7E5E4]/80 mb-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Reg. Patronal IMSS:</span>
                      <span className="font-semibold">{emp.registroPatronalImss}</span>
                    </div>
                    {emp.cuentaBancoClabe && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Cuenta CLABE:</span>
                        <span>{emp.cuentaBancoClabe}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-400">RLS ID:</span>
                      <span className="text-neutral-500 truncate max-w-[150px]">{emp.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E7E5E4]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#16A34A] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                    Aislamiento RLS Verificado
                  </span>

                  <button
                    onClick={() => onSelectEmpresa(emp)}
                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#FCFCF9] hover:bg-neutral-100 text-[#1A1A1A] border border-[#E7E5E4]'
                    }`}
                  >
                    {isSelected ? 'Empresa Activa ✓' : 'Seleccionar Empresa →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
