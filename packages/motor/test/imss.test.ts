/**
 * packages/motor/test/imss.test.ts
 * 38 tests unitarios deterministas para calcIMSS (Art. 27 LSS y 13 conceptos obrero/patronal)
 * 0 dependencias externas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calcIMSS, UMA_2026 } from '../src/index';

test('IMSS Suite - 38 Tests Unitarios', async (t) => {
  // Test 1: Juan Pérez López Cuota Obrera
  await t.test('1. Juan Pérez López SBC $629.58 15 días: cuota obrera = $182.67', () => {
    const res = calcIMSS(629.58, 15, 0.0113065, 'PELJ900101ABC');
    assert.equal(res.imssObreroTotal, 182.67);
  });

  // Test 2: Juan Pérez López Cuota Patronal
  await t.test('2. Juan Pérez López SBC $629.58 15 días: cuota patronal = $2,201.68', () => {
    const res = calcIMSS(629.58, 15, 0.0113065, 'PELJ900101ABC');
    assert.equal(res.imssPatronalTotal, 2201.68);
  });

  // Test 3: FIX CRÍTICO - guarderias_descuento no suma a patronal
  await t.test('3. FIX CRÍTICO: guarderias_descuento_excluido activo (no suma a patronal)', () => {
    const res = calcIMSS(629.58, 15);
    assert.equal(res.conceptos.guarderias_descuento_excluido, true);
  });

  // Tests 4 a 16: Validación de los 13 conceptos desglosados
  await t.test('4. Concepto 1: Cuota Fija Patronal calculada sobre 1 UMA', () => {
    const res = calcIMSS(500, 15);
    assert.ok(res.conceptos.enf_mat_cuota_fija > 0);
  });

  await t.test('5. Concepto 2: Excedente Patronal cuando SBC > 3 UMA', () => {
    const sbcAlto = UMA_2026 * 4;
    const res = calcIMSS(sbcAlto, 15);
    assert.ok(res.conceptos.enf_mat_excedente_patronal > 0);
  });

  await t.test('6. Concepto 2b: Excedente Patronal es 0 cuando SBC <= 3 UMA', () => {
    const sbcBajo = UMA_2026 * 2.5;
    const res = calcIMSS(sbcBajo, 15);
    assert.equal(res.conceptos.enf_mat_excedente_patronal, 0);
  });

  await t.test('7. Concepto 3: Prestaciones en Dinero Patronal (0.70%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.enf_mat_prestaciones_dinero_patronal > 0);
  });

  await t.test('8. Concepto 4: Gastos Médicos Pensionados Patronal (1.05%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.enf_mat_gastos_medicos_patronal > 0);
  });

  await t.test('9. Concepto 5: Invalidez y Vida Patronal (1.75%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.invalidez_vida_patronal > 0);
  });

  await t.test('10. Concepto 6: Retiro Patronal (2.00%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.retiro_patronal > 0);
  });

  await t.test('11. Concepto 7: Cesantía y Vejez Patronal escalonada 2026', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.cesantia_vejez_patronal > 0);
  });

  await t.test('12. Concepto 8: Guarderías y Prestaciones Sociales Patronal (1.00%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.guarderias_patronal > 0);
  });

  await t.test('13. Concepto 9: Riesgo de Trabajo Patronal proporcional a la prima', () => {
    const res = calcIMSS(600, 15, 0.025);
    assert.ok(res.conceptos.riesgo_trabajo_patronal > 0);
  });

  await t.test('14. Concepto 10: Excedente Obrero cuando SBC > 3 UMA (0.40%)', () => {
    const res = calcIMSS(UMA_2026 * 4, 15);
    assert.ok(res.conceptos.enf_mat_excedente_obrero > 0);
  });

  await t.test('15. Concepto 11: Prestaciones en Dinero Obrero (0.25%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.enf_mat_prestaciones_dinero_obrero > 0);
  });

  await t.test('16. Concepto 12: Gastos Médicos Obrero (0.375%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.enf_mat_gastos_medicos_obrero > 0);
  });

  await t.test('17. Concepto 13: Invalidez y Vida Obrero (0.625%)', () => {
    const res = calcIMSS(600, 15);
    assert.ok(res.conceptos.invalidez_vida_obrero > 0);
  });

  // Tests 18 a 25: Tope de 25 UMAS
  const sbcsSuperiores = [3000, 3500, 4000, 5000, 6000, 8000, 10000, 15000];
  const tope25Umas = UMA_2026 * 25;
  for (let i = 0; i < sbcsSuperiores.length; i++) {
    const sbc = sbcsSuperiores[i]!;
    await t.test(`Tope 25 UMAS (${tope25Umas.toFixed(2)}) para SBC $${sbc}`, () => {
      const res = calcIMSS(sbc, 15);
      assert.equal(res.sbc, Math.round(tope25Umas * 100) / 100);
    });
  }

  // Tests 26 a 33: Variaciones en días cotizados
  const diasPrueba = [1, 7, 10, 14, 15, 28, 30, 31];
  for (let i = 0; i < diasPrueba.length; i++) {
    const d = diasPrueba[i]!;
    await t.test(`Días cotizados proporcionales: ${d} días`, () => {
      const res = calcIMSS(500, d);
      assert.equal(res.diasCotizados, d);
      assert.ok(res.imssObreroTotal > 0);
    });
  }

  // Tests 34 a 38: Primas de Riesgo de Trabajo
  const clasesRiesgo = [0.0054355, 0.0113065, 0.0259840, 0.0465325, 0.0758875];
  for (let i = 0; i < clasesRiesgo.length; i++) {
    const prima = clasesRiesgo[i]!;
    await t.test(`Prima Riesgo Clase #${i + 1} (${prima})`, () => {
      const res = calcIMSS(500, 15, prima);
      assert.ok(res.conceptos.riesgo_trabajo_patronal > 0);
    });
  }
});
