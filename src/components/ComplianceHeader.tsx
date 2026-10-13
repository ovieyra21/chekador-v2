import React from 'react';

interface ComplianceHeaderProps {
  onOpenAuditoria?: () => void;
  empresaNombre?: string;
}

export const ComplianceHeader: React.FC<ComplianceHeaderProps> = ({
  onOpenAuditoria,
}) => {
  return (
    <header className="w-full bg-[#1A1A1A] text-[#FCFCF9] text-[12px] sm:text-[12.5px] font-mono py-2 px-4 sm:px-6 flex flex-wrap items-center justify-between border-b border-[#2d2d2d] shrink-0 z-20">
      <div className="flex items-center gap-2.5">
        <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
        <span className="font-semibold text-[#16A34A] tracking-wider uppercase">
          Cumplimiento LFT:
        </span>
        <span className="text-neutral-300 hidden sm:inline">
          Reforma LFT 1 mayo 2026 art 132 fr XXXIV obligatorio 1-ene-2027 · Multa $28,285-$565,700 x trabajador
        </span>
        <span className="text-neutral-300 sm:hidden">
          Art. 132 Fr. XXXIV · Multa $28k-$565k x trab.
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 text-xs text-neutral-400">
        <span className="hidden md:inline">
          RLS: <code className="text-neutral-200">empresa_id = auth.despacho</code>
        </span>
        <span className="text-neutral-600 hidden md:inline">|</span>
        <span className="hidden sm:inline">Prueba Plena Art. 805 LFT</span>
        <span className="text-neutral-600 hidden sm:inline">|</span>
        <button
          onClick={onOpenAuditoria}
          title="Ver auditoría y verificación de doble partida"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#16A34A]/20 text-[#16A34A] font-semibold hover:bg-[#16A34A]/30 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
          <span>Cuadre 0.00</span>
        </button>
      </div>
    </header>
  );
};
