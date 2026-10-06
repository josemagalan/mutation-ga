/*
 * Contenido docente del contraejemplo: reinicio aleatorio aplicado a una permutación.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Este contraejemplo muestra por qué las permutaciones necesitan mutaciones propias. Se aplica a una permutación la mutación de reinicio aleatorio de la representación entera: cada posición, con probabilidad pm, toma un valor cualquiera entre 1 y n, sin mirar qué hay en las demás.',
      'El resultado casi nunca es una permutación: el valor nuevo suele estar ya en otra posición, así que aparece repetido, y el que había desaparece. En una ruta del viajante significaría visitar una ciudad dos veces y no pasar nunca por otra; en un problema de secuenciación, programar dos veces una tarea y olvidar otra.',
      'Talbi (2009) llama validez a esta propiedad: la mutación debe producir soluciones del espacio de búsqueda. Se podría reparar el mutante después, o castigarlo en la función de evaluación, pero lo natural es usar mutaciones que solo recoloquen genes y nunca cambien sus valores: intercambio, inserción, inversión y mezcla.',
      'La misma lección aparece con el cruce: el cruce en un punto de las cadenas binarias también produce genes repetidos si se aplica a permutaciones.',
    ],
    en: [
      'This counterexample shows why permutations need their own mutations. The random-resetting mutation of integer representations is applied to a permutation: each position, with probability pm, takes any value between 1 and n, without looking at the other positions.',
      'The result is almost never a permutation: the new value is usually already at another position, so it appears twice, and the one that was there disappears. In a travelling-salesman route it would mean visiting one city twice and never another; in a sequencing problem, scheduling one job twice and forgetting another.',
      'Talbi (2009) calls this property validity: mutation must produce solutions of the search space. The mutant could be repaired afterwards, or penalised in the evaluation function, but the natural choice is mutations that only move genes and never change their values: swap, insertion, inversion and scramble.',
      'The same lesson appears with crossover: one-point crossover for binary strings also produces repeated genes when applied to permutations.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una permutación de {n} genes, y le aplicamos la mutación de reinicio aleatorio de la representación entera: cada posición, con probabilidad pm = {pm}, toma un valor cualquiera entre 1 y n.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r entre 0 y 1. Si r < pm, se sortea otro número s y el gen pasa a valer 1 + ⌊s · {n}⌋, sin mirar los demás genes.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawNew: 'Posición {pos}: r = {r} < pm = {pm}. Valor nuevo: s = {s}, 1 + ⌊{s} · {n}⌋ = {v}. Cambia: {a} → {v}.',
      drawDup: 'Posición {pos}: r = {r} < pm = {pm}. Valor nuevo: s = {s}, 1 + ⌊{s} · {n}⌋ = {v}. Cambia: {a} → {v}, pero el {v} ya estaba en el mutante: ahora está repetido.',
      drawSame: 'Posición {pos}: r = {r} < pm = {pm}. Valor nuevo: s = {s}, 1 + ⌊{s} · {n}⌋ = {v}, el mismo que había: el gen no cambia.',
      doneInvalid: 'Resultado: el mutante no es una permutación: tiene genes repetidos ({reps}) y otros que faltan ({missing}). En una ruta del viajante se visitarían dos veces unas ciudades y nunca otras. Por eso la mutación de una permutación no puede cambiar valores: tiene que recolocarlos.',
      doneValid: 'Resultado: esta vez, por casualidad, el mutante sigue siendo una permutación, pero nada lo garantiza. Prueba con «Sortear de nuevo»: lo normal es que aparezcan genes repetidos.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre. Prueba con «Sortear de nuevo» o sube pm.',
    },
    en: {
      intro: 'We start from a parent, a permutation of {n} genes, and apply the random-resetting mutation of integer representations: each position, with probability pm = {pm}, takes any value between 1 and n.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn between 0 and 1. If r < pm, another number s is drawn and the gene becomes 1 + ⌊s · {n}⌋, without looking at the other genes.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawNew: 'Position {pos}: r = {r} < pm = {pm}. New value: s = {s}, 1 + ⌊{s} · {n}⌋ = {v}. It changes: {a} → {v}.',
      drawDup: 'Position {pos}: r = {r} < pm = {pm}. New value: s = {s}, 1 + ⌊{s} · {n}⌋ = {v}. It changes: {a} → {v}, but {v} was already in the mutant: it is now repeated.',
      drawSame: 'Position {pos}: r = {r} < pm = {pm}. New value: s = {s}, 1 + ⌊{s} · {n}⌋ = {v}, the same as before: the gene does not change.',
      doneInvalid: 'Result: the mutant is not a permutation: some genes are repeated ({reps}) and others are missing ({missing}). In a travelling-salesman route some cities would be visited twice and others never. That is why mutating a permutation cannot change values: it has to move them.',
      doneValid: 'Result: this time, by chance, the mutant is still a permutation, but nothing guarantees it. Try “Draw again”: repeated genes are the usual outcome.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent. Try “Draw again” or raise pm.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'REINICIO_ALEATORIO(P, pm)        // pensado para enteros' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'mutate', indent: 3, text: 'sortear s en [0, 1);  M[i] ← 1 + ⌊s · n⌋        // ¡no mira los demás genes!' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'RANDOM_RESETTING(P, pm)        // meant for integers' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
      { id: 'test', indent: 2, text: 'if r < pm:' },
      { id: 'mutate', indent: 3, text: 'draw s in [0, 1);  M[i] ← 1 + ⌊s · n⌋        // ignores the other genes!' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['sortear', 'para cada', 'si', 'devolver'], en: ['draw', 'for each', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'], copy: ['copy'], drawIntro: ['forPos', 'draw', 'test'], drawKeep: ['draw', 'test'], drawHit: ['test', 'mutate'], done: ['return'],
  };
  const fnName = { python: 'random_resetting', javascript: 'randomResetting' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'random_resetting_perm.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def random_resetting(parent, pm=None, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:
            mutant[i] = 1 + int(rng.random() * n)  # {{reset}}
    return mutant


def is_permutation(chromosome):
    """{{doc2}}"""
    n = len(chromosome)
    return sorted(chromosome) == list(range(1, n + 1))


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.9, 0.12, 0.05, 0.8, 0.7, 0.6, 0.95, 0.4, 0.33])

    class Fixed:
        def random(self):
            return next(draws)

    m = random_resetting([3, 7, 5, 1, 6, 8, 2, 4], 0.25, Fixed())
    print(m, is_permutation(m))  # [3, 1, 5, 1, 6, 8, 2, 4] False
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'random-resetting-perm.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function randomResetting(parent, pm, rng = Math.random) {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) mutant[i] = 1 + Math.floor(rng() * n); // {{reset}}
  }
  return mutant;
}

/** {{doc2}} */
function isPermutation(chromosome) {
  const n = chromosome.length;
  return chromosome.slice().sort((a, b) => a - b).every((g, i) => g === i + 1);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { randomResetting, isPermutation };
  if (require.main === module) {
    // {{example}}
    const draws = [0.9, 0.12, 0.05, 0.8, 0.7, 0.6, 0.95, 0.4, 0.33];
    let k = 0;
    const m = randomResetting([3, 7, 5, 1, 6, 8, 2, 4], 0.25, () => draws[k++]);
    console.log(m, isPermutation(m)); // [3, 1, 5, 1, 6, 8, 2, 4] false
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Contraejemplo: mutación de reinicio aleatorio (para enteros) aplicada a una permutación.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. y Smith, J. E. (2015).',
      doc1: 'Cada posición, con probabilidad pm, toma un valor al azar entre 1 y n. Con una permutación, el resultado suele tener genes repetidos. rng es cualquier objeto con un método random() en [0, 1).',
      doc2: 'True si el cromosoma contiene 1..n exactamente una vez.',
      reset: 'valor al azar, sin mirar los demás genes',
      example: 'Ejemplo con números aleatorios fijados: la 2.ª posición pasa a valer 1, que ya estaba en la 4.ª',
    },
    en: {
      title: 'Counterexample: random-resetting mutation (for integers) applied to a permutation.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. & Smith, J. E. (2015).',
      doc1: 'Each position, with probability pm, takes a random value between 1 and n. With a permutation, the result usually has repeated genes. rng is any object with a random() method in [0, 1).',
      doc2: 'True if the chromosome contains 1..n exactly once.',
      reset: 'random value, ignoring the other genes',
      example: 'Example with fixed random numbers: the 2nd position becomes 1, which was already at the 4th',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Entre las propiedades de la mutación (apartado 3.3.2.2) exige la validez: el mutante debe pertenecer al espacio de búsqueda, que aquí es el de las permutaciones.',
      en: 'The course’s reference textbook. Among the properties of mutation (section 3.3.2.2) it requires validity: the mutant must belong to the search space, here that of permutations.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la representación de las soluciones y su mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers solution representation and mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Presenta el reinicio aleatorio para enteros (apartado 4.3.1) y explica, al empezar con las permutaciones (apartado 4.5), que en ellas no se pueden cambiar los valores de los genes por separado.',
      en: 'Evolutionary computing textbook. Presents random resetting for integers (section 4.3.1) and explains, when introducing permutations (section 4.5), that their gene values cannot be changed independently.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'reset-perm', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['reset-perm'] = api;
})(typeof self !== 'undefined' ? self : this);
