/*
 * Mutación por inversión de bits (bit-flip) para representación binaria.
 * Para cada posición i se sortea r_i en [0, 1); si r_i < pm, la posición muta.
 *   Variante «flip» (la habitual): el bit se invierte, 0 ↔ 1.
 *   Variante «random» (alelo aleatorio): se sortea un bit nuevo s_i (0 si s_i < 0,5; 1 si no),
 *   que puede coincidir con el que había: el bit solo cambia con probabilidad pm/2.
 * Los números se sortean redondeados hacia abajo a centésimas (para que la narración muestre
 * exactamente lo que se compara) y en este orden: r_1, [s_1], r_2, [s_2], …
 * El sorteo es reproducible (opts.seed) o se puede fijar (opts.draws, en ese orden).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;

  function bitFlip(parent, pm, opts) {
    const err = B.validateParent(parent);
    if (err) throw new Error(err);
    if (!(pm > 0 && pm <= 1)) throw new Error('errParam');
    opts = opts || {};
    const variant = opts.variant === 'random' ? 'random' : 'flip';
    const D = M.drawSource(opts, true);
    const n = parent.length;
    const child = parent.slice();
    const items = [];
    const T = M.newTrace(n);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n, pm, expected: Math.round(pm * n * 100) / 100 } } });
    const fly = T.copyAll(parent);
    T.snap({ type: 'copy', text: { key: 'copy' }, fly });
    T.st.auxVisible = true;
    T.snap({ type: 'drawIntro', text: { key: variant === 'flip' ? 'drawIntro' : 'drawIntroRandom', params: { pm } } });

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
      let nb;
      if (variant === 'flip') nb = 1 - parent[i];
      else {
        item.s = D.next();
        nb = item.s < 0.5 ? 0 : 1;
      }
      item.bit = nb;
      items.push(item);
      const changed = nb !== parent[i];
      if (changed) {
        child[i] = nb;
        T.child[i] = { v: nb, kind: 'mutated' };
      }
      const key = variant === 'flip' ? 'drawFlip' : (changed ? 'drawResetNew' : 'drawResetSame');
      T.snap(Object.assign({
        type: 'drawHit',
        text: { key, params: { pos: i + 1, r, pm, s: item.s, a: parent[i], b: nb } },
        flip: changed ? [i] : [],
      }, base));
    }

    const mutated = M.diffPositions(parent, child);
    const k = mutated.length;
    T.snap({
      type: 'done',
      text: { key: k === 0 ? 'doneNone' : k === 1 ? 'doneOne' : 'done', params: { k, list: mutated.map((i) => i + 1).join(', '), expected: Math.round(pm * n * 100) / 100 } },
      highlight: { c: mutated },
    });

    return { child, steps: T.steps, draws: D.used, mutated, aux: { type: 'draws', items, pm } };
  }

  const spec = {
    id: 'bit-flip',
    representation: 'binary',
    marks: null,
    aux: 'draws',
    legend: ['copy', 'mutated', 'drawHit'],
    params: [{ id: 'pm', type: 'float', min: 0.01, max: 0.5, step: 0.01, default: 0.15 }],
    variants: ['flip', 'random'],
    defaultVariant: 'flip',
    random: true,           // la página ofrece «Sortear de nuevo»
    run: (parent, marks, opts) => {
      const pm = opts && opts.params && opts.params.pm;
      return bitFlip(parent, typeof pm === 'number' ? pm : 0.15, { variant: opts && opts.variant, seed: opts && opts.seed, draws: opts && opts.draws });
    },
  };

  const api = { bitFlip, validateParent: B.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['bit-flip'] = api;
})(typeof self !== 'undefined' ? self : this);
