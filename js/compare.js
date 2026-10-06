/*
 * Comparación de los operadores de mutación de una misma representación con el mismo padre:
 * cuánto cambia cada uno y qué conserva del padre.
 *
 * Lógica pura (sin DOM), usada por la pantalla «Comparar operadores» y por los tests.
 *
 *   compare({ rep, ops, parent, marks, from, variant, params, draw, reps, seed })
 *     ops: [{ id, spec }] en el orden en que se muestran
 *     → [{ id, marks, params, variant, child, genes, example, mean }]
 *
 * example: métricas del mutante del ejemplo; mean: las mismas métricas con `reps` mutaciones del
 * mismo padre (marcadores y sorteos al azar, mismos parámetros), o null si reps = 0.
 * randomMean*: la misma media, pero sobre muchos padres al azar de la misma longitud.
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;
  const GEN = isNode ? {
    binary: require('./operators/bin-utils.js').randomBits,
    integer: require('./operators/int-utils.js').randomInts,
    real: require('./operators/real-utils.js').randomReals,
  } : {
    binary: (r, n) => root.GAX.binUtils.randomBits(r, n),
    integer: (r, n) => root.GAX.intUtils.randomInts(r, n),
    real: (r, n) => root.GAX.realUtils.randomReals(r, n),
  };

  const EPS = 1e-9;
  const SMALL = 1;   // salto «pequeño» en reales: como mucho una unidad (un 10 % del intervalo [0, 10])

  // Métricas de cada representación, en el orden de las columnas.
  // kind: 'pct' (fracción entre 0 y 1) o 'num' (número sin tope fijo).
  const METRICS = {
    binary: [
      { id: 'hamming', kind: 'num' },
      { id: 'clone', kind: 'pct' },
    ],
    integer: [
      { id: 'changed', kind: 'pct' },
      { id: 'jump', kind: 'num' },
      { id: 'clone', kind: 'pct' },
    ],
    real: [
      { id: 'changed', kind: 'pct' },
      { id: 'jump', kind: 'num' },
      { id: 'small', kind: 'pct' },
    ],
    permutation: [
      { id: 'position', kind: 'pct' },
      { id: 'adjacency', kind: 'pct' },
      { id: 'order', kind: 'pct' },
      { id: 'clone', kind: 'pct' },
      { id: 'valid', kind: 'pct' },
    ],
  };

  // ---------- Recuentos de un mutante (se suman entre repeticiones y luego se normalizan) ----------

  function firstIndex(arr) {
    const m = new Map();
    arr.forEach((g, i) => { if (!m.has(g)) m.set(g, i); });
    return m;
  }
  const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  /** true si a, b, c aparecen en ese sentido al leer el cromosoma como un circuito. */
  function clockwise(idx, a, b, c) {
    const x = idx.get(a);
    const y = idx.get(b);
    const z = idx.get(c);
    return (x < y) + (y < z) + (z < x) === 2;
  }

  /**
   * Recuentos de un mutante frente a su padre.
   *  binaria, entera, real: changed (genes que cambian), abs (suma de |Δ|), small (cambios con
   *    |Δ| ≤ SMALL), clone (1 si no cambia nada).
   *  permutación (leída como circuito, como en el viajante): pos (genes en su posición), adj
   *    (aristas del mutante que estaban en el padre), ord (tríos de genes recorridos en el mismo
   *    sentido que en el padre), clone, valid (1 si sigue siendo una permutación).
   */
  function counts(rep, child, parent) {
    const n = child.length;
    if (rep !== 'permutation') {
      let changed = 0;
      let abs = 0;
      let small = 0;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(child[i] - parent[i]);
        if (d > EPS) { changed++; abs += d; if (d <= SMALL + EPS) small++; }
      }
      return { changed, abs, small, clone: changed ? 0 : 1 };
    }
    let pos = 0;
    for (let i = 0; i < n; i++) if (child[i] === parent[i]) pos++;
    const pe = new Set();
    for (let i = 0; i < n; i++) pe.add(edgeKey(parent[i], parent[(i + 1) % n]));
    let adj = 0;
    for (let i = 0; i < n; i++) if (pe.has(edgeKey(child[i], child[(i + 1) % n]))) adj++;
    const ip = firstIndex(parent);
    const ic = firstIndex(child);
    const genes = parent.slice().sort((a, b) => a - b);
    let ord = 0;
    for (let x = 0; x < n; x++) {
      for (let y = x + 1; y < n; y++) {
        for (let z = y + 1; z < n; z++) {
          const [a, b, c] = [genes[x], genes[y], genes[z]];
          if (ic.has(a) && ic.has(b) && ic.has(c) && clockwise(ic, a, b, c) === clockwise(ip, a, b, c)) ord++;
        }
      }
    }
    return { pos, adj, ord, clone: pos === n ? 1 : 0, valid: new Set(child).size === n ? 1 : 0 };
  }

  function addCounts(acc, c) {
    Object.keys(c).forEach((k) => { acc[k] = (acc[k] || 0) + c[k]; });
    acc.runs = (acc.runs || 0) + 1;
    return acc;
  }

  /** Métricas a partir de los recuentos sumados de `acc.runs` mutantes de longitud n. */
  function finalize(rep, acc, n) {
    const runs = acc.runs || 1;
    if (rep === 'permutation') {
      const triples = (n * (n - 1) * (n - 2)) / 6;
      return {
        position: acc.pos / (runs * n),
        adjacency: acc.adj / (runs * n),
        order: acc.ord / (runs * triples),
        clone: acc.clone / runs,
        valid: acc.valid / runs,
      };
    }
    // jump y small se miden solo entre los genes que cambian (null si no ha cambiado ninguno)
    return {
      hamming: acc.changed / runs,
      changed: acc.changed / (runs * n),
      jump: acc.changed ? acc.abs / acc.changed : null,
      small: acc.changed ? acc.small / acc.changed : null,
      clone: acc.clone / runs,
    };
  }

  function metricsOf(rep, child, parent) {
    return finalize(rep, addCounts({}, counts(rep, child, parent)), parent.length);
  }

  // ---------- Qué le pasa a cada gen (para colorear los mutantes) ----------

  /**
   * Clase de cada gen del mutante:
   *  permutación: 'kept' (misma posición que en el padre) o 'moved'; dup = gen repetido.
   *  resto: 'kept' (igual que en el padre) o 'mutated'.
   */
  function geneClasses(rep, child, parent) {
    const count = new Map();
    child.forEach((g) => count.set(g, (count.get(g) || 0) + 1));
    return child.map((g, i) => {
      const same = Math.abs(g - parent[i]) < EPS;
      if (rep === 'permutation') return { cls: same ? 'kept' : 'moved', dup: count.get(g) > 1 };
      return { cls: same ? 'kept' : 'mutated', dup: false };
    });
  }

  // ---------- Marcadores y ajustes de cada operador ----------

  function randomMarks(spec, rng, n) {
    const ms = spec.marks;
    if (!ms) return [];
    if (ms.type === 'gene') return R.shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, ms.count);
    const a = R.randInt(rng, 0, n - 2);
    return [a, R.randInt(rng, a + 2, n)];
  }

  function validMarks(spec, marks, n) {
    const ms = spec.marks;
    if (!ms) return true;
    if (!Array.isArray(marks) || marks.length !== ms.count || !marks.every(Number.isInteger)) return false;
    if (ms.type === 'gene') return marks.every((m) => m >= 0 && m < n) && new Set(marks).size === marks.length;
    return marks[0] >= 0 && marks[1] <= n && marks[1] - marks[0] >= 2;
  }

  /** Parámetros por defecto del operador, o los de la página de origen si es ese operador. */
  function defaultParams(spec, given) {
    const out = {};
    (spec.params || []).forEach((p) => {
      const v = given && given[p.id];
      out[p.id] = Number.isFinite(v) && v >= p.min && v <= p.max ? v : p.default;
    });
    return out;
  }

  function opSettings(opts) {
    return opts.ops.map(({ id, spec }) => {
      const isFrom = id === opts.from;
      const params = defaultParams(spec, isFrom ? opts.params : null);
      const variant = spec.variants
        ? (isFrom && spec.variants.indexOf(opts.variant) !== -1 ? opts.variant : spec.defaultVariant)
        : null;
      return { id, spec, params, variant, isFrom };
    });
  }

  // Sin trazas pesadas (la distribución de los reales) en las repeticiones.
  const runOp = (s, parent, marks, seed) => s.spec.run(parent, marks, { variant: s.variant, seed, params: s.params, light: true });

  // ---------- Comparación con el mismo padre ----------

  function compare(opts) {
    const { rep, parent } = opts;
    const n = parent.length;
    const reps = opts.reps == null ? 1000 : opts.reps;
    const draw = opts.draw || 1;
    const markRng = R.mulberry32((opts.seed || 1) + 7);

    return opSettings(opts).map((s, idx) => {
      // Ejemplo: los marcadores de la página de origen si valen para este operador; si no, al azar
      const marks = validMarks(s.spec, opts.marks, n) && s.spec.marks && opts.marks.length
        ? opts.marks.slice()
        : randomMarks(s.spec, markRng, n);
      const res = runOp(s, parent, marks, draw);
      const child = res.child.slice();
      const example = metricsOf(rep, child, parent);
      const genes = geneClasses(rep, child, parent);

      // Media: mismo padre y parámetros, marcadores y sorteos al azar
      let mean = null;
      if (reps) {
        const rng = R.mulberry32(((opts.seed || 1) * 7919 + idx * 104729 + 1) >>> 0);
        const acc = {};
        for (let t = 0; t < reps; t++) {
          const r = runOp(s, parent, randomMarks(s.spec, rng, n), 1 + Math.floor(rng() * 999999));
          addCounts(acc, counts(rep, r.child, parent));
        }
        mean = finalize(rep, acc, n);
      }
      return { id: s.id, marks, params: s.params, variant: s.variant, child, genes, example, mean };
    });
  }

  // ---------- Media con padres al azar ----------

  function randomParent(rep, rng, n) {
    if (rep === 'permutation') return R.randomPermutation(rng, n);
    return GEN[rep](rng, n);
  }

  // Semilla de cada padre (y de cada operador): el resultado no depende de cómo se reparta el
  // cálculo en tandas.
  const mixSeed = (a, b, c) => ((Math.imul(a, 2654435761) ^ Math.imul(b + 1, 2246822519) ^ Math.imul(c + 1, 3266489917)) >>> 0) || 1;

  /**
   * Media sobre padres al azar, por tandas (para no bloquear la página):
   *   const acc = randomMeanStart(opts);  randomMeanStep(acc, k);  ...  randomMeanResult(acc)
   * opts: { rep, ops, n, from, variant, params, parents, reps, seed }
   *   `parents` padres de longitud n; con cada uno, `reps` mutaciones por operador.
   */
  function randomMeanStart(opts) {
    const settings = opSettings(opts);
    return {
      opts, settings,
      parents: opts.parents == null ? 1000 : opts.parents,
      reps: opts.reps == null ? 10 : opts.reps,
      seed: opts.seed == null ? 1 : opts.seed,
      done: 0,
      sums: settings.map(() => ({})),
    };
  }

  /** Procesa hasta `count` padres más. Devuelve la fracción hecha (0–1). */
  function randomMeanStep(acc, count) {
    const { opts, settings } = acc;
    const n = opts.n;
    const end = Math.min(acc.parents, acc.done + count);
    for (let k = acc.done; k < end; k++) {
      const parent = randomParent(opts.rep, R.mulberry32(mixSeed(acc.seed, k, -1)), n);
      settings.forEach((s, idx) => {
        const rng = R.mulberry32(mixSeed(acc.seed, k, idx));
        for (let t = 0; t < acc.reps; t++) {
          const r = runOp(s, parent, randomMarks(s.spec, rng, n), 1 + Math.floor(rng() * 999999));
          addCounts(acc.sums[idx], counts(opts.rep, r.child, parent));
        }
      });
    }
    acc.done = end;
    return acc.parents ? acc.done / acc.parents : 1;
  }

  /** { [id]: { métrica: media } } cuando ha terminado; null si aún no. */
  function randomMeanResult(acc) {
    if (acc.done < acc.parents) return null;
    const out = {};
    acc.settings.forEach((s, idx) => { out[s.id] = finalize(acc.opts.rep, acc.sums[idx], acc.opts.n); });
    return out;
  }

  /** Todo de una vez (tests y scripts). */
  function randomMean(opts) {
    const acc = randomMeanStart(opts);
    randomMeanStep(acc, acc.parents);
    return randomMeanResult(acc);
  }

  const api = {
    METRICS, compare, counts, finalize, metricsOf, geneClasses, randomMarks, defaultParams,
    randomMean, randomMeanStart, randomMeanStep, randomMeanResult,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).compare = api;
})(typeof self !== 'undefined' ? self : this);
