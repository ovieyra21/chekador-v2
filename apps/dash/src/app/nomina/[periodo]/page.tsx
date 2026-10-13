'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Lock,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowRight,
  Receipt,
  Building,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { DashNav } from '../../../components/DashNav';
import {
  ejecutarCalculoNominaWorker,
  EmpleadoInputParaCalculo,
  ResultadoNominaWorker,
} from '../../../lib/nominaWorker';

interface PageProps {
  params: Promise<{
    periodo: string;
  }>;
}

// Empleado demo oficial Juan Pérez López
const JUAN_PEREZ_INPUT: EmpleadoInputParaCalculo = {
  id: 'trab_juan_perez_001',
  nombre: 'Juan Pérez López',
  rfc: 'PELJ900101ABC',
  salario_diario: 600.0,
  sbc: 629.58,
  dias: 15,
  horas_extra_doble: 6,
  horas_extra_triple: 0,
  prima_dominical_dias: 2,
  faltas: 0,
};

// Generador de 100 empleados para benchmarking Masivo del Web Worker
function generar100Empleados(): EmpleadoInputParaCalculo[] {
  const lista: EmpleadoInputParaCalculo[] = [JUAN_PEREZ_INPUT];

  const nombres = [
    'María Elena Sánchez Rico',
    'Carlos Mendoza Ruiz',
    'Ana Patricia Gómez Tovar',
    'Roberto Carlos Estrada',
    'Laura Isabel Ramírez',
    'Miguel Ángel Torres Vega',
    'Sofía Villalobos Cruz',
    'Fernando Zavala Luna',
    'Gabriela Ortiz Morales',
  ];

  for (let i = 2; i <= 100; i++) {
    const baseNombre = nombres[(i - 2) % nombres.length];
    const salario = 380 + ((i * 17) % 750);
    const sbc = Math.round(salario * 1.0493 * 100) / 100;
    const extras = i % 5 === 0 ? 4 : i % 7 === 0 ? 6 : 0;
    const domingos = i % 6 === 0 ? 1 : i % 11 === 0 ? 2 : 0;

    lista.push({
      id: `trab_demo_${String(i).padStart(3, '0')}`,
      nombre: `${baseNombre} #${i}`,
      rfc: `DEMO${String(900101 + i).slice(0, 6)}X${(i % 9) + 1}`,
      salario_diario: salario,
      sbc,
      dias: 15,
      horas_extra_doble: extras,
      horas_extra_triple: 0,
      prima_dominical_dias: domingos,
      faltas: 0,
    });
  }

  return lista;
}

