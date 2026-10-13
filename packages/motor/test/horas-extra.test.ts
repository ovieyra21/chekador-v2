/**
 * packages/motor/test/horas-extra.test.ts
 * 31 tests unitarios deterministas para calcHorasExtra (Art. 68 LFT y Art. 93 LISR)
 * 0 dependencias externas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calcHorasExtra, SALARIO_MINIMO_GENERAL_2026, UMA_2026 } from '../src/index';

test('Horas Extra Suite - 31 Tests Unitarios', async (t) => {
  // Test 1: Validación Juan Pérez López
  await t.test('1. Juan Pérez López: $600 diario, 6h dobles = $900 ($450 exento, $450 gravado)', () => {
    const res = calcHorasExtra(600, 6, 0);
    assert.equal(res.totalExtraBruto, 900);
    assert.equal(res.extraExento, 450);
    assert.equal(res.extraGravado, 450);
  });

  // Test 2: 0 horas
  await t.test('2. Cero horas retorna montos en 0', () => {
    const res = calcHorasExtra(500, 0, 0);
    assert.equal(res.totalExtraBruto, 0);
    assert.equal(res.extraExento, 0);
    assert.equal(res.extraGravado, 0);
  });

  // Tests 3 a 12: Bloques de horas dobles (1h a 10h)
  for (let h = 1; h <= 10; h++) {
    await t.test(`Bloque Horas Dobles: ${h}h a salario $400`, () => {
      const cuotaHora = 400 / 8;
      const res = calcHorasExtra(400, h, 0);
      const esperado = Math.round(h * cuotaHora * 2 * 100) / 100;
      assert.equal(res.importeDobles, esperado);
      assert.equal(res.horasDobles, h);
    });
  }

  // Tests 13 a 20: Horas triples (300% de pago y 100% gravadas)
  for (let ht = 1; ht <= 8; ht++) {
    await t.test(`Horas Triples: ${ht}h son 300% y 100% gravadas`, () => {
      const cuotaHora = 400 / 8;
      const res = calcHorasExtra(400, 0, ht);
      const esperadoTriple = Math.round(ht * cuotaHora * 3 * 100) / 100;
      assert.equal(res.importeTriples, esperadoTriple);
      assert.equal(res.extraExento, 0);
      assert.equal(res.extraGravado, esperadoTriple);
    });
  }

  // Tests 21 a 28: Trabajador con Salario Mínimo (100% exento en horas dobles)
  for (let h = 1; h <= 8; h++) {
    await t.test(`Salario Mínimo $${SALARIO_MINIMO_GENERAL_2026}: ${h}h dobles son 100% exentas`, () => {
      const res = calcHorasExtra(SALARIO_MINIMO_GENERAL_2026, h, 0);
      assert.equal(res.extraExento, res.totalExtraBruto);
      assert.equal(res.extraGravado, 0);
    });
  }

  // Tests 29 a 31: Tope legal de 5 UMAS quincenales en exención
  const horasAltas = [15, 20, 30];
  const tope5Umas = Math.round(UMA_2026 * 5 * 100) / 100;
  for (let idx = 0; idx < horasAltas.length; idx++) {
    const h = horasAltas[idx]!;
    await t.test(`Tope de exención 5 UMAS (${tope5Umas}) con ${h}h dobles a salario alto`, () => {
      const res = calcHorasExtra(1000, h, 0);
      assert.equal(res.extraExento, tope5Umas);
      assert.ok(res.extraGravado > 0);
    });
  }
});
