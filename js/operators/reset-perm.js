/*
 * Contraejemplo: el reinicio aleatorio de la representación entera aplicado a una permutación.
 * Para cada posición se sortea r; si r < pm, el gen toma un valor al azar entre 1 y n:
 * v = 1 + ⌊s·n⌋, con un segundo número s. Como cada posición se decide por separado, aparecen
 * genes repetidos y faltan otros: el mutante ya no es una permutación.
 * Los números se sortean redondeados hacia abajo a centésimas y en este orden: r_1, [s_1], r_2, …
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const P = isNode ? require('./perm-utils.js') : root.GAX.permUtils;

  function resetPerm(parent, pm, opts) {
    const err = P.validateParent(parent);
    if (err) throw new Error(err);
    if (!(pm > 0 && pm <= 1)) throw new Error('errParam');
    const D = M.drawSource(opts, true);
    const n = parent.length;
    const child = parent.slice();
    const items = [];
    const T = M.newTrace(n);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n, pm } } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.st.auxVisible = true;
    T.snap({ type: 'drawIntro', text: { key: 'drawIntro', params: { pm, n } } });
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
      item.val = 1 + Math.floor(item.s * n);
      items.push(item);
      const changed = item.val !== parent[i];
      if (changed) {
        child[i] = item.val;
        T.child[i] = { v: item.val, kind: 'mutated' };
      }
      // genes repetidos hasta ahora en el mutante
      const count = new Map();
      child.forEach((g) => count.set(g, (count.get(g) || 0) + 1));
      const dupPos = changed && count.get(item.val) > 1 ? child.map((g, k) => (g === item.val ? k : -1)).filter((k) => k >= 0) : [];
      T.snap(Object.assign({
        type: 'drawHit',
        text: { key: !changed ? 'drawSame' : dupPos.length ? 'drawDup' : 'drawNew', params: { pos: i + 1, r, pm, s: item.s, n, v: item.val, a: parent[i] } },
        flip: changed ? [i] : [],
      }, base, dupPos.length ? { conflict: { c: dupPos } } : {}));
    }

    const count = new Map();
    child.forEach((g) => count.set(g, (count.get(g) || 0) + 1));
    const reps = [...count.keys()].filter((g) => count.get(g) > 1).sort((x, y) => x - y);
    const missing = P.range(1, n + 1).filter((g) => !count.has(g));
    const dupAll = child.map((g, k) => (count.get(g) > 1 ? k : -1)).filter((k) => k >= 0);
    const mutated = M.diffPositions(parent, child);
    let key = 'doneInvalid';
    if (!mutated.length) key = 'doneNone';
    else if (!reps.length) key = 'doneValid';
    T.snap({
      type: 'done',
      text: { key, params: { k: mutated.length, reps: reps.join(', '), missing: missing.join(', ') } },
      conflict: { c: dupAll },
      highlight: { c: mutated },
    });
    return { child, steps: T.steps, draws: D.used, mutated, valid: !reps.length, aux: { type: 'draws', items, pm } };
  }

  const spec = {
    id: 'reset-perm',
    representation: 'permutation',
    marks: null,
    aux: 'draws',
    legend: ['copy', 'mutated', 'drawHit', 'conflict'],
    params: [{ id: 'pm', type: 'float', min: 0.05, max: 0.5, step: 0.01, default: 0.25 }],
    random: true,
    invalidChildren: true,  // el mutante puede no ser una permutación
    run: (parent, marks, opts) => {
      const pm = opts && opts.params && opts.params.pm;
      return resetPerm(parent, typeof pm === 'number' ? pm : 0.25, { seed: opts && opts.seed, draws: opts && opts.draws });
    },
  };

  const api = { resetPerm, validateParent: P.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['reset-perm'] = api;
})(typeof self !== 'undefined' ? self : this);
