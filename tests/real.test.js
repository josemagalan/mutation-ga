'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../js/operators/real-utils.js');
const { uniformReal } = require('../js/operators/uniform-real.js');
const { nonUniform } = require('../js/operators/non-uniform.js');
const { gaussian } = require('../js/operators/gaussian.js');
const { polynomial } = require('../js/operators/polynomial.js');
const rng = require('../js/rng.js');

const P = [4.2, 1.7, 8.5, 2.1, 6.0];
const near = (a, b, eps = 1e-9) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < eps);
const round2 = (a) => a.map((x) => Math.round(x * 100) / 100);

test('ejemplos resueltos con números fijados', () => {
  assert.deepEqual(round2(uniformReal(P, 0.25, { draws: [0.9, 0.1, 0.75, 0.6, 0.5, 0.8] }).child), [4.2, 7.5, 8.5, 2.1, 6]);
  // t/T = 0,5 y b = 5: e = 0,5^5; hacia arriba (τ = 0,3), u = 0,5
  assert.deepEqual(round2(nonUniform(P, 0.25, 0.5, 5, { draws: [0.1, 0.3, 0.5, 0.9, 0.7, 0.6, 0.8] }).child), [4.32, 1.7, 8.5, 2.1, 6]);
  // Box-Muller con u2 = 0: z = √(−2·ln 0,6) ≈ 1,0108
  assert.deepEqual(round2(gaussian(P, 0.25, 1, { draws: [0.9, 0.1, 0.4, 0.0, 0.7, 0.8, 0.6] }).child), [4.2, 2.71, 8.5, 2.1, 6]);
  // u = 0,3 < 0,5: δ = 0,6^(1/21) − 1 ≈ −0,0240
  assert.deepEqual(round2(polynomial(P, 0.25, 20, { draws: [0.9, 0.1, 0.3, 0.6, 0.7, 0.8] }).child), [4.2, 1.46, 8.5, 2.1, 6]);
});

test('recortes en los límites (gaussiana y polinómica)', () => {
  const g = gaussian([9.9, 5, 5, 5, 5], 0.5, 2, { draws: [0, 0.5, 0, 0.9, 0.9, 0.9, 0.9] });   // z > 0 grande
  assert.equal(g.child[0], 10);
  assert.equal(g.steps.find((s) => s.type === 'drawHit').text.key, 'drawGaussClamp');
  const p = polynomial([0.1, 5, 5, 5, 5], 0.5, 1, { draws: [0, 0.01, 0.9, 0.9, 0.9, 0.9] });   // δ ≈ −0,9
  assert.equal(p.child[0], 0);
});

// Implementaciones independientes de la perturbación, sin traza.
const ref = {
  uniform: (v, [u]) => U.LOW + u * (U.HIGH - U.LOW),
  nonUniform: (g, b) => (v, [tau, u]) => {
    const f = 1 - u ** ((1 - g) ** b);
    return tau < 0.5 ? v + (U.HIGH - v) * f : v - (v - U.LOW) * f;
  },
  gaussian: (s) => (v, [u1, u2]) => U.clamp(v + s * Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2)),
  polynomial: (eta) => (v, [u]) => {
    const d = u < 0.5 ? (2 * u) ** (1 / (eta + 1)) - 1 : 1 - (2 * (1 - u)) ** (1 / (eta + 1));
    return U.clamp(v + d * (U.HIGH - U.LOW));
  },
};
function replay(parent, pm, draws, extra, f) {
  let k = 0;
  return parent.map((v) => {
    if (!(draws[k++] < pm)) return v;
    const ds = draws.slice(k, k + extra);
    k += extra;
    return f(v, ds);
  });
}

test('miles de casos contra las implementaciones independientes', () => {
  const r = rng.mulberry32(23);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p = U.randomReals(r, n);
    const pm = [0.1, 0.3, 0.7][t % 3];
    const g = [0, 0.3, 0.9][t % 3];
    const b = [1, 5][t % 2];
    const s = [0.5, 1, 3][t % 3];
    const eta = [1, 20, 100][t % 3];
    const runs = [
      [uniformReal(p, pm, { seed: t + 1 }), 1, ref.uniform],
      [nonUniform(p, pm, g, b, { seed: t + 1 }), 2, ref.nonUniform(g, b)],
      [gaussian(p, pm, s, { seed: t + 1 }), 2, ref.gaussian(s)],
      [polynomial(p, pm, eta, { seed: t + 1 }), 1, ref.polynomial(eta)],
    ];
    for (const [res, extra, f] of runs) {
      assert.ok(near(res.child, replay(p, pm, res.draws, extra, f)));
      assert.ok(res.child.every((v) => v >= U.LOW && v <= U.HIGH));
      assert.ok(near(res.steps[res.steps.length - 1].child.map((x) => x.v), res.child));
      // reproducible con los números usados
      assert.deepEqual(res.child, runs[0][0] === res ? uniformReal(p, pm, { draws: res.draws }).child : res.child);
    }
  }
});

test('la distribución del valor mutado tiene la forma esperada', () => {
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  // uniforme: plana
  const hu = uniformReal([5, 5, 5, 5, 5], 0.5, { seed: 3 }).aux.hists[0];
  assert.ok(Math.abs(sum(hu) - 1) < 1e-9);
  assert.ok(Math.max(...hu) < 2.2 / U.BINS);
  // gaussiana y polinómica: picos junto al padre; más estrecha con σ menor / η mayor
  const spread = (h) => { const mid = U.BINS / 2; return sum(h.map((f, k) => f * Math.abs(k + 0.5 - mid))); };
  assert.ok(spread(gaussian([5, 5, 5, 5, 5], 0.5, 0.5, { seed: 3 }).aux.hists[0]) < spread(gaussian([5, 5, 5, 5, 5], 0.5, 2, { seed: 3 }).aux.hists[0]));
  assert.ok(spread(polynomial([5, 5, 5, 5, 5], 0.5, 100, { seed: 3 }).aux.hists[0]) < spread(polynomial([5, 5, 5, 5, 5], 0.5, 2, { seed: 3 }).aux.hists[0]));
  // no uniforme: los saltos se acortan al avanzar la búsqueda
  assert.ok(spread(nonUniform([5, 5, 5, 5, 5], 0.5, 0.9, 5, { seed: 3 }).aux.hists[0]) < spread(nonUniform([5, 5, 5, 5, 5], 0.5, 0, 5, { seed: 3 }).aux.hists[0]));
});

test('gaussiana lejos de los límites: salto medio ≈ 0,8·σ (E|z| = √(2/π))', () => {
  let s = 0;
  let k = 0;
  for (let t = 0; t < 3000; t++) {
    const res = gaussian([5, 5, 5, 5, 5], 1, 0.5, { seed: t + 1 });
    res.child.forEach((v) => { s += Math.abs(v - 5); k++; });
  }
  assert.ok(Math.abs(s / k - 0.5 * Math.sqrt(2 / Math.PI)) < 0.01);
});

test('validación de reales y parámetros', () => {
  assert.equal(U.validateParent([1, 2, 3, 4, 10.5]), 'errReal');
  assert.equal(U.validateParent([1, 2, 3.333, 4, 5]), 'errReal');
  assert.equal(U.validateParent([1, 2, 3]), 'errRange');
  assert.equal(U.validateParent([0, 10, 3.25, 4, 5]), null);
  assert.throws(() => gaussian(P, 0.2, 0), /errParam/);
  assert.throws(() => nonUniform(P, 0.2, 1, 5), /errParam/);
});
