/*
 * Contenido docente de la mutación por intercambio (representación permutacional).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación por intercambio (swap) elige dos posiciones al azar e intercambia sus genes. Es la mutación más sencilla para permutaciones: no cambia ningún valor, solo recoloca dos, así que el mutante sigue siendo una permutación válida, sin repetidos ni ausencias.',
      'Con las propiedades que pide Talbi (2009), es válida, es ergódica (encadenando intercambios se llega a cualquier ordenación) y es bastante local: el resto de los genes conserva su posición. Pero no es tan local para todos los problemas. Si lo que importa es quién va al lado de quién, como en una ruta del viajante, un intercambio rompe hasta cuatro adyacencias: las dos de cada gen movido.',
      'Por eso conviene pensar qué información codifica la permutación. En problemas de asignación, donde importa la posición absoluta de cada elemento, el intercambio es una buena mutación. En los de secuenciación, donde importa el orden relativo, suele preferirse la inserción, y en los de rutas, donde importan las adyacencias, la inversión.',
      'Coste: dos sorteos y un intercambio, en tiempo O(1), además de la copia del padre, O(n).',
    ],
    en: [
      'Swap mutation chooses two positions at random and swaps their genes. It is the simplest mutation for permutations: it changes no value, it only moves two, so the mutant is still a valid permutation, with nothing repeated or missing.',
      'In terms of the properties Talbi (2009) asks of a mutation, it is valid, ergodic (chaining swaps can reach any ordering) and fairly local: every other gene keeps its position. But it is not equally local for every problem. If what matters is who is next to whom, as in a travelling-salesman route, a swap breaks up to four adjacencies: two around each moved gene.',
      'That is why it pays to think about what information the permutation encodes. In assignment problems, where the absolute position of each element matters, swap is a good mutation. In sequencing problems, where relative order matters, insertion is usually preferred, and in routing problems, where adjacencies matter, inversion.',
      'Cost: two draws and one swap, in O(1) time, plus copying the parent, O(n).',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una permutación de {n} genes.',
      copy: 'El mutante empieza siendo una copia del padre.',
      pick: 'Se eligen dos posiciones distintas al azar: i = {i} (gen {gi}) y j = {j} (gen {gj}).',
      swap: 'Los genes de las posiciones {i} y {j} se intercambian: el {gi} pasa a la posición {j} y el {gj}, a la {i}.',
      done: 'Resultado: el mutante sigue siendo una permutación. Conserva {posKept} de las {n} posiciones del padre y, leído como una ruta circular, {edgesKept} de sus {n} adyacencias; las nuevas son {newEdges}.',
    },
    en: {
      intro: 'We start from a parent, a permutation of {n} genes.',
      copy: 'The mutant starts as a copy of the parent.',
      pick: 'Two different positions are chosen at random: i = {i} (gene {gi}) and j = {j} (gene {gj}).',
      swap: 'The genes at positions {i} and {j} are swapped: {gi} moves to position {j} and {gj} to position {i}.',
      done: 'Result: the mutant is still a permutation. It keeps {posKept} of the parent’s {n} positions and, read as a circular route, {edgesKept} of its {n} adjacencies; the new ones are {newEdges}.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POR_INTERCAMBIO(P)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'pick', indent: 1, text: 'elegir al azar dos posiciones distintas i, j' },
      { id: 'swap', indent: 1, text: 'intercambiar M[i] y M[j]' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'SWAP_MUTATION(P)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'pick', indent: 1, text: 'choose two different positions i, j at random' },
      { id: 'swap', indent: 1, text: 'swap M[i] and M[j]' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['elegir', 'intercambiar', 'devolver'], en: ['choose', 'swap', 'return'] };
  const stepLines = { intro: ['sig'], copy: ['copy'], pick: ['pick'], swap: ['swap'], done: ['return'] };
  const fnName = { python: 'swap', javascript: 'swap' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'swap.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def swap(parent, i=None, j=None, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if i is None:
        i, j = rng.sample(range(n), 2)
    mutant = list(parent)
    mutant[i], mutant[j] = mutant[j], mutant[i]  # {{swap}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    p = [3, 7, 5, 1, 6, 8, 2, 4]
    print(swap(p, 1, 5))  # [3, 8, 5, 1, 6, 7, 2, 4]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'swap.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function swap(parent, i, j) {
  const n = parent.length;
  if (i === undefined) {
    i = Math.floor(Math.random() * n);
    do { j = Math.floor(Math.random() * n); } while (j === i);
  }
  const mutant = parent.slice();
  [mutant[i], mutant[j]] = [mutant[j], mutant[i]]; // {{swap}}
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { swap };
  if (require.main === module) {
    // {{example}}
    console.log(swap([3, 7, 5, 1, 6, 8, 2, 4], 1, 5)); // [3, 8, 5, 1, 6, 7, 2, 4]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación por intercambio (swap) para representación permutacional.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Syswerda, G. (1991).',
      doc1: 'Mutante que intercambia los genes de las posiciones i y j (distintas, contando desde 0). Si se omiten, se eligen al azar.',
      swap: 'solo se recolocan dos genes: sigue siendo una permutación',
      example: 'Ejemplo: se intercambian las posiciones 2.ª y 6.ª (i = 1, j = 5 contando desde 0)',
    },
    en: {
      title: 'Swap mutation for permutation representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Syswerda, G. (1991).',
      doc1: 'Mutant that swaps the genes at positions i and j (different, counting from 0). If omitted, they are chosen at random.',
      swap: 'only two genes are moved: it is still a permutation',
      example: 'Example: the 2nd and 6th positions are swapped (i = 1, j = 5 counting from 0)',
    },
  };

  const references = [
    C.ref('syswerda1991', {
      es: 'Propone, para problemas de secuenciación de tareas, la mutación basada en el orden (order-based mutation), que intercambia dos genes elegidos al azar, y la compara con otras.',
      en: 'Proposes, for task-scheduling problems, order-based mutation, which swaps two randomly chosen genes, and compares it with others.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Presenta el intercambio como vecindario de las permutaciones en las metaheurísticas basadas en una solución (capítulo 2) y como mutación en los algoritmos evolutivos (apartado 3.3.2.2), con las propiedades de validez y localidad.',
      en: 'The course’s reference textbook. Presents swap as a permutation neighbourhood in single-solution metaheuristics (chapter 2) and as a mutation in evolutionary algorithms (section 3.3.2.2), with the validity and locality properties.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación de permutaciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers permutation mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.5.1 presenta las cuatro mutaciones clásicas de las permutaciones: intercambio, inserción, mezcla e inversión.',
      en: 'Evolutionary computing textbook. Section 4.5.1 presents the four classic permutation mutations: swap, insert, scramble and inversion.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'swap', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).swap = api;
})(typeof self !== 'undefined' ? self : this);
