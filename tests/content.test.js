'use strict';
// Comprueba que el material docente de cada operador disponible es coherente con la herramienta:
// el código descargable (Python y JavaScript, en los dos idiomas) da el mismo mutante que la
// animación con los mismos números aleatorios, y cada paso de la animación resalta líneas que
// existen en el pseudocódigo.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const registry = require('../js/registry.js');
const rng = require('../js/rng.js');
const B = require('../js/operators/bin-utils.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ga-mut-content-'));
const PY = ['python3', 'python'].find((cmd) => spawnSync(cmd, ['--version']).status === 0);
const readyOps = registry.representations.flatMap((r) => r.operators.map((o) => Object.assign({ rep: r.id }, o))).filter((o) => o.ready);

const GEN = { binary: (r, n) => B.randomBits(r, n), permutation: (r, n) => rng.randomPermutation(r, n), integer: (r, n) => require('../js/operators/int-utils.js').randomInts(r, n), real: (r, n) => require('../js/operators/real-utils.js').randomReals(r, n) };
const pair = (r, n) => rng.shuffle(r, Array.from({ length: n }, (_, i) => i)).slice(0, 2);
const segment = (r, n) => { const a = rng.randInt(r, 0, n - 2); return [a, rng.randInt(r, a + 2, n)]; };

/*
 * Cómo llamar a la función descargable de cada operador con los datos de un caso:
 *   args(c): argumentos en JavaScript (el azar, si lo hay, es una función que devuelve c.draws en orden)
 *   py(c):   la misma llamada en Python (el azar es un objeto con random() que devuelve c.draws)
 */
const CALLS = {
  'bit-flip': {
    params: (t) => ({ pm: [0.05, 0.15, 0.3, 0.5][t % 4] }),
    js: 'f(c.parent, c.params.pm, fixed(c.draws), c.v)',
    py: 'f(c["parent"], c["params"]["pm"], Fixed(c["draws"]), c["v"])',
  },
  'random-resetting': {
    params: (t) => ({ pm: [0.05, 0.2, 0.5][t % 3] }),
    js: 'f(c.parent, c.params.pm, 0, 9, fixed(c.draws))',
    py: 'f(c["parent"], c["params"]["pm"], 0, 9, Fixed(c["draws"]))',
  },
  creep: {
    params: (t) => ({ pm: [0.1, 0.3, 0.6][t % 3], step: 1 + (t % 3) }),
    js: 'f(c.parent, c.params.pm, c.params.step, 0, 9, fixed(c.draws), c.v)',
    py: 'f(c["parent"], c["params"]["pm"], c["params"]["step"], 0, 9, Fixed(c["draws"]), c["v"])',
  },
  'uniform-real': {
    params: (t) => ({ pm: [0.1, 0.3, 0.6][t % 3] }),
    js: 'f(c.parent, c.params.pm, 0, 10, fixed(c.draws))',
    py: 'f(c["parent"], c["params"]["pm"], 0.0, 10.0, Fixed(c["draws"]))',
  },
  'non-uniform': {
    params: (t) => ({ pm: [0.1, 0.3, 0.6][t % 3], g: [0, 0.25, 0.5, 0.9][t % 4], b: [1, 2, 5][t % 3] }),
    js: 'f(c.parent, c.params.g * 100, 100, c.params.pm, c.params.b, 0, 10, fixed(c.draws))',
    py: 'f(c["parent"], c["params"]["g"] * 100, 100, c["params"]["pm"], c["params"]["b"], 0.0, 10.0, Fixed(c["draws"]))',
  },
  gaussian: {
    params: (t) => ({ pm: [0.1, 0.3, 0.6][t % 3], sigma: [0.5, 1, 2.5][t % 3] }),
    js: 'f(c.parent, c.params.pm, c.params.sigma, 0, 10, fixed(c.draws))',
    py: 'f(c["parent"], c["params"]["pm"], c["params"]["sigma"], 0.0, 10.0, Fixed(c["draws"]))',
  },
  polynomial: {
    params: (t) => ({ pm: [0.1, 0.3, 0.6][t % 3], eta: [1, 5, 20, 100][t % 4] }),
    js: 'f(c.parent, c.params.pm, c.params.eta, 0, 10, fixed(c.draws))',
    py: 'f(c["parent"], c["params"]["pm"], c["params"]["eta"], 0.0, 10.0, Fixed(c["draws"]))',
  },
  'reset-perm': {
    params: (t) => ({ pm: [0.05, 0.25, 0.5][t % 3] }),
    js: 'f(c.parent, c.params.pm, fixed(c.draws))',
    py: 'f(c["parent"], c["params"]["pm"], Fixed(c["draws"]))',
  },
  swap: { marks: pair, js: 'f(c.parent, c.marks[0], c.marks[1])', py: 'f(c["parent"], c["marks"][0], c["marks"][1])' },
  insert: { marks: pair, js: 'f(c.parent, c.marks[0], c.marks[1])', py: 'f(c["parent"], c["marks"][0], c["marks"][1])' },
  inversion: { marks: segment, js: 'f(c.parent, c.marks[0], c.marks[1])', py: 'f(c["parent"], c["marks"][0], c["marks"][1])' },
  scramble: { marks: segment, js: 'f(c.parent, c.marks[0], c.marks[1], fixed(c.draws))', py: 'f(c["parent"], c["marks"][0], c["marks"][1], Fixed(c["draws"]))' },
  'one-bit': {
    marks: (r, n) => [rng.randInt(r, 0, n - 1)],
    js: 'f(c.parent, c.marks[0])',
    py: 'f(c["parent"], c["marks"][0])',
  },
};

