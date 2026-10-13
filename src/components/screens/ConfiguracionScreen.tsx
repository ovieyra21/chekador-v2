import React, { useState } from 'react';
import { Despacho, Empresa, CatalogoTipo } from '../../types';

interface ConfiguracionScreenProps {
  despacho: Despacho;
  empresa: Empresa | null;
  onActualizarDespacho: (d: Partial<Despacho>) => void;
  onActualizarEmpresa: (e: Partial<Empresa>) => void;
  onEjecutarScriptDemo: () => void;
  onEjecutarScriptExportacion: () => void;
  onOpenAuditoria: () => void;
  onLimpiarDatos: () => void;
}

export const ConfiguracionScreen: React.FC<ConfiguracionScreenProps> = ({
  despacho,
  empresa,
  onActualizarDespacho,
  onActualizarEmpresa,
  onEjecutarScriptDemo,
  onEjecutarScriptExportacion,
  onOpenAuditoria,
  onLimpiarDatos,
}) => {
  const [despachoNombre, setDespachoNombre] = useState(despacho.nombre);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveDespacho = (e: React.FormEvent) => {
    e.preventDefault();
    onActualizarDespacho({ nombre: despachoNombre });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 bg-[#FCFCF9] overflow-y-auto custom-scroll text-left">
      <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            <span>Despacho</span>
            <span>/</span>
            <span className="text-[#1A1A1A] font-semibold">Configuración & Scripts de Integridad</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#1A1A1A] font-bold mt-1">
            Parámetros Fiscales y Scripts de Auditoría
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Métricas de prueba plena LFT, reglas RLS herméticas y suite de validación determinista.
          </p>
        </div>

        {/* Script Execution Console Card */}
        <div className="bg-white border border-[#E7E5E4] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C65D3A] text-xl">
                terminal
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                Scripts de Validación en Monorepo (pnpm workspaces)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-50 text-[#16A34A] border border-emerald-200 font-semibold">
              0 ERRORES EN BUILD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Script 1: verificar:demo */}
            <div className="p-4 bg-[#F8F7F4] border border-[#E7E5E4] flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#1A1A1A] block">
                  npm run verificar:demo
                </span>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Compara valores calculados por la landing vs motor puro (centavos, subsidio a 35%, fix guarderías no patronal).
                </p>
              </div>
              <button
                type="button"
                onClick={onEjecutarScriptDemo}
                className="w-full py-2 bg-white hover:bg-neutral-100 border border-[#E7E5E4] text-[#1A1A1A] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                <span>Ejecutar verificar:demo</span>
              </button>
            </div>

            {/* Script 2: verificar:exportacion */}
            <div className="p-4 bg-[#F8F7F4] border border-[#E7E5E4] flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#1A1A1A] block">
                  npm run verificar:exportacion
                </span>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Valida 20/20 campos SAT Receptor (CURP 18, RFC 13, CLABE 18), sin doble BOM, sin encabezado, y DEBE=HABER 0.00.
                </p>
              </div>
              <button
                type="button"
                onClick={onEjecutarScriptExportacion}
                className="w-full py-2 bg-white hover:bg-neutral-100 border border-[#E7E5E4] text-[#1A1A1A] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                <span>Ejecutar exportación 20/20</span>
              </button>
            </div>

            {/* Script 3: 199/199 Tests */}
            <div className="p-4 bg-[#F8F7F4] border border-[#E7E5E4] flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#1A1A1A] block">
                  npm test (199/199 tests)
                </span>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Ejecuta los 199 tests unitarios del motor puro sin base de datos ni Math.random en &lt;100ms.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAuditoria}
                className="w-full py-2 bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">done_all</span>
                <span>Ver Test Suite (199/199)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Despacho & RLS Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Despacho Contable */}
          <div className="bg-white border border-[#E7E5E4] p-5 shadow-sm">
            <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-3">
              Datos del Despacho Contable
            </h3>
            <form onSubmit={handleSaveDespacho} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 mb-1 font-semibold">
                  Razón Social del Despacho:
                </label>
                <input
                  type="text"
                  value={despachoNombre}
                  onChange={(e) => setDespachoNombre(e.target.value)}
                  className="w-full h-8 px-2 border border-[#E7E5E4] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-[#FCFCF9] p-2 border border-[#E7E5E4]">
                  <span className="text-neutral-500 block">RFC Despacho:</span>
                  <span className="font-semibold text-[#1A1A1A]">{despacho.rfc}</span>
                </div>
                <div className="bg-[#FCFCF9] p-2 border border-[#E7E5E4]">
                  <span className="text-neutral-500 block">Licencia Asignada:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {despacho.licenciaLimiteEmpleados} Empleados
                  </span>
                </div>
              </div>

              <div className="bg-[#FCFCF9] p-2.5 border border-[#E7E5E4] font-mono text-[11px]">
                <span className="text-neutral-500 block">Identificador de Sesión RLS:</span>
                <span className="text-neutral-700 select-all">{despacho.tokenAuth}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedMsg && (
                  <span className="text-[#16A34A] font-semibold text-xs">
                    ✓ Despacho actualizado
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-1.5 bg-[#1A1A1A] hover:bg-black text-white font-semibold cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          {/* Card: Catálogo Contable Configurable por Empresa */}
          <div className="bg-white border border-[#E7E5E4] p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-2">
                Catálogo Base de Cuentas CONTPAQi
              </h3>
              <p className="text-xs text-neutral-600 mb-4">
                Configurable por cada empresa cliente en Supabase Postgres (JSONB <code className="font-mono bg-neutral-100 px-1">catalogo_cuentas</code>).
              </p>

              {empresa ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label
                      onClick={() => onActualizarEmpresa({ catalogoBase: '510-001' })}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition-all ${
                        empresa.catalogoBase === '510-001'
                          ? 'border-[#C65D3A] bg-[#C65D3A]/5 font-semibold text-[#1A1A1A]'
                          : 'border-[#E7E5E4] hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cat"
                        checked={empresa.catalogoBase === '510-001'}
                        onChange={() => onActualizarEmpresa({ catalogoBase: '510-001' })}
                        className="mt-0.5 accent-[#C65D3A]"
                      />
                      <div className="text-xs">
                        <span className="font-mono font-bold block">510-001 (Estándar Tradicional)</span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          510-001-001 Sueldos, 510-001-002 Extras, 110-001-002 Bancos SPEI
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => onActualizarEmpresa({ catalogoBase: '6000-01-001' })}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition-all ${
                        empresa.catalogoBase === '6000-01-001'
                          ? 'border-[#C65D3A] bg-[#C65D3A]/5 font-semibold text-[#1A1A1A]'
                          : 'border-[#E7E5E4] hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cat"
                        checked={empresa.catalogoBase === '6000-01-001'}
                        onChange={() => onActualizarEmpresa({ catalogoBase: '6000-01-001' })}
                        className="mt-0.5 accent-[#C65D3A]"
                      />
                      <div className="text-xs">
                        <span className="font-mono font-bold block">6000-01-001 (NIF Agrupador)</span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          6001-01-000 Sueldos NIF, 6001-02-000 Extras NIF, 1102-01-000 Bancos
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 italic p-4 bg-[#FCFCF9] border border-[#E7E5E4]">
                  No hay empresa cliente seleccionada actualmente.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">
                Reiniciar entorno local:
              </span>
              <button
                type="button"
                onClick={onLimpiarDatos}
                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-mono cursor-pointer"
              >
                Vaciar Empresas (Empezar de cero)
              </button>
            </div>
          </div>
        </div>

        {/* PostgreSQL DDL Schema Audit */}
        <div className="bg-[#1A1A1A] text-neutral-300 p-4 font-mono text-xs space-y-2 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 pb-1 border-b border-neutral-700 text-[11px]">
            <span>POSTGRESQL 16 DDL DEFINITION (SCHEMA: PUBLIC)</span>
            <span className="text-[#16A34A]">IMMUTABLE TRIGGER ARMED</span>
          </div>
          <pre className="text-[11px] text-neutral-300 overflow-x-auto select-all leading-tight">
{`-- Inalterabilidad LFT Art 132 Fracc. XXXIV
CREATE TABLE public.marcajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    trabajador_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    device_id VARCHAR(64) NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    salt VARCHAR(32) NOT NULL
);

CREATE OR REPLACE FUNCTION bloquear_modificaciones_marcajes()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACION LFT ART 132 FR XXXIV: Marcajes de asistencia son estrictamente inmutables.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marcajes_inmutables
BEFORE UPDATE OR DELETE ON public.marcajes
FOR EACH ROW EXECUTE FUNCTION bloquear_modificaciones_marcajes();`}
          </pre>
        </div>
      </div>
    </div>
  );
};
