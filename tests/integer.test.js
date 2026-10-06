'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../js/operators/int-utils.js');
const { randomResetting } = require('../js/operators/random-resetting.js');
const { creep } = require('../js/operators/creep.js');
const rng = require('../js/rng.js');

const P = [3, 7, 1, 4, 6, 0, 9, 2];

test('reinicio aleatorio: ejemplo resuelto, el valor nuevo puede repetirse', () => {
  const res = randomResetting(P, 0.2, { draws: [0.68, 0.12, 0.75, 0.9, 0.05, 0.33, 0.6, 0.4, 0.8, 0.95] });
  assert.deepEqual(res.child, [3, 7, 1, 3, 6, 0, 9, 2]);
  assert.deepEqual(res.mutated, [3]);
  assert.deepEqual(res.steps.filter((s) => s.type === 'drawHit').map((s) => s.text.key), ['drawSame', 'drawNew']);
});

test('deslizamiento: pasos, recorte y vuelta en los extremos', () => {
  const d = [0, 0.2, 0, 0.7, 0, 0.9, 0, 0.1, 0, 0.6];   // r = 0 siempre muta; u elige −1 o +1
  assert.deepEqual(creep([0, 9, 0, 9, 5], 1, 1, { draws: d }).child, [0, 9, 1, 8, 6]);
  assert.deepEqual(creep([0, 9, 0, 9, 5], 1, 1, { variant: 'wrap', draws: d }).child, [9, 0, 1, 8, 6]);
  // paso máximo 2: k = ⌊u·4⌋ → −2, −1, +1, +2
  const d2 = [0, 0.1, 0, 0.3, 0, 0.6, 0, 0.9, 0, 0.5];
  assert.deepEqual(creep([5, 5, 5, 5, 5], 1, 2, { draws: d2 }).child, [3, 4, 6, 7, 6]);
});

// Implementaciones independientes, sin traza.
function refReset(p, pm, draws) {
  let k = 0;
  return p.map((g) => (draws[k++] < pm ? Math.floor(draws[k++] * 10) : g));
}
function refCreep(p, pm, s, draws, wrap) {
  let k = 0;
  return p.map((g) => {
    if (!(draws[k++] < pm)) return g;
    const steps = [];
    for (let x = -s; x <= s; x++) if (x) steps.push(x);
    const v = g + steps[Math.floor(draws[k++] * steps.length)];
    if (wrap) return ((v % 10) + 10) % 10;
    return Math.min(9, Math.max(0, v));
  });
}

test('miles de casos contra las implementaciones independientes', () => {
  const r = rng.mulberry32(17);
  for (let t = 0; t < 4000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p = I.randomInts(r, n);
    const pm = [0.1, 0.3, 0.7][t % 3];
    const s = 1 + (t % 3);
    const wrap = t % 2 === 1;
    const a = randomResetting(p, pm, { seed: t + 1 });
    assert.deepEqual(a.child, refReset(p, pm, a.draws));
    const b = creep(p, pm, s, { seed: t + 1, variant: wrap ? 'wrap' : 'clamp' });
    assert.deepEqual(b.child, refCreep(p, pm, s, b.draws, wrap));
    for (const res of [a, b]) {
      assert.ok(res.child.every((v) => Number.isInteger(v) && v >= 0 && v <= 9));
      assert.deepEqual(res.steps[res.steps.length - 1].child.map((g) => g.v), res.child);
    }
    // recortando, ningún gen se mueve más que el paso máximo
    if (!wrap) b.child.forEach((v, i) => assert.ok(Math.abs(v - p[i]) <= s));
  }
});

test('el reinicio aleatorio sortea todos los valores del rango por igual', () => {
  const counts = Array(10).fill(0);
  for (let t = 0; t < 5000; t++) randomResetting([5, 5, 5, 5, 5], 1, { seed: t + 1 }).child.forEach((v) => counts[v]++);
  counts.forEach((c) => assert.ok(Math.abs(c - 2500) < 250));
});

test('validación de enteros y parámetros', () => {
  assert.equal(I.validateParent([1, 2, 3, 4, 10]), 'errInt');
  assert.equal(I.validateParent([1, 2, 3.5, 4, 5]), 'errInt');
  assert.equal(I.validateParent([1, 2, 3, 4]), 'errRange');
  assert.equal(I.validateParent([0, 9, 3, 4, 5]), null);
  assert.throws(() => creep(P, 0.2, 4), /errParam/);
  assert.throws(() => randomResetting(P, 1.5), /errParam/);
});
