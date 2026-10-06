/*
 * Utilidades de la representación entera: cada gen es un entero del rango [LOW, HIGH].
 * Para que los ejemplos se lean bien en clase, el rango es fijo: de 0 a 9.
 */
(function (root) {
  'use strict';

  const LOW = 0;
  const HIGH = 9;

  /** null si p es un vector de enteros del rango (5 <= n <= 12), o una clave de error. */
  function validateParent(p) {
    if (!Array.isArray(p)) return 'errFormat';
    const n = p.length;
    if (n < 5 || n > 12) return 'errRange';
    if (!p.every((v) => Number.isInteger(v) && v >= LOW && v <= HIGH)) return 'errInt';
    return null;
  }

  function randomInts(rng, n) {
    return Array.from({ length: n }, () => LOW + Math.floor(rng() * (HIGH - LOW + 1)));
  }

  /** Escribe un salto con signo: +2, −1 (con el signo menos tipográfico). */
  const signed = (d) => (d > 0 ? `+${d}` : `−${-d}`);

  const api = { LOW, HIGH, validateParent, randomInts, signed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).intUtils = api;
})(typeof self !== 'undefined' ? self : this);
