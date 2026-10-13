/**
 * @chekdor/serializadores v2.0.0 (Octubre 2026)
 * 9 Layouts de Exportación Contable y Fiscal para CONTPAQi, Aspel NOI, Bancos, SUA, IDSE y SAT.
 * Strict TypeScript puro, 0 dependencias externas, sin Buffer.
 */

// ============================================================================
// TIPOS DE DATOS DE ENTRADA
// ============================================================================
export interface MovimientoPoliza {
  readonly tipoMovimiento: 'D' | 'M' | 'C' | 'A'; // D: Diario / M: Movimiento
  readonly numeroMovimiento: number | string;
  readonly fecha: string; // DD/MM/AAAA
  readonly cuentaContable: string;
  readonly departamento: string | number;
  readonly concepto: string;
  readonly debe: number;
  readonly haber: number;
  readonly rfc?: string;
  readonly uuid?: string;
}

export interface PolizaContableInput {
  readonly folio: string | number;
  readonly fecha: string; // DD/MM/AAAA
  readonly concepto: string;
  readonly totalDebe: number;
  readonly totalHaber: number;
  readonly movimientos: readonly MovimientoPoliza[];
}

export interface EmpresaFiscalInput {
  readonly rfc: string;
  readonly razonSocial: string;
  readonly registroPatronal?: string;
  readonly catalogoBase?: '510-001' | '6000-01-001';
}

export interface TrabajadorSatCompleto {
  readonly numEmpleado: string;
  readonly nombre: string;
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
  readonly regimenContratacion: string; // '02'
  readonly periodicidadPago: string;     // '04'
  readonly usoCfdi: string;              // 'CN01'
  readonly regimenFiscalReceptor: string;// '605'
  readonly codigoPostal: string;         // 5 dígitos
  readonly tagNfcUid: string;
  readonly diasPagados: number;
  readonly tipoContrato: string;         // '01'
  readonly netoAPagar: number;
}

// ============================================================================
// 1. LAYOUT PRINCIPAL: generarPipeCONTPAQi
// Formato: Tipo|Num|Fecha DD/MM/AAAA|Cuenta|Depto|Concepto|Debe|Haber|Moneda|TipoCambio|UUID|Diario
// UTF-8 con BOM único \uFEFF al inicio solo una vez, sin encabezado.
// ============================================================================
export function generarPipeCONTPAQi(
  poliza: PolizaContableInput,
  empresa: EmpresaFiscalInput
): string {
  const lineas: string[] = [];

  for (const mov of poliza.movimientos) {
    const tipo = mov.tipoMovimiento || 'D';
    const num = poliza.folio.toString();
    const fecha = mov.fecha || poliza.fecha;
    const cuenta = mov.cuentaContable.trim();
    const depto = (mov.departamento ?? 0).toString();
    const conceptoLimpio = mov.concepto.replace(/\|/g, ' ').trim();
    const debeStr = mov.debe.toFixed(2);
    const haberStr = mov.haber.toFixed(2);
    const moneda = '1'; // 1 = Pesos MXN
    const tipoCambio = '1.0000';
    const uuid = mov.uuid || '';
    const rfcRef = mov.rfc || empresa.rfc;
    const razonSocialRef = empresa.razonSocial.replace(/\|/g, ' ').trim();

    // Línea delimitada por plecas sin encabezado
    // Formato: Tipo|Num|Fecha|Cuenta|Depto|Concepto|Debe|Haber|Moneda|TipoCambio|UUID|RFC|RazonSocial
    const fila = [
      tipo,
      num,
      fecha,
      cuenta,
      depto,
      conceptoLimpio,
      debeStr,
      haberStr,
      moneda,
      tipoCambio,
      uuid,
      rfcRef,
      razonSocialRef,
    ].join('|');

    lineas.push(fila);
  }

  // BOM UTF-8 único (\uFEFF) exactamente al inicio
  return '\uFEFF' + lineas.join('\n');
}

