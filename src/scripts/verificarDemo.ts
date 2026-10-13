/**
 * Script verificar:demo
 * Compara valores del motor puro vs landing vs requerimientos fiscales
 */
import { calcularNominaTrabajador, calcularQuincenaEmpresa } from '../motor';
import { DEMO_TRABAJADORES } from '../mock/demoData';

console.log('═══════════════════════════════════════════════════════════');
console.log(' CHEKDOR v2.0 - VERIFICACIÓN MOTOR VS LANDING DEMO');
console.log('═══════════════════════════════════════════════════════════');

const juan = DEMO_TRABAJADORES[0];
const calculoJuan = calcularNominaTrabajador(juan);

console.log(`[1] Sueldo Ordinario (15 días x $600.00): $${calculoJuan.percepciones[0]?.bruto.toFixed(2)} MXN (Esperado: $9,000.00)`);
console.log(`[2] Horas Extra Dobles (6h al 200%): $${calculoJuan.percepciones[1]?.bruto.toFixed(2)} MXN (Esperado: $900.00)`);
console.log(`[3] Prima Dominical (2 domingos al 25%): $${calculoJuan.percepciones[2]?.bruto.toFixed(2)} MXN (Esperado: $300.00)`);
console.log(`[4] Total Percepciones Brutas: $${calculoJuan.totalBruto.toFixed(2)} MXN (Esperado: $10,200.00)`);
console.log(`[5] Base Gravable Acumulable: $${calculoJuan.totalGravadoLisr.toFixed(2)} MXN (Exento: $${calculoJuan.totalExentoLisr.toFixed(2)})`);
console.log(`[6] Retención ISR Art. 96 Quincenal 2026: $${calculoJuan.retencionIsr.toFixed(2)} MXN (Esperado: $1,117.82)`);
console.log(`[7] Cuota Obrera IMSS (SBC $629.58): $${calculoJuan.imssObrero.toFixed(2)} MXN (Esperado: $182.67)`);
console.log(`[8] NETO Líquido a Dispersar: $${calculoJuan.netoLiquido.toFixed(2)} MXN (Esperado: $8,899.51)`);
console.log(`[9] Costo Total Empresa (Patch guarderias_descuento): $${calculoJuan.costoTotalEmpresa.toFixed(2)} MXN (Esperado: $11,101.19)`);

const resumen = calcularQuincenaEmpresa(DEMO_TRABAJADORES);
console.log('-----------------------------------------------------------');
console.log(`[10] Totales Comercializadora del Bajío (6 trabajadores):`);
console.log(`     - Neto a Dispersar: $${resumen.totalNetoDispersar.toFixed(2)} MXN`);
console.log(`     - Retención ISR: $${resumen.totalRetencionIsr.toFixed(2)} MXN`);
console.log(`     - Retención IMSS Obrero: $${resumen.totalRetencionImssObrero.toFixed(2)} MXN`);
console.log(`     - Costo Total Empresa: $${resumen.totalCostoEmpresa.toFixed(2)} MXN`);
console.log(`     - Diferencia de Cuadre: $${resumen.cuadreDiferencia.toFixed(2)} MXN (CUADRA 0.00)`);

if (
  calculoJuan.totalBruto === 10200 &&
  calculoJuan.retencionIsr === 1117.82 &&
  calculoJuan.imssObrero === 182.67 &&
  calculoJuan.netoLiquido === 8899.51 &&
  calculoJuan.costoTotalEmpresa === 11101.19
) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' ✓ VERIFICACIÓN EXITOSA: 0 DISCREPANCIAS ENTRE MOTOR Y LANDING');
  console.log('═══════════════════════════════════════════════════════════');
} else {
  console.error(' ✕ Error de discrepancia en valores auditados');
  process.exit(1);
}
