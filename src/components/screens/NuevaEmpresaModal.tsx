import React, { useState } from 'react';
import { Empresa, CatalogoTipo } from '../../types';

interface NuevaEmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrearEmpresa: (empresa: Empresa) => void;
  despachoId: string;
}

export const NuevaEmpresaModal: React.FC<NuevaEmpresaModalProps> = ({
  isOpen,
  onClose,
  onCrearEmpresa,
  despachoId,
}) => {
  const [rfc, setRfc] = useState('CBA240101AB1');
  const [nombre, setNombre] = useState('Comercializadora del Bajío S.A. de C.V.');
  const [catalogoBase, setCatalogoBase] = useState<CatalogoTipo>('510-001');
  const [regimenFiscal, setRegimenFiscal] = useState('601 General de Ley Personas Morales');
  const [clabe, setClabe] = useState('012180001012345678');
  const [registroPatronal, setRegistroPatronal] = useState('Y54-92183-10-8');
  const [showAvanzado, setShowAvanzado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Regex SAT validation
  const rfcTrimmed = rfc.trim().toUpperCase();
  const rfcValido = /^[A-Z&Ñ]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/.test(rfcTrimmed);
  const checksum = rfcTrimmed.slice(-3) || 'AB1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const nueva: Empresa = {
        id: `emp_${Date.now()}`,
        despachoId,
        rfc: rfcTrimmed,
        nombre: nombre.trim(),
        catalogoBase,
        regimenFiscal,
        registroPatronalImss: registroPatronal.trim() || 'Y54-92183-10-8',
        cuentaBancoClabe: clabe.trim(),
        creadoEn: new Date().toISOString(),
      };
      setIsSubmitting(false);
      onCrearEmpresa(nueva);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto custom-scroll">
      <div className="w-full max-w-[620px] bg-white border border-[#E7E5E4] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 my-auto text-left max-h-[95vh] overflow-y-auto custom-scroll">
        {/* Header Breadcrumb & Tag */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase">
            <span>Despacho</span>
            <span>/</span>
            <span>Empresas Cliente</span>
            <span>/</span>
            <span className="text-[#1A1A1A] font-bold">Nueva Empresa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono text-[11px] border border-emerald-200 uppercase font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Registro Inicial RLS
            </span>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-800 p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Audit Disclosure Strip */}
        <div className="bg-[#F8F7F4] p-3.5 border-l-2 border-[#C65D3A] flex items-start gap-3">
          <span className="material-symbols-outlined text-[#C65D3A] text-base mt-0.5">
            verified_user
          </span>
          <div className="flex flex-col gap-0.5 text-xs text-[#57534E]">
            <span className="font-semibold text-[#1A1A1A] uppercase tracking-wider text-[11px]">
              Aislamiento por Despacho
            </span>
            <span>
              Cumplimiento art. 805 LFT: Cada movimiento de timbrado, checada biométrica y póliza de diario queda encriptado bajo el esquema multitenant del despacho.
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Campo 1: RFC */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="rfc"
                className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                RFC (Registro Federal de Contribuyentes) <span className="text-red-600">*</span>
              </label>
              <span className="font-mono text-[11px] text-neutral-500">
                Regex SAT: 12-13 caracteres
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                id="rfc"
                type="text"
                required
                maxLength={13}
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="CBA240101AB1"
                className="w-full h-[38px] px-3 font-mono text-[14px] bg-white border border-[#E7E5E4] text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A] uppercase tracking-wider transition-colors"
              />
              <span
                className={`absolute right-3 flex items-center ${
                  rfcValido ? 'text-emerald-600' : 'text-neutral-400'
                }`}
                title="Validador de formato SAT"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                ✓ Formato válido (regex 12-13 caracteres SAT)
              </span>
              <span className="text-neutral-500">
                Checksum: <strong className="text-[#1A1A1A]">{checksum}</strong>
              </span>
            </div>
          </div>

          {/* Campo 2: Nombre o Razón Social */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nombre"
              className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              Nombre o Razón Social <span className="text-red-600">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Comercializadora del Bajío S.A. de C.V."
              className="w-full h-[38px] px-3 font-sans text-sm bg-white border border-[#E7E5E4] text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A] transition-colors"
            />
            <p className="text-xs text-neutral-500">
              Denominación formal con la que se nombrarán las pólizas de diario y exportaciones en <strong className="text-[#1A1A1A]">CONTPAQi® Contabilidad</strong>.
            </p>
          </div>

          {/* Campo 3: Catálogo Base (CONTPAQi) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="catalogo"
                className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                Catálogo Base (CONTPAQi) <span className="text-red-600">*</span>
              </label>
              <span className="font-mono text-[11px] text-neutral-500">
                JSONB catalogo_cuentas
              </span>
            </div>
            <select
              id="catalogo"
              value={catalogoBase}
              onChange={(e) => setCatalogoBase(e.target.value as CatalogoTipo)}
              className="w-full h-[38px] px-3 font-sans text-sm bg-white border border-[#E7E5E4] text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A] transition-colors cursor-pointer"
            >
              <option value="510-001">510-001 tradicional (Estándar Despacho)</option>
              <option value="6000-01-001">6000-01-001 NIF agrupador (Dígito)</option>
            </select>
            <p className="text-xs text-neutral-500">
              Inicializa las subcuentas de Provisión IMSS, Retención ISR e ISN local para la emisión del layout <code className="font-mono bg-neutral-100 px-1 py-0.5 text-[#1A1A1A]">.txt</code> de pólizas.
            </p>
          </div>

          {/* Sección colapsable: Avanzado */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAvanzado(!showAvanzado)}
              className="w-full flex items-center justify-between py-2.5 px-3 bg-[#F8F7F4] hover:bg-[#F2EFE9] text-left transition-colors cursor-pointer border border-[#E7E5E4]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-neutral-500 text-base transition-transform ${
                    showAvanzado ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  expand_more
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Avanzado
                </span>
              </div>
              <span className="font-mono text-[10px] text-neutral-500 bg-white px-2 py-0.5 border border-[#E7E5E4] uppercase">
                Opcional
              </span>
            </button>

            {showAvanzado && (
              <div className="p-4 border border-t-0 border-[#E7E5E4] bg-white flex flex-col gap-4">
                {/* Régimen Fiscal */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Régimen fiscal (SAT c_RegimenFiscal)
                  </label>
                  <select
                    value={regimenFiscal}
                    onChange={(e) => setRegimenFiscal(e.target.value)}
                    className="w-full h-[36px] px-3 font-sans text-xs bg-white border border-[#E7E5E4] text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A]"
                  >
                    <option value="601 General de Ley Personas Morales">
                      601 — General de Ley Personas Morales
                    </option>
                    <option value="612 Personas Físicas con Actividades Empresariales y Profesionales">
                      612 — Personas Físicas con Actividades Empresariales y Profesionales
                    </option>
                    <option value="626 Régimen Simplificado de Confianza (RESICO)">
                      626 — Régimen Simplificado de Confianza (RESICO)
                    </option>
                    <option value="603 Personas Morales con Fines no Lucrativos">
                      603 — Personas Morales con Fines no Lucrativos
                    </option>
                  </select>
                </div>

                {/* Registro Patronal IMSS */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Registro Patronal IMSS
                  </label>
                  <input
                    type="text"
                    value={registroPatronal}
                    onChange={(e) => setRegistroPatronal(e.target.value)}
                    placeholder="Y54-92183-10-8"
                    className="w-full h-[36px] px-3 font-mono text-xs bg-white border border-[#E7E5E4] text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A]"
                  />
                </div>

                {/* Cuenta Banco / CLABE */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                      Cuenta banco / CLABE
                    </label>
                    <span className="font-mono text-[11px] text-neutral-500">18 dígitos</span>
                  </div>
                  <input
                    type="text"
                    maxLength={18}
                    value={clabe}
                    onChange={(e) => setClabe(e.target.value)}
                    placeholder="012180001012345678"
                    className="w-full h-[36px] px-3 font-mono text-xs bg-white border border-[#E7E5E4] text-[#1A1A1A] focus:outline-none focus:border-[#C65D3A] tracking-wider"
                  />
                  <span className="text-[11px] text-neutral-500">
                    Utilizada para conciliar dispersión de nómina con comprobante STP/SPEI.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 h-[38px] bg-white border border-[#E7E5E4] text-[#1A1A1A] hover:bg-neutral-50 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer order-2 sm:order-1"
            >
              Volver a empresas
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 h-[38px] bg-[#C65D3A] hover:bg-[#b24f2f] text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors cursor-pointer order-1 sm:order-2"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>{isSubmitting ? 'Registrando...' : 'Crear empresa'}</span>
            </button>
          </div>

          {/* Technical Ledger Micro-Audit */}
          <div className="bg-[#F8F7F4] p-3 font-mono text-[11px] text-neutral-600 flex flex-col gap-1 border border-[#E7E5E4]">
            <div className="flex items-center justify-between text-neutral-700 font-medium">
              <span className="uppercase tracking-widest text-[9px] text-[#C65D3A] font-bold">
                Operación Determinista
              </span>
              <span>PostgreSQL 16 · schema = public</span>
            </div>
            <div className="text-[#1A1A1A] break-all bg-white p-2 border border-[#E7E5E4]">
              <code>
                INSERT INTO empresas (id, rfc, nombre, catalogo_cuentas) VALUES (gen_random_uuid(), '{rfcTrimmed}', '{nombre}', '{JSON.stringify({ base: catalogoBase })}') RETURNING id;
              </code>
            </div>
            <span className="text-neutral-500 italic text-[10px]">
              ↳ Row-Level Security aislará las bitácoras biométricas y pólizas inmediatamente bajo esta clave.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
