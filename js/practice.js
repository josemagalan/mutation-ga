/*
 * Modo «Practicar: predice el mutante»: qué datos hay que dar para que el mutante tenga una única
 * respuesta, y cómo se corrige la predicción.
 *
 * En la mutación todo es azar, así que se dan los números sorteados (exactamente los que usa el
 * operador: dos decimales para las decisiones r < pm y cuatro para las perturbaciones) y las
 * posiciones o el tramo elegidos. Lógica pura, sin DOM: la usan la página y los tests.
 */
(function (root) {
  'use strict';

  /**
   * givens(spec, result, marks) → {
   *   marks: { type, marks } | null           posiciones o tramo elegidos
   *   perPos: [{ pos, r, hit, extra: [..] }]  números de cada posición (operadores con r < pm)
   *   extraNames: ['s'] | ['τ', 'u'] | …      nombres de los números de la perturbación
   *   sequence: [..] | null                   números sorteados en orden (mezcla)
   * }
   */
  function givens(spec, result, marks) {
    const out = { marks: null, perPos: null, extraNames: spec.drawNames || ['s'], sequence: null };
    if (spec.marks) out.marks = { type: spec.marks.type, count: spec.marks.count, names: spec.marks.names || null, marks: marks.slice() };
    const items = result.aux && result.aux.items;
    if (items) {
      out.perPos = items.map((it, i) => ({
        pos: i + 1,
        r: it.r,
        hit: it.hit,
        extra: it.ds ? it.ds.slice() : (it.s != null ? [it.s] : []),
      }));
    } else if (Array.isArray(result.draws) && result.draws.length) {
      out.sequence = result.draws.slice();
    }
    return out;
  }

  /** Lista de números sorteados, en el orden en que los consume el operador, a partir de los datos dados. */
  function drawsFrom(g) {
    if (g.sequence) return g.sequence.slice();
    if (!g.perPos) return [];
    const d = [];
    g.perPos.forEach((p) => { d.push(p.r); if (p.hit) d.push(...p.extra); });
    return d;
  }

  /** Formato de la predicción según la representación (sin exigir que sea un mutante válido). */
  function validateGuess(rep, guess, n) {
    if (!Array.isArray(guess) || guess.length !== n) return 'errLength';
    if (rep === 'binary') return guess.every((v) => v === 0 || v === 1) ? null : 'errBits';
    if (rep === 'integer') return guess.every((v) => Number.isInteger(v) && v >= 0 && v <= 9) ? null : 'errInt';
    if (rep === 'permutation') return guess.every((v) => Number.isInteger(v) && v >= 1 && v <= n) ? null : 'errFormat';
    return guess.every((v) => typeof v === 'number' && Number.isFinite(v)) ? null : 'errFormat';
  }

  const REAL_TOL = 0.05;

  /** Corrección gen a gen: [{ guess, correct, ok }]. En reales se admite un error de ±REAL_TOL. */
  function grade(rep, guess, correct) {
    const close = (a, b) => (rep === 'real' ? Math.abs(a - b) <= REAL_TOL + 1e-9 : a === b);
    return guess.map((v, i) => ({ guess: v, correct: correct[i], ok: close(v, correct[i]) }));
  }

  const api = { givens, drawsFrom, validateGuess, grade, REAL_TOL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).practice = api;
})(typeof self !== 'undefined' ? self : this);
