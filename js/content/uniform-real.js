/*
 * Contenido docente de la mutación uniforme (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación uniforme es la más sencilla de la representación real: con probabilidad pm, el gen se sustituye por un valor sorteado uniformemente en todo su intervalo [L, U]. El valor nuevo no depende del que tenía. Es el equivalente real del reinicio aleatorio de los enteros.',
      'Por eso la distribución del valor mutado es plana: en el panel, el histograma es igual de alto en todo el intervalo, esté donde esté el padre. Con las propiedades de Talbi (2009) es válida y muy ergódica, pero nada local: un gen puede saltar de un extremo a otro.',
      'Explora mucho y afina poco. Es útil al principio de la búsqueda o para escapar de óptimos locales, pero cerca del óptimo casi todas sus mutaciones empeoran la solución. Las mutaciones que dependen del valor del padre (gaussiana, polinómica, no uniforme) dan pasos pequeños con más probabilidad y permiten afinar.',
      'Coste: uno o dos sorteos por posición, en tiempo O(n).',
    ],
    en: [
      'Uniform mutation is the simplest one for real-valued representations: with probability pm, the gene is replaced by a value drawn uniformly from its whole interval [L, U]. The new value does not depend on the old one. It is the real-valued counterpart of random resetting for integers.',
      'That is why the distribution of the mutated value is flat: in the panel, the histogram is equally high across the whole interval, wherever the parent is. In terms of Talbi’s (2009) properties it is valid and very ergodic, but not local at all: a gene can jump from one end to the other.',
      'It explores a lot and fine-tunes little. It is useful early in the search or to escape local optima, but near the optimum almost all its mutations make the solution worse. Mutations that depend on the parent’s value (Gaussian, polynomial, non-uniform) take small steps with higher probability and allow fine-tuning.',
      'Cost: one or two draws per position, in O(n) time.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, un vector de {n} reales entre {lo} y {hi}. Cada posición mutará con probabilidad pm = {pm}.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r entre 0 y 1. Si r < pm, se sortea otro número u y el gen pasa a valer {lo} + u · {w}: un valor cualquiera del intervalo, sin tener en cuenta el que tenía. Debajo, la distribución de ese valor: plana.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawNew: 'Posición {pos}: r = {r} < pm = {pm}. Valor nuevo: u = {u}, {lo} + {u} · {w} = {v}. Cambia: {a} → {v}.',
      done: 'Resultado: han cambiado {k} genes (posiciones {list}), con un salto medio de {meanJump}. Como el valor nuevo no depende del anterior, los saltos pueden ser de todo el intervalo.',
      doneOne: 'Resultado: ha cambiado 1 gen (posición {list}), con un salto de {meanJump}. Como el valor nuevo no depende del anterior, el salto puede ser de todo el intervalo.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre.',
    },
    en: {
      intro: 'We start from a parent, a vector of {n} reals between {lo} and {hi}. Each position will mutate with probability pm = {pm}.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn between 0 and 1. If r < pm, another number u is drawn and the gene becomes {lo} + u · {w}: any value in the interval, regardless of the old one. Below, the distribution of that value: flat.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawNew: 'Position {pos}: r = {r} < pm = {pm}. New value: u = {u}, {lo} + {u} · {w} = {v}. It changes: {a} → {v}.',
      done: 'Result: {k} genes have changed (positions {list}), with an average jump of {meanJump}. Since the new value does not depend on the old one, jumps can span the whole interval.',
      doneOne: 'Result: 1 gene has changed (position {list}), with a jump of {meanJump}. Since the new value does not depend on the old one, the jump can span the whole interval.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_UNIFORME(P, pm, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'mutate', indent: 3, text: 'sortear u en [0, 1);  M[i] ← L + u · (U − L)' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'UNIFORM_MUTATION(P, pm, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
      { id: 'test', indent: 2, text: 'if r < pm:' },
      { id: 'mutate', indent: 3, text: 'draw u in [0, 1);  M[i] ← L + u · (U − L)' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['sortear', 'para cada', 'si', 'devolver'], en: ['draw', 'for each', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'], copy: ['copy'], drawIntro: ['forPos', 'draw', 'test'], drawKeep: ['draw', 'test'], drawHit: ['test', 'mutate'], done: ['return'],
  };
  const fnName = { python: 'uniform_mutation', javascript: 'uniformMutation' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'uniform_mutation.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def uniform_mutation(parent, pm=None, low=0.0, high=10.0, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:
            mutant[i] = low + rng.random() * (high - low)  # {{reset}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.9, 0.1, 0.75, 0.6, 0.5, 0.8])

    class Fixed:
        def random(self):
            return next(draws)

    print(uniform_mutation([4.2, 1.7, 8.5, 2.1, 6.0], 0.25, rng=Fixed()))  # [4.2, 7.5, 8.5, 2.1, 6.0]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'uniform-mutation.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function uniformMutation(parent, pm, low = 0, high = 10, rng = Math.random) {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) mutant[i] = low + rng() * (high - low); // {{reset}}
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { uniformMutation };
  if (require.main === module) {
    // {{example}}
    const draws = [0.9, 0.1, 0.75, 0.6, 0.5, 0.8];
    let k = 0;
    console.log(uniformMutation([4.2, 1.7, 8.5, 2.1, 6.0], 0.25, 0, 10, () => draws[k++])); // [4.2, 7.5, 8.5, 2.1, 6]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación uniforme para representación real.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Michalewicz, Z. (1996).',
      doc1: 'Cada posición, con probabilidad pm (por defecto 1/n), toma un valor uniforme en [low, high], sin tener en cuenta el que tenía. rng es cualquier objeto con un método random() en [0, 1).',
      reset: 'cualquier valor del intervalo: no depende del anterior',
      example: 'Ejemplo con números aleatorios fijados: solo muta la 2.ª posición (r = 0,1), con u = 0,75',
    },
    en: {
      title: 'Uniform mutation for real-valued representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Michalewicz, Z. (1996).',
      doc1: 'Each position, with probability pm (1/n by default), takes a uniform value in [low, high], regardless of the old one. rng is any object with a random() method in [0, 1).',
      reset: 'any value in the interval: independent of the old one',
      example: 'Example with fixed random numbers: only the 2nd position mutates (r = 0.1), with u = 0.75',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la mutación de las representaciones reales en el apartado 3.3.2.2, con las propiedades de validez, ergodicidad y localidad, que la mutación uniforme cumple solo en parte (no es local).',
      en: 'The course’s reference textbook. Covers mutation for real-valued representations in section 3.3.2.2, with the validity, ergodicity and locality properties, which uniform mutation only partly meets (it is not local).',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('michalewicz', {
      es: 'Presenta la mutación uniforme para algoritmos genéticos con codificación real junto a la no uniforme, y discute el equilibrio entre explorar y afinar.',
      en: 'Presents uniform mutation for real-coded genetic algorithms alongside non-uniform mutation, and discusses the balance between exploring and fine-tuning.',
    }),
    C.ref('herrera', {
      es: 'Revisión de los operadores de los algoritmos genéticos con codificación real, entre ellos las mutaciones uniforme, no uniforme y gaussiana.',
      en: 'Review of the operators of real-coded genetic algorithms, including uniform, non-uniform and Gaussian mutation.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.4.1 presenta la mutación uniforme de la representación real.',
      en: 'Evolutionary computing textbook. Section 4.4.1 presents uniform mutation for real-valued representations.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'uniform-real', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['uniform-real'] = api;
})(typeof self !== 'undefined' ? self : this);
