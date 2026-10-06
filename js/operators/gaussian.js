/*
 * Mutación gaussiana para representación real: si r < pm, al gen se le suma un ruido normal
 * de media 0 y desviación típica σ, v' = v + σ·z, y el resultado se recorta a [L, U].
 * z ~ N(0, 1) se obtiene con la transformación de Box-Muller a partir de dos números u1, u2:
 *     z = √(−2·ln(1 − u1)) · cos(2π·u2)
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;

  function gaussian(parent, pm, sigma, opts) {
    if (!(sigma > 0)) throw new Error('errParam');
    return U.realTrace(parent, pm, opts, {
      extra: 2,
      introParams: { sigma },
      drawIntroParams: { sigma },
      apply: (v, [u1, u2]) => {
        const z = Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2);
        const raw = v + sigma * z;
        const out = U.clamp(raw);
        return { v: out, key: out === raw ? 'drawGauss' : 'drawGaussClamp', params: { z, sigma, raw } };
      },
    });
  }

  const spec = {
    id: 'gaussian',
    representation: 'real',
    marks: null,
    aux: 'real',
    drawNames: ['u1', 'u2'],   // nombres de los números de la perturbación (modo práctica)
    legend: ['copy', 'mutated', 'drawHit', 'dist'],
    params: [
      { id: 'pm', type: 'float', min: 0.01, max: 0.5, step: 0.01, default: 0.25 },
      { id: 'sigma', type: 'float', min: 0.1, max: 3, step: 0.1, default: 1 },
    ],
    random: true,
    run: (parent, marks, opts) => {
      const p = (opts && opts.params) || {};
      return gaussian(parent, typeof p.pm === 'number' ? p.pm : 0.25, typeof p.sigma === 'number' ? p.sigma : 1,
        { seed: opts && opts.seed, draws: opts && opts.draws, light: opts && opts.light });
    },
  };

  const api = { gaussian, validateParent: U.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {}).gaussian = api;
})(typeof self !== 'undefined' ? self : this);
