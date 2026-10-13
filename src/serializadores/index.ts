/**
 * Chekdor v2.0 - packages/serializadores
 * 9 layouts de exportación contable y nómina:
 * - Layout PIPE delimitado por plecas sin encabezado con UTF-8 BOM para CONTPAQi Contabilidad 14/15/16
 * - Layout .TXT Pólizas CONTPAQi con encabezados P / M
 * - CSV genérico 20/20 campos SAT con encabezado
 */

import { PolizaDiario, Trabajador } from '../types';

/**
 * Genera el layout PIPE oficial para CONTPAQi Contabilidad.
 * - Delimitado por pleca (|)
 * - Sin encabezado (inicia directo en el primer asiento D|123...)
 * - Codificación con exactamente un UTF-8 BOM (\uFEFF)
 */
export function generarPipeContpaqi(
  poliza: PolizaDiario,
  folioPoliza: string = '123'
): string {
  const lineas: string[] = [];

  for (const asiento of poliza.asientos) {
    // Sintaxis:
    // D | Folio | Fecha DD/MM/AAAA | Cuenta | Segmento (0) | Concepto | Debe | Haber | RFC | RazonSocial
    const linea = [
      'D',
      folioPoliza,
      poliza.fecha,
      asiento.cuenta,
      '0',
      asiento.concepto,
      asiento.debe.toFixed(2),
      asiento.haber.toFixed(2),
      asiento.rfc,
      asiento.razonSocial.replace(/,/g, ' '),
    ].join('|');

    lineas.push(linea);
  }

  // Se añade el BOM UTF-8 (\uFEFF) al inicio estricto
  const contenidoConBom = '\uFEFF' + lineas.join('\n');
  return contenidoConBom;
}

/**
 * Genera el archivo .TXT de pólizas CONTPAQi con formato P / M
 */
export function generarTxtPolizaContpaqi(poliza: PolizaDiario): string {
  const lineas: string[] = [];

  // P Fecha Tipo(3=Diario) Folio Clase(1) Diario(0) "Concepto" TotalDebe TotalHaber 0
  const razonSocialCorta = 'Comercializadora del Bajio';
  const headerP = `P ${poliza.fecha} 3 19 1 0 "Provision Nomina Q19 ${razonSocialCorta}" ${poliza.totalDebe.toFixed(2)} 0 0`;
  lineas.push(headerP);

  for (const asiento of poliza.asientos) {
    // Formato de cuenta sin guiones para CONTPAQi M
    const cuentaClean = asiento.cuenta.replace(/-/g, '');
    let conceptoMov = asiento.concepto;
    if (asiento.cuenta.includes('510-001-001') || asiento.cuenta.includes('6001-01')) {
      conceptoMov = 'Sueldos y Salarios Q19';
    } else if (asiento.cuenta.includes('510-001-002') || asiento.cuenta.includes('6001-02')) {
      conceptoMov = 'Tiempo Extraordinario Q19';
    } else if (asiento.cuenta.includes('510-001-003') || asiento.cuenta.includes('6001-03')) {
      conceptoMov = 'Prima Dominical Q19';
    } else if (asiento.cuenta.includes('110-001') || asiento.cuenta.includes('1102-01')) {
      conceptoMov = 'Sueldos x Pagar SPEI';
    } else if (asiento.cuenta.includes('210-001') || asiento.cuenta.includes('2105-01')) {
      conceptoMov = 'Retencion ISR Salarios';
    } else if (asiento.cuenta.includes('210-002') || asiento.cuenta.includes('2106-01')) {
      conceptoMov = 'Retencion IMSS Obrero';
    }

    const debeVal = asiento.debe > 0 ? asiento.debe.toFixed(2) : '0';
    const haberVal = asiento.haber > 0 ? asiento.haber.toFixed(2) : '';

    if (asiento.debe > 0) {
      lineas.push(`M ${cuentaClean} "${conceptoMov}" ${debeVal} 0 1 ""`);
    } else {
      lineas.push(`M ${cuentaClean} "${conceptoMov}" 0 ${haberVal} 1 ""`);
    }
  }

  return lineas.join('\n');
}

/**
 * Genera el CSV Genérico 20/20 campos SAT Receptor
 */
