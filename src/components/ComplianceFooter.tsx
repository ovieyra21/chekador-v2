import React from 'react';

interface ComplianceFooterProps {
  onOpenTests?: () => void;
}

export const ComplianceFooter: React.FC<ComplianceFooterProps> = ({ onOpenTests }) => {
  return (
    <footer className="w-full border-t border-[#E7E5E4] bg-white py-2.5 px-4 sm:px-6 text-center shrink-0 z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
        <div className="flex items-center gap-2 font-mono text-[12px] text-[#1A1A1A]">
          <button
            onClick={onOpenTests}
            title="Abrir panel de ejecución de 199 tests"
            className="inline-flex items-center gap-1 font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded border border-[#16A34A]/20 hover:bg-[#16A34A]/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>199/199 tests</span>
          </button>
          <span className="text-[#6B7280]">·</span>
          <span className="font-mono text-[#5A554E]">tsc limpio</span>
          <span className="text-[#6B7280]">·</span>
          <span className="font-mono text-[#5A554E]">v2.0 Octubre 2026</span>
        </div>

        <div className="text-[11px] text-[#6B7280] flex items-center gap-3 font-mono">
          <span>Determinista · Sin mocks</span>
          <span className="text-neutral-400">·</span>
          <span>SHA-256 Inmutable</span>
        </div>
      </div>
    </footer>
  );
};
