/*
 * Utilidades de la representación binaria: validación y generación de padres.
 */
(function (root) {
  'use strict';

  /** null si p es una cadena de bits válida (5 <= n <= 12), o una clave de error. */
  function validateParent(p) {
    if (!Array.isArray(p)) return 'errFormat';
    const n = p.length;
    if (n < 5 || n > 12) return 'errRange';
    if (!p.every((b) => b === 0 || b === 1)) return 'errBits';
    return null;
  }

  function randomBits(rng, n) {
    return Array.from({ length: n }, () => (rng() < 0.5 ? 1 : 0));
  }

  const api = { validateParent, randomBits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).binUtils = api;
})(typeof self !== 'undefined' ? self : this);
