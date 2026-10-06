/*
 * Mutación por mezcla (scramble) para representación permutacional: se elige un tramo [a, b) y
 * sus genes se reordenan al azar; el resto no se mueve.
 * La mezcla es el algoritmo de Fisher-Yates sobre el tramo: para k desde el último gen del
 * tramo hasta el segundo, se sortea r y se intercambian los genes k y ⌊r·(k + 1)⌋ (contando
 * dentro del tramo desde 0). Los r se redondean hacia abajo a cuatro decimales. El sorteo es
 * reproducible (opts.seed) o se puede fijar (opts.draws).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const P = isNode ? require('./perm-utils.js') : root.GAX.permUtils;

  function scrambleMutation(parent, a, b, opts) {
    const err = P.validateParent(parent);
    if (err) throw new Error(err);
    const n = parent.length;
    if (!P.validSegment(n, a, b)) throw new Error('errMarks');
    const D = M.drawSource(opts, 4);   // cuatro decimales: el modo práctica los da exactos
    const idx = P.range(a, b);   // posiciones del padre, en el orden en que quedan en el tramo
    for (let k = idx.length - 1; k > 0; k--) {
      const j = Math.floor(D.next() * (k + 1));
      [idx[k], idx[j]] = [idx[j], idx[k]];
    }
    const order = P.range(0, n);
    idx.forEach((from, k) => { order[a + k] = from; });
    const child = order.map((k) => parent[k]);
    const seg = P.range(a, b);
    const T = M.newTrace(n);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.snap({ type: 'pick', text: { key: 'pick', params: { a: a + 1, b, list: parent.slice(a, b).join(', '), m: b - a } }, highlight: { p: seg, c: seg } });
    const fly = P.rearrange(T, parent, order);
    const same = child.every((g, k) => g === parent[k]);
    T.snap({ type: 'shuffle', text: { key: same ? 'shuffleSame' : 'shuffle', params: { list: child.slice(a, b).join(', ') } }, highlight: { c: seg }, fly });
    const st = P.stats(parent, child);
    T.snap({
      type: 'done',
      text: { key: 'done', params: { n, m: b - a, posKept: st.posKept, edgesKept: st.edgesKept, newEdges: st.newEdges.join(', ') || '—' } },
      highlight: { c: seg },
    });
    return { child, steps: T.steps, draws: D.used, mutated: M.diffPositions(parent, child) };
  }

  const spec = {
    id: 'scramble',
    representation: 'permutation',
    marks: { type: 'gap', count: 2 },
    aux: null,
    legend: ['copy', 'moved', 'segment'],
    random: true,           // la página ofrece «Sortear de nuevo»
    run: (parent, marks, opts) => scrambleMutation(parent, marks[0], marks[1], { seed: opts && opts.seed, draws: opts && opts.draws }),
  };

  const api = { scrambleMutation, validateParent: P.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).scramble = api;
})(typeof self !== 'undefined' ? self : this);
