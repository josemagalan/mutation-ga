/*
 * Contenido docente de la mutación por mezcla (representación permutacional).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación por mezcla (scramble) elige un tramo del cromosoma al azar y reordena sus genes al azar, de modo que todas las ordenaciones del tramo sean igual de probables. Fuera del tramo no cambia nada.',
      'Es la más disruptiva de las cuatro mutaciones clásicas de las permutaciones: dentro del tramo se pierden a la vez las posiciones, el orden relativo y las adyacencias. Con las propiedades de Talbi (2009), sigue siendo válida y ergódica, pero es poco local salvo que el tramo sea corto. El tamaño del tramo controla, por tanto, cuánto cambia el mutante.',
      'Para que todas las ordenaciones sean igual de probables, la mezcla se hace con el algoritmo de Fisher-Yates: se recorre el tramo de atrás adelante y cada gen se intercambia con uno elegido al azar entre él y los anteriores. Un tramo de m genes admite m! ordenaciones, y una de ellas es la original, así que a veces, sobre todo con tramos cortos, el tramo queda igual.',
      'Coste: un sorteo por gen del tramo, en tiempo O(n) como mucho.',
    ],
    en: [
      'Scramble mutation chooses a stretch of the chromosome at random and randomly reorders its genes, so that every ordering of the stretch is equally likely. Nothing changes outside the stretch.',
      'It is the most disruptive of the four classic permutation mutations: inside the stretch, positions, relative order and adjacencies are all lost at once. In terms of Talbi’s (2009) properties it is still valid and ergodic, but it is not very local unless the stretch is short. The size of the stretch therefore controls how much the mutant changes.',
      'For every ordering to be equally likely, the shuffle uses the Fisher-Yates algorithm: the stretch is traversed from back to front and each gene is swapped with one chosen at random among itself and those before it. A stretch of m genes has m! orderings, one of which is the original, so sometimes, especially with short stretches, the stretch stays the same.',
      'Cost: one draw per gene of the stretch, in at most O(n) time.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una permutación de {n} genes.',
      copy: 'El mutante empieza siendo una copia del padre.',
      pick: 'Se elige un tramo al azar: de la posición {a} a la {b}, con {m} genes ({list}).',
      shuffle: 'Los genes del tramo se reordenan al azar, con todas las ordenaciones igual de probables: ahora el tramo es {list}.',
      shuffleSame: 'Los genes del tramo se reordenan al azar y, por casualidad, quedan en el mismo orden ({list}). Prueba con «Sortear de nuevo».',
      done: 'Resultado: el mutante sigue siendo una permutación. Fuera del tramo nada cambia; dentro, el orden se ha perdido. Conserva {posKept} de las {n} posiciones del padre y, leído como una ruta circular, {edgesKept} de sus {n} adyacencias; las nuevas son {newEdges}.',
    },
    en: {
      intro: 'We start from a parent, a permutation of {n} genes.',
      copy: 'The mutant starts as a copy of the parent.',
      pick: 'A stretch is chosen at random: from position {a} to {b}, with {m} genes ({list}).',
      shuffle: 'The genes in the stretch are randomly reordered, with every ordering equally likely: the stretch is now {list}.',
      shuffleSame: 'The genes in the stretch are randomly reordered and, by chance, end up in the same order ({list}). Try “Draw again”.',
      done: 'Result: the mutant is still a permutation. Nothing changes outside the stretch; inside it, the order has been lost. It keeps {posKept} of the parent’s {n} positions and, read as a circular route, {edgesKept} of its {n} adjacencies; the new ones are {newEdges}.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POR_MEZCLA(P)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'pick', indent: 1, text: 'elegir al azar un tramo [a, b) con al menos dos genes' },
      { id: 'forK', indent: 1, text: 'para k desde b − 1 hasta a + 1:        // Fisher-Yates' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1);  t ← a + ⌊r · (k − a + 1)⌋' },
      { id: 'swap', indent: 2, text: 'intercambiar M[k] y M[t]' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'SCRAMBLE_MUTATION(P)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'pick', indent: 1, text: 'choose a stretch [a, b) with at least two genes at random' },
      { id: 'forK', indent: 1, text: 'for k from b − 1 down to a + 1:        // Fisher-Yates' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1);  t ← a + ⌊r · (k − a + 1)⌋' },
      { id: 'swap', indent: 2, text: 'swap M[k] and M[t]' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['elegir', 'para', 'desde', 'hasta', 'sortear', 'intercambiar', 'devolver'], en: ['choose', 'for', 'from', 'down to', 'draw', 'swap', 'return'] };
  const stepLines = { intro: ['sig'], copy: ['copy'], pick: ['pick'], shuffle: ['forK', 'draw', 'swap'], done: ['return'] };
  const fnName = { python: 'scramble', javascript: 'scramble' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'scramble.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def scramble(parent, a=None, b=None, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if a is None:
        a = rng.randrange(n - 1)
        b = rng.randrange(a + 2, n + 1)
    mutant = list(parent)
    stretch = mutant[a:b]
    for k in range(len(stretch) - 1, 0, -1):  # {{fy}}
        t = int(rng.random() * (k + 1))
        stretch[k], stretch[t] = stretch[t], stretch[k]
    mutant[a:b] = stretch
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.72, 0.04, 0.46])

    class Fixed:
        def random(self):
            return next(draws)

    p = [3, 7, 5, 1, 6, 8, 2, 4]
    print(scramble(p, 2, 6, Fixed()))  # [3, 7, 1, 8, 5, 6, 2, 4]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'scramble.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function scramble(parent, a, b, rng = Math.random) {
  const n = parent.length;
  if (a === undefined) {
    a = Math.floor(rng() * (n - 1));
    b = a + 2 + Math.floor(rng() * (n - a - 1));
  }
  const mutant = parent.slice();
  const stretch = mutant.slice(a, b);
  for (let k = stretch.length - 1; k > 0; k--) { // {{fy}}
    const t = Math.floor(rng() * (k + 1));
    [stretch[k], stretch[t]] = [stretch[t], stretch[k]];
  }
  mutant.splice(a, b - a, ...stretch);
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scramble };
  if (require.main === module) {
    // {{example}}
    const draws = [0.72, 0.04, 0.46];
    let k = 0;
    console.log(scramble([3, 7, 5, 1, 6, 8, 2, 4], 2, 6, () => draws[k++])); // [3, 7, 1, 8, 5, 6, 2, 4]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación por mezcla (scramble) para representación permutacional.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. y Smith, J. E. (2015).',
      doc1: 'Mutante con los genes del tramo [a, b) reordenados al azar (contando desde 0, b excluido, b - a >= 2). Si se omiten a y b, el tramo se elige al azar. rng es cualquier objeto con un método random() en [0, 1).',
      fy: 'Fisher-Yates: todas las ordenaciones igual de probables',
      example: 'Ejemplo con números aleatorios fijados: se mezcla el tramo de las posiciones 3.ª a 6.ª',
    },
    en: {
      title: 'Scramble mutation for permutation representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. & Smith, J. E. (2015).',
      doc1: 'Mutant with the genes of the stretch [a, b) randomly reordered (counting from 0, b excluded, b - a >= 2). If a and b are omitted, the stretch is chosen at random. rng is any object with a random() method in [0, 1).',
      fy: 'Fisher-Yates: every ordering equally likely',
      example: 'Example with fixed random numbers: the stretch from the 3rd to the 6th position is scrambled',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. En el apartado 3.3.2.2 presenta las mutaciones de las permutaciones y las propiedades que deben cumplir; la mezcla es la que menos respeta la localidad.',
      en: 'The course’s reference textbook. Section 3.3.2.2 presents permutation mutations and the properties they should meet; scramble is the one that least respects locality.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación de permutaciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers permutation mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.5.1 presenta la mutación por mezcla, que reordena al azar un tramo o, en otra versión, un subconjunto cualquiera de posiciones.',
      en: 'Evolutionary computing textbook. Section 4.5.1 presents scramble mutation, which randomly reorders a stretch or, in another version, any subset of positions.',
    }),
    C.ref('syswerda1991', {
      es: 'Compara mutaciones para problemas de secuenciación de tareas, entre ellas la reordenación aleatoria de una sublista.',
      en: 'Compares mutations for task-scheduling problems, including the random reordering of a sublist.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'scramble', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).scramble = api;
})(typeof self !== 'undefined' ? self : this);