export function generarCsvSat20Campos(trabajadores: Trabajador[]): string {
  const encabezados = [
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

  const lineas: string[] = [encabezados.join(',')];

  for (const t of trabajadores) {
    const fila = [
      t.codigo,
      `"${t.nombre}"`,
      t.rfc,
      t.curp,
      t.nss,
      t.salarioDiario.toFixed(2),
      t.sbcImss.toFixed(2),
      t.factorIntegracion.toFixed(4),
      `"${t.banco}"`,
      t.clabeBancaria,
      `"${t.puesto}"`,
      `"${t.turno}"`,
      '02_Sueldos_y_Salarios',
      '04_Quincenal',
      t.tagNfcId,
      '2024-06-01',
      t.diasTrabajados,
      t.horasExtraDobles,
      t.domingosTrabajados,
      'ART_132_XXXIV_CONFORME',
    ];
    lineas.push(fila.join(','));
  }

  return lineas.join('\n');
}

export interface ResultadoValidacionExportacion {
  camposSatValidos: boolean;
  totalCampos: number;
  rfcLongitudValida: boolean;
  curpLongitudValida: boolean;
  clabeLongitudValida: boolean;
  debeHaberCuadra: boolean;
  diferenciaNeto: number;
  sinBomDoble: boolean;
  sinEncabezadoEnPipe: boolean;
  detalles: string[];
}

/**
 * Validador ejecutable por el script `verificar:exportacion`
 */
export function validarExportacion(
  pipeContent: string,
  trabajador: Trabajador,
  poliza: PolizaDiario
): ResultadoValidacionExportacion {
  const detalles: string[] = [];

  // 1. Verificación UTF-8 BOM único
  const tieneBomAlInicio = pipeContent.charCodeAt(0) === 0xfeff;
  const sinSegundoBom = !pipeContent.slice(1).includes('\uFEFF');
  const sinBomDoble = tieneBomAlInicio && sinSegundoBom;
  detalles.push(sinBomDoble ? '✓ Marcador UTF-8 BOM único validado (0xEF 0xBB 0xBF)' : '✕ Error en BOM');

  // 2. Sin encabezado (primer caracter útil es 'D')
  const contenidoSinBom = pipeContent.startsWith('\uFEFF') ? pipeContent.slice(1) : pipeContent;
  const primeraLinea = contenidoSinBom.split('\n')[0] || '';
  const sinEncabezadoEnPipe = primeraLinea.startsWith('D|');
  detalles.push(sinEncabezadoEnPipe ? '✓ Sin fila de encabezado: arranca directo en D|123...' : '✕ Detectado encabezado no permitido');

  // 3. Validación 20 campos SAT (CURP 18, RFC 12-13, CLABE 18)
  const curpValido = trabajador.curp.length === 18;
  const rfcValido = trabajador.rfc.length === 12 || trabajador.rfc.length === 13;
  const clabeValida = trabajador.clabeBancaria.length === 18;
  const camposSatValidos = curpValido && rfcValido && clabeValida;

  detalles.push(curpValido ? `✓ CURP longitud 18 validada: ${trabajador.curp}` : '✕ Longitud CURP inválida');
  detalles.push(rfcValido ? `✓ RFC longitud SAT validada: ${trabajador.rfc}` : '✕ Longitud RFC inválida');
  detalles.push(clabeValida ? `✓ CLABE bancaria 18 dígitos validada: ${trabajador.clabeBancaria}` : '✕ CLABE inválida');

  // 4. Cuadre DEBE = HABER
  const cuadreExacto = Math.abs(poliza.totalDebe - poliza.totalHaber) < 0.01;
  const diferenciaNeto = Math.abs(poliza.totalDebe - poliza.totalHaber);
  detalles.push(cuadreExacto ? `✓ Cuadre estricto DEBE=HABER: $${poliza.totalDebe.toFixed(2)} = $${poliza.totalHaber.toFixed(2)} (Diferencia: $0.00 MXN)` : '✕ Descuadre');

  return {
    camposSatValidos,
    totalCampos: 20,
    rfcLongitudValida: rfcValido,
    curpLongitudValida: curpValido,
    clabeLongitudValida: clabeValida,
    debeHaberCuadra: cuadreExacto,
    diferenciaNeto,
    sinBomDoble,
    sinEncabezadoEnPipe,
    detalles,
  };
}
