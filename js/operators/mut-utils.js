/*
 * Motor común de las trazas de mutación: un padre y un mutante que se construye paso a paso.
 *
 * Cada operador devuelve { child, steps, draws?, aux?, mutated } donde cada paso (snapshot) lleva:
 *   child        genes del mutante en ese momento ({ v, kind } o null si aún no se ha copiado)
 *                kind: 'copy' (igual que en el padre), 'mutated' (valor nuevo), 'moved' (recolocado)
 *   text         { key, params } de la narración
 *   highlight    { p: [...], c: [...] } posiciones resaltadas en el padre y en el mutante
 *   fly          [{ from: [fila, pos], to: [fila, pos] }] genes que «vuelan» en la animación
 *   flip         posiciones del mutante cuyo valor cambia en este paso (animación de giro)
 *   auxVisible   si se ve el panel auxiliar del operador; revealed: casillas del panel ya reveladas
 *   auxActive    casillas del panel resaltadas en este paso
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../rng.js') : root.GAX.rng;

  function newTrace(n) {
    const child = Array(n).fill(null);
    const steps = [];
    const st = { auxVisible: false, revealed: [] };
    function snap(step) {
      steps.push(Object.assign({
        child: child.map((g) => (g ? Object.assign({}, g) : null)),
        auxVisible: st.auxVisible,
        revealed: st.revealed.slice(),
        auxActive: [],
        highlight: {},
        conflict: {},
        fly: [],
        flip: [],
      }, step));
    }
    /** El mutante empieza como copia del padre: todos los genes vuelan del padre al mutante. */
    function copyAll(parent) {
      parent.forEach((v, i) => { child[i] = { v, kind: 'copy' }; });
      return parent.map((_, i) => ({ from: ['p', i], to: ['c', i] }));
    }
    return { child, steps, st, snap, copyAll };
  }

  /**
   * Fuente de números aleatorios de un operador. Con opts.draws (lista) los devuelve en orden
   * (tests y modo práctica); si no, los saca de mulberry32(opts.seed) y los redondea hacia abajo a
   * `decimals` cifras (2 para las decisiones r < pm, 4 para las perturbaciones), para que la
   * narración y el modo práctica puedan mostrar exactamente el número usado. decimals = 0: sin
   * redondear. next(d) permite otra precisión para un número concreto.
   * `used` guarda, en orden, todos los números consumidos.
   */
  function drawSource(opts, decimals) {
    opts = opts || {};
    const given = Array.isArray(opts.draws) ? opts.draws : null;
    const rand = R.mulberry32((opts.seed >>> 0) || 1);
    const used = [];
    const base = decimals === true ? 2 : (decimals || 0);
    let k = 0;
    function next(d) {
      let v;
      if (given) {
        if (k >= given.length) throw new Error('errDraws');
        v = given[k++];
      } else {
        const dd = d == null ? base : d;
        const f = Math.pow(10, dd);
        v = dd ? Math.floor(rand() * f) / f : rand();
      }
      used.push(v);
      return v;
    }
    return { next, used, rand };
  }

  /** Posiciones (base 0) en que dos cromosomas difieren. */
  function diffPositions(a, b) {
    const out = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i);
    return out;
  }

  const api = { newTrace, drawSource, diffPositions, R };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).mutUtils = api;
})(typeof self !== 'undefined' ? self : this);