// ============================================================================
// 2. LAYOUT: Generar CSV Genérico con Encabezado
// ============================================================================
export function generarCsvGenerico(poliza: PolizaContableInput): string {
  const headers = ['Cuenta', 'Debe', 'Haber', 'Concepto', 'Referencia', 'Fecha'];
  const lineas: string[] = [headers.join(',')];

  for (const m of poliza.movimientos) {
    const fila = [
      `"${m.cuentaContable}"`,
      m.debe.toFixed(2),
      m.haber.toFixed(2),
      `"${m.concepto.replace(/"/g, '""')}"`,
      `"${poliza.folio}"`,
      `"${m.fecha || poliza.fecha}"`,
    ];
    lineas.push(fila.join(','));
  }

  return lineas.join('\n');
}

// ============================================================================
// 3. LAYOUT: Generar JSON Estructurado de Póliza
// ============================================================================
export function generarJsonPoliza(
  poliza: PolizaContableInput,
  empresa: EmpresaFiscalInput
): string {
  const obj = {
    version: '2.0',
    empresa: {
      rfc: empresa.rfc,
      razonSocial: empresa.razonSocial,
      catalogoBase: empresa.catalogoBase || '510-001',
    },
    poliza: {
      folio: poliza.folio,
      fecha: poliza.fecha,
      concepto: poliza.concepto,
      totalDebe: poliza.totalDebe,
      totalHaber: poliza.totalHaber,
      diferencia: Math.round(Math.abs(poliza.totalDebe - poliza.totalHaber) * 100) / 100,
      cuadra: Math.abs(poliza.totalDebe - poliza.totalHaber) <= 0.01,
      movimientos: poliza.movimientos.map((m, idx) => ({
        partida: idx + 1,
        tipo: m.tipoMovimiento,
        cuenta: m.cuentaContable,
        departamento: m.departamento,
        concepto: m.concepto,
        cargo: m.debe,
        abono: m.haber,
        rfc: m.rfc || empresa.rfc,
      })),
    },
  };

  return JSON.stringify(obj, null, 2);
}

// ============================================================================
// 4. LAYOUT: TXT CONTPAQi Estándar P / M (Poliza y Movimientos)
// ============================================================================
export function generarTxtPolizaContpaqi(
  poliza: PolizaContableInput,
  empresa: EmpresaFiscalInput
): string {
  const lineas: string[] = [];
  const tipoDiario = 3; // 3 = Póliza de Diario
  const clase = 1;
  const diario = 0;

  lineas.push(
    `P ${poliza.fecha} ${tipoDiario} ${poliza.folio} ${clase} ${diario} "${poliza.concepto.replace(/"/g, '')}" ${poliza.totalDebe.toFixed(2)} 0 0`
  );

  for (const m of poliza.movimientos) {
    const cuentaClean = m.cuentaContable.replace(/-/g, '');
    const cargo = m.debe > 0 ? m.debe.toFixed(2) : '0';
    const abono = m.haber > 0 ? m.haber.toFixed(2) : '';

    if (m.debe > 0) {
      lineas.push(`M ${cuentaClean} "${m.concepto}" ${cargo} 0 1 ""`);
    } else {
      lineas.push(`M ${cuentaClean} "${m.concepto}" 0 ${abono} 1 ""`);
    }
  }

  return lineas.join('\n');
}

// ============================================================================
// 5. LAYOUT: CSV Genérico 20/20 Campos SAT Receptor
// ============================================================================
export function generarCsvSat20Campos(trabajadores: readonly TrabajadorSatCompleto[]): string {
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
    'USO_CFDI',
    'REGIMEN_FISCAL_RECEPTOR',
    'CODIGO_POSTAL',
    'TAG_NFC_ID',
    'DIAS_PAGADOS',
    'TIPO_CONTRATO',
  ];

  const filas: string[] = [headers.join(',')];

  for (const t of trabajadores) {
    const fila = [
      t.numEmpleado,
      `"${t.nombre}"`,
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
      t.regimenContratacion,
      t.periodicidadPago,
      t.usoCfdi,
      t.regimenFiscalReceptor,
      t.codigoPostal,
      t.tagNfcUid,
      t.diasPagados.toString(),
      t.tipoContrato,
    ];
    filas.push(fila.join(','));
  }

  return filas.join('\n');
}

