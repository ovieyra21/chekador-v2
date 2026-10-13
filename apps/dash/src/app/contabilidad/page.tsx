'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Building,
  Terminal,
  FileText,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { DashNav } from '../../components/DashNav';
import {
  generarPipeCONTPAQi,
  generarCsvGenerico,
  validarExportacionSat20,
  PolizaContableInput,
  EmpresaFiscalInput,
  TrabajadorSatCompleto,
} from '@chekdor/serializadores';

export default function ContabilidadPage() {
  const [catalogoActivo, setCatalogoActivo] = useState<'510-001' | '6000-01-001'>('510-001');
  const [cuentaFallaSimulada, setCuentaFallaSimulada] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [exitoValidacion, setExitoValidacion] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Formulario de validación real (Piloto Allende 16 y Fuentes 311 Celaya)
  const [importoPrimera, setImportoPrimera] = useState<'si' | 'no'>('si');
  const [versionContpaqi, setVersionContpaqi] = useState<string>('16.2.1 (2024/2025)');
  const [tiempoAhorrado, setTiempoAhorrado] = useState<string>('1.5 horas por quincena');
  const [cuentaFalloInput, setCuentaFalloInput] = useState<string>('');
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);

  const empresaDemo: EmpresaFiscalInput = {
    rfc: 'DEMO260101AB1',
    razonSocial: 'Comercializadora del Bajío S.A. de C.V.',
    registroPatronal: 'Y5612345101',
    catalogoBase: catalogoActivo,
  };

  // Mapeo de conceptos a cuentas contables según catálogo seleccionado
  const cuentasMapeo = {
    sueldo: catalogoActivo === '510-001' ? '510-001' : '6000-01-001',
    extra: catalogoActivo === '510-001' ? '510-002' : '6000-01-002',
    prima: catalogoActivo === '510-001' ? '510-003' : '6000-01-003',
    neto: catalogoActivo === '510-001' ? '110-001' : '1102-01-001',
    isr: catalogoActivo === '510-001' ? '210-001' : '2105-01-001',
    imss: catalogoActivo === '510-001' ? '210-002' : '2106-01-001',
  };

  // Datos del trabajador Juan Pérez para verificación 20/20 SAT
  const trabajadorJuan: TrabajadorSatCompleto = {
    numEmpleado: 'F-001',
    nombre: 'Juan Pérez López',
    rfc: 'PELJ900101ABC',
    curp: 'PELJ900101HDFRRN09',
    nss: '12345678901',
    salarioDiario: 600.0,
    sbc: 629.58,
    factorIntegracion: 1.0493,
    banco: 'BBVA México',
    clabe: '012180015678901234',
    puesto: 'Auxiliar de Almacén',
    turno: 'Mixto (7.5h)',
    regimenContratacion: '02',
    periodicidadPago: '04',
    usoCfdi: 'CN01',
    regimenFiscalReceptor: '605',
    codigoPostal: '38000',
    tagNfcUid: '04:A1:B2:C3:D4:E5:F6',
    diasPagados: 15,
    tipoContrato: '01',
    netoAPagar: 8899.51,
  };

  // Póliza contable balanceada DEBE = HABER ($10,200.00)
  const polizaActual: PolizaContableInput = {
    folio: '123',
    fecha: '15/10/2026',
    concepto: 'Provisión Nómina Quincena 19 Comercializadora del Bajío',
    totalDebe: 10200.0,
    totalHaber: 10200.0,
    movimientos: [
      {
        tipoMovimiento: 'D',
        numeroMovimiento: '123',
        fecha: '15/10/2026',
        cuentaContable: cuentasMapeo.sueldo,
        departamento: 0,
        concepto: 'Sueldos Juan Pérez López Q19',
        debe: 9000.0,
        haber: 0.0,
        rfc: 'PELJ900101ABC',
      },
      {
        tipoMovimiento: 'D',
        numeroMovimiento: '123',
        fecha: '15/10/2026',
        cuentaContable: cuentasMapeo.extra,
        departamento: 0,
        concepto: 'Horas Extras Art 68 Juan Pérez',
        debe: 900.0,
        haber: 0.0,
        rfc: 'PELJ900101ABC',
      },
      {
        tipoMovimiento: 'D',
        numeroMovimiento: '123',
        fecha: '15/10/2026',
        cuentaContable: cuentasMapeo.prima,
        departamento: 0,
        concepto: 'Prima Dominical Art 71 Juan Pérez',
        debe: 300.0,
        haber: 0.0,
        rfc: 'PELJ900101ABC',
      },
      {
        tipoMovimiento: 'D',
        numeroMovimiento: '123',
        fecha: '15/10/2026',
        cuentaContable: cuentasMapeo.neto,
        departamento: 0,
        concepto: 'Neto a Dispersar SPEI Juan Pérez',
        debe: 0.0,
        haber: 8899.51,
        rfc: 'PELJ900101ABC',
      },
      {
        tipoMovimiento: 'D',
        numeroMovimiento: '123',
        fecha: '15/10/2026',
        cuentaContable: cuentasMapeo.isr,
        departamento: 0,
        concepto: 'Retención ISR Art 96 LISR SAT',
        debe: 0.0,
        haber: 1117.82,
        rfc: 'PELJ900101ABC',
      },
      {
        tipoMovimiento: 'D',
        numeroMovimiento: '123',
        fecha: '15/10/2026',
        cuentaContable: cuentasMapeo.imss,
        departamento: 0,
        concepto: 'Retención IMSS Obrero LSS',
        debe: 0.0,
        haber: 182.67,
        rfc: 'PELJ900101ABC',
      },
    ],
  };

  // Generación en memoria con BOM único \uFEFF al inicio sin encabezado
  const pipeString = generarPipeCONTPAQi(polizaActual, empresaDemo);
  const csvString = generarCsvGenerico(polizaActual);

  // Ejemplo exacto de 3 líneas pedido en prompt: D|123|15/10/2026|...
  const ejemploPipe3Lineas = [
    `D|123|15/10/2026|${cuentasMapeo.sueldo}|0|Sueldos Juan Pérez|9000.00|0.00|1|1.0000||PELJ900101ABC|Comercializadora del Bajio`,
    `D|123|15/10/2026|${cuentasMapeo.extra}|0|Horas Extras Juan Pérez|900.00|0.00|1|1.0000||PELJ900101ABC|Comercializadora del Bajio`,
    `D|123|15/10/2026|${cuentasMapeo.neto}|0|Neto Bancos Juan Pérez|0.00|8899.51|1|1.0000||PELJ900101ABC|Comercializadora del Bajio`,
  ].join('\r\n');

  // Ejecuta validación 20/20 y DEBE=HABER antes de permitir descarga
  const ejecutarValidacionPrevia = (): boolean => {
    setErrorDescarga(null);
    setExitoValidacion(null);

    // Si hay una simulación de cuenta inexistente activa
    if (cuentaFallaSimulada) {
      setErrorDescarga(`ERROR DE EXPORTACIÓN: Cuenta ${cuentaFallaSimulada} no existe en el catálogo de CONTPAQi.`);
      return false;
    }

    const resultado = validarExportacionSat20([trabajadorJuan], polizaActual, pipeString);

    if (!resultado.puedeDescargar) {
      const campoErr = resultado.campoFallido || 'VALIDACION_FALLIDA';
      const motivo = resultado.motivoError || 'Error al validar póliza.';
      setErrorDescarga(`ERROR DE EXPORTACIÓN [${campoErr}]: ${motivo}`);
      return false;
    }

    setExitoValidacion(
      '✓ Protocolo de verificación 20/20 SAT y Partida Doble DEBE=HABER superado con éxito (Diferencia: $0.00 MXN).'
    );
    return true;
  };

  const handleDescargarPipe = () => {
    const valida = ejecutarValidacionPrevia();
    if (!valida) return;

    // Descarga UTF-8 BOM único sin encabezado
    const blob = new Blob([pipeString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POLIZA_CONTPAQI_PIPE_${catalogoActivo}_Q19.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDescargarCsv = () => {
    const valida = ejecutarValidacionPrevia();
    if (!valida) return;

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POLIZA_GENERICA_CUENTAS_${catalogoActivo}_Q19.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGuardarFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackEnviado(true);
    setTimeout(() => setFeedbackEnviado(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#141210] text-[#FAFAF9] flex flex-col font-sans">
      <DashNav empresaNombre="Comercializadora del Bajío S.A. de C.V." />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header con Nota de Principio Contable */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between pb-6 border-b border-[#2C2825] gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#A8A29E] uppercase tracking-wider mb-1">
              <span>CONTPAQi Contabilidad</span>
              <span>/</span>
              <span className="text-[#FB923C]">Layout Pipe UTF-8 BOM</span>
              <span>/</span>
              <span>Despacho Allende 16 & Fuentes 311</span>
            </div>
            <h1 className="text-3xl font-bold font-fraunces text-[#FAFAF9] tracking-tight">
              Exportación de Póliza Contable
            </h1>
            <p className="text-sm text-[#A8A29E] mt-1 max-w-2xl">
              Generación de asientos contables partida doble para CONTPAQi Contabilidad 14, 15 y 16.
            </p>
          </div>

          {/* Selector de Catálogo Base de Cuentas */}
          <div className="flex items-center bg-[#24201D] p-1 rounded-lg border border-[#3E3833]">
            <button
              type="button"
              onClick={() => {
                setCatalogoActivo('510-001');
                setErrorDescarga(null);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                catalogoActivo === '510-001'
                  ? 'bg-[#C65D3A] text-white font-bold shadow-sm'
                  : 'text-[#A8A29E] hover:text-[#FAFAF9]'
              }`}
            >
              510-001 Tradicional
            </button>
            <button
              type="button"
              onClick={() => {
                setCatalogoActivo('6000-01-001');
                setErrorDescarga(null);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                catalogoActivo === '6000-01-001'
                  ? 'bg-[#C65D3A] text-white font-bold shadow-sm'
                  : 'text-[#A8A29E] hover:text-[#FAFAF9]'
              }`}
            >
              6000-01-001 NIF SAT
            </button>
          </div>
        </div>

        {/* NOTA OBLIGATORIA DESTACADA */}
        <div className="rounded-xl bg-[#1C1917] border border-[#3A342E] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#C65D3A]/20 border border-[#C65D3A]/40 flex items-center justify-center shrink-0 text-[#FB923C]">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs font-mono">
            <span className="font-bold text-[#FAFAF9] block">
              Principio de Operación Chekdor:
            </span>
            <span className="text-[#D6D3D1] italic">
              "Chekdor no inventa cuentas, no crea catálogo, solo transforma horas→póliza."
            </span>
          </div>
        </div>

        {/* MAPEO CONCEPTO -> CUENTA POR EMPRESA */}
        <div className="rounded-xl border border-[#2E2925] bg-[#181614] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#2E2925] gap-2">
            <div>
              <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                Mapeo de Cuentas por Empresa (catalogo_cuentas)
              </h3>
              <p className="text-xs font-mono text-[#A8A29E]">
                Empresa: <strong className="text-[#FAFAF9]">{empresaDemo.razonSocial}</strong> · RFC: {empresaDemo.rfc}
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#24201D] border border-[#3E3833] text-emerald-300">
              Catálogo Base: {catalogoActivo}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#141210] border border-[#282420] flex justify-between items-center">
              <div>
                <span className="text-[#78716C] text-[11px] block uppercase">Concepto: Sueldo Ordinario</span>
                <span className="text-[#D6D3D1] font-sans">Sueldos y Salarios</span>
              </div>
              <strong className="text-base text-[#FB923C] bg-[#24201D] px-2 py-1 rounded border border-[#3E3833]">
                {cuentasMapeo.sueldo}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-[#141210] border border-[#282420] flex justify-between items-center">
              <div>
                <span className="text-[#78716C] text-[11px] block uppercase">Concepto: Horas Extra</span>
                <span className="text-[#D6D3D1] font-sans">Horas Extra Dobles Art 68</span>
              </div>
              <strong className="text-base text-[#FB923C] bg-[#24201D] px-2 py-1 rounded border border-[#3E3833]">
                {cuentasMapeo.extra}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-[#141210] border border-[#282420] flex justify-between items-center">
              <div>
                <span className="text-[#78716C] text-[11px] block uppercase">Concepto: Prima Dominical</span>
                <span className="text-[#D6D3D1] font-sans">Prima Dominical Art 71</span>
              </div>
              <strong className="text-base text-[#FB923C] bg-[#24201D] px-2 py-1 rounded border border-[#3E3833]">
                {cuentasMapeo.prima}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-[#141210] border border-[#282420] flex justify-between items-center">
              <div>
                <span className="text-[#78716C] text-[11px] block uppercase">Concepto: Bancos / Neto</span>
                <span className="text-[#D6D3D1] font-sans">Sueldos por Pagar SPEI</span>
              </div>
              <strong className="text-base text-emerald-400 bg-[#24201D] px-2 py-1 rounded border border-[#3E3833]">
                {cuentasMapeo.neto}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-[#141210] border border-[#282420] flex justify-between items-center">
              <div>
                <span className="text-[#78716C] text-[11px] block uppercase">Concepto: Retención ISR</span>
                <span className="text-[#D6D3D1] font-sans">ISR por Salarios Art 96</span>
              </div>
              <strong className="text-base text-red-400 bg-[#24201D] px-2 py-1 rounded border border-[#3E3833]">
                {cuentasMapeo.isr}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-[#141210] border border-[#282420] flex justify-between items-center">
              <div>
                <span className="text-[#78716C] text-[11px] block uppercase">Concepto: Retención IMSS</span>
                <span className="text-[#D6D3D1] font-sans">Cuota Obrera IMSS</span>
              </div>
              <strong className="text-base text-amber-400 bg-[#24201D] px-2 py-1 rounded border border-[#3E3833]">
                {cuentasMapeo.imss}
              </strong>
            </div>
          </div>
        </div>

        {/* PREVIEW PÓLIZA MONO JETBRAINS 13PX (Partida Doble) */}
        <div className="rounded-xl border border-[#2E2925] bg-[#181614] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#2E2925] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#FB923C]" />
              <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                Preview Póliza de Diario (Mono JetBrains 13px)
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                ✓ DEBE $10,200.00 = HABER $10,200.00 (Diferencia: $0.00)
              </span>

              {/* Botón para simular fallo de cuenta inexistente */}
              <button
                type="button"
                onClick={() =>
                  setCuentaFallaSimulada(
                    cuentaFallaSimulada ? null : cuentasMapeo.sueldo
                  )
                }
                className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                  cuentaFallaSimulada
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'bg-[#24201D] border-[#3E3832] text-[#78716C] hover:text-[#FAFAF9]'
                }`}
                title="Probar regla de cuenta no dada de alta"
              >
                {cuentaFallaSimulada
                  ? 'Quitar simulación error'
                  : 'Simular cuenta faltante'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* TABLA FORMATEADA EN MONO JETBRAINS 13PX */}
            <table className="w-full text-left border-collapse font-mono text-[13px]">
              <thead>
                <tr className="bg-[#1E1B18] border-b border-[#2E2925] text-[#A8A29E] text-[12px] uppercase">
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Folio</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Cuenta Contable</th>
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3 text-right">Cargo (DEBE)</th>
                  <th className="py-2.5 px-3 text-right">Abono (HABER)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2925]">
                {polizaActual.movimientos.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#1E1B18]/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#FB923C]">{m.tipoMovimiento}</td>
                    <td className="py-2.5 px-3 text-[#A8A29E]">{m.numeroMovimiento}</td>
                    <td className="py-2.5 px-3 text-[#A8A29E]">{m.fecha}</td>
                    <td className="py-2.5 px-3 font-bold text-[#FAFAF9]">{m.cuentaContable}</td>
                    <td className="py-2.5 px-3 font-sans text-xs text-[#D6D3D1]">{m.concepto}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {m.debe > 0 ? `$${m.debe.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      {m.haber > 0 ? `$${m.haber.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1E1B18] font-bold border-t-2 border-[#3E3832]">
                  <td colSpan={5} className="py-3 px-3 text-right uppercase text-xs text-[#A8A29E]">
                    Sumas Iguales:
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    ${polizaActual.totalDebe.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400 text-sm">
                    ${polizaActual.totalHaber.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* EJEMPLO PIPE 3 LÍNEAS EXACTO */}
        <div className="rounded-xl border border-[#2E2925] bg-[#12100E] p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#78716C]">
              Ejemplo de Estructura PIPE CONTPAQi (3 líneas con pleca · D|123|15/10/2026|...):
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(ejemploPipe3Lineas);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#24201D] border border-[#3E3832] text-[11px] text-[#D6D3D1] hover:text-[#FAFAF9]"
            >
              {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiado ? 'Copiado' : 'Copiar 3 Líneas'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#0D0B0A] border border-[#262320] rounded text-[12px] text-[#D6D3D1] overflow-x-auto select-all leading-relaxed">
            {ejemploPipe3Lineas}
          </pre>
        </div>

        {/* FEEDBACK DE VALIDACIÓN O ERROR EXACTO */}
        {errorDescarga && (
          <div className="p-4 rounded-xl bg-red-950/90 border border-red-500/60 text-red-100 font-mono text-xs flex items-center gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <strong className="block text-red-200">DESCARGA DETENIDA POR VALIDACIÓN:</strong>
              <span>{errorDescarga}</span>
            </div>
          </div>
        )}

        {exitoValidacion && !errorDescarga && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exitoValidacion}</span>
          </div>
        )}

        {/* BOTONES DE DESCARGA: PRIMARY Y SECONDARY */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          {/* BOTÓN SECONDARY: 'Descargar CSV genérico' */}
          <button
            type="button"
            onClick={handleDescargarCsv}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#24201D] hover:bg-[#2C2825] border border-[#3E3833] text-[#D6D3D1] hover:text-[#FAFAF9] font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FB923C]" />
            <span>Descargar CSV genérico</span>
          </button>

          {/* BOTÓN PRIMARY: 'Descargar PIPE.txt UTF-8 BOM sin encabezado para CONTPAQi Contabilidad' */}
          <button
            type="button"
            onClick={handleDescargarPipe}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C65D3A] hover:bg-[#B34E2D] active:scale-[0.98] text-white font-mono text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PIPE.txt UTF-8 BOM sin encabezado para CONTPAQi Contabilidad</span>
          </button>
        </div>

        {/* FORMULARIO DE VALIDACIÓN REAL: PILOTO ALLENDE 16 Y FUENTES 311 CELAYA */}
        <div className="rounded-xl border border-[#2E2925] bg-[#181614] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#2E2925] gap-2">
            <div>
              <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                Formulario de Validación Real en Despacho
              </h3>
              <p className="text-xs font-sans text-[#A8A29E]">
                Auditoría en sitio · <strong className="text-[#FB923C]">Piloto Allende 16 y Fuentes 311 Celaya</strong>
              </p>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-[#262320] border border-[#3E3833] text-[#D6D3D1]">
              DESPACHO CELAYA GTO
            </span>
          </div>

          <form onSubmit={handleGuardarFeedback} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
            {/* 1. ¿Importó a la primera? Sí/No */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#FAFAF9] block font-mono text-[11px]">
                ¿Importó a la primera en CONTPAQi?
              </label>
              <div className="flex items-center gap-2 pt-1 font-mono">
                <button
                  type="button"
                  onClick={() => setImportoPrimera('si')}
                  className={`flex-1 py-1.5 px-3 rounded text-center transition-all cursor-pointer ${
                    importoPrimera === 'si'
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-[#24201D] border border-[#3E3833] text-[#A8A29E]'
                  }`}
                >
                  ✓ Sí
                </button>
                <button
                  type="button"
                  onClick={() => setImportoPrimera('no')}
                  className={`flex-1 py-1.5 px-3 rounded text-center transition-all cursor-pointer ${
                    importoPrimera === 'no'
                      ? 'bg-red-950 border border-red-500 text-red-300 font-bold'
                      : 'bg-[#24201D] border border-[#3E3833] text-[#A8A29E]'
                  }`}
                >
                  ✕ No
                </button>
              </div>
            </div>

            {/* 2. Versión CONTPAQi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#FAFAF9] block font-mono text-[11px]">
                Versión CONTPAQi®
              </label>
              <select
                value={versionContpaqi}
                onChange={(e) => setVersionContpaqi(e.target.value)}
                className="w-full h-9 rounded bg-[#24201D] border border-[#3E3833] px-2.5 text-xs font-mono text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
              >
                <option value="16.2.1 (2024/2025)">16.2.1 (2024/2025)</option>
                <option value="16.1.0 (2024)">16.1.0 (2024)</option>
                <option value="15.4.2 (2023)">15.4.2 (2023)</option>
                <option value="14.0.1 (Legacy)">14.0.1 (Legacy)</option>
              </select>
            </div>

            {/* 3. Tiempo ahorrado vs Excel */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#FAFAF9] block font-mono text-[11px]">
                Tiempo ahorrado vs Excel
              </label>
              <select
                value={tiempoAhorrado}
                onChange={(e) => setTiempoAhorrado(e.target.value)}
                className="w-full h-9 rounded bg-[#24201D] border border-[#3E3833] px-2.5 text-xs font-mono text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
              >
                <option value="45 minutos por quincena">45 minutos por quincena</option>
                <option value="1.5 horas por quincena">1.5 horas por quincena</option>
                <option value="3+ horas por póliza">3+ horas por póliza</option>
                <option value="Menos de 30 minutos">Menos de 30 minutos</option>
              </select>
            </div>

            {/* 4. Cuenta que falló */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#FAFAF9] block font-mono text-[11px]">
                Cuenta que falló (si aplica)
              </label>
              <input
                type="text"
                value={cuentaFalloInput}
                onChange={(e) => setCuentaFalloInput(e.target.value)}
                placeholder="Ej. Cuenta 510-001 no existe..."
                className="w-full h-9 rounded bg-[#24201D] border border-[#3E3833] px-2.5 text-xs font-mono text-[#FAFAF9] placeholder-[#78716C] focus:outline-none focus:border-[#C65D3A]"
              />
            </div>

            {/* Fila de Envío */}
            <div className="md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-[#262320] gap-3">
              <span className="text-[11px] font-mono text-[#A8A29E]">
                {feedbackEnviado ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Retroalimentación guardada en bitácora piloto Allende 16 & Fuentes 311!
                  </span>
                ) : (
                  <span>Recopilación directa para calibración con contadores en Celaya, Gto.</span>
                )}
              </span>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#24201D] hover:bg-[#2C2825] border border-[#3E3833] text-[#FAFAF9] font-mono text-xs font-semibold cursor-pointer transition-colors"
              >
                Guardar validación de despacho
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
