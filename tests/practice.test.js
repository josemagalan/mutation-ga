'use strict';
// Modo práctica: los datos que se dan (posiciones, tramo y números sorteados, tal como se
// muestran) bastan para obtener el mutante exacto, y la corrección funciona por representación.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const registry = require('../js/registry.js');
const rng = require('../js/rng.js');
const PR = require('../js/practice.js');

const GEN = {
  binary: (r, n) => require('../js/operators/bin-utils.js').randomBits(r, n),
  integer: (r, n) => require('../js/operators/int-utils.js').randomInts(r, n),
  real: (r, n) => require('../js/operators/real-utils.js').randomReals(r, n),
  permutation: (r, n) => rng.randomPermutation(r, n),
};
function marksFor(spec, r, n) {
  if (!spec.marks) return [];
  if (spec.marks.type === 'gene') return rng.shuffle(r, Array.from({ length: n }, (_, i) => i)).slice(0, spec.marks.count);
  const a = rng.randInt(r, 0, n - 2);
  return [a, rng.randInt(r, a + 2, n)];
}
// ¿Se puede escribir exactamente con cuatro decimales (como se muestra)?
const shown = (v) => Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-6;

const ops = registry.representations.flatMap((rep) => rep.operators.map((o) => Object.assign({ rep: rep.id }, o))).filter((o) => o.ready);

for (const op of ops) {
  test(`«${op.id}»: los datos de la práctica dan el mutante exacto`, () => {
    const { spec } = require(path.join('..', 'js', 'operators', `${op.id}.js`));
    const r = rng.mulberry32(41);
    for (let t = 0; t < 400; t++) {
      const n = rng.randInt(r, 5, 12);
      const parent = GEN[op.rep](r, n);
      const marks = marksFor(spec, r, n);
      const params = {};
      (spec.params || []).forEach((p) => { params[p.id] = p.default; });
      if (params.pm) params.pm = [0.2, 0.5, 0.9][t % 3];
      const variant = spec.variants ? spec.variants[t % spec.variants.length] : undefined;
      const res = spec.run(parent, marks, { variant, seed: t + 1, params });
      const g = PR.givens(spec, res, marks);
      (g.perPos || []).forEach((p) => { assert.ok(shown(p.r)); p.extra.forEach((v) => assert.ok(shown(v), `${op.id}: ${v}`)); });
      (g.sequence || []).forEach((v) => assert.ok(shown(v)));
      const again = spec.run(parent, g.marks ? g.marks.marks : [], { variant, params, draws: PR.drawsFrom(g) });
      assert.deepEqual(again.child, res.child);
      assert.ok(PR.grade(op.rep, res.child, res.child).every((c) => c.ok));
    }
  });
}

test('validación y corrección de la predicción', () => {
  assert.equal(PR.validateGuess('binary', [1, 0, 2, 1, 0], 5), 'errBits');
  assert.equal(PR.validateGuess('binary', [1, 0, 1], 5), 'errLength');
  assert.equal(PR.validateGuess('integer', [1, 0, 12, 1, 0], 5), 'errInt');
  // en el contraejemplo el mutante correcto puede repetir genes: no se exige una permutación
  assert.equal(PR.validateGuess('permutation', [1, 1, 3, 4, 5], 5), null);
  assert.equal(PR.validateGuess('real', [1.5, 2, 3, 4, 5], 5), null);
  const g = PR.grade('real', [1.04, 2.2], [1.0, 2.0]);
  assert.deepEqual(g.map((c) => c.ok), [true, false]);
});
