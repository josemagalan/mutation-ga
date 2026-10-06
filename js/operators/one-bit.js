/*
 * Mutación de un bit para representación binaria: se elige una posición k al azar
 * (uniforme entre las n) y se invierte ese bit. El mutante difiere siempre del padre
 * en exactamente un gen (distancia de Hamming 1).
 * En la página, la posición es un marcador arrastrable; «Posición aleatoria» la sortea.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const M = isNode ? require('./mut-utils.js') : root.GAX.mutUtils;
  const B = isNode ? require('./bin-utils.js') : root.GAX.binUtils;

  function oneBit(parent, k) {
    const err = B.validateParent(parent);
    if (err) throw new Error(err);
    const n = parent.length;
    if (!Number.isInteger(k) || k < 0 || k >= n) throw new Error('errMarks');
    const child = parent.slice();
    child[k] = 1 - parent[k];
    const T = M.newTrace(n);

    T.snap({ type: 'intro', text: { key: 'intro', params: { n } } });
    const fly = T.copyAll(parent);
    T.snap({ type: 'copy', text: { key: 'copy' }, fly });
    T.snap({ type: 'pick', text: { key: 'pick', params: { pos: k + 1, n } }, highlight: { p: [k], c: [k] } });
    T.child[k] = { v: child[k], kind: 'mutated' };
    T.snap({ type: 'flip', text: { key: 'flip', params: { pos: k + 1, a: parent[k], b: child[k] } }, highlight: { p: [k], c: [k] }, flip: [k] });
    T.snap({ type: 'done', text: { key: 'done', params: { pos: k + 1 } }, highlight: { c: [k] } });

    return { child, steps: T.steps, mutated: [k] };
  }

  const spec = {
    id: 'one-bit',
    representation: 'binary',
    marks: { type: 'gene', count: 1 },
    aux: null,
    legend: ['copy', 'mutated', 'mark'],
    run: (parent, marks) => oneBit(parent, marks[0]),
  };

  const api = { oneBit, validateParent: B.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['one-bit'] = api;
})(typeof self !== 'undefined' ? self : this);
