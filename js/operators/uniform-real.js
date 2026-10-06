/*
 * Mutación uniforme para representación real: si r < pm, el gen se sustituye por un valor
 * sorteado uniformemente en todo su intervalo [L, U]: v' = L + u·(U − L).
 * No depende del valor que tenía: es el equivalente real del reinicio aleatorio.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;

  function uniformReal(parent, pm, opts) {
    const w = U.HIGH - U.LOW;
    return U.realTrace(parent, pm, opts, {
      extra: 1,
      drawIntroParams: { lo: U.LOW, w },
      apply: (v, [u]) => ({ v: U.LOW + u * w, key: 'drawNew', params: { u, lo: U.LOW, w } }),
    });
  }

  const spec = {
    id: 'uniform-real',
    representation: 'real',
    marks: null,
    aux: 'real',
    drawNames: ['u'],   // nombres de los números de la perturbación (modo práctica)
    legend: ['copy', 'mutated', 'drawHit', 'dist'],
    params: [{ id: 'pm', type: 'float', min: 0.01, max: 0.5, step: 0.01, default: 0.25 }],
    random: true,
    run: (parent, marks, opts) => {
      const pm = opts && opts.params && opts.params.pm;
      return uniformReal(parent, typeof pm === 'number' ? pm : 0.25, { seed: opts && opts.seed, draws: opts && opts.draws, light: opts && opts.light });
    },
  };

  const api = { uniformReal, validateParent: U.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['uniform-real'] = api;
})(typeof self !== 'undefined' ? self : this);
