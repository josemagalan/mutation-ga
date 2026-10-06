/*
 * Mutación por inversión para representación permutacional: se elige un tramo [a, b) y se
 * invierte el orden de sus genes. Leído como una ruta circular, el mutante conserva todas las
 * adyacencias salvo, como mucho, las dos de los extremos del tramo: es el movimiento 2-opt del
 * problema del viajante.
 * En la página, el tramo se marca con dos marcadores arrastrables, como los cortes de un cruce.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const P = isNode ? require('./perm-utils.js') : root.GAX.permUtils;

  function inversionMutation(parent, a, b) {
    const err = P.validateParent(parent);
    if (err) throw new Error(err);
    const n = parent.length;
    if (!P.validSegment(n, a, b)) throw new Error('errMarks');
    const order = P.range(0, n);
    for (let k = a; k < b; k++) order[k] = a + b - 1 - k;
    const child = order.map((k) => parent[k]);
    const seg = P.range(a, b);
    const T = M.newTrace(n);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    T.snap({ type: 'copy', text: { key: 'copy' }, fly: T.copyAll(parent) });
    T.snap({ type: 'pick', text: { key: 'pick', params: { a: a + 1, b, list: parent.slice(a, b).join(', ') } }, highlight: { p: seg, c: seg } });
    const fly = P.rearrange(T, parent, order);
    T.snap({ type: 'reverse', text: { key: 'reverse', params: { list: child.slice(a, b).join(', ') } }, highlight: { c: seg }, fly });
    const st = P.stats(parent, child);
    T.snap({
      type: 'done',
      text: {
        key: st.edgesKept === n ? 'doneSame' : 'done',
        params: { n, posKept: st.posKept, edgesKept: st.edgesKept, broken: n - st.edgesKept, newEdges: st.newEdges.join(', ') },
      },
      highlight: { c: seg },
    });
    return { child, steps: T.steps, mutated: M.diffPositions(parent, child) };
  }

  const spec = {
    id: 'inversion',
    representation: 'permutation',
    marks: { type: 'gap', count: 2 },
    aux: null,
    legend: ['copy', 'moved', 'segment'],
    run: (parent, marks) => inversionMutation(parent, marks[0], marks[1]),
  };

  const api = { inversionMutation, validateParent: P.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).inversion = api;
})(typeof self !== 'undefined' ? self : this);
