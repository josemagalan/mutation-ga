/*
 * Contenido docente de la mutación de un bit (representación binaria).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación de un bit elige una sola posición al azar, con la misma probabilidad para todas, e invierte ese bit. El mutante difiere siempre del padre en exactamente un gen: la distancia de Hamming entre los dos es 1.',
      'Es el movimiento elemental de la búsqueda local en espacios binarios: los mutantes posibles de una cadena son sus n vecinas a distancia 1. Con esta mutación, un algoritmo que acepta el mutante si no empeora es la búsqueda local aleatoria (RLS, randomized local search) de la teoría de los algoritmos evolutivos.',
      'Comparada con la inversión de bits con pm = 1/n, que en promedio también cambia un bit, aquí no hay mutantes idénticos al padre ni saltos de varios bits: el cambio es siempre el mínimo posible. Eso la hace más eficiente cuando basta con pasos pequeños, pero la deja atrapada en los óptimos locales de los que solo se sale cambiando varios bits a la vez (Droste, Jansen y Wegener, 2002).',
      'Con las propiedades que pide Talbi (2009), es la mutación más local posible (un solo cambio), es válida y es ergódica: encadenando mutaciones de un bit se llega a cualquier cadena.',
      'Coste: un sorteo y un cambio, en tiempo O(1), además de la copia del padre, O(n).',
    ],
    en: [
      'Single-bit mutation chooses just one position at random, with the same probability for all, and flips that bit. The mutant always differs from the parent in exactly one gene: the Hamming distance between them is 1.',
      'It is the elementary move of local search in binary spaces: the possible mutants of a string are its n neighbours at distance 1. With this mutation, an algorithm that accepts the mutant whenever it is no worse is randomized local search (RLS) in the theory of evolutionary algorithms.',
      'Compared with bit-flip mutation with pm = 1/n, which also changes one bit on average, here there are no mutants identical to the parent and no multi-bit jumps: the change is always the smallest possible. That makes it more efficient when small steps are enough, but leaves it stuck in local optima that can only be escaped by changing several bits at once (Droste, Jansen & Wegener, 2002).',
      'In terms of Talbi’s (2009) properties, it is the most local mutation possible (a single change), it is valid and it is ergodic: chaining single-bit mutations, any string can be reached.',
      'Cost: one draw and one change, in O(1) time, plus copying the parent, O(n).',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una cadena de {n} bits.',
      copy: 'El mutante empieza siendo una copia del padre.',
      pick: 'Se elige una posición al azar, cada una con probabilidad 1/{n}: la posición {pos}.',
      flip: 'Se invierte el bit de la posición {pos}: {a} → {b}.',
      done: 'Resultado: el mutante solo difiere del padre en la posición {pos}. La distancia de Hamming es siempre 1.',
    },
    en: {
      intro: 'We start from a parent, a string of {n} bits.',
      copy: 'The mutant starts as a copy of the parent.',
      pick: 'A position is chosen at random, each with probability 1/{n}: position {pos}.',
      flip: 'The bit at position {pos} is flipped: {a} → {b}.',
      done: 'Result: the mutant only differs from the parent at position {pos}. The Hamming distance is always 1.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_DE_UN_BIT(P)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'pick', indent: 1, text: 'elegir una posición k al azar entre las n' },
      { id: 'flip', indent: 1, text: 'M[k] ← 1 − M[k]' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'SINGLE_BIT_MUTATION(P)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'pick', indent: 1, text: 'choose a position k at random among the n' },
      { id: 'flip', indent: 1, text: 'M[k] ← 1 − M[k]' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['elegir', 'devolver'], en: ['choose', 'return'] };
  const stepLines = { intro: ['sig'], copy: ['copy'], pick: ['pick'], flip: ['flip'], done: ['return'] };
  const fnName = { python: 'one_bit', javascript: 'oneBit' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'one_bit.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def one_bit(parent, k=None, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if k is None:
        k = rng.randrange(n)
    mutant = list(parent)
    mutant[k] = 1 - mutant[k]  # {{flip}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    p = [1, 1, 0, 0, 1, 0, 0, 1]
    print(one_bit(p, 3))  # [1, 1, 0, 1, 1, 0, 0, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'one-bit.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function oneBit(parent, k) {
  const n = parent.length;
  if (k === undefined) k = Math.floor(Math.random() * n);
  const mutant = parent.slice();
  mutant[k] = 1 - mutant[k]; // {{flip}}
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { oneBit };
  if (require.main === module) {
    // {{example}}
    console.log(oneBit([1, 1, 0, 0, 1, 0, 0, 1], 3)); // [1, 1, 0, 1, 1, 0, 0, 1]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación de un bit para representación binaria.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Droste, S., Jansen, T. y Wegener, I. (2002).',
      doc1: 'Mutante que invierte solo el bit de la posición k (0 <= k < n, contando desde 0). Si se omite k, se elige al azar.',
      flip: 'solo cambia este bit: distancia de Hamming 1',
      example: 'Ejemplo: se invierte el 4.º bit (k = 3 contando desde 0)',
    },
    en: {
      title: 'Single-bit mutation for binary representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Droste, S., Jansen, T. & Wegener, I. (2002).',
      doc1: 'Mutant that flips only the bit at position k (0 <= k < n, counting from 0). If k is omitted, it is chosen at random.',
      flip: 'only this bit changes: Hamming distance 1',
      example: 'Example: the 4th bit is flipped (k = 3 counting from 0)',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Relaciona la mutación de los algoritmos evolutivos (apartado 3.3.2.2, propiedad de localidad) con los vecindarios de la búsqueda local: en binario, las soluciones a distancia de Hamming 1, que son exactamente los mutantes posibles de este operador.',
      en: 'The course’s reference textbook. Relates mutation in evolutionary algorithms (section 3.3.2.2, locality property) to local-search neighbourhoods: in binary, the solutions at Hamming distance 1, which are exactly this operator’s possible mutants.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación en el capítulo 8 (algoritmos genéticos) y los vecindarios en los capítulos de búsqueda local.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers mutation in chapter 8 (genetic algorithms) and neighbourhoods in the local-search chapters.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.2.1 presenta la mutación de la representación binaria, que esta variante restringe a un solo bit.',
      en: 'Evolutionary computing textbook. Section 4.2.1 presents mutation for binary representations, which this variant restricts to a single bit.',
    }),
    C.ref('droste', {
      es: 'Compara el algoritmo (1+1) con mutación de todos los bits (pm = 1/n) frente a cambiar un solo bit, y muestra funciones en las que cambiar un solo bit no basta para salir de un óptimo local.',
      en: 'Compares the (1+1) algorithm with all-bit mutation (pm = 1/n) against flipping a single bit, and shows functions where flipping a single bit is not enough to escape a local optimum.',
    }),
    C.ref('luke', {
      es: 'Relaciona la mutación con los vecindarios de la búsqueda local: cambiar un bit es el ajuste mínimo (tweak) de una solución binaria.',
      en: 'Relates mutation to local-search neighbourhoods: flipping one bit is the minimal tweak of a binary solution.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'one-bit', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['one-bit'] = api;
})(typeof self !== 'undefined' ? self : this);
