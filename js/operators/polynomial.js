/*
 * Mutación polinómica de Deb y Goyal para representación real (versión básica). Si r < pm,
 * con un número u:
 *     δ = (2u)^(1/(η+1)) − 1          si u < 0,5
 *     δ = 1 − (2(1 − u))^(1/(η+1))    si u ≥ 0,5
 *     v' = v + δ·(U − L),  recortado a [L, U]
 * δ está en (−1, 1) y se concentra cerca de 0 tanto más cuanto mayor es el índice de
 * distribución η: con η grande los mutantes son muy parecidos al padre.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;

  function polynomial(parent, pm, eta, opts) {
    if (!(eta >= 0)) throw new Error('errParam');
    const w = U.HIGH - U.LOW;
    const ex = 1 / (eta + 1);
    return U.realTrace(parent, pm, opts, {
      extra: 1,
      introParams: { eta },
      drawIntroParams: { eta, w },
      apply: (v, [u]) => {
        const delta = u < 0.5 ? Math.pow(2 * u, ex) - 1 : 1 - Math.pow(2 * (1 - u), ex);
        const raw = v + delta * w;
        const out = U.clamp(raw);
        return { v: out, key: out === raw ? 'drawPoly' : 'drawPolyClamp', params: { u, delta, raw, eta, w, low: u < 0.5 } };
      },
    });
  }

  const spec = {
    id: 'polynomial',
    representation: 'real',
    marks: null,
    aux: 'real',
    drawNames: ['u'],   // nombres de los números de la perturbación (modo práctica)
    legend: ['copy', 'mutated', 'drawHit', 'dist'],
    params: [
      { id: 'pm', type: 'float', min: 0.01, max: 0.5, step: 0.01, default: 0.25 },
      { id: 'eta', type: 'float', min: 1, max: 100, step: 1, default: 20 },
    ],
    random: true,
    run: (parent, marks, opts) => {
      const p = (opts && opts.params) || {};
      return polynomial(parent, typeof p.pm === 'number' ? p.pm : 0.25, typeof p.eta === 'number' ? p.eta : 20,
        { seed: opts && opts.seed, draws: opts && opts.draws, light: opts && opts.light });
    },
  };

  const api = { polynomial, validateParent: U.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).polynomial = api;
})(typeof self !== 'undefined' ? self : this);
