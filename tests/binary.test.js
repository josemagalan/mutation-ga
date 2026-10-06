'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../js/operators/bin-utils.js');
const { bitFlip } = require('../js/operators/bit-flip.js');
const { oneBit } = require('../js/operators/one-bit.js');
const rng = require('../js/rng.js');

const P = [1, 1, 0, 0, 1, 0, 0, 1];

test('inversión de bits: ejemplo resuelto con números fijados', () => {
  // r < 0,3 en las posiciones 3 y 5: esos bits se invierten
  const res = bitFlip(P, 0.3, { draws: [0.68, 0.77, 0.21, 0.62, 0.08, 0.59, 0.72, 0.45] });
  assert.deepEqual(res.child, [1, 1, 1, 0, 0, 0, 0, 1]);
  assert.deepEqual(res.mutated, [2, 4]);
  assert.deepEqual(res.aux.items.map((it) => it.hit), [false, false, true, false, true, false, false, false]);
});

test('inversión de bits: r = pm no muta (la condición es estricta)', () => {
  const res = bitFlip(P, 0.3, { draws: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3] });
  assert.deepEqual(res.child, P);
  assert.equal(res.steps[res.steps.length - 1].text.key, 'doneNone');
});

test('alelo aleatorio: el bit sorteado puede coincidir con el que había', () => {
  // posición 3: r = 0,21 < 0,3, s = 0,62 → 1 (cambia 0 → 1)
  // posición 5: r = 0,08 < 0,3, s = 0,59 → 1 (ya era 1: no cambia)
  const res = bitFlip(P, 0.3, { variant: 'random', draws: [0.68, 0.77, 0.21, 0.62, 0.62, 0.08, 0.59, 0.72, 0.45, 0.9] });
  assert.deepEqual(res.child, [1, 1, 1, 0, 1, 0, 0, 1]);
  assert.deepEqual(res.mutated, [2]);
  assert.ok(res.steps.some((s) => s.text.key === 'drawResetSame'));
});

// Implementación independiente, sin traza, para contrastar.
function reference(parent, pm, draws, variant) {
  let k = 0;
  return parent.map((b) => {
    if (!(draws[k++] < pm)) return b;
    if (variant === 'flip') return 1 - b;
    return draws[k++] < 0.5 ? 0 : 1;
  });
}

test('inversión de bits: miles de casos contra la implementación independiente', () => {
  const r = rng.mulberry32(11);
  for (let t = 0; t < 4000; t++) {
    const n = rng.randInt(r, 5, 12);
    const parent = B.randomBits(r, n);
    const pm = [0.05, 0.15, 0.3, 0.5][t % 4];
    const variant = t % 2 ? 'random' : 'flip';
    const res = bitFlip(parent, pm, { variant, seed: t + 1 });
    assert.deepEqual(res.child, reference(parent, pm, res.draws, variant));
    // los sorteos se redondean a centésimas
    res.draws.forEach((d) => assert.equal(Math.round(d * 100) / 100, d));
    // la última instantánea es el mutante completo, y los genes mutados son los que cambian
    const last = res.steps[res.steps.length - 1];
    assert.deepEqual(last.child.map((g) => g.v), res.child);
    last.child.forEach((g, i) => assert.equal(g.kind === 'mutated', res.mutated.includes(i)));
    // reproducible con la misma semilla
    assert.deepEqual(bitFlip(parent, pm, { variant, seed: t + 1 }).child, res.child);
  }
});

test('inversión de bits: frecuencia de cambio pm (invertir) y pm/2 (alelo aleatorio)', () => {
  const parent = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
  const pm = 0.2;
  const rate = (variant) => {
    let changed = 0;
    const runs = 4000;
    for (let t = 0; t < runs; t++) changed += bitFlip(parent, pm, { variant, seed: t + 1 }).mutated.length;
    return changed / (runs * parent.length);
  };
  assert.ok(Math.abs(rate('flip') - pm) < 0.01);
  assert.ok(Math.abs(rate('random') - pm / 2) < 0.01);
});

test('mutación de un bit: cambia exactamente la posición elegida', () => {
  assert.deepEqual(oneBit(P, 3).child, [1, 1, 0, 1, 1, 0, 0, 1]);
  const r = rng.mulberry32(5);
  for (let t = 0; t < 2000; t++) {
    const n = rng.randInt(r, 5, 12);
    const parent = B.randomBits(r, n);
    const k = rng.randInt(r, 0, n - 1);
    const res = oneBit(parent, k);
    const diff = parent.map((b, i) => (b !== res.child[i] ? i : -1)).filter((i) => i >= 0);
    assert.deepEqual(diff, [k]);
    assert.deepEqual(res.steps[res.steps.length - 1].child.map((g) => g.v), res.child);
  }
  assert.throws(() => oneBit(P, 8), /errMarks/);
});

test('validación de bits y de parámetros', () => {
  assert.equal(B.validateParent([1, 0, 1, 1, 2]), 'errBits');
  assert.equal(B.validateParent([1, 0, 1, 1]), 'errRange');
  assert.equal(B.validateParent('10110'), 'errFormat');
  assert.equal(B.validateParent([1, 0, 1, 1, 0]), null);
  assert.throws(() => bitFlip(P, 0), /errParam/);
  assert.throws(() => bitFlip(P, 0.2, { draws: [0.5] }), /errDraws/);
});
