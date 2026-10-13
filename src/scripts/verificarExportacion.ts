/**
 * Script verificar:exportacion
 * Valida 20/20 campos SAT Receptor (CURP 18, RFC 13, Banco, CLABE 18),
 * sin doble BOM, sin encabezado, y DEBE=HABER 0.00.
 */
import { calcularNominaTrabajador, generarPolizaDiario } from '../motor';
import { generarPipeContpaqi, validarExportacion } from '../serializadores';
import { DEMO_TRABAJADORES } from '../mock/demoData';

console.log('═══════════════════════════════════════════════════════════');
console.log(' CHEKDOR v2.0 - VERIFICACIÓN DE EXPORTACIÓN 20/20 SAT & PIPE');
console.log('═══════════════════════════════════════════════════════════');

const juan = DEMO_TRABAJADORES[0];
const calculoJuan = calcularNominaTrabajador(juan);
const poliza = generarPolizaDiario(calculoJuan, '510-001', 'Comercializadora del Bajío S.A. de C.V.');
const pipe = generarPipeContpaqi(poliza, '123');

const validacion = validarExportacion(pipe, juan, poliza);

for (const detalle of validacion.detalles) {
  console.log(`[OK] ${detalle}`);
}

console.log('-----------------------------------------------------------');
console.log(`Resumen de Integridad:`);
console.log(`- Total Campos SAT Verificados: ${validacion.totalCampos}/20`);
console.log(`- Marcador UTF-8 BOM Único: ${validacion.sinBomDoble ? 'VÁLIDO (0xEF 0xBB 0xBF)' : 'INVÁLIDO'}`);
console.log(`- Ausencia de Encabezado: ${validacion.sinEncabezadoEnPipe ? 'VÁLIDO (Arranca en D|123...)' : 'INVÁLIDO'}`);
console.log(`- Balance Partida Doble: DEBE $${poliza.totalDebe.toFixed(2)} = HABER $${poliza.totalHaber.toFixed(2)} (Diferencia: $${validacion.diferenciaNeto.toFixed(2)} MXN)`);

if (
  validacion.camposSatValidos &&
  validacion.sinBomDoble &&
  validacion.sinEncabezadoEnPipe &&
  validacion.debeHaberCuadra
) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' ✓ PROTOCOLO 20/20 SAT Y CONTPAQi APROBADO: Póliza lista para Celaya.');
  console.log('═══════════════════════════════════════════════════════════');
} else {
  console.error(' ✕ Error de validación en protocolo de exportación');
  process.exit(1);
}