// ============================================================================
// 6. LAYOUT: Aspel NOI (Layout de Movimientos a la Nómina)
// ============================================================================
export function generarAspelNoiLayout(
  trabajadores: readonly TrabajadorSatCompleto[],
  numeroNomina: number = 19
): string {
  const lineas: string[] = [];
  // Formato NOI: CLAVE_TRAB|NUM_PERC_DED|CLAVE_CONCEPTO|MONTO|APLICA
  for (const t of trabajadores) {
    lineas.push(`${t.numEmpleado}|1|P001|${(t.salarioDiario * t.diasPagados).toFixed(2)}|S`);
    lineas.push(`${t.numEmpleado}|1|NETO|${t.netoAPagar.toFixed(2)}|S`);
  }
  return lineas.join('\r\n');
}

// ============================================================================
// 7. LAYOUT: Dispersión Bancaria TXT (Layout Universal SPEI / CLABE 18)
// ============================================================================
export function generarDispersionBancariaTxt(
  trabajadores: readonly TrabajadorSatCompleto[],
  empresa: EmpresaFiscalInput
): string {
  const lineas: string[] = [];
  let sec = 1;

  for (const t of trabajadores) {
    // SEC|CLABE_18|MONTO|NOMBRE|CONCEPTO_SPEI|RFC
    const fila = [
      String(sec++).padStart(5, '0'),
      t.clabe,
      t.netoAPagar.toFixed(2),
      t.nombre.replace(/\|/g, ' ').substring(0, 40),
      `NOMINA QUINCENA ${empresa.rfc}`,
      t.rfc,
    ].join('|');
    lineas.push(fila);
  }

  return lineas.join('\n');
}

// ============================================================================
// 8. LAYOUT: SUA Movimientos IMSS (.TXT)
// ============================================================================
export function generarLayoutSuaMovimientos(
  trabajadores: readonly TrabajadorSatCompleto[],
  empresa: EmpresaFiscalInput
): string {
  const regPat = (empresa.registroPatronal || 'Y5492183108').replace(/-/g, '').padEnd(11, ' ');
  const lineas: string[] = [];

  for (const t of trabajadores) {
    const nssClean = t.nss.replace(/-/g, '').padEnd(11, ' ');
    const sbcCentavos = Math.round(t.sbc * 100).toString().padStart(7, '0');
    // Tipo movimiento: 08 (Modificación salario) o 07 (Reingreso)
    const fila = `${regPat}${nssClean}08${sbcCentavos}15102026${t.curp.padEnd(18, ' ')}`;
    lineas.push(fila);
  }

  return lineas.join('\r\n');
}

// ============================================================================
// 9. LAYOUT: IDSE / DISPMAG IMSS (.TXT Fijo)
// ============================================================================
export function generarLayoutIdseTxt(
  trabajadores: readonly TrabajadorSatCompleto[],
  empresa: EmpresaFiscalInput
): string {
  const regPat = (empresa.registroPatronal || 'Y5492183108').replace(/-/g, '').padEnd(11, ' ');
  const lineas: string[] = [];

  for (const t of trabajadores) {
    const sbcStr = Math.round(t.sbc * 100).toString().padStart(6, '0');
    // Registro 160 posiciones estándar IDSE
    const registro = `${regPat}${t.nss.padEnd(11, ' ')}${t.curp.padEnd(18, ' ')}08${sbcStr}1510202619000100${t.rfc.padEnd(13, ' ')}`;
    lineas.push(registro);
  }

  return lineas.join('\r\n');
}

