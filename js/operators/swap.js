/*
 * Mutación por intercambio (swap) para representación permutacional: se eligen dos posiciones
 * i y j al azar y sus genes se intercambian. El mutante sigue siendo una permutación.
 * En la página, las posiciones son dos marcadores arrastrables; «Posiciones aleatorias» las sortea.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const P = isNode ? require('./perm-utils.js') : root.GAX.permUtils;

  function swapMutation(parent, i, j) {
    const err = P.validateParent(parent);
    if (err) throw new Error(err);
    const n = parent.length;
    if (!P.validPair(n, i, j)) throw new Error('errMarks');
    const child = parent.slice();
    child[i] = parent[j];
    child[j] = parent[i];
    const T = M.newTrace(n);
    const hl = { p: [i, j], c: [i, j] };

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.snap({ type: 'pick', text: { key: 'pick', params: { i: i + 1, j: j + 1, gi: parent[i], gj: parent[j] } }, highlight: hl });
    const src = P.range(0, n);
    src[i] = j;
    src[j] = i;
    const fly = P.rearrange(T, parent, src);
    T.snap({ type: 'swap', text: { key: 'swap', params: { i: i + 1, j: j + 1, gi: parent[i], gj: parent[j] } }, highlight: hl, fly });
    const st = P.stats(parent, child);
    T.snap({
      type: 'done',
      text: { key: 'done', params: { n, posKept: st.posKept, edgesKept: st.edgesKept, newEdges: st.newEdges.join(', ') } },
      highlight: { c: [i, j] },
    });
    return { child, steps: T.steps, mutated: M.diffPositions(parent, child) };
  }

  const spec = {
    id: 'swap',
    representation: 'permutation',
    marks: { type: 'gene', count: 2, names: ['i', 'j'] },
    aux: null,
    legend: ['copy', 'moved', 'mark'],
    run: (parent, marks) => swapMutation(parent, marks[0], marks[1]),
  };

  const api = { swapMutation, validateParent: P.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).swap = api;
})(typeof self !== 'undefined' ? self : this);
