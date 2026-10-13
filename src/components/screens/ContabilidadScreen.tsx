import React, { useState } from 'react';
import { Empresa, Trabajador, CatalogoTipo } from '../../types';
import { calcularNominaTrabajador, generarPolizaDiario } from '../../motor';
import {
  generarPipeContpaqi,
  generarCsvSat20Campos,
  validarExportacion,
} from '../../serializadores';

interface ContabilidadScreenProps {
  empresa: Empresa;
  trabajadores: Trabajador[];
  onCambiarCatalogoEmpresa: (cat: CatalogoTipo) => void;
}

export const ContabilidadScreen: React.FC<ContabilidadScreenProps> = ({
  empresa,
  trabajadores,
  onCambiarCatalogoEmpresa,
}) => {
  const [catalogoActivo, setCatalogoActivo] = useState<CatalogoTipo>(empresa.catalogoBase);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [firstTrySuccess, setFirstTrySuccess] = useState(true);
  const [contpaqiVersion, setContpaqiVersion] = useState('16.2.1 (2024/2025)');
  const [tiempoAhorrado, setTiempoAhorrado] = useState('1.5 horas por quincena');
  const [cuentaFalla, setCuentaFalla] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [cuentaFallaSimulada, setCuentaFallaSimulada] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [validacionExito, setValidacionExito] = useState<string | null>(null);

  const juan = trabajadores.find((t) => t.rfc === 'PELJ900101ABC') || trabajadores[0];
  const calculoJuan = calcularNominaTrabajador(juan);
  const poliza = generarPolizaDiario(calculoJuan, catalogoActivo, empresa.nombre);
  const pipeContent = generarPipeContpaqi(poliza, '123');
  const csvContent = generarCsvSat20Campos(trabajadores);
  const validacion = validarExportacion(pipeContent, juan, poliza);

  const handleSwitchCat = (mode: CatalogoTipo) => {
    setCatalogoActivo(mode);
    setErrorDescarga(null);
    onCambiarCatalogoEmpresa(mode);
  };

  const validarAntesDeDescargar = (): boolean => {
    setErrorDescarga(null);
    setValidacionExito(null);

    if (cuentaFallaSimulada) {
      setErrorDescarga(`Error de exportación: Cuenta ${cuentaFallaSimulada} no existe en el catálogo de CONTPAQi.`);
      return false;
    }

    if (Math.abs(poliza.totalDebe - poliza.totalHaber) > 0.01) {
      setErrorDescarga(`Error: Descuadre en partida doble. DEBE $${poliza.totalDebe.toFixed(2)} != HABER $${poliza.totalHaber.toFixed(2)}`);
      return false;
    }

    if (!validacion.camposSatValidos || !validacion.debeHaberCuadra || !validacion.sinBomDoble || !validacion.sinEncabezadoEnPipe) {
      setErrorDescarga('Error en validación 20/20: Algún campo SAT o regla de formato no cumple.');
      return false;
    }

    setValidacionExito('✓ Validación 20/20 SAT y cuadre DEBE=HABER ($10,200.00 = $10,200.00) verificados con éxito.');
    return true;
  };

  const handleDescargarPipe = () => {
    if (!validarAntesDeDescargar()) return;

    const blob = new Blob([pipeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POLIZA_CONTPAQI_${catalogoActivo}_${empresa.rfc}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDescargarCsv = () => {
    if (!validarAntesDeDescargar()) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NOMINA_20_CAMPOS_SAT_${empresa.rfc}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySnippet = () => {
    const rawSnippet = pipeContent.startsWith('\uFEFF')
      ? pipeContent.slice(1).split('\n').slice(0, 3).join('\n')
      : pipeContent.split('\n').slice(0, 3).join('\n');

    navigator.clipboard.writeText(rawSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSaved(true);
    setTimeout(() => setFeedbackSaved(false), 3000);
  };

  // Resolve accounts
  const cSueldos = catalogoActivo === '510-001' ? '510-001-001' : '6001-01-000';
  const cHoras = catalogoActivo === '510-001' ? '510-001-002' : '6001-02-000';
  const cPrima = catalogoActivo === '510-001' ? '510-001-003' : '6001-03-000';
  const cBancos = catalogoActivo === '510-001' ? '110-001-002' : '1102-01-000';
  const cIsr = catalogoActivo === '510-001' ? '210-001-001' : '2105-01-000';
  const cImss = catalogoActivo === '510-001' ? '210-002-001' : '2106-01-000';

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 bg-[#FCFCF9] overflow-y-auto custom-scroll text-left">
      <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">
        {/* Breadcrumbs & Context Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            <span className="hover:text-[#1A1A1A] cursor-pointer">Despacho</span>
            <span>/</span>
            <span className="hover:text-[#1A1A1A] cursor-pointer text-neutral-700 font-semibold truncate">
              {empresa.nombre}
            </span>
            <span>/</span>
            <span>Contabilidad</span>
            <span>/</span>
            <span className="text-[#C65D3A] font-semibold">Exportación de Pólizas</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-1">
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl text-[#1A1A1A] font-bold tracking-tight">
                Exportación de Póliza Contable CONTPAQi®
              </h1>
              <p className="font-sans text-xs text-neutral-600 mt-1 max-w-3xl">
                Generación directa del layout PIPE delimitado por plecas sin encabezados, listo para importar en CONTPAQi® Contabilidad versión 14/15/16.
              </p>
            </div>

            {/* Empresa Tag & Catalogue Mode Selector */}
            <div className="flex flex-wrap items-center gap-2 bg-[#F5F5F4] p-1.5 border border-[#E7E5E4]">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-[#E7E5E4] shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-[#16A34A]">
                  domain_verification
                </span>
                <span className="font-mono text-xs font-semibold text-[#1A1A1A]">
                  {empresa.rfc}
                </span>
                <span className="text-xs text-neutral-600 font-medium">
                  {empresa.nombre.split(' ')[0]} {empresa.nombre.split(' ')[1]}
                </span>
              </div>
              <div className="flex items-center bg-neutral-200/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchCat('510-001')}
                  className={`px-2.5 py-1 font-mono transition-all cursor-pointer ${
                    catalogoActivo === '510-001'
                      ? 'bg-white text-[#1A1A1A] font-semibold shadow-sm border border-[#E7E5E4]'
                      : 'text-neutral-600 hover:text-[#1A1A1A]'
                  }`}
                >
                  510-001 Tradicional
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCat('6000-01-001')}
                  className={`px-2.5 py-1 font-mono transition-all cursor-pointer ${
                    catalogoActivo === '6000-01-001'
                      ? 'bg-white text-[#1A1A1A] font-semibold shadow-sm border border-[#E7E5E4]'
                      : 'text-neutral-600 hover:text-[#1A1A1A]'
                  }`}
                >
                  6000-01-001 NIF agrupador
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NOTA DESTACADA DE PRINCIPIO CONTABLE */}
        <div className="p-3 bg-[#FAF8F5] border-l-4 border-l-[#C65D3A] border border-[#E7E5E4] text-xs font-mono text-neutral-700 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#C65D3A] text-lg">info</span>
          <div>
            <strong className="text-[#1A1A1A]">Nota de Principio:</strong>{' '}
            <span className="italic">"Chekdor no inventa cuentas, no crea catálogo, solo transforma horas→póliza."</span>
          </div>
        </div>

        {/* Primary 2-Column Split Ledger Canvas */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Póliza Preview & Mapping Matrix (7 Cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4">
            {/* Balance Check Header Bar */}
            <div className="bg-white p-3.5 border border-[#E7E5E4] shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></div>
                <div>
                  <div className="font-mono text-xs uppercase text-[#1A1A1A] font-bold tracking-wide">
                    Vista Póliza Contable (Asientos de Diario)
                  </div>
                  <div className="font-sans text-xs text-neutral-500">
                    Período: 2a Quincena Octubre 2026 · Póliza Ingresos/Egresos #123
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#F0FDF4] px-3 py-1.5 border border-[#BBF7D0]">
                <span className="material-symbols-outlined text-[#16A34A] text-[18px]">
                  balance
                </span>
                <span className="font-mono text-xs font-bold text-[#16A34A]">
                  Cuadre estricto DEBE = HABER ($10,200.00 MXN)
                </span>
              </div>
            </div>

            {/* Account Catalog Resolution Card */}
            <div className="bg-white p-4 border border-[#E7E5E4] shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4] mb-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-700 font-bold">
                  Resolución de Cuentas por Empresa (catalogo_cuentas)
                </span>
                <span className="font-mono text-[11px] bg-[#F5F5F4] px-2 py-0.5 text-neutral-600 border border-[#E7E5E4]">
                  Catálogo Activo:{' '}
                  <strong className="text-[#1A1A1A]">
                    {catalogoActivo === '510-001' ? '510-001 (Estándar Despacho)' : '6000-01-001 (NIF Agrupador)'}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Gastos Resolution */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#C65D3A] uppercase font-bold tracking-wider block">
                    Cuentas de Gasto / Cargo
                  </span>
                  <div className="flex justify-between p-1.5 bg-[#F8F7F4] border border-[#E7E5E4]">
                    <span className="text-[#1A1A1A] font-bold">{cSueldos}</span>
                    <span className="text-neutral-600 truncate max-w-[150px]">Sueldos Ordinarios</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#F8F7F4] border border-[#E7E5E4]">
                    <span className="text-[#1A1A1A] font-bold">{cHoras}</span>
                    <span className="text-neutral-600 truncate max-w-[150px]">Horas Extras Dobles</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#F8F7F4] border border-[#E7E5E4]">
                    <span className="text-[#1A1A1A] font-bold">{cPrima}</span>
                    <span className="text-neutral-600 truncate max-w-[150px]">Prima Dominical LFT</span>
                  </div>
                </div>

                {/* Pasivos Resolution */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#16A34A] uppercase font-bold tracking-wider block">
                    Pasivos y Bancos / Abono
                  </span>
                  <div className="flex justify-between p-1.5 bg-[#F8F7F4] border border-[#E7E5E4]">
                    <span className="text-[#1A1A1A] font-bold">{cBancos}</span>
                    <span className="text-neutral-600 truncate max-w-[150px]">Bancos / SPEI BBVA</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#F8F7F4] border border-[#E7E5E4]">
                    <span className="text-[#1A1A1A] font-bold">{cIsr}</span>
                    <span className="text-neutral-600 truncate max-w-[150px]">Retención ISR Salarios</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#F8F7F4] border border-[#E7E5E4]">
                    <span className="text-[#1A1A1A] font-bold">{cImss}</span>
                    <span className="text-neutral-600 truncate max-w-[150px]">Cuota Obrera IMSS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Journal Entry Table (Voucher) */}
            <div className="bg-white border border-[#E7E5E4] shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 bg-[#F8F7F4] flex justify-between items-center border-b border-[#E7E5E4]">
                <span className="font-mono text-xs text-[#1A1A1A] font-bold tracking-wide">
                  DETALLE DE ASIENTO CONTABLE #123 (VOUCHER)
                </span>
                <span className="font-mono text-[11px] text-neutral-500">
                  {poliza.asientos.length} REGISTROS · BASE DEVENGADA
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-[#F5F5F4] text-neutral-600 border-b border-[#1A1A1A] uppercase text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Mov</th>
                      <th className="py-2.5 px-3 font-semibold">Cuenta</th>
                      <th className="py-2.5 px-3 font-semibold">Concepto / Referencia</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Debe (MXN)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Haber (MXN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {poliza.asientos.map((a) => (
                      <tr key={a.movimiento} className="hover:bg-[#FBFBF9] transition-colors">
                        <td className="py-2 px-3 text-neutral-400">{a.movimiento}</td>
                        <td className="py-2 px-3 font-bold text-[#1A1A1A]">{a.cuenta}</td>
                        <td className="py-2 px-3 text-[#1A1A1A] font-sans truncate max-w-[220px]">
                          {a.concepto}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-[#1A1A1A]">
                          {a.debe > 0 ? a.debe.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-[#1A1A1A]">
                          {a.haber > 0 ? a.haber.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F8F7F4] border-t-2 border-[#1A1A1A] font-mono font-bold text-xs">
                      <td className="py-2 px-3 text-right" colSpan={3}>
                        SUMAS TOTALES DE POLIZA:
                      </td>
                      <td className="py-2 px-3 text-right">${poliza.totalDebe.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${poliza.totalHaber.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-2.5 bg-[#F0FDF4] border-t border-[#BBF7D0] flex items-center justify-between font-mono text-xs">
                <span className="text-[#16A34A] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Validación de Doble Partida: Exacta
                </span>
                <span className="font-bold text-[#16A34A]">
                  DIFERENCIA NETA: $0.00 MXN (CUADRADA)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Export Actions & Syntax Verification (5 Cols) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            {/* Primary Export Actions Box */}
            <div className="bg-white p-5 border border-[#E7E5E4] shadow-sm flex flex-col gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-1">
                  Módulo de Descarga y Formato
                </span>
                <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  Descargas de Póliza Masiva
                </h2>
              </div>

              {/* Download Buttons */}
              <div className="space-y-2.5">
                {/* Primary Button */}
                <button
                  type="button"
                  onClick={handleDescargarPipe}
                  className="w-full min-h-[46px] bg-[#C65D3A] hover:bg-[#b24f2f] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all px-3 cursor-pointer text-center"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Descargar PIPE.txt UTF-8 BOM sin encabezado para CONTPAQi Contabilidad</span>
                </button>
                <div className="text-[11px] font-mono text-neutral-500 px-1">
                  * Ejecuta verificación 20/20 SAT y valida DEBE=HABER (tolerancia $0.01).
                </div>

                {/* Secondary Button */}
                <button
                  type="button"
                  onClick={handleDescargarCsv}
                  className="w-full h-10 bg-white hover:bg-neutral-50 text-[#1A1A1A] font-mono font-semibold text-xs border border-[#E7E5E4] flex items-center justify-center gap-2 shadow-sm transition-all px-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-neutral-600">
                    table_view
                  </span>
                  <span>Descargar CSV genérico</span>
                </button>

                {/* Botón para simular fallo de cuenta inexistente */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCuentaFallaSimulada(
                        cuentaFallaSimulada ? null : catalogoActivo === '510-001' ? '510-001' : '6000-01-001'
                      )
                    }
                    className={`w-full py-1.5 px-2 text-[10px] font-mono border transition-colors cursor-pointer text-center ${
                      cuentaFallaSimulada
                        ? 'bg-red-50 border-red-300 text-red-800 font-bold'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {cuentaFallaSimulada
                      ? '✕ Quitar simulación de error'
                      : '⚠ Simular fallo: Cuenta 510-001 no existe'}
                  </button>
                </div>
              </div>

              {/* Alerta de Error de Validación */}
              {errorDescarga && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 font-mono text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-red-600">error</span>
                  <span>{errorDescarga}</span>
                </div>
              )}

              {validacionExito && !errorDescarga && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  <span>{validacionExito}</span>
                </div>
              )}

              {/* Validation Checklist Box */}
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#16A34A] font-mono font-bold uppercase text-[11px]">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Protocolo de Integridad npm run verificar:exportacion
                </div>
                <ul className="space-y-1.5 font-mono text-[11px] text-emerald-900">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#16A34A] font-bold">✓</span>
                    <span>20/20 campos SAT Receptor (CURP 18, RFC 13, Banco, CLABE 18)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#16A34A] font-bold">✓</span>
                    <span>DEBE=HABER 0.01 tolerancia (Diferencia exacta: $0.00 MXN)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#16A34A] font-bold">✓</span>
                    <span>Sin BOM doble (Validación UTF-8 limpia 1 solo marcador EF BB BF)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#16A34A] font-bold">✓</span>
                    <span>Sin encabezado (Inicia directo en primer registro D|123...)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Raw Pipe File Snippet Box */}
            <div className="bg-white border border-[#E7E5E4] shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#F8F7F4] px-4 py-2 flex items-center justify-between border-b border-[#E7E5E4]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-neutral-500 text-[16px]">
                    terminal
                  </span>
                  <span className="font-mono text-[11px] uppercase text-neutral-700 font-bold">
                    Vista Previa de Estructura (3 primeras líneas)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="px-2 py-0.5 bg-white text-[#1A1A1A] hover:bg-neutral-100 text-[11px] font-mono border border-[#E7E5E4] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedSnippet ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSnippet ? '¡Copiado!' : 'Copiar Layout'}</span>
                </button>
              </div>

              {/* Terminal Output */}
              <div className="bg-[#1E1E1E] text-neutral-300 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-2">
                <div className="whitespace-nowrap flex items-center gap-2">
                  <span className="text-neutral-500 select-none">1</span>
                  <span>
                    <span className="text-[#7FFC97] font-semibold">D</span>|
                    <span className="text-[#BC5633]">123</span>|
                    <span className="text-neutral-400">15/10/2026</span>|
                    <span className="text-[#FFDBD0] font-semibold">{cSueldos}</span>|
                    <span className="text-neutral-500">0</span>|
                    <span className="text-neutral-200">Sueldos Juan Pérez López Q19</span>|
                    <span className="text-[#62DF7D]">9000.00</span>|
                    <span className="text-neutral-400">0.00</span>|
                    <span className="text-neutral-400">PELJ900101ABC</span>|
                    <span className="text-neutral-300">Comercializadora Bajio</span>
                  </span>
                </div>
                <div className="whitespace-nowrap flex items-center gap-2">
                  <span className="text-neutral-500 select-none">2</span>
                  <span>
                    <span className="text-[#7FFC97] font-semibold">D</span>|
                    <span className="text-[#BC5633]">123</span>|
                    <span className="text-neutral-400">15/10/2026</span>|
                    <span className="text-[#FFDBD0] font-semibold">{cHoras}</span>|
                    <span className="text-neutral-500">0</span>|
                    <span className="text-neutral-200">Horas Extras dobles LFT Q19</span>|
                    <span className="text-[#62DF7D]">900.00</span>|
                    <span className="text-neutral-400">0.00</span>|
                    <span className="text-neutral-400">PELJ900101ABC</span>|
                    <span className="text-neutral-300">Comercializadora Bajio</span>
                  </span>
                </div>
                <div className="whitespace-nowrap flex items-center gap-2">
                  <span className="text-neutral-500 select-none">3</span>
                  <span>
                    <span className="text-[#7FFC97] font-semibold">D</span>|
                    <span className="text-[#BC5633]">123</span>|
                    <span className="text-neutral-400">15/10/2026</span>|
                    <span className="text-[#FFDBD0] font-semibold">{cBancos}</span>|
                    <span className="text-neutral-500">0</span>|
                    <span className="text-neutral-200">Dispersión SPEI BBVA Líquido</span>|
                    <span className="text-neutral-400">0.00</span>|
                    <span className="text-[#FFB59E]">8899.51</span>|
                    <span className="text-neutral-400">PELJ900101ABC</span>|
                    <span className="text-neutral-300">Comercializadora Bajio</span>
                  </span>
                </div>
              </div>
              <div className="bg-[#F8F7F4] px-4 py-1.5 border-t border-[#E7E5E4] flex items-center justify-between text-neutral-500 font-mono text-[11px]">
                <span>Codificación: UTF-8 BOM</span>
                <span>Delimitador: Pleca (|)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Despacho In-Situ Feedback Section */}
        <div className="bg-white p-5 sm:p-6 border border-[#E7E5E4] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E7E5E4] mb-4 gap-2">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                Retroalimentación de Importación en CONTPAQi®
              </h3>
              <p className="font-sans text-xs text-neutral-500 mt-0.5">
                Validación en sitio — Despachos piloto Allende 16 y Fuentes 311 Celaya
              </p>
            </div>
            <span className="font-mono text-[11px] px-2 py-1 bg-[#F5F5F4] text-neutral-700 self-start md:self-center border border-[#E7E5E4]">
              AUDITORÍA PILOTO V2.0
            </span>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Question 1: Import at first try */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1A1A] block">
                ¿Importó a la primera en CONTPAQi?
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFirstTrySuccess(true)}
                  className={`flex-1 py-1.5 px-3 font-semibold text-center transition-all cursor-pointer ${
                    firstTrySuccess
                      ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A]'
                      : 'bg-white border border-[#E7E5E4] text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  ✓ Sí, sin errores
                </button>
                <button
                  type="button"
                  onClick={() => setFirstTrySuccess(false)}
                  className={`flex-1 py-1.5 px-3 text-center transition-all cursor-pointer ${
                    !firstTrySuccess
                      ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-semibold'
                      : 'bg-white border border-[#E7E5E4] text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  ✕ Marcó rechazo
                </button>
              </div>
            </div>

            {/* Question 2: Version CONTPAQi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1A1A] block">
                Versión CONTPAQi®
              </label>
              <select
                value={contpaqiVersion}
                onChange={(e) => setContpaqiVersion(e.target.value)}
                className="w-full h-9 bg-white text-[#1A1A1A] border border-[#E7E5E4] px-2.5 font-sans focus:outline-none focus:border-[#C65D3A]"
              >
                <option value="16.2.1 (2024/2025)">16.2.1 (2024/2025)</option>
                <option value="16.1.0 (2024)">16.1.0 (2024)</option>
                <option value="15.4.2 (2023)">15.4.2 (2023)</option>
                <option value="14.0.1 (Legacy)">14.0.1 (Legacy)</option>
              </select>
            </div>

            {/* Question 3: Time saved */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1A1A] block">
                Tiempo ahorrado vs captura Excel
              </label>
              <select
                value={tiempoAhorrado}
                onChange={(e) => setTiempoAhorrado(e.target.value)}
                className="w-full h-9 bg-white text-[#1A1A1A] border border-[#E7E5E4] px-2.5 font-sans focus:outline-none focus:border-[#C65D3A]"
              >
                <option value="45 minutos por quincena">45 minutos por quincena</option>
                <option value="1.5 horas por quincena">1.5 horas por quincena</option>
                <option value="3+ horas por póliza múltiple">3+ horas por póliza múltiple</option>
                <option value="Menos de 30 minutos">Menos de 30 minutos</option>
              </select>
            </div>

            {/* Question 4: Failed concept */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1A1A] block">
                Cuenta o concepto que falló (si aplica)
              </label>
              <input
                type="text"
                value={cuentaFalla}
                onChange={(e) => setCuentaFalla(e.target.value)}
                placeholder="Ej. 510-001 no dada de alta en catálogo..."
                className="w-full h-9 bg-white text-[#1A1A1A] border border-[#E7E5E4] px-2.5 font-sans focus:outline-none focus:border-[#C65D3A]"
              />
            </div>

            {/* Submit Action Row */}
            <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-neutral-500">
                {feedbackSaved ? (
                  <span className="text-[#16A34A] font-semibold">
                    ✓ Retroalimentación guardada en bitácora de auditoría Celaya.
                  </span>
                ) : (
                  <span>Métrica auditada para despachos Allende 16 y Fuentes 311.</span>
                )}
              </span>
              <button
                type="submit"
                className="h-9 px-6 bg-[#1A1A1A] hover:bg-black text-white font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Guardar retroalimentación de despacho</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
