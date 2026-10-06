/*
 * Mutación por inserción para representación permutacional: el gen de la posición i se saca de
 * su sitio y se inserta de modo que quede en la posición j; los genes que había entre las dos
 * posiciones se desplazan un lugar para hacerle hueco. El resto no se mueve.
 * En la página, i (origen) y j (destino) son dos marcadores arrastrables.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const P = isNode ? require('./perm-utils.js') : root.GAX.permUtils;

  function insertMutation(parent, i, j) {
    const err = P.validateParent(parent);
    if (err) throw new Error(err);
    const n = parent.length;
    if (!P.validPair(n, i, j)) throw new Error('errMarks');
    // src[k]: posición del padre de la que viene el gen que acaba en la posición k
    const order = P.range(0, n);
    order.splice(i, 1);
    order.splice(j, 0, i);
    const child = order.map((k) => parent[k]);
    const T = M.newTrace(n);
    const lo = Math.min(i, j);
    const hi = Math.max(i, j);
    const shifted = P.range(lo, hi + 1).filter((k) => k !== j);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.snap({ type: 'pick', text: { key: 'pick', params: { i: i + 1, j: j + 1, g: parent[i] } }, highlight: { p: [i], c: [i, j] } });
    const fly = P.rearrange(T, parent, order);
    T.snap({
      type: 'insert',
      text: { key: i < j ? 'insertRight' : 'insertLeft', params: { i: i + 1, j: j + 1, g: parent[i], count: hi - lo, list: shifted.map((k) => child[k]).join(', ') } },
      highlight: { c: P.range(lo, hi + 1) },
      fly,
    });
    const st = P.stats(parent, child);
    T.snap({
      type: 'done',
      text: { key: 'done', params: { n, g: parent[i], posKept: st.posKept, edgesKept: st.edgesKept, newEdges: st.newEdges.join(', ') } },
      highlight: { c: [j] },
    });
    return { child, steps: T.steps, mutated: M.diffPositions(parent, child) };
  }

  const spec = {
    id: 'insert',
    representation: 'permutation',
    marks: { type: 'gene', count: 2, names: ['i', 'j'] },
    aux: null,
    legend: ['copy', 'moved', 'mark'],
    run: (parent, marks) => insertMutation(parent, marks[0], marks[1]),
  };

  const api = { insertMutation, validateParent: P.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).insert = api;
})(typeof self !== 'undefined' ? self : this);
