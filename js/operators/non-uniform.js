/*
 * Mutación no uniforme de Michalewicz para representación real. Si r < pm, se sortea el
 * sentido con τ (hacia arriba si τ < 0,5) y el gen se mueve una parte del hueco y que le queda
 * hasta el límite en ese sentido:
 *     Δ(t, y) = y · (1 − u^((1 − t/T)^b))
 *     v' = v + Δ(t, U − v)  (hacia arriba)      v' = v − Δ(t, v − L)  (hacia abajo)
 * con t/T el avance de la búsqueda (generación actual / número máximo) y b la rapidez con que
 * se estrecha el salto. Al principio (t/T = 0) el salto es uniforme en todo el hueco; al final
 * (t/T → 1) se hace cada vez más pequeño. Nunca se sale del intervalo.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const U = isNode ? require('./real-utils.js') : root.GAX.realUtils;

  function nonUniform(parent, pm, g, b, opts) {
    if (!(g >= 0 && g < 1) || !(b > 0)) throw new Error('errParam');
    const e = Math.pow(1 - g, b);
    return U.realTrace(parent, pm, opts, {
      extra: 2,
      introParams: { g, b },
      drawIntroParams: { g, b, e },
      apply: (v, [tau, u]) => {
        const up = tau < 0.5;
        const y = up ? U.HIGH - v : v - U.LOW;
        const delta = y * (1 - Math.pow(u, e));
        return { v: up ? v + delta : v - delta, key: up ? 'drawUp' : 'drawDown', params: { tau, u, y, delta, e } };
      },
    });
  }

  const spec = {
    id: 'non-uniform',
    representation: 'real',
    marks: null,
    aux: 'real',
    drawNames: ['τ', 'u'],   // nombres de los números de la perturbación (modo práctica)
    legend: ['copy', 'mutated', 'drawHit', 'dist'],
    params: [
      { id: 'pm', type: 'float', min: 0.01, max: 0.5, step: 0.01, default: 0.25 },
      { id: 'g', type: 'float', min: 0, max: 0.95, step: 0.05, default: 0.5 },
      { id: 'b', type: 'float', min: 1, max: 10, step: 1, default: 5 },
    ],
    random: true,
    run: (parent, marks, opts) => {
      const p = (opts && opts.params) || {};
      return nonUniform(parent, typeof p.pm === 'number' ? p.pm : 0.25, typeof p.g === 'number' ? p.g : 0.5, typeof p.b === 'number' ? p.b : 5,
        { seed: opts && opts.seed, draws: opts && opts.draws, light: opts && opts.light });
    },
  };

  const api = { nonUniform, validateParent: U.validateParent, spec };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).operators = root.GAX.operators || {})['non-uniform'] = api;
})(typeof self !== 'undefined' ? self : this);
