/**
 * packages/motor/test/isr.test.ts
 * 42 tests unitarios deterministas para calcISR (Art. 96 LISR + Subsidio al Empleo 2026)
 * 0 dependencias externas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calcISR, TARIFA_ISR_MENSUAL_2026, TARIFA_ISR_QUINCENAL_2026, LIMITE_SUBSIDIO_EMPLEO_MENSUAL } from '../src/index';

test('ISR Suite - 42 Tests Unitarios', async (t) => {
  // Test 1: Base 0 o negativa
  await t.test('1. Base gravable 0 retorna ISR 0', () => {
    const res = calcISR(0, 'quincenal');
    assert.equal(res.isrRetener, 0);
  });

  await t.test('2. Base gravable negativa retorna ISR 0', () => {
    const res = calcISR(-1500, 'quincenal');
    assert.equal(res.isrRetener, 0);
  });

  // Test 3: Validación exacta Juan Pérez López
  await t.test('3. Juan Pérez López: base $9,523.72 retorna ISR $1,117.82', () => {
    const res = calcISR(9523.72, 'quincenal', 600, 'PELJ900101ABC');
    assert.equal(res.isrRetener, 1117.82);
  });

  // Tests 4 a 14: Validación de los 11 tramos mensuales
  for (let i = 0; i < TARIFA_ISR_MENSUAL_2026.length; i++) {
    const tramo = TARIFA_ISR_MENSUAL_2026[i]!;
    await t.test(`Tramo Mensual #${i + 1} (${tramo.limiteInferior} - ${tramo.limiteSuperior})`, () => {
      const basePrueba = tramo.limiteInferior + 10;
      const res = calcISR(basePrueba, 'mensual');
      assert.ok(res.isrAntesSubsidio >= tramo.cuotaFija);
      assert.ok(res.baseGravable === basePrueba);
    });
  }

  // Tests 15 a 25: Validación de los 11 tramos quincenales
  for (let i = 0; i < TARIFA_ISR_QUINCENAL_2026.length; i++) {
    const tramo = TARIFA_ISR_QUINCENAL_2026[i]!;
    await t.test(`Tramo Quincenal #${i + 1} (${tramo.limiteInferior} - ${tramo.limiteSuperior})`, () => {
      const basePrueba = tramo.limiteInferior + 5;
      const res = calcISR(basePrueba, 'quincenal');
      assert.ok(res.isrAntesSubsidio >= tramo.cuotaFija);
      assert.ok(res.baseGravable === basePrueba);
    });
  }

  // Tests 26 a 33: Subsidio al empleo para bases <= 10,171 mensuales
  const basesConSubsidio = [1000, 2500, 4000, 5000, 6500, 8000, 9500, 10170];
  for (let idx = 0; idx < basesConSubsidio.length; idx++) {
    const b = basesConSubsidio[idx]!;
    await t.test(`Subsidio al empleo aplicado para base mensual $${b} <= $10,171`, () => {
      const res = calcISR(b, 'mensual');
      assert.ok(res.subsidioEmpleo > 0, `Debe recibir subsidio para base ${b}`);
    });
  }

  // Tests 34 a 39: Exclusión de subsidio para ingresos > 10,171 mensuales
  const basesSinSubsidio = [10172, 12000, 15000, 25000, 50000, 100000];
  for (let idx = 0; idx < basesSinSubsidio.length; idx++) {
    const b = basesSinSubsidio[idx]!;
    await t.test(`Sin subsidio al empleo para base mensual $${b} > $10,171`, () => {
      const res = calcISR(b, 'mensual');
      assert.equal(res.subsidioEmpleo, 0);
      assert.equal(res.isrRetener, res.isrAntesSubsidio);
    });
  }

  // Test 40: Redondeo SAT estricto a 2 decimales
  await t.test('40. Redondeo SAT a 2 decimales estricto', () => {
    const res = calcISR(7890.33, 'quincenal');
    const decimales = res.isrRetener.toString().split('.')[1] || '';
    assert.ok(decimales.length <= 2);
  });

  // Test 41: Tasa efectiva dentro del rango legal (0% a 35%)
  await t.test('41. Tasa efectiva calculada en rango admisible', () => {
    const res = calcISR(9523.72, 'quincenal');
    assert.ok(res.tasaEfectiva >= 0 && res.tasaEfectiva <= 0.35);
  });

  // Test 42: Salario mínimo general no genera retención
  await t.test('42. Sin retención para salario base menor a cuotas mínimas', () => {
    const res = calcISR(100, 'quincenal');
    assert.equal(res.isrRetener, 0);
  });
});