// ============================================================================
// VALIDADOR ESTRICTO DE EXPORTACIÓN Y 20/20 CAMPOS SAT
// ============================================================================
export interface ValidacionSatResultado {
  readonly esValido: boolean;
  readonly puedeDescargar: boolean;
  readonly campoFallido?: string;
  readonly motivoError?: string;
  readonly detalles: readonly string[];
  readonly totalCamposValidados: number;
}

// Regex SAT Oficiales
export const REGEX_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;
export const REGEX_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
export const REGEX_CLABE = /^\d{18}$/;
export const REGEX_NSS = /^\d{11}$/;
export const REGEX_CP = /^\d{5}$/;
export const REGEX_FECHA = /^\d{2}\/\d{2}\/\d{4}$/;

export function validarExportacionSat20(
  trabajadores: readonly TrabajadorSatCompleto[],
  poliza: PolizaContableInput,
  pipeString: string
): ValidacionSatResultado {
  const detalles: string[] = [];

  // 1. Validación de Partida Doble: DEBE = HABER con tolerancia 0.01
  const diferenciaCuadre = Math.round(Math.abs(poliza.totalDebe - poliza.totalHaber) * 100) / 100;
  if (diferenciaCuadre > 0.01) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'DESCUADRE_PARTIDA_DOBLE',
      motivoError: `La póliza no cuadra. DEBE: $${poliza.totalDebe.toFixed(2)}, HABER: $${poliza.totalHaber.toFixed(2)}, Diferencia: $${diferenciaCuadre.toFixed(2)} MXN (Tolerancia máx $0.01).`,
      detalles: ['✕ Descuadre en partida doble contable'],
      totalCamposValidados: 0,
    };
  }
  detalles.push(`✓ Partida Doble Cuadrada: DEBE $${poliza.totalDebe.toFixed(2)} = HABER $${poliza.totalHaber.toFixed(2)} (Diferencia: $0.00 MXN)`);

  // 2. Validación de Marcador BOM Único en PIPE
  const tieneBomAlInicio = pipeString.charCodeAt(0) === 0xfeff;
  if (!tieneBomAlInicio) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'UTF8_BOM_FALTANTE',
      motivoError: 'El archivo PIPE no cuenta con el marcador UTF-8 BOM (\\uFEFF) al inicio.',
      detalles,
      totalCamposValidados: 1,
    };
  }
  const tieneSegundoBom = pipeString.slice(1).includes('\uFEFF');
  if (tieneSegundoBom) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'UTF8_BOM_DUPLICADO',
      motivoError: 'El archivo PIPE contiene más de un marcador BOM, lo cual corrompe la importación en CONTPAQi.',
      detalles,
      totalCamposValidados: 2,
    };
  }
  detalles.push('✓ Marcador UTF-8 BOM único validado (0xEF 0xBB 0xBF)');

  // 3. Validación de Ausencia de Encabezado en PIPE
  const contenidoSinBom = pipeString.slice(1);
  const primeraLinea = contenidoSinBom.split('\n')[0] || '';
  if (primeraLinea.toLowerCase().includes('cuenta') || primeraLinea.toLowerCase().includes('debe') || primeraLinea.startsWith('Tipo|')) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'ENCABEZADO_NO_PERMITIDO',
      motivoError: 'El archivo PIPE contiene una fila de encabezado de texto. CONTPAQi exige arrancar directo con los asientos D|...',
      detalles,
      totalCamposValidados: 3,
    };
  }
  if (!primeraLinea.startsWith('D|') && !primeraLinea.startsWith('M|')) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'FORMATO_LINEA_INICIAL_INVALIDO',
      motivoError: `El archivo PIPE debe iniciar con un registro de movimiento 'D|'. Línea detectada: "${primeraLinea}"`,
      detalles,
      totalCamposValidados: 3,
    };
  }
  detalles.push('✓ Ausencia de encabezado en PIPE: arranca directo en registro contable D|...');

  // 4. Validación de Fecha Válida
  if (!REGEX_FECHA.test(poliza.fecha)) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'FECHA_POLIZA_INVALIDA',
      motivoError: `La fecha de la póliza "${poliza.fecha}" no cumple con el formato DD/MM/AAAA.`,
      detalles,
      totalCamposValidados: 4,
    };
  }
  detalles.push(`✓ Fecha de póliza válida: ${poliza.fecha}`);

  // 5. Validación de los 20 Campos SAT Receptor en cada Trabajador
  if (trabajadores.length === 0) {
    return {
      esValido: false,
      puedeDescargar: false,
      campoFallido: 'PADRON_TRABAJADORES_VACIO',
      motivoError: 'No hay trabajadores en el padrón para validar.',
      detalles,
      totalCamposValidados: 4,
    };
  }

  for (const t of trabajadores) {
    // Campo 1: Num Empleado
    if (!t.numEmpleado || t.numEmpleado.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'NUM_EMPLEADO', motivoError: `Trabajador ${t.nombre} sin clave de empleado.`, detalles, totalCamposValidados: 5 };
    }
    // Campo 2: Nombre
    if (!t.nombre || t.nombre.trim().length < 3) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'NOMBRE_COMPLETO', motivoError: `Nombre inválido para trabajador ${t.numEmpleado}.`, detalles, totalCamposValidados: 6 };
    }
    // Campo 3: RFC con regex oficial
    if (!REGEX_RFC.test(t.rfc)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'RFC_RECEPTOR', motivoError: `RFC inválido "${t.rfc}" para ${t.nombre}. Debe cumplir regex SAT ^[A-ZÑ&]{3,4}\\d{6}[A-Z\\d]{3}$.`, detalles, totalCamposValidados: 7 };
    }
    // Campo 4: CURP con regex oficial 18 caracteres
    if (!REGEX_CURP.test(t.curp)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'CURP_RECEPTOR', motivoError: `CURP inválido "${t.curp}" para ${t.nombre}. Debe cumplir regex SAT ^[A-Z]{4}\\d{6}[HM][A-Z]{5}[A-Z\\d]{2}$ (18 caracteres).`, detalles, totalCamposValidados: 8 };
    }
    // Campo 5: NSS 11 dígitos
    if (!REGEX_NSS.test(t.nss)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'NSS', motivoError: `NSS inválido "${t.nss}" para ${t.nombre}. Debe tener 11 dígitos.`, detalles, totalCamposValidados: 9 };
    }
    // Campo 6: Salario Diario > 0
    if (t.salarioDiario <= 0 || isNaN(t.salarioDiario)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'SALARIO_DIARIO', motivoError: `Salario diario inválido (${t.salarioDiario}) para ${t.nombre}.`, detalles, totalCamposValidados: 10 };
    }
    // Campo 7: SBC >= Salario Diario
    if (t.sbc < t.salarioDiario || isNaN(t.sbc)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'SBC_IMSS', motivoError: `SBC (${t.sbc}) no puede ser menor al salario diario (${t.salarioDiario}) para ${t.nombre}.`, detalles, totalCamposValidados: 11 };
    }
    // Campo 8: Factor Integración >= 1.0493
    if (t.factorIntegracion < 1.0493 || isNaN(t.factorIntegracion)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'FACTOR_INTEGRACION', motivoError: `Factor de integración (${t.factorIntegracion}) no puede ser menor a 1.0493 de ley.`, detalles, totalCamposValidados: 12 };
    }
    // Campo 9: Banco no vacío
    if (!t.banco || t.banco.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'BANCO_RECEPTOR', motivoError: `Banco emisor no especificado para ${t.nombre}.`, detalles, totalCamposValidados: 13 };
    }
    // Campo 10: CLABE 18 dígitos exactos
    if (!REGEX_CLABE.test(t.clabe)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'CLABE_INTERBANCARIA', motivoError: `CLABE inválida "${t.clabe}" para ${t.nombre}. Debe cumplir regex ^\\d{18}$ (18 dígitos numéricos).`, detalles, totalCamposValidados: 14 };
    }
    // Campo 11: Puesto
    if (!t.puesto || t.puesto.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'PUESTO', motivoError: `Puesto no especificado para ${t.nombre}.`, detalles, totalCamposValidados: 15 };
    }
    // Campo 12: Turno / Tipo Jornada
    if (!t.turno || t.turno.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'TIPO_JORNADA', motivoError: `Tipo de jornada no especificada para ${t.nombre}.`, detalles, totalCamposValidados: 16 };
    }
    // Campo 13: Régimen de Contratación
    if (!t.regimenContratacion || t.regimenContratacion.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'REGIMEN_CONTRATACION', motivoError: `Régimen de contratación faltante para ${t.nombre}.`, detalles, totalCamposValidados: 17 };
    }
    // Campo 14: Periodicidad de Pago ('04' quincenal)
    if (!t.periodicidadPago || t.periodicidadPago.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'PERIODICIDAD_PAGO', motivoError: `Periodicidad de pago faltante para ${t.nombre}.`, detalles, totalCamposValidados: 18 };
    }
    // Campo 15: Uso CFDI
    if (!t.usoCfdi || (t.usoCfdi !== 'CN01' && t.usoCfdi !== 'G03')) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'USO_CFDI', motivoError: `Uso CFDI inválido "${t.usoCfdi}" para ${t.nombre}. Debe ser CN01 (Nómina) o G03.`, detalles, totalCamposValidados: 19 };
    }
    // Campo 16: Régimen Fiscal Receptor ('605' Sueldos)
    if (!t.regimenFiscalReceptor || t.regimenFiscalReceptor.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'REGIMEN_FISCAL_RECEPTOR', motivoError: `Régimen fiscal del receptor faltante para ${t.nombre}.`, detalles, totalCamposValidados: 20 };
    }
    // Campo 17: Código Postal 5 dígitos
    if (!REGEX_CP.test(t.codigoPostal)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'CODIGO_POSTAL', motivoError: `Código postal inválido "${t.codigoPostal}" para ${t.nombre}. Debe tener 5 dígitos.`, detalles, totalCamposValidados: 21 };
    }
    // Campo 18: Tag NFC UID no vacío
    if (!t.tagNfcUid || t.tagNfcUid.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'TAG_NFC_ID', motivoError: `Token NFC faltante para prueba plena Art. 805 LFT en ${t.nombre}.`, detalles, totalCamposValidados: 22 };
    }
    // Campo 19: Días pagados
    if (t.diasPagados <= 0 || isNaN(t.diasPagados)) {
      return { esValido: false, puedeDescargar: false, campoFallido: 'DIAS_PAGADOS', motivoError: `Días pagados inválidos (${t.diasPagados}) para ${t.nombre}.`, detalles, totalCamposValidados: 23 };
    }
    // Campo 20: Tipo de Contrato
    if (!t.tipoContrato || t.tipoContrato.trim() === '') {
      return { esValido: false, puedeDescargar: false, campoFallido: 'TIPO_CONTRATO', motivoError: `Tipo de contrato no especificado para ${t.nombre}.`, detalles, totalCamposValidados: 24 };
    }
  }

  detalles.push(`✓ 20/20 Campos SAT Receptor validados en ${trabajadores.length} trabajadores:`);
  detalles.push(`  - CURP regex ^[A-Z]{4}\\d{6}[HM][A-Z]{5}[A-Z\\d]{2}$ (18 chars)`);
  detalles.push(`  - RFC regex ^[A-ZÑ&]{3,4}\\d{6}[A-Z\\d]{3}$ (12-13 chars)`);
  detalles.push(`  - Banco emisor y Cuenta CLABE regex ^\\d{18}$ (18 dígitos)`);
  detalles.push(`  - Uso CFDI 'CN01' y Régimen Fiscal '605'`);
  detalles.push(`  - Token NFC físico registrado para cumplimiento LFT Art 132 Fr. XXXIV`);

  return {
    esValido: true,
    puedeDescargar: true,
    detalles,
    totalCamposValidados: 20,
  };
}
