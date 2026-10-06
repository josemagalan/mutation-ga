/*
 * Utilidades de la representación permutacional: validación, recolocación de genes en la traza
 * y qué conserva el mutante del padre (posiciones y adyacencias).
 */
(function (root) {
  'use strict';

  /** null si p es una permutación de 1..n (5 <= n <= 12), o una clave de error. */
  function validateParent(p) {
    if (!Array.isArray(p)) return 'errFormat';
    const n = p.length;
    if (n < 5 || n > 12) return 'errRange';
    if (p.some((v) => !Number.isInteger(v)) || new Set(p).size !== n || !p.every((v) => v >= 1 && v <= n)) return 'errPerm';
    return null;
  }

  /** Dos posiciones de gen distintas (0 <= i, j < n). */
  function validPair(n, i, j) {
    return Number.isInteger(i) && Number.isInteger(j) && i >= 0 && j >= 0 && i < n && j < n && i !== j;
  }

  /** Tramo [a, b) con al menos dos genes. */
  function validSegment(n, a, b) {
    return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b <= n && b - a >= 2;
  }

  // Aristas sin sentido, leyendo el cromosoma como una ruta circular (el último gen es vecino del primero).
  const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  function edges(p) {
    const out = [];
    for (let i = 0; i < p.length; i++) out.push(edgeKey(p[i], p[(i + 1) % p.length]));
    return out;
  }

  /**
   * Qué conserva el mutante del padre:
   *  posKept:   genes en la misma posición
   *  edgesKept: adyacencias (aristas de la ruta circular) del mutante que ya estaban en el padre
   *  newEdges:  las que no estaban, como «a–b»
   */
  function stats(parent, child) {
    const n = parent.length;
    const pe = new Set(edges(parent));
    const ce = edges(child);
    const fresh = ce.filter((e) => !pe.has(e));
    return {
      n,
      posKept: parent.filter((g, i) => g === child[i]).length,
      edgesKept: n - fresh.length,
      newEdges: fresh.map((e) => e.replace('-', '–')),
    };
  }

  /**
   * Recoloca los genes del mutante en la traza: el gen que estaba en la posición src[k] pasa a la k.
   * Marca como 'moved' los genes que ya no están en la posición que tenían en el padre y devuelve
   * los vuelos (dentro de la fila del mutante) para la animación.
   */
  function rearrange(T, parent, src) {
    const before = T.child.map((g) => (g ? Object.assign({}, g) : null));
    const fly = [];
    src.forEach((from, k) => {
      const v = before[from].v;
      T.child[k] = { v, kind: v === parent[k] ? 'copy' : 'moved' };
      if (from !== k) fly.push({ from: ['c', from], to: ['c', k] });
    });
    return fly;
  }

  function range(a, b) {
    const r = [];
    for (let i = a; i < b; i++) r.push(i);
    return r;
  }

  const api = { validateParent, validPair, validSegment, edges, stats, rearrange, range };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).permUtils = api;
})(typeof self !== 'undefined' ? self : this);
