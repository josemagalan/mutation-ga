/*
 * Mutación por deslizamiento (creep) para representación entera.
 * Para cada posición se sortea r; si r < pm, al gen se le suma un paso pequeño, positivo o
 * negativo, elegido al azar entre −s…−1 y +1…+s (s = paso máximo), todos con la misma
 * probabilidad: con un segundo número u, k = ⌊u·2s⌋ y el paso es k − s si k < s, o k − s + 1 si no.
 * Si el valor se sale del rango [L, U]:
 *   variante «clamp» (recortar, la habitual): se queda en el extremo;
 *   variante «wrap» (dar la vuelta): el rango se trata como circular, U + 1 → L.
 * Los números se sortean redondeados hacia abajo a centésimas y en este orden: r_1, [u_1], r_2, …
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const I = isNode ? require('./int-utils.js') : root.GAX.intUtils;

  function creep(parent, pm, step, opts) {
    const err = I.validateParent(parent);
    if (err) throw new Error(err);
    if (!(pm > 0 && pm <= 1)) throw new Error('errParam');
    if (!(Number.isInteger(step) && step >= 1 && step <= 3)) throw new Error('errParam');
    opts = opts || {};
    const wrap = opts.variant === 'wrap';
    const D = M.drawSource(opts, true);
    const n = parent.length;
    const { LOW: lo, HIGH: hi } = I;
    const size = hi - lo + 1;
    const child = parent.slice();
    const items = [];
    const T = M.newTrace(n);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n, pm, lo, hi, step } } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.st.auxVisible = true;
    T.snap({ type: 'drawIntro', text: { key: 'drawIntro', params: { pm, step, steps: step === 1 ? '−1, +1' : `−${step}…−1, +1…+${step}`, twoS: 2 * step } } });
    for (let i = 0; i < n; i++) {
      const r = D.next();
      const item = { r, hit: r < pm };
      T.st.revealed.push(i);
      const base = { highlight: { p: [i], c: [i] }, auxActive: [i] };
      if (!item.hit) {
        items.push(item);
        T.snap(Object.assign({ type: 'drawKeep', text: { key: 'drawKeep', params: { pos: i + 1, r, pm } } }, base));
        continue;
      }
      item.s = D.next();
      const k = Math.floor(item.s * 2 * step);
      const delta = k < step ? k - step : k - step + 1;
      const raw = parent[i] + delta;
      let v = raw;
      if (raw < lo || raw > hi) v = wrap ? lo + ((((raw - lo) % size) + size) % size) : Math.min(hi, Math.max(lo, raw));
      item.delta = I.signed(delta);
      item.val = v;
      items.push(item);
      const changed = v !== parent[i];
      if (changed) {
        child[i] = v;
        T.child[i] = { v, kind: 'mutated' };
      }
      let key = 'drawStep';
      if (raw !== v) key = wrap ? 'drawWrap' : (changed ? 'drawClamp' : 'drawClampSame');
      T.snap(Object.assign({
        type: 'drawHit',
        text: { key, params: { pos: i + 1, r, pm, s: item.s, twoS: 2 * step, k, delta: I.signed(delta), a: parent[i], raw, v, lo, hi } },
        flip: changed ? [i] : [],
      }, base));
    }

    const mutated = M.diffPositions(parent, child);
    const jumps = mutated.map((i) => Math.abs(child[i] - parent[i]));
    T.snap({
      type: 'done',
      text: {
        key: mutated.length ? (wrap && jumps.some((j) => j > step) ? 'doneWrap' : 'done') + (mutated.length === 1 ? 'One' : '') : 'doneNone',
        params: { k: mutated.length, list: mutated.map((i) => i + 1).join(', '), step, maxJump: Math.max(0, ...jumps) },
      },
      highlight: { c: mutated },
    });
    return { child, steps: T.steps, draws: D.used, mutated, aux: { type: 'draws', items, pm } };
  }

  const spec = {
    id: 'creep',
    representation: 'integer',
    marks: null,
    aux: 'draws',
    drawNames: ['u'],   // nombres de los números de la perturbación (modo práctica)
    legend: ['copy', 'mutated', 'drawHit'],
    params: [
      { id: 'pm', type: 'float', min: 0.01, max: 0.5, step: 0.01, default: 0.3 },
      // «smax» y no «step»: en la URL, step= es el paso de la animación
      { id: 'smax', type: 'int', min: 1, max: 3, step: 1, default: 1 },
    ],
    variants: ['clamp', 'wrap'],
    defaultVariant: 'clamp',
    random: true,
    run: (parent, marks, opts) => {
      const p = (opts && opts.params) || {};
      return creep(parent, typeof p.pm === 'number' ? p.pm : 0.3, typeof p.smax === 'number' ? p.smax : 1,
        { variant: opts && opts.variant, seed: opts && opts.seed, draws: opts && opts.draws });
    },
  };

  const api = { creep, validateParent: I.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).creep = api;
})(typeof self !== 'undefined' ? self : this);
