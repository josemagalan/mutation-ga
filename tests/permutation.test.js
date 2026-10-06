'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/operators/perm-utils.js');
const { swapMutation } = require('../js/operators/swap.js');
const { insertMutation } = require('../js/operators/insert.js');
const { inversionMutation } = require('../js/operators/inversion.js');
const { scrambleMutation } = require('../js/operators/scramble.js');
const { resetPerm } = require('../js/operators/reset-perm.js');
const rng = require('../js/rng.js');

const P0 = [3, 7, 5, 1, 6, 8, 2, 4];
const isPerm = (a) => a.length >= 1 && new Set(a).size === a.length && a.every((v) => v >= 1 && v <= a.length);
const lastChild = (res) => res.steps[res.steps.length - 1].child.map((g) => g.v);

test('ejemplos resueltos de las cuatro mutaciones de permutaciones', () => {
  assert.deepEqual(swapMutation(P0, 1, 5).child, [3, 8, 5, 1, 6, 7, 2, 4]);
  assert.deepEqual(insertMutation(P0, 1, 5).child, [3, 5, 1, 6, 8, 7, 2, 4]);   // el 7 avanza a la 6.ª
  assert.deepEqual(insertMutation(P0, 6, 2).child, [3, 7, 2, 5, 1, 6, 8, 4]);   // el 2 retrocede a la 3.ª
  assert.deepEqual(inversionMutation(P0, 2, 6).child, [3, 7, 8, 6, 1, 5, 2, 4]);
  assert.deepEqual(scrambleMutation(P0, 2, 6, { draws: [0.72, 0.04, 0.46] }).child, [3, 7, 1, 8, 5, 6, 2, 4]);
});

test('la inversión es un 2-opt: cambia exactamente dos adyacencias (o ninguna)', () => {
  const r = rng.mulberry32(21);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p = rng.randomPermutation(r, n);
    const a = rng.randInt(r, 0, n - 2);
    const b = rng.randInt(r, a + 2, n);
    const st = P.stats(p, inversionMutation(p, a, b).child);
    const len = b - a;
    assert.equal(st.edgesKept, len >= n - 1 ? n : n - 2, `n=${n} [${a},${b})`);
  }
});

// Implementaciones independientes, sin traza, para contrastar.
const ref = {
  swap: (p, i, j) => p.map((g, k) => (k === i ? p[j] : k === j ? p[i] : g)),
  insert: (p, i, j) => { const q = p.filter((_, k) => k !== i); return q.slice(0, j).concat([p[i]], q.slice(j)); },
  inversion: (p, a, b) => p.slice(0, a).concat(p.slice(a, b).reverse(), p.slice(b)),
};

test('miles de casos: permutación válida, independiente y última instantánea', () => {
  const r = rng.mulberry32(8);
  for (let t = 0; t < 3000; t++) {
    const n = rng.randInt(r, 5, 12);
    const p = rng.randomPermutation(r, n);
    const [i, j] = rng.shuffle(r, P.range(0, n)).slice(0, 2);
    const a = rng.randInt(r, 0, n - 2);
    const b = rng.randInt(r, a + 2, n);
    const runs = {
      swap: [swapMutation(p, i, j), ref.swap(p, i, j)],
      insert: [insertMutation(p, i, j), ref.insert(p, i, j)],
      inversion: [inversionMutation(p, a, b), ref.inversion(p, a, b)],
    };
    for (const [id, [res, expected]] of Object.entries(runs)) {
      assert.deepEqual(res.child, expected, id);
      assert.ok(isPerm(res.child), id);
      assert.deepEqual(lastChild(res), res.child, id);
      // genes marcados como recolocados = los que no están en su posición del padre
      res.steps[res.steps.length - 1].child.forEach((g, k) => assert.equal(g.kind === 'moved', g.v !== p[k], id));
    }
    // inserción: el orden relativo del resto no cambia
    const others = (q) => q.filter((g) => g !== p[i]);
    assert.deepEqual(others(runs.insert[0].child), others(p));
    // mezcla: fuera del tramo nada cambia; dentro, los mismos genes
    const sc = scrambleMutation(p, a, b, { seed: t + 1 });
    assert.ok(isPerm(sc.child));
    assert.deepEqual(sc.child.slice(0, a).concat(sc.child.slice(b)), p.slice(0, a).concat(p.slice(b)));
    assert.deepEqual(sc.child.slice(a, b).sort(), p.slice(a, b).sort());
    assert.deepEqual(scrambleMutation(p, a, b, { draws: sc.draws }).child, sc.child);
  }
});

test('mezcla: todas las ordenaciones del tramo igual de probables (Fisher-Yates)', () => {
  const counts = new Map();
  const runs = 24000;
  for (let t = 0; t < runs; t++) {
    const k = scrambleMutation([1, 2, 3, 4, 5, 6], 1, 5, { seed: t + 1 }).child.slice(1, 5).join('');
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  assert.equal(counts.size, 24);   // 4! ordenaciones
  for (const c of counts.values()) assert.ok(Math.abs(c - runs / 24) < 0.15 * runs / 24);
});

test('contraejemplo: el reinicio aleatorio produce genes repetidos', () => {
  const res = resetPerm(P0, 0.25, { draws: [0.9, 0.12, 0.05, 0.8, 0.7, 0.6, 0.95, 0.4, 0.33] });
  assert.deepEqual(res.child, [3, 1, 5, 1, 6, 8, 2, 4]);
  assert.equal(res.valid, false);
  const last = res.steps[res.steps.length - 1];
  assert.equal(last.text.key, 'doneInvalid');
  assert.deepEqual(last.conflict.c, [1, 3]);
  assert.equal(last.text.params.reps, '1');
  assert.equal(last.text.params.missing, '7');
  // con pm alta, casi nunca sale una permutación
  let valid = 0;
  for (let t = 0; t < 2000; t++) if (resetPerm(P0, 0.5, { seed: t + 1 }).valid) valid++;
  assert.ok(valid / 2000 < 0.1);
});

test('validación de permutaciones y de marcadores', () => {
  assert.equal(P.validateParent([1, 2, 2, 4, 5]), 'errPerm');
  assert.equal(P.validateParent([1, 2, 3, 4]), 'errRange');
  assert.equal(P.validateParent([2, 3, 4, 5, 6]), 'errPerm');
  assert.throws(() => swapMutation(P0, 2, 2), /errMarks/);
  assert.throws(() => inversionMutation(P0, 3, 4), /errMarks/);
  assert.throws(() => scrambleMutation(P0, 0, 9), /errMarks/);
});
