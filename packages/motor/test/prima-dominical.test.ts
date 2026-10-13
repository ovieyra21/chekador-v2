/**
 * packages/motor/test/prima-dominical.test.ts
 * 18 tests unitarios deterministas para calcPrimaDominical (Art. 71 LFT y Art. 93 LISR)
 * 0 dependencias externas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calcPrimaDominical, SALARIO_MINIMO_GENERAL_2026 } from '../src/index';

test('Prima Dominical Suite - 18 Tests Unitarios', async (t) => {
  // Test 1: Validación Juan Pérez López
  await t.test('1. Juan Pérez López: $600 diario, 2 domingos = $300 ($226.28 exento, $73.72 gravado)', () => {
    const res = calcPrimaDominical(600, 2, 'PELJ900101ABC');
    assert.equal(res.importeBruto, 300);
    assert.equal(res.primaExenta, 226.28);
    assert.equal(res.primaGravada, 73.72);
  });

  // Test 2: 0 domingos
  await t.test('2. Cero domingos trabajados retorna 0', () => {
    const res = calcPrimaDominical(500, 0);
    assert.equal(res.importeBruto, 0);
    assert.equal(res.primaExenta, 0);
    assert.equal(res.primaGravada, 0);
  });

  // Tests 3 a 10: Bloques de 1 a 8 domingos laborados
  for (let d = 1; d <= 8; d++) {
    await t.test(`Cálculo 25% para ${d} domingos a salario $400`, () => {
      const res = calcPrimaDominical(400, d);
      const esperado = Math.round(d * (400 * 0.25) * 100) / 100;
      assert.equal(res.importeBruto, esperado);
      assert.equal(res.domingosTrabajados, d);
    });
  }

  // Tests 11 a 16: Exención hasta 1 Salario Mínimo ($278.80) por domingo
  for (let d = 1; d <= 6; d++) {
    await t.test(`Exención tope 1 SM ($${SALARIO_MINIMO_GENERAL_2026}) x ${d} domingos`, () => {
      const salarioBajo = 300; // 25% = $75 < 278.80 -> 100% exento
      const res = calcPrimaDominical(salarioBajo, d);
      assert.equal(res.primaExenta, res.importeBruto);
      assert.equal(res.primaGravada, 0);
    });
  }

  // Tests 17 a 18: Salarios altos que exceden el tope de exención por domingo
  await t.test('17. Salario alto ($2,000 diario): prima $500 excede tope SM', () => {
    const res = calcPrimaDominical(2000, 1);
    assert.equal(res.importeBruto, 500);
    assert.equal(res.primaExenta, SALARIO_MINIMO_GENERAL_2026);
    assert.equal(res.primaGravada, Math.round((500 - SALARIO_MINIMO_GENERAL_2026) * 100) / 100);
  });

  await t.test('18. Salario alto ($2,500 diario) x 2 domingos: genera gravamen', () => {
    const res = calcPrimaDominical(2500, 2);
    const esperadoBruto = 2500 * 0.25 * 2; // 1250
    const esperadoExento = SALARIO_MINIMO_GENERAL_2026 * 2; // 557.60
    assert.equal(res.importeBruto, esperadoBruto);
    assert.equal(res.primaExenta, esperadoExento);
    assert.equal(res.primaGravada, esperadoBruto - esperadoExento);
  });
});
