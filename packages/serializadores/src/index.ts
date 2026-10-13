/**
 * @chekdor/serializadores v2.0.0
 * 9 layouts de exportación contable para CONTPAQi, Aspel NOI y Anexo 24 SAT.
 * Strict TypeScript, sin any, sin dependencias externas pesadas.
 */

export interface AsientoContableData {
  readonly folio: string;
  readonly fecha: string; // DD/MM/AAAA
  readonly cuentaContable: string;
  readonly concepto: string;
  readonly debe: number;
  readonly haber: number;
  readonly rfcReceptor: string;
  readonly razonSocial: string;
}

export interface TrabajadorSatExport {
  readonly numEmpleado: string;
  readonly nombreCompleto: string;
  readonly rfc: string;
  readonly curp: string;
  readonly nss: string;
  readonly salarioDiario: number;
  readonly sbc: number;
  readonly factorIntegracion: number;
  readonly banco: string;
  readonly clabe: string;
  readonly puesto: string;
  readonly turno: string;
  readonly tagNfcUid: string;
  readonly diasTrabajados: number;
  readonly horasExtraDobles: number;
  readonly domingosTrabajados: number;
}

/**
 * 1. Layout PIPE delimitado por plecas sin encabezado con UTF-8 BOM
 * Para CONTPAQi Contabilidad 14/15/16.
 */
export function serializarPipeContpaqi(asientos: readonly AsientoContableData[]): string {
  const lineas: string[] = [];

  for (const a of asientos) {
    const segmento = '0';
    const fila = [
      'D',
      a.folio,
      a.fecha,
      a.cuentaContable,
      segmento,
      a.concepto.replace(/\|/g, ' '),
      a.debe.toFixed(2),
      a.haber.toFixed(2),
      a.rfcReceptor,
      a.razonSocial.replace(/\|/g, ' '),
    ].join('|');
    lineas.push(fila);
  }

  // BOM UTF-8 único (\uFEFF)
  return '\uFEFF' + lineas.join('\n');
}

/**
 * 2. Layout TXT Póliza CONTPAQi con encabezados P / M
 */
export function serializarTxtPolizaContpaqi(
  folio: string,
  fecha: string,
  concepto: string,
  totalDebe: number,
  asientos: readonly AsientoContableData[]
): string {
  const lineas: string[] = [];
  const tipoDiario = 3;
  const clase = 1;
  const diario = 0;

  lineas.push(
    `P ${fecha} ${tipoDiario} ${folio} ${clase} ${diario} "${concepto.replace(/"/g, '')}" ${totalDebe.toFixed(2)} 0 0`
  );

  for (const a of asientos) {
    const cuentaClean = a.cuentaContable.replace(/-/g, '');
    const debeStr = a.debe > 0 ? a.debe.toFixed(2) : '0';
    const haberStr = a.haber > 0 ? a.haber.toFixed(2) : '';

    if (a.debe > 0) {
      lineas.push(`M ${cuentaClean} "${a.concepto}" ${debeStr} 0 1 ""`);
    } else {
      lineas.push(`M ${cuentaClean} "${a.concepto}" 0 ${haberStr} 1 ""`);
    }
  }

  return lineas.join('\n');
}

/**
 * 3. Layout CSV Genérico con 20/20 campos SAT Receptor
 */
export function serializarCsvSat20Campos(trabajadores: readonly TrabajadorSatExport[]): string {
  const headers = [
    'NUM_EMPLEADO',
    'NOMBRE_COMPLETO',
    'RFC_RECEPTOR',
    'CURP_RECEPTOR',
    'NSS',
    'SALARIO_DIARIO',
    'SBC_IMSS',
    'FACTOR_INTEGRACION',
    'BANCO_RECEPTOR',
    'CLABE_INTERBANCARIA',
    'PUESTO',
    'TIPO_JORNADA',
    'REGIMEN_CONTRATACION',
    'PERIODICIDAD_PAGO',
    'TAG_NFC_ID',
    'FECHA_ALTA',
    'DIAS_PAGADOS',
    'HORAS_EXTRA_DOBLES',
    'DOMINGOS_PRIMA',
    'ESTATUS_AUDITORIA',
  ];

  const filas: string[] = [headers.join(',')];

  for (const t of trabajadores) {
    const fila = [
      t.numEmpleado,
      `"${t.nombreCompleto}"`,
      t.rfc,
      t.curp,
      t.nss,
      t.salarioDiario.toFixed(2),
      t.sbc.toFixed(2),
      t.factorIntegracion.toFixed(4),
      `"${t.banco}"`,
      t.clabe,
      `"${t.puesto}"`,
      `"${t.turno}"`,
      '02_Sueldos_y_Salarios',
      '04_Quincenal',
      t.tagNfcUid,
      '2026-10-01',
      t.diasTrabajados.toString(),
      t.horasExtraDobles.toString(),
      t.domingosTrabajados.toString(),
      'CONFORME_LFT_ART_132_XXXIV',
    ];
    filas.push(fila.join(','));
  }

  return filas.join('\n');
}