function makeCases(op, spec, count, seed, variant) {
  const call = CALLS[op.id];
  const r = rng.mulberry32(seed);
  const cases = [];
  for (let t = 0; t < count; t++) {
    const n = rng.randInt(r, 5, 12);
    const parent = GEN[op.rep](r, n);
    const marks = call.marks ? call.marks(r, n) : [];
    const params = call.params ? call.params(t) : {};
    const res = spec.run(parent, marks, { variant, seed: t + 1, params });
    cases.push({ v: variant || null, parent, marks, params, draws: res.draws || [], expected: res.child });
  }
  return cases;
}

for (const op of readyOps) {
  const spec = require(path.join('..', 'js', 'operators', `${op.id}.js`)).spec;
  const content = require(path.join('..', 'js', 'content', `${op.id}.js`));
  const call = CALLS[op.id];

  test(`«${op.id}»: el pseudocódigo cubre todos los pasos de la traza`, () => {
    assert.ok(call, `falta la forma de llamar a ${op.id} en CALLS`);
    for (const variant of spec.variants || [undefined]) {
      for (const lang of ['es', 'en']) {
        const ids = new Set(content.pseudocodeFor(lang, variant).map((l) => l.id));
        const cases = makeCases(op, spec, 50, 3, variant);
        for (const c of cases) {
          const res = spec.run(c.parent, c.marks, { variant, params: c.params, draws: c.draws.length ? c.draws : undefined });
          for (const step of res.steps) {
            const lines = content.stepLines[step.type];
            assert.ok(lines && lines.length, `${op.id}: paso «${step.type}» sin líneas`);
            lines.forEach((id) => assert.ok(ids.has(id), `${op.id}: línea «${id}» no está en el pseudocódigo (${lang})`));
            assert.ok(content.narration[lang][step.text.key], `${op.id}: falta la narración «${step.text.key}» (${lang})`);
          }
        }
      }
    }
  });

  for (const lang of ['es', 'en']) {
    test(`«${op.id}»: el código JavaScript descargable (${lang}) da el mismo mutante`, () => {
      const file = path.join(tmp, `${op.id}-${lang}.js`);
      fs.writeFileSync(file, content.getCode('javascript', lang));
      const f = require(file)[content.fnName.javascript];
      const fixed = (draws) => { let k = 0; return () => draws[k++]; };
      for (const variant of spec.variants || [undefined]) {
        for (const c of makeCases(op, spec, 300, 7, variant)) {
          // eslint-disable-next-line no-new-func
          const got = new Function('f', 'c', 'fixed', `return ${call.js};`)(f, c, fixed);
          assert.equal(got.length, c.expected.length);
          got.forEach((v, i) => assert.ok(Math.abs(v - c.expected[i]) < 1e-9, `${op.id}: ${got} ≠ ${c.expected}`));
        }
      }
      const run = spawnSync(process.execPath, [file], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stderr);
    });

    test(`«${op.id}»: el código Python descargable (${lang}) da el mismo mutante`, { skip: !PY && 'sin Python' }, () => {
      const dir = path.join(tmp, `py-${lang}`);
      fs.mkdirSync(dir, { recursive: true });
      const modName = content.codeTemplates.python.filename.replace(/\.py$/, '');
      fs.writeFileSync(path.join(dir, `${modName}.py`), content.getCode('python', lang));
      const cases = [];
      for (const variant of spec.variants || [undefined]) cases.push(...makeCases(op, spec, 300, 7, variant));
      fs.writeFileSync(path.join(dir, `${modName}-cases.json`), JSON.stringify(cases));
      const script = `
import json, sys
sys.path.insert(0, ${JSON.stringify(dir)})
from ${modName} import ${content.fnName.python} as f

class Fixed:
    def __init__(self, draws):
        self.draws = list(draws)
        self.k = 0
    def random(self):
        v = self.draws[self.k]
        self.k += 1
        return v

cases = json.load(open(${JSON.stringify(path.join(dir, `${modName}-cases.json`))}))
bad = 0
for c in cases:
    got = ${call.py}
    if len(got) != len(c["expected"]) or any(abs(a - b) > 1e-9 for a, b in zip(got, c["expected"])):
        bad += 1
        print("diferente", c, got)
print("mal", bad)
sys.exit(1 if bad else 0)
`;
      const run = spawnSync(PY, ['-c', script], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stdout + run.stderr);
      const demo = spawnSync(PY, [path.join(dir, `${modName}.py`)], { encoding: 'utf8' });
      assert.equal(demo.status, 0, demo.stderr);
    });
  }
}