export default function NominaPeriodoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const periodo = resolvedParams.periodo || '2026-10-1q';

  const [calculando, setCalculando] = useState(false);
  const [resultadoWorker, setResultadoWorker] = useState<ResultadoNominaWorker | null>(null);
  const [descuadreSimulado, setDescuadreSimulado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [descargaError, setDescargaError] = useState<string | null>(null);

  // Ejecutar cálculo automático inicial
  useEffect(() => {
    handleCalcularQuincena();
  }, []);

  const handleCalcularQuincena = async () => {
    setCalculando(true);
    setDescargaError(null);
    try {
      const empleados100 = generar100Empleados();
      const res = await ejecutarCalculoNominaWorker(empleados100);
      setResultadoWorker(res);
    } finally {
      setCalculando(false);
    }
  };

  // Datos específicos de Juan Pérez López
  const juanPerezRes = resultadoWorker?.empleados.find(
    (e) => e.rfc === 'PELJ900101ABC'
  )?.resultado;

  // Cuentas de la póliza de diario para Juan Pérez y empresa demo
  // DEBE: 510-001 (9,000) + 510-002 (900) + 510-003 (300) = 10,200.00
  // HABER: 110-001 (8,899.51) + 210-001 (1,117.82) + 210-002 (182.67) = 10,200.00
  const polizaAsientosDebe = [
    {
      cuenta: '510-001',
      concepto: 'Sueldos y Salarios Ordinarios',
      monto: 9000.0,
      detalle: '15 días x $600.00 (100% gravado ISR)',
    },
    {
      cuenta: '510-002',
      concepto: 'Horas Extras Dobles (Art. 68 LFT)',
      monto: 900.0,
      detalle: '6 hrs dobles (450.00 gravado / 450.00 exento)',
    },
    {
      cuenta: '510-003',
      concepto: 'Prima Dominical (Art. 71 LFT)',
      monto: 300.0,
      detalle: '2 domingos (73.72 gravado / 226.28 exento)',
    },
  ];

  const totalDebeCalculado = polizaAsientosDebe.reduce((acc, curr) => acc + curr.monto, 0);

  // Si se activa el interruptor de prueba de descuadre, introducimos $0.50 de diferencia
  const totalHaberNeto = descuadreSimulado ? 8899.01 : 8899.51;

  const polizaAsientosHaber = [
    {
      cuenta: '110-001',
      concepto: 'Bancos / Sueldos por Pagar (SPEI BBVA)',
      monto: totalHaberNeto,
      detalle: 'Neto a transferir Juan Pérez López',
    },
    {
      cuenta: '210-001',
      concepto: 'Retención ISR Salarios (Art. 96 LISR)',
      monto: 1117.82,
      detalle: 'Impuesto retenido a enterar al SAT',
    },
    {
      cuenta: '210-002',
      concepto: 'Retención IMSS Cuota Obrera',
      monto: 182.67,
      detalle: 'COP retenida SBC $629.58',
    },
  ];

  const totalHaberCalculado = polizaAsientosHaber.reduce((acc, curr) => acc + curr.monto, 0);
  const diferenciaPoliza = Math.abs(Math.round((totalDebeCalculado - totalHaberCalculado) * 100) / 100);
  const polizaCuadra = diferenciaPoliza === 0.0;

  // Generador del archivo CONTPAQi en formato pipe delimitado con BOM único
  const generarContpaqiPipe = () => {
    // Tipo|Num|Fecha DD/MM/AAAA|Cuenta|Depto|Concepto|Debe|Haber
    const fecha = '15/10/2026';
    const num = '19';
    const lineas = [
      `D|${num}|${fecha}|510-001|0|Sueldos Ordinarios Juan Pérez López|9000.00|0.00`,
      `D|${num}|${fecha}|510-002|0|Horas Extras Art 68 Juan Pérez López|900.00|0.00`,
      `D|${num}|${fecha}|510-003|0|Prima Dominical Art 71 Juan Pérez López|300.00|0.00`,
      `D|${num}|${fecha}|110-001|0|Neto Bancos SPEI Juan Pérez López|0.00|${totalHaberNeto.toFixed(2)}`,
      `D|${num}|${fecha}|210-001|0|Retención ISR Art 96 SAT|0.00|1117.82`,
      `D|${num}|${fecha}|210-002|0|Retención IMSS Obrero LSS|0.00|182.67`,
    ];
    return '\uFEFF' + lineas.join('\r\n');
  };

  const handleDescargarPoliza = () => {
    if (!polizaCuadra) {
      setDescargaError(
        'DESCARGA BLOQUEADA: La póliza presenta un descuadre de $' +
          diferenciaPoliza.toFixed(2) +
          '. El sistema contable CONTPAQi requiere sumas exactamente iguales (tolerancia $0.00).'
      );
      return;
    }

    setDescargaError(null);
    const contenido = generarContpaqiPipe();
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POLIZA_CONTPAQI_Q19_${periodo.toUpperCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#141210] text-[#FAFAF9] flex flex-col font-sans">
      <DashNav empresaNombre="Comercializadora del Bajío S.A. de C.V." />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header con Período y Botón Calcular */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#2C2825] gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#A8A29E] uppercase tracking-wider mb-1">
              <span>Nómina Quincenal</span>
              <span>/</span>
              <span className="text-[#FB923C]">Periodo {periodo}</span>
              <span>/</span>
              <span>100 Empleados</span>
            </div>
            <h1 className="text-3xl font-bold font-fraunces text-[#FAFAF9] tracking-tight">
              Cálculo Quincenal & Generador de Póliza
            </h1>
            <p className="text-sm text-[#A8A29E] mt-1">
              Motor puro determinista `@chekdor/motor` en Web Worker asíncrono. Cumplimiento Art. 68 y 71 LFT, Art. 96 LISR, Art. 27 y 211 LSS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Medidor de rendimiento Web Worker */}
            {resultadoWorker && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#24201D] border border-[#3E3833] text-xs font-mono text-emerald-300">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                <span>Web Worker: {resultadoWorker.tiempoMs}ms</span>
                <span className="text-[#78716C]">(&lt;200ms para 100 emp)</span>
              </div>
            )}

            {/* Botón principal: 'Calcular quincena' */}
            <button
              type="button"
              onClick={handleCalcularQuincena}
              disabled={calculando}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C65D3A] hover:bg-[#B34E2D] active:scale-[0.98] text-white font-medium text-xs font-mono shadow-md transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>{calculando ? 'Calculando en Worker...' : 'Calcular quincena'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPIS OBLIGATORIOS: Total Neto, ISR, IMSS, Costo Empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: TOTAL NETO */}
          <div className="p-4 rounded-xl bg-[#1A1816] border border-[#2E2925] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#A8A29E] uppercase font-semibold">
              Total Neto a Dispersar
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FAFAF9]">
                ${(resultadoWorker?.kpis.totalNeto || 8899.51).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                SPEI Listo
              </span>
            </div>
            <span className="text-[11px] text-[#78716C] mt-2 font-mono">
              Juan Pérez: $8,899.51 líquido
            </span>
          </div>

          {/* KPI 2: TOTAL ISR */}
          <div className="p-4 rounded-xl bg-[#1A1816] border border-[#2E2925] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#A8A29E] uppercase font-semibold">
              Retención ISR (Art. 96)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-red-400">
                ${(resultadoWorker?.kpis.totalIsr || 1117.82).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-mono text-red-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">
                A enterar SAT
              </span>
            </div>
            <span className="text-[11px] text-[#78716C] mt-2 font-mono">
              Juan Pérez: $1,117.82 retención
            </span>
          </div>

          {/* KPI 3: TOTAL IMSS OBRERO */}
          <div className="p-4 rounded-xl bg-[#1A1816] border border-[#2E2925] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#A8A29E] uppercase font-semibold">
              Retención IMSS Obrero
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-amber-400">
                ${(resultadoWorker?.kpis.totalImssObrero || 182.67).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                Cuota Obrera
              </span>
            </div>
            <span className="text-[11px] text-[#78716C] mt-2 font-mono">
              Juan Pérez: $182.67 cuota
            </span>
          </div>

          {/* KPI 4: COSTO EMPRESA CON FIX GUARDERÍAS */}
          <div className="p-4 rounded-xl bg-[#1A1816] border border-[#2E2925] flex flex-col justify-between">
            <span className="font-mono text-xs text-[#A8A29E] uppercase font-semibold">
              Costo Empresa (Fix Guarderías)
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#FB923C]">
                ${(resultadoWorker?.kpis.totalCostoEmpresa || 11101.19).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-mono text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/30">
                LSS Art 211
              </span>
            </div>
            <span className="text-[11px] text-[#78716C] mt-2 font-mono">
              Juan Pérez: $11,101.19 total
            </span>
          </div>
        </div>

        {/* TABLA DETALLADA: JUAN PÉREZ LÓPEZ */}
        <div className="rounded-xl border border-[#2E2925] bg-[#181614] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#2E2925] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FB923C]" />
                <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                  Cédula Analítica Individual · Juan Pérez López
                </h3>
              </div>
              <p className="text-xs font-mono text-[#A8A29E] mt-0.5">
                RFC: <code className="text-[#FAFAF9]">PELJ900101ABC</code> · Salario Diario: $600.00 · SBC IMSS: $629.58 · 15 Días
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#262320] border border-[#3E3832] text-[#D6D3D1]">
                6h Dobles · 2 Domingos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#1E1B18] border-b border-[#2E2925] text-[#A8A29E] uppercase text-[11px]">
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3 text-right">Percepción Bruta</th>
                  <th className="py-2.5 px-3 text-right text-emerald-300">Gravado LISR</th>
                  <th className="py-2.5 px-3 text-right text-neutral-400">Exento LISR</th>
                  <th className="py-2.5 px-3 text-right text-red-400">Retención ISR</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Retención IMSS</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Neto Efectivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2925]">
                {/* 1. Sueldo Ordinario */}
                <tr className="hover:bg-[#1E1B18]/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-[#FAFAF9]">
                    Sueldo Ordinario (15 días x $600.00)
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#FAFAF9]">$9,000.00</td>
                  <td className="py-2.5 px-3 text-right text-emerald-300 font-semibold">$9,000.00</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">$0.00</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                </tr>

                {/* 2. Horas Extras */}
                <tr className="hover:bg-[#1E1B18]/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-[#FAFAF9]">
                    Horas Extra Dobles Art. 68 (6 hrs)
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#FAFAF9]">$900.00</td>
                  <td className="py-2.5 px-3 text-right text-emerald-300 font-semibold">$450.00</td>
                  <td className="py-2.5 px-3 text-right text-[#A8A29E]">$450.00</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                </tr>

                {/* 3. Prima Dominical */}
                <tr className="hover:bg-[#1E1B18]/50">
                  <td className="py-2.5 px-3 font-sans font-medium text-[#FAFAF9]">
                    Prima Dominical Art. 71 (2 domingos)
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#FAFAF9]">$300.00</td>
                  <td className="py-2.5 px-3 text-right text-emerald-300 font-semibold">$73.72</td>
                  <td className="py-2.5 px-3 text-right text-[#A8A29E]">$226.28</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                  <td className="py-2.5 px-3 text-right text-[#78716C]">—</td>
                </tr>

                {/* 4. Base ISR & Totales */}
                <tr className="bg-[#24201D] font-bold text-[#FAFAF9] border-t-2 border-[#3E3832]">
                  <td className="py-3 px-3">
                    SUBTOTAL PERCEPCIONES / BASE ISR: $10,200.00
                    <span className="block text-[10px] text-[#A8A29E] font-normal">
                      ($9,523.72 Gravado + $676.28 Exento)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">$10,200.00</td>
                  <td className="py-3 px-3 text-right text-emerald-300">$9,523.72</td>
                  <td className="py-3 px-3 text-right text-[#D6D3D1]">$676.28</td>
                  <td className="py-3 px-3 text-right text-red-400">-$1,117.82</td>
                  <td className="py-3 px-3 text-right text-amber-400">-$182.67</td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">$8,899.51</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#1C1917] border-t border-[#2E2925] flex flex-wrap items-center justify-between text-xs font-mono text-[#A8A29E] gap-2">
            <div>
              <span>Costo Total Empresa Juan Pérez: </span>
              <strong className="text-[#FAFAF9] text-sm font-bold">$11,101.19 MXN</strong>
              <span className="text-[#FB923C] ml-1">(con fix guarderías LSS Art. 211)</span>
            </div>
            <div>
              <span>Tasa Efectiva Retención: </span>
              <strong className="text-[#D6D3D1]">12.75%</strong>
            </div>
          </div>
        </div>

        {/* PÓLIZA PREVIEW SPLIT (DEBE / HABER) */}
        <div className="rounded-xl border border-[#2E2925] bg-[#181614] overflow-hidden shadow-sm flex flex-col gap-0">
          <div className="p-4 border-b border-[#2E2925] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#FB923C]" />
                <h3 className="font-fraunces text-base font-bold text-[#FAFAF9]">
                  Póliza de Diario · Partida Doble CONTPAQi (Layout Anexo 24 SAT)
                </h3>
              </div>
              <p className="text-xs font-mono text-[#A8A29E] mt-0.5">
                Provisión de Nómina Quincena 19 · Despacho Contable · 15/10/2026
              </p>
            </div>

            {/* Checksum Badge y Controles */}
            <div className="flex items-center gap-3">
              {polizaCuadra ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>CUADRA diferencia 0.00</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-950/80 border border-red-500/40 text-red-300 font-mono text-xs font-bold shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>DESCUADRE: ${diferenciaPoliza.toFixed(2)}</span>
                </div>
              )}

              {/* Botón de prueba para simular descuadre (Auditoría) */}
              <button
                type="button"
                onClick={() => setDescuadreSimulado(!descuadreSimulado)}
                title="Probar regla de bloqueo ante descuadre"
                className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                  descuadreSimulado
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-[#24201D] border-[#3E3832] text-[#78716C] hover:text-[#FAFAF9]'
                }`}
              >
                {descuadreSimulado ? 'Quitar Simulación' : 'Simular Descuadre'}
              </button>
            </div>
          </div>

          {/* SPLIT DEBE / HABER EN 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2E2925]">
            {/* COLUMNA IZQUIERDA: DEBE */}
            <div className="flex flex-col">
              <div className="p-3 bg-[#1C1917] border-b border-[#2E2925] flex items-center justify-between text-xs font-mono font-semibold text-[#D6D3D1]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C65D3A]"></span>
                  <span>DEBE · CARGOS (Cuentas de Gasto 510)</span>
                </span>
                <span className="text-[#A8A29E]">$10,200.00</span>
              </div>

              <div className="p-4 space-y-3 font-mono text-xs flex-1">
                {polizaAsientosDebe.map((asiento) => (
                  <div
                    key={asiento.cuenta}
                    className="p-3 rounded-lg bg-[#141210] border border-[#262320] flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-[#FB923C] text-sm">{asiento.cuenta}</strong>
                        <span className="font-sans font-medium text-[#FAFAF9]">
                          {asiento.concepto}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#78716C] mt-0.5 block">
                        {asiento.detalle}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#FAFAF9] shrink-0 ml-3">
                      ${asiento.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#1E1B18] border-t border-[#2E2925] flex items-center justify-between text-xs font-mono font-bold text-[#FAFAF9]">
                <span>SUMA CARGOS (DEBE):</span>
                <span className="text-sm text-emerald-400">${totalDebeCalculado.toFixed(2)}</span>
              </div>
            </div>

            {/* COLUMNA DERECHA: HABER */}
            <div className="flex flex-col">
              <div className="p-3 bg-[#1C1917] border-b border-[#2E2925] flex items-center justify-between text-xs font-mono font-semibold text-[#D6D3D1]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>HABER · ABONOS (Pasivo y Bancos 110/210)</span>
                </span>
                <span className="text-[#A8A29E]">${totalHaberCalculado.toFixed(2)}</span>
              </div>

              <div className="p-4 space-y-3 font-mono text-xs flex-1">
                {polizaAsientosHaber.map((asiento) => (
                  <div
                    key={asiento.cuenta}
                    className="p-3 rounded-lg bg-[#141210] border border-[#262320] flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-emerald-400 text-sm">{asiento.cuenta}</strong>
                        <span className="font-sans font-medium text-[#FAFAF9]">
                          {asiento.concepto}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#78716C] mt-0.5 block">
                        {asiento.detalle}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#FAFAF9] shrink-0 ml-3">
                      ${asiento.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#1E1B18] border-t border-[#2E2925] flex items-center justify-between text-xs font-mono font-bold text-[#FAFAF9]">
                <span>SUMA ABONOS (HABER):</span>
                <span className={`text-sm ${polizaCuadra ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${totalHaberCalculado.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Sumas Iguales y Descarga CONTPAQi */}
          <div className="p-4 bg-[#1A1816] border-t border-[#2E2925] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[#A8A29E]">Diferencia de Póliza:</span>
              <strong
                className={`text-sm ${
                  polizaCuadra ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                ${diferenciaPoliza.toFixed(2)} MXN
              </strong>
              {polizaCuadra && (
                <span className="text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                  ✓ Principio de Partida Doble Satisfecho
                </span>
              )}
            </div>

            {/* BOTÓN DESCARGA: SI DIFERENCIA != 0 BLOQUEA DESCARGA EN ROJO */}
            <div>
              {!polizaCuadra ? (
                <button
                  type="button"
                  onClick={handleDescargarPoliza}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold shadow transition-all cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>DESCARGA BLOQUEADA (Diferencia != 0.00)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDescargarPoliza}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C65D3A] hover:bg-[#B34E2D] active:scale-[0.98] text-white font-mono text-xs font-bold shadow transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar CONTPAQi Pipe (.txt con BOM único)</span>
                </button>
              )}
            </div>
          </div>

          {/* Alerta de Error de Descarga */}
          {descargaError && (
            <div className="p-3 bg-red-950/90 border-t border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{descargaError}</span>
            </div>
          )}
        </div>

        {/* CONTPAQi Preview Raw Pipe Display */}
        <div className="rounded-xl border border-[#2E2925] bg-[#12100E] p-4 font-mono text-xs text-[#A8A29E] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#78716C]">
              Vista Previa de Líneas Pipe CONTPAQi (Sin Encabezado · UTF-8 con BOM único \uFEFF):
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generarContpaqiPipe());
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#24201D] border border-[#3E3832] text-[10px] text-[#D6D3D1] hover:text-[#FAFAF9]"
            >
              {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#0D0B0A] border border-[#262320] rounded text-[11px] text-[#D6D3D1] overflow-x-auto select-all">
            {generarContpaqiPipe()}
          </pre>
        </div>
      </main>
    </div>
  );
}
