'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/compare.js');
const registry = require('../js/registry.js');

const opsOf = (rep) => registry.getRepresentation(rep).operators.filter((o) => o.ready)
  .map((o) => ({ id: o.id, spec: require(`../js/operators/${o.id}.js`).spec }));
const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]));

test('métricas de un mutante: ejemplos a mano', () => {
  const p = [3, 7, 5, 1, 6, 8, 2, 4];
  const inv = C.metricsOf('permutation', [3, 7, 8, 6, 1, 5, 2, 4], p);   // inversión de 5 1 6 8
  assert.equal(inv.position, 4 / 8);
  assert.equal(inv.adjacency, 6 / 8);   // 2-opt: cambian dos aristas
  assert.equal(inv.valid, 1);
  const dup = C.metricsOf('permutation', [3, 1, 5, 1, 6, 8, 2, 4], p);
  assert.equal(dup.valid, 0);
  const r = C.metricsOf('real', [4.2, 2.7, 8.5], [4.2, 1.7, 5.0]);
  assert.equal(r.changed, 2 / 3);
  assert.ok(Math.abs(r.jump - 2.25) < 1e-9);   // (1 + 3,5) / 2
  assert.equal(r.small, 0.5);
  const none = C.metricsOf('integer', [1, 2, 3], [1, 2, 3]);
  assert.equal(none.jump, null);
  assert.equal(none.clone, 1);
});

test('comparar con el mismo padre: lo que cada operador garantiza', () => {
  const bin = byId(C.compare({ rep: 'binary', ops: opsOf('binary'), parent: [1, 1, 0, 0, 1, 0, 0, 1], marks: [], reps: 600, seed: 2 }));
  assert.equal(bin['one-bit'].mean.hamming, 1);
  assert.equal(bin['one-bit'].mean.clone, 0);
  assert.ok(Math.abs(bin['bit-flip'].mean.hamming - 0.15 * 8) < 0.15);   // pm·n con pm = 0,15
  const perm = byId(C.compare({ rep: 'permutation', ops: opsOf('permutation'), parent: [3, 7, 5, 1, 6, 8, 2, 4], marks: [], reps: 600, seed: 2 }));
  ['swap', 'insert', 'inversion', 'scramble'].forEach((id) => assert.equal(perm[id].mean.valid, 1));
  assert.ok(perm['reset-perm'].mean.valid < 0.5);
  assert.ok(perm.inversion.mean.adjacency >= 0.75 - 1e-9);   // nunca cambia más de 2 de 8 aristas
  const int = byId(C.compare({ rep: 'integer', ops: opsOf('integer'), parent: [3, 7, 1, 4, 6, 0, 9, 2], marks: [], reps: 600, seed: 2 }));
  assert.equal(int.creep.mean.jump, 1);   // paso máximo 1 por defecto, con recorte
  assert.ok(int['random-resetting'].mean.jump > 2);
  const real = byId(C.compare({ rep: 'real', ops: opsOf('real'), parent: [4.2, 1.7, 8.5, 2.1, 6.0, 9.6, 0.3, 5.5], marks: [], reps: 600, seed: 2 }));
  assert.ok(real['non-uniform'].mean.small > real['uniform-real'].mean.small);
  assert.ok(real.polynomial.mean.jump < real['uniform-real'].mean.jump);
});

test('media con padres al azar: reproducible e independiente de las tandas', () => {
  const opts = { rep: 'permutation', ops: opsOf('permutation'), n: 7, parents: 60, reps: 3, seed: 5 };
  const a = C.randomMean(opts);
  const acc = C.randomMeanStart(opts);
  while (C.randomMeanStep(acc, 7) < 1);
  assert.deepEqual(C.randomMeanResult(acc), a);
  assert.equal(a.swap.valid, 1);
});
