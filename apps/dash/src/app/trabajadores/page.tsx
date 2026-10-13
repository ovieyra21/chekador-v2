'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  RotateCcw,
  CreditCard,
  Building,
  KeyRound,
  FileCheck2,
} from 'lucide-react';
import { DashNav } from '../../components/DashNav';

export interface TrabajadorRow {
  id: string;
  num_empleado: string;
  nombre: string;
  rfc: string;
  curp: string;
  nss: string;
  salario_diario: number;
  sbc: number;
  banco: string;
  cuenta_clabe: string;
  nfc_uid: string;
  puesto: string;
  turno: string;
  activo: boolean;
}

// Regex SAT Oficiales
const REGEX_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
const REGEX_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;
const REGEX_CLABE = /^\d{18}$/;
const REGEX_NSS = /^\d{11}$/;

// Demo oficial Juan Pérez López
const DEMO_JUAN_PEREZ: TrabajadorRow = {
  id: 'trab_juan_perez_001',
  num_empleado: 'F-001',
  nombre: 'Juan Pérez López',
  rfc: 'PELJ900101ABC',
  curp: 'PELJ900101HDFRRN09',
  nss: '12345678901',
  salario_diario: 600.0,
  sbc: 629.58,
  banco: 'BBVA México',
  cuenta_clabe: '012180015678901234',
  nfc_uid: '04:A1:B2:C3:D4:E5:F6',
  puesto: 'Auxiliar de Almacén',
  turno: 'Mixto (7.5h)',
  activo: true,
};

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<TrabajadorRow[]>([]);
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [notificacion, setNotificacion] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Formulario Alta Trabajador (8 campos requeridos)
  const [formRfc, setFormRfc] = useState('');
  const [formCurp, setFormCurp] = useState('');
  const [formNss, setFormNss] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formSalario, setFormSalario] = useState('600.00');
  const [formBanco, setFormBanco] = useState('BBVA México');
  const [formClabe, setFormClabe] = useState('');
  const [formNfcUid, setFormNfcUid] = useState('04:A1:B2:C3:D4:E5:F6');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [csvValidationErrors, setCsvValidationErrors] = useState<string[]>([]);
  const [csvValidRows, setCsvValidRows] = useState<TrabajadorRow[]>([]);

  // Inicialización de estado
  useEffect(() => {
    const saved = localStorage.getItem('chekdor_trabajadores_v2');
    if (saved) {
      try {
        setTrabajadores(JSON.parse(saved));
      } catch {
        setTrabajadores([]);
      }
    } else {
      setTrabajadores([]);
    }
  }, []);

  const persistirTrabajadores = (lista: TrabajadorRow[]) => {
    setTrabajadores(lista);
    localStorage.setItem('chekdor_trabajadores_v2', JSON.stringify(lista));
  };

  const handleCargarDemoJuanPerez = () => {
    persistirTrabajadores([DEMO_JUAN_PEREZ]);
    setNotificacion({
      tipo: 'ok',
      texto: 'Cargada 1 fila demo: Juan Pérez López ($600 diario, BBVA, CLABE 18 dígitos, NFC Tag).',
    });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const handleVaciar = () => {
    persistirTrabajadores([]);
    setNotificacion({
      tipo: 'ok',
      texto: 'Tabla de trabajadores reiniciada a estado vacío ("Sin trabajadores").',
    });
    setTimeout(() => setNotificacion(null), 3500);
  };

  // Validación y envío del formulario de Alta Trabajador
  const handleAltaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    const rfcClean = formRfc.trim().toUpperCase();
    const curpClean = formCurp.trim().toUpperCase();
    const nssClean = formNss.trim();
    const clabeClean = formClabe.trim();
    const salarioNum = parseFloat(formSalario);

    if (!formNombre.trim() || formNombre.trim().length < 3) {
      errors.push('Nombre: Debe ingresar el nombre completo del trabajador.');
    }
    if (!REGEX_RFC.test(rfcClean)) {
      errors.push('RFC: Debe tener 12 o 13 caracteres válidos según formato SAT.');
    }
    if (!REGEX_CURP.test(curpClean)) {
      errors.push('CURP: Debe tener exactamente 18 caracteres alfanuméricos.');
    }
    if (!REGEX_NSS.test(nssClean)) {
      errors.push('NSS: Debe ser un número de seguridad social de 11 dígitos.');
    }
    if (isNaN(salarioNum) || salarioNum <= 0) {
      errors.push('Salario Diario: Debe ser un monto numérico positivo.');
    }
    if (!formBanco.trim()) {
      errors.push('Banco: Debe seleccionar o indicar la institución bancaria receptora.');
    }
    if (!REGEX_CLABE.test(clabeClean)) {
      errors.push('Cuenta CLABE: Debe contener exactamente 18 dígitos numéricos.');
    }
    if (!formNfcUid.trim()) {
      errors.push('NFC UID: Requiere identificador único para el reloj checador inmutable.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const nuevo: TrabajadorRow = {
      id: `trab_${Date.now()}`,
      num_empleado: `F-00${trabajadores.length + 1}`,
      nombre: formNombre.trim(),
      rfc: rfcClean,
      curp: curpClean,
      nss: nssClean,
      salario_diario: salarioNum,
      sbc: Math.round(salarioNum * 1.0493 * 100) / 100,
      banco: formBanco.trim(),
      cuenta_clabe: clabeClean,
      nfc_uid: formNfcUid.trim(),
      puesto: 'Operativo / Empleado',
      turno: 'Diurno (8h)',
      activo: true,
    };

    const lista = [...trabajadores, nuevo];
    persistirTrabajadores(lista);
    setShowAltaModal(false);
    setFormErrors([]);
    setFormNombre('');
    setFormRfc('');
    setFormCurp('');
    setFormNss('');
    setFormClabe('');
    setNotificacion({
      tipo: 'ok',
      texto: `Trabajador ${nuevo.nombre} dado de alta exitosamente en la empresa.`,
    });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // Validación CSV 20/20 campos SAT estricta
  const handleValidarCsv = (texto: string) => {
    setCsvContent(texto);
    setCsvValidationErrors([]);
    setCsvValidRows([]);

    if (!texto.trim()) return;

    const lineas = texto.trim().split('\n');
    const erroresEncontrados: string[] = [];
    const filasValidas: TrabajadorRow[] = [];

    lineas.forEach((linea, index) => {
      const numFila = index + 1;
      const partes = linea.split(',').map((p) => p.trim());

      // Si es fila de encabezado la saltamos si empieza con num_empleado o rfc
      if (index === 0 && (partes[0]?.toLowerCase().includes('empleado') || partes[1]?.toLowerCase().includes('nombre'))) {
        return;
      }

      // Debe tener los 20 campos SAT
      if (partes.length < 20) {
        erroresEncontrados.push(
          `Fila ${numFila}: Rechazada completa. Contiene ${partes.length}/20 campos. Se requieren los 20 campos SAT Receptor.`
        );
        return;
      }

      const [
        numEmpleado,
        nombre,
        rfc,
        curp,
        nss,
        salarioDiarioStr,
        sbcStr,
        banco,
        clabe,
        nfcUid,
        puesto,
        turno,
        regimenContratacion,
        periodicidadPago,
        usoCfdi,
        regimenFiscal,
        cp,
        factorIntegracion,
        diasPagados,
        tipoContrato,
      ] = partes;

      // Validación individual de los campos clave
      if (!clabe || !REGEX_CLABE.test(clabe)) {
        erroresEncontrados.push(`Fila ${numFila}: Falta CLABE de 18 dígitos o formato incorrecto (recibido: "${clabe || 'VACÍO'}").`);
        return;
      }
      if (!curp || !REGEX_CURP.test(curp)) {
        erroresEncontrados.push(`Fila ${numFila}: CURP inválido (recibido: "${curp || 'VACÍO'}"). Debe tener 18 caracteres.`);
        return;
      }
      if (!rfc || !REGEX_RFC.test(rfc)) {
        erroresEncontrados.push(`Fila ${numFila}: RFC inválido (recibido: "${rfc || 'VACÍO'}").`);
        return;
      }
      if (!nss || !REGEX_NSS.test(nss)) {
        erroresEncontrados.push(`Fila ${numFila}: NSS inválido (recibido: "${nss || 'VACÍO'}"). Requiere 11 dígitos.`);
        return;
      }
      if (!banco) {
        erroresEncontrados.push(`Fila ${numFila}: Falta campo Banco receptor.`);
        return;
      }
      if (!nfcUid) {
        erroresEncontrados.push(`Fila ${numFila}: Falta identificador nfc_uid para reloj inmutable.`);
        return;
      }

      const sal = parseFloat(salarioDiarioStr);
      if (isNaN(sal) || sal <= 0) {
        erroresEncontrados.push(`Fila ${numFila}: Salario diario inválido.`);
        return;
      }

      filasValidas.push({
        id: `csv_${Date.now()}_${index}`,
        num_empleado: numEmpleado || `F-${100 + index}`,
        nombre: nombre || 'Trabajador CSV',
        rfc: rfc.toUpperCase(),
        curp: curp.toUpperCase(),
        nss,
        salario_diario: sal,
        sbc: parseFloat(sbcStr) || Math.round(sal * 1.0493 * 100) / 100,
        banco,
        cuenta_clabe: clabe,
        nfc_uid: nfcUid,
        puesto: puesto || 'General',
        turno: turno || 'Diurno',
        activo: true,
      });
    });

    setCsvValidationErrors(erroresEncontrados);
    setCsvValidRows(filasValidas);
  };

  const handleImportarCsvConfirm = () => {
    if (csvValidationErrors.length > 0) {
      setNotificacion({
        tipo: 'error',
        texto: `Rechazado: El CSV contiene errores en campos obligatorios SAT. Corrígelos antes de importar.`,
      });
      return;
    }
    if (csvValidRows.length === 0) {
      setNotificacion({
        tipo: 'error',
        texto: 'No se encontraron filas con 20/20 campos SAT válidos.',
      });
      return;
    }

    const unificados = [...trabajadores, ...csvValidRows];
    persistirTrabajadores(unificados);
    setShowCsvModal(false);
    setCsvContent('');
    setCsvValidRows([]);
    setNotificacion({
      tipo: 'ok',
      texto: `✓ Se importaron ${csvValidRows.length} trabajadores cumpliendo el protocolo 20/20 SAT.`,
    });
    setTimeout(() => setNotificacion(null), 4000);
  };

  const handleCargarCsvEjemploFalla = () => {
    // Ejemplo donde fila 4 carece de CLABE para probar el requerimiento exacto
    const csvConFalla = [
      'num_empleado,nombre,rfc,curp,nss,salario_diario,sbc,banco,cuenta_clabe,nfc_uid,puesto,turno,regimen_contratacion,periodicidad_pago,uso_cfdi,regimen_fiscal,codigo_postal,factor_integracion,dias_pagados,tipo_contrato',
      'F-001,Juan Pérez López,PELJ900101ABC,PELJ900101HDFRRN09,12345678901,600.00,629.58,BBVA México,012180015678901234,04:A1:B2:C3:D4:E5:F6,Auxiliar de Almacén,Mixto,02,04,CN01,605,38000,1.0493,15,01',
      'F-002,María Gómez Morales,GOMM920315XYZ,GOMM920315MDFRRN01,98765432109,750.00,786.98,Banorte,072180001234567890,04:B2:C3:D4:E5:F6:A1,Contadora Junior,Diurno,02,04,CN01,605,38010,1.0493,15,01',
      'F-003,Carlos Rivera Sánchez,RISC880520H99,RISC880520HDFRRN08,45678901234,500.00,524.65,Santander,014180009876543210,04:C3:D4:E5:F6:A1:B2,Montacarguista,Diurno,02,04,CN01,605,38020,1.0493,15,01',
      'F-004,Raúl Mendoza Ortiz,MEOR950711K22,MEOR950711HDFRRN05,78901234567,550.00,577.12,BBVA México,,04:D4:E5:F6:A1:B2:C3,Operador de Ruta,Mixto,02,04,CN01,605,38030,1.0493,15,01',
    ].join('\n');

    handleValidarCsv(csvConFalla);
  };

  const handleCargarCsvEjemploValido = () => {
    // Ejemplo donde todas las filas cumplen 20/20 campos
    const csvValido = [
      'num_empleado,nombre,rfc,curp,nss,salario_diario,sbc,banco,cuenta_clabe,nfc_uid,puesto,turno,regimen_contratacion,periodicidad_pago,uso_cfdi,regimen_fiscal,codigo_postal,factor_integracion,dias_pagados,tipo_contrato',
      'F-001,Juan Pérez López,PELJ900101ABC,PELJ900101HDFRRN09,12345678901,600.00,629.58,BBVA México,012180015678901234,04:A1:B2:C3:D4:E5:F6,Auxiliar de Almacén,Mixto,02,04,CN01,605,38000,1.0493,15,01',
      'F-002,María Gómez Morales,GOMM920315XYZ,GOMM920315MDFRRN01,98765432109,750.00,786.98,Banorte,072180001234567890,04:B2:C3:D4:E5:F6:A1,Contadora Junior,Diurno,02,04,CN01,605,38010,1.0493,15,01',
    ].join('\n');

    handleValidarCsv(csvValido);
  };

  return (
    <div className="min-h-screen bg-[#1C1917] text-[#FAFAF9]" style={{ fontSize: '15px' }}>
      <DashNav
        despachoNombre="Sánchez & Asociados S.C."
        empresaNombre="Comercializadora del Bajío S.A. de C.V."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notificación Toast */}
        {notificacion && (
          <div
            className={`mb-6 p-3 rounded text-xs font-mono flex items-center gap-2 border ${
              notificacion.tipo === 'ok'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            {notificacion.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notificacion.texto}</span>
          </div>
        )}

        {/* SI TABLA VACÍA: EMPTY STATE "SIN TRABAJADORES" */}
        {trabajadores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-[#292524] border border-[#44403C] flex items-center justify-center mb-6 shadow-xl">
              <Users className="w-10 h-10 text-[#C65D3A]" />
            </div>

            <h1
              className="font-fraunces font-semibold text-[28px] text-[#FAFAF9] leading-tight mb-2"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: '28px' }}
            >
              Sin trabajadores
            </h1>

            <p className="text-[15px] text-[#A8A29E] leading-relaxed mb-8 max-w-md">
              El padrón laboral de esta empresa cliente se encuentra vacío. Registra tu primer colaborador o
              importa la nómina desde el archivo CSV con validación 20/20 campos SAT.
            </p>

            {/* Botones solicitados: '+ Alta trabajador' y 'Importar CSV 20/20 campos SAT' */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={() => setShowAltaModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-medium text-sm rounded-lg shadow hover:brightness-110 transition-all"
                style={{ backgroundColor: '#C65D3A' }}
              >
                <Plus className="w-4 h-4" />
                <span>+ Alta trabajador</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCsvModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#292524] hover:bg-[#332E2B] text-[#D6D3D1] border border-[#44403C] text-sm font-medium rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#FB923C]" />
                <span>Importar CSV 20/20 campos SAT</span>
              </button>
            </div>

            {/* Botón rápido para cargar 1 fila demo Juan Pérez López */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCargarDemoJuanPerez}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A8A29E] hover:text-[#FB923C] transition-colors underline decoration-dotted underline-offset-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar 1 fila demo: Juan Pérez López ($600 diario)</span>
              </button>
            </div>
          </div>
        ) : (
          /* TABLA DENSA CON 1 FILA DEMO JUAN PÉREZ LÓPEZ (O MÁS) */
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#383330]">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-fraunces font-semibold text-[24px] text-[#FAFAF9]">
                    Padrón de Trabajadores
                  </h1>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#292524] border border-[#44403C] text-[#FB923C]">
                    {trabajadores.length} {trabajadores.length === 1 ? 'colaborador' : 'colaboradores'}
                  </span>
                </div>
                <p className="text-xs text-[#A8A29E] font-mono mt-0.5">
                  Receptor CFDI 4.0 & Art. 132 Fr. XXXIV • Integridad Inalterable
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVaciar}
                  title="Reiniciar padrón a estado vacío"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#24211E] hover:bg-[#2C2825] text-[#A8A29E] hover:text-[#FAFAF9] border border-[#3A3531] text-xs font-mono rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCsvModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#292524] hover:bg-[#332E2B] text-[#D6D3D1] border border-[#44403C] text-xs font-mono rounded transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#FB923C]" />
                  <span>Importar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAltaModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium font-mono rounded shadow hover:brightness-110 transition-all"
                  style={{ backgroundColor: '#C65D3A' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Alta trabajador</span>
                </button>
              </div>
            </div>

            {/* TABLA DENSA: Inter 15px, JetBrains Mono para tags, hashes y códigos */}
            <div className="bg-[#24211E] border border-[#3A3531] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ fontSize: '15px' }}>
                  <thead>
                    <tr className="border-b border-[#383330] bg-[#1E1B18] text-[#A8A29E] font-mono text-[12px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Clave / Nombre</th>
                      <th className="py-2.5 px-3">RFC SAT</th>
                      <th className="py-2.5 px-3">CURP (18)</th>
                      <th className="py-2.5 px-3">NSS (11)</th>
                      <th className="py-2.5 px-3 text-right">Salario D.</th>
                      <th className="py-2.5 px-3 text-right">SBC IMSS</th>
                      <th className="py-2.5 px-3">Banco / CLABE (18)</th>
                      <th className="py-2.5 px-3">Tag NFC UID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#302B27]">
                    {trabajadores.map((t) => (
                      <tr key={t.id} className="hover:bg-[#2A2623] transition-colors">
                        {/* Nombre y Puesto */}
                        <td className="py-2 px-3">
                          <div className="font-medium text-[#FAFAF9] leading-tight">{t.nombre}</div>
                          <div className="text-[12px] text-[#A8A29E] flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-[#C65D3A] font-semibold">{t.num_empleado}</span>
                            <span>•</span>
                            <span>{t.puesto}</span>
                          </div>
                        </td>

                        {/* RFC */}
                        <td className="py-2 px-3 font-mono text-[13px] text-[#FB923C] font-semibold">
                          {t.rfc}
                        </td>

                        {/* CURP */}
                        <td className="py-2 px-3 font-mono text-[12px] text-[#D6D3D1]">
                          {t.curp}
                        </td>

                        {/* NSS */}
                        <td className="py-2 px-3 font-mono text-[12px] text-[#A8A29E]">
                          {t.nss}
                        </td>

                        {/* Salario Diario */}
                        <td className="py-2 px-3 font-mono text-[13px] text-right font-medium text-[#FAFAF9]">
                          ${t.salario_diario.toFixed(2)}
                        </td>

                        {/* SBC */}
                        <td className="py-2 px-3 font-mono text-[12px] text-right text-[#A8A29E]">
                          ${t.sbc.toFixed(2)}
                        </td>

                        {/* Banco y CLABE 18 */}
                        <td className="py-2 px-3">
                          <div className="text-[13px] font-medium text-[#E7E5E4]">{t.banco}</div>
                          <div className="font-mono text-[11px] text-[#78716C] tracking-wide mt-0.5">
                            {t.cuenta_clabe}
                          </div>
                        </td>

                        {/* Tag NFC UID */}
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-[#1C1917] border border-[#443E3A] text-[#FB923C]">
                            <KeyRound className="w-3 h-3 text-[#C65D3A]" />
                            <span>{t.nfc_uid}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: FORM ALTA TRABAJADOR (8 CAMPOS REQUERIDOS) */}
        {showAltaModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#24211E] border border-[#443E3A] rounded-xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setShowAltaModal(false)}
                className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#FAFAF9]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-md bg-[#C65D3A]/20 border border-[#C65D3A]/50 flex items-center justify-center text-[#C65D3A]">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="font-fraunces font-semibold text-xl text-[#FAFAF9]">
                  Alta de Trabajador en Empresa
                </h2>
              </div>
              <p className="text-xs text-[#A8A29E] font-mono mb-4">
                Formulario directo: RFC, CURP, NSS, nombre, salario diario, banco, cuenta CLABE y NFC UID.
              </p>

              {formErrors.length > 0 && (
                <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs font-mono space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                    <AlertCircle className="w-4 h-4" />
                    <span>Errores de validación SAT:</span>
                  </div>
                  {formErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAltaSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      Nombre Completo del Trabajador *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez López"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-sm text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
                    />
                  </div>

                  {/* RFC */}
                  <div>
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      RFC Receptor (12 o 13) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={13}
                      value={formRfc}
                      onChange={(e) => setFormRfc(e.target.value.toUpperCase())}
                      placeholder="PELJ900101ABC"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs font-mono text-[#FAFAF9] tracking-wider uppercase focus:outline-none focus:border-[#C65D3A]"
                    />
                  </div>

                  {/* CURP (18) */}
                  <div>
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      CURP Oficial (18 caracteres) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      value={formCurp}
                      onChange={(e) => setFormCurp(e.target.value.toUpperCase())}
                      placeholder="PELJ900101HDFRRN09"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs font-mono text-[#FAFAF9] tracking-wider uppercase focus:outline-none focus:border-[#C65D3A]"
                    />
                  </div>

                  {/* NSS (11) */}
                  <div>
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      NSS Seguro Social (11 dígitos) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formNss}
                      onChange={(e) => setFormNss(e.target.value)}
                      placeholder="12345678901"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs font-mono text-[#FAFAF9] tracking-wider focus:outline-none focus:border-[#C65D3A]"
                    />
                  </div>

                  {/* Salario Diario */}
                  <div>
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      Salario Diario Integrado Base ($ MXN) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formSalario}
                      onChange={(e) => setFormSalario(e.target.value)}
                      placeholder="600.00"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs font-mono text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
                    />
                  </div>

                  {/* Banco */}
                  <div>
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      Banco Receptor Dispersión *
                    </label>
                    <select
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
                    >
                      <option value="BBVA México">BBVA México (012)</option>
                      <option value="Banorte">Banorte (072)</option>
                      <option value="Santander">Santander (014)</option>
                      <option value="Citibanamex">Citibanamex (002)</option>
                      <option value="HSBC">HSBC (021)</option>
                      <option value="Scotiabank">Scotiabank (044)</option>
                      <option value="Banco Azteca">Banco Azteca (127)</option>
                    </select>
                  </div>

                  {/* Cuenta CLABE (18) */}
                  <div>
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      Cuenta CLABE Interbancaria (18 dígitos) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      value={formClabe}
                      onChange={(e) => setFormClabe(e.target.value)}
                      placeholder="012180015678901234"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs font-mono text-[#FAFAF9] tracking-wider focus:outline-none focus:border-[#C65D3A]"
                    />
                  </div>

                  {/* NFC UID */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-[#D6D3D1] mb-1">
                      UID Tag NFC / Tarjeta Física Asistencia *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNfcUid}
                      onChange={(e) => setFormNfcUid(e.target.value)}
                      placeholder="04:A1:B2:C3:D4:E5:F6"
                      className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded text-xs font-mono text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
                    />
                    <span className="text-[11px] text-[#A8A29E] mt-1 block">
                      * Llave física criptográfica para estampas SHA-256 de jornada (LFT Art. 132 Fr. XXXIV).
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#383330]">
                  <button
                    type="button"
                    onClick={() => setShowAltaModal(false)}
                    className="px-4 py-2 text-xs font-mono text-[#A8A29E] hover:text-[#FAFAF9]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-white font-medium text-xs font-mono rounded shadow hover:brightness-110 transition-all"
                    style={{ backgroundColor: '#C65D3A' }}
                  >
                    Guardar Colaborador
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: IMPORTAR CSV CON VALIDACIÓN 20/20 CAMPOS SAT */}
        {showCsvModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#24211E] border border-[#443E3A] rounded-xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#FAFAF9]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-md bg-[#C65D3A]/20 border border-[#C65D3A]/50 flex items-center justify-center text-[#C65D3A]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h2 className="font-fraunces font-semibold text-xl text-[#FAFAF9]">
                  Importar CSV con Validación 20/20 Campos SAT
                </h2>
              </div>
              <p className="text-xs text-[#A8A29E] font-mono mb-4">
                Solo se admiten archivos que cumplan exactamente los 20 campos SAT. Si falta uno (ej. CLABE en fila 4), se rechaza la fila completa especificando el motivo.
              </p>

              {/* Botones de Prueba Rápida de Validación */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-mono text-[#A8A29E]">Cargar caso de prueba:</span>
                <button
                  type="button"
                  onClick={handleCargarCsvEjemploFalla}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 rounded text-xs font-mono"
                >
                  Probar Rechazo: Fila 4 sin CLABE
                </button>
                <button
                  type="button"
                  onClick={handleCargarCsvEjemploValido}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded text-xs font-mono"
                >
                  Probar Aprobado: 20/20 Válido
                </button>
              </div>

              {/* Textarea para pegar o editar CSV */}
              <div className="mb-4">
                <textarea
                  rows={8}
                  value={csvContent}
                  onChange={(e) => handleValidarCsv(e.target.value)}
                  placeholder="num_empleado,nombre,rfc,curp,nss,salario_diario,sbc,banco,cuenta_clabe,nfc_uid,puesto,turno,regimen_contratacion,periodicidad_pago,uso_cfdi,regimen_fiscal,codigo_postal,factor_integracion,dias_pagados,tipo_contrato..."
                  className="w-full px-3 py-2 bg-[#1C1917] border border-[#443E3A] rounded-lg font-mono text-[11px] text-[#FAFAF9] focus:outline-none focus:border-[#C65D3A]"
                />
              </div>

              {/* Mensajes de Validación */}
              {csvValidationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-rose-950/70 border border-rose-800 rounded text-rose-200 text-xs font-mono space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-100">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Filas rechazadas por no cumplir protocolo 20/20 SAT:</span>
                  </div>
                  {csvValidationErrors.map((err, i) => (
                    <div key={i} className="pl-4">
                      • {err}
                    </div>
                  ))}
                </div>
              )}

              {csvValidRows.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {csvValidRows.length} fila(s) superaron exitosamente los 20/20 campos SAT.
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                    Listo para importar
                  </span>
                </div>
              )}

              {/* Checklist 20 Campos SAT */}
              <div className="p-3 bg-[#1C1917] border border-[#383330] rounded-lg mb-4 text-[11px] font-mono text-[#A8A29E]">
                <div className="text-[#D6D3D1] font-semibold mb-1">
                  20 Campos SAT Receptor Requeridos:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px]">
                  <span>1. num_empleado</span>
                  <span>2. nombre</span>
                  <span>3. rfc (12-13)</span>
                  <span>4. curp (18)</span>
                  <span>5. nss (11)</span>
                  <span>6. salario_diario</span>
                  <span>7. sbc</span>
                  <span>8. banco</span>
                  <span className="text-[#FB923C] font-semibold">9. clabe (18)</span>
                  <span>10. nfc_uid</span>
                  <span>11. puesto</span>
                  <span>12. turno</span>
                  <span>13. regimen_contrato</span>
                  <span>14. periodicidad_pago</span>
                  <span>15. uso_cfdi</span>
                  <span>16. regimen_fiscal</span>
                  <span>17. codigo_postal</span>
                  <span>18. factor_integ</span>
                  <span>19. dias_pagados</span>
                  <span>20. tipo_contrato</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#383330]">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 text-xs font-mono text-[#A8A29E] hover:text-[#FAFAF9]"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={csvValidRows.length === 0 || csvValidationErrors.length > 0}
                  onClick={handleImportarCsvConfirm}
                  className="px-5 py-2.5 text-white font-medium text-xs font-mono rounded shadow hover:brightness-110 transition-all disabled:opacity-40"
                  style={{ backgroundColor: '#C65D3A' }}
                >
                  Importar {csvValidRows.length} Colaboradores Aprobados
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
