/*
 * Utilidades de la representación real y motor común de sus mutaciones.
 *
 * Cada gen es un real del intervalo [LOW, HIGH] = [0, 10]. Los padres aleatorios tienen un
 * decimal, para que los ejemplos se lean bien en clase; a mano se admiten hasta dos decimales.
 *
 * Todas las mutaciones reales siguen el mismo esquema: para cada posición se sortea r
 * (redondeado hacia abajo a centésimas, para que la narración muestre exactamente lo que se
 * compara) y, si r < pm, el gen se perturba con uno o varios números más (redondeados a cuatro
 * decimales, para que el modo práctica pueda darlos exactos).
 * Los números se consumen en este orden: r_1, [números de la perturbación 1], r_2, …
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  const LOW = 0;
  const HIGH = 10;
  const BINS = 40;
  const SAMPLES = 4000;

  /** null si p es un vector real válido (5 <= n <= 12, valores en [0, 10] con hasta dos decimales), o una clave de error. */
  function validateParent(p) {
    if (!Array.isArray(p)) return 'errFormat';
    const n = p.length;
    if (n < 5 || n > 12) return 'errRange';
    const ok = (v) => typeof v === 'number' && Number.isFinite(v) && v >= LOW && v <= HIGH && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
    if (!p.every(ok)) return 'errReal';
    return null;
  }

  /** Vector de n reales con un decimal en [0, 10]. */
  function randomReals(rng, n) {
    return Array.from({ length: n }, () => Math.round(rng() * 100) / 10);
  }

  const clamp = (v) => Math.min(HIGH, Math.max(LOW, v));

  /** Histograma (fracciones) de valores en [LOW, HIGH] con BINS intervalos. */
  function histogram(values) {
    const bins = Array(BINS).fill(0);
    values.forEach((v) => {
      const k = Math.min(BINS - 1, Math.max(0, Math.floor(((v - LOW) / (HIGH - LOW)) * BINS)));
      bins[k]++;
    });
    return bins.map((c) => c / values.length);
  }

  /**
   * Traza común de las mutaciones reales.
   * def: {
   *   extra:   cuántos números más se sortean cuando la posición muta
   *   apply(v, ds) → { v: valor nuevo (ya dentro de [LOW, HIGH]), key: clave de la narración, params }
   *   introParams, drawIntroParams: parámetros de esos dos pasos
   * }
   * Devuelve { child, steps, draws, mutated, aux } con aux.type = 'real': los números de cada
   * posición y, para cada posición, la distribución del valor mutado (SAMPLES perturbaciones).
   */
  function realTrace(parent, pm, opts, def) {
    const err = validateParent(parent);
    if (err) throw new Error(err);
    if (!(pm > 0 && pm <= 1)) throw new Error('errParam');
    opts = opts || {};
    const D = M.drawSource(opts, true);
    const n = parent.length;
    const child = parent.slice();
    const items = [];
    const T = M.newTrace(n);
    const nextRaw = () => D.next(4);   // números de la perturbación: cuatro decimales

    T.snap({ type: 'intro', text: { key: 'intro', params: Object.assign({ n, pm, lo: LOW, hi: HIGH }, def.introParams || {}) } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.st.auxVisible = true;
    T.snap({ type: 'drawIntro', text: { key: 'drawIntro', params: Object.assign({ pm }, def.drawIntroParams || {}) }, auxActive: [0], histPos: 0 });
    for (let i = 0; i < n; i++) {
      const r = D.next();
      const item = { r, hit: r < pm };
      T.st.revealed.push(i);
      const base = { highlight: { p: [i], c: [i] }, auxActive: [i], histPos: i };
      if (!item.hit) {
        items.push(item);
        T.snap(Object.assign({ type: 'drawKeep', text: { key: 'drawKeep', params: { pos: i + 1, r, pm } } }, base));
        continue;
      }
      const ds = [];
      for (let k = 0; k < def.extra; k++) ds.push(nextRaw());
      const res = def.apply(parent[i], ds);
      item.val = res.v;
      item.ds = ds;
      items.push(item);
      const changed = Math.abs(res.v - parent[i]) > 1e-12;
      if (changed) {
        child[i] = res.v;
        T.child[i] = { v: res.v, kind: 'mutated' };
      }
      T.snap(Object.assign({
        type: 'drawHit',
        text: { key: res.key, params: Object.assign({ pos: i + 1, r, pm, a: parent[i], v: res.v, genes: ['a', 'v'] }, res.params || {}) },
        flip: changed ? [i] : [],
        histMark: res.v,
      }, base));
    }

    const mutated = M.diffPositions(parent, child);
    const jumps = mutated.map((i) => Math.abs(child[i] - parent[i]));
    const mean = jumps.length ? jumps.reduce((a, b) => a + b, 0) / jumps.length : 0;
    T.snap({
      type: 'done',
      text: {
        key: mutated.length === 0 ? 'doneNone' : mutated.length === 1 ? 'doneOne' : 'done',
        params: { k: mutated.length, list: mutated.map((i) => i + 1).join(', '), meanJump: mean, maxJump: Math.max(0, ...jumps) },
      },
      highlight: { c: mutated },
      histPos: mutated.length ? mutated[0] : 0,
      histMark: mutated.length ? child[mutated[0]] : null,
    });

    // Distribución del valor mutado en cada posición (otros sorteos, mismos ajustes);
    // no se calcula al reproducir sorteos concretos (tests, modo práctica) ni en las repeticiones
    // de «Comparar operadores» (opts.light).
    let hists = null;
    if (!Array.isArray(opts.draws) && !opts.light) {
      const rand = R.mulberry32((((opts.seed >>> 0) || 1) * 2654435761 + 12345) >>> 0);
      hists = parent.map((v) => {
        const vals = [];
        for (let s = 0; s < SAMPLES; s++) {
          const ds = [];
          for (let k = 0; k < def.extra; k++) ds.push(rand());
          vals.push(def.apply(v, ds).v);
        }
        return histogram(vals);
      });
    }

    return { child, steps: T.steps, draws: D.used, mutated, aux: { type: 'real', items, pm, hists, parent: parent.slice(), lo: LOW, hi: HIGH, samples: SAMPLES } };
  }

  const api = { LOW, HIGH, BINS, SAMPLES, validateParent, randomReals, clamp, histogram, realTrace };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).realUtils = api;
})(typeof self !== 'undefined' ? self : this);
