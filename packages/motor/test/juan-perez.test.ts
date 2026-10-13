/**
 * packages/motor/test/juan-perez.test.ts
 * Test de validación integral: Juan Pérez López
 * 15 días, $600 diario, 6h extra dobles, 2 domingos prima
 * Verifica: neto 8,899.51, isr 1,117.82, imss obrero 182.67, debe=haber=10,200, costo_total=11,101.19
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calcNomina } from '../src/index';

test('Validación Integral Juan Pérez López', () => {
  const resultado = calcNomina({
    salario_diario: 600,
    sbc: 629.58,
    dias: 15,
    horas_extra_doble: 6,
    horas_extra_triple: 0,
    prima_dominical_dias: 2,
    faltas: 0,
    rfc: 'PELJ900101ABC',
  });

  // 1. Sueldo: 15 días x $600 = $9,000.00
  assert.equal(resultado.sueldo, 9000.00, 'Sueldo ordinario debe ser $9,000.00');

  // 2. Horas extras: 6h dobles = $900.00 ($450 exento, $450 gravado)
  assert.equal(resultado.extra_exento, 450.00, 'Horas extra exento debe ser $450.00');
  assert.equal(resultado.extra_gravado, 450.00, 'Horas extra gravado debe ser $450.00');

  // 3. Prima dominical: 2 domingos = $300.00 ($226.28 exenta, $73.72 gravada)
  assert.equal(resultado.prima_exenta, 226.28, 'Prima dominical exenta debe ser $226.28');
  assert.equal(resultado.prima_gravada, 73.72, 'Prima dominical gravada debe ser $73.72');

  // 4. Base Gravable ISR: 9000 + 450 + 73.72 = $9,523.72
  assert.equal(resultado.base_isr, 9523.72, 'Base gravable ISR debe ser $9,523.72');

  // 5. Retención ISR: $1,117.82
  assert.equal(resultado.isr, 1117.82, 'Retención ISR debe ser $1,117.82');

  // 6. Seguridad Social IMSS Cuota Obrera: $182.67
  assert.equal(resultado.imss_obrero, 182.67, 'IMSS Obrero debe ser $182.67');

  // 7. Líquido a dispersar (NETO): 10,200 - 1,117.82 - 182.67 = $8,899.51
  assert.equal(resultado.neto, 8899.51, 'Neto a dispersar debe ser $8,899.51');

  // 8. Partida Doble Cuadrada: DEBE = HABER = $10,200.00
  assert.equal(resultado.debe, 10200.00, 'Cargos DEBE debe ser $10,200.00');
  assert.equal(resultado.haber, 10200.00, 'Abonos HABER debe ser $10,200.00');
  assert.equal(resultado.debe, resultado.haber, 'DEBE debe ser exactamente igual a HABER (cuadre 0.00)');

  // 9. Costo Total Empresa con fix guarderias_descuento no suma a patronal
  assert.equal(resultado.costo_total, 11101.19, 'Costo total empresa debe ser $11,101.19');
  assert.equal(resultado.imss_patronal_13_conceptos.guarderias_descuento_excluido, true, 'Fix guarderías debe estar activo');
});
