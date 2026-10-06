/*
 * Contenido docente de la mutación por inversión (representación permutacional).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación por inversión elige un tramo del cromosoma al azar e invierte el orden de sus genes. Lo que estaba en el tramo como 5, 1, 6, 8 queda como 8, 6, 1, 5; fuera del tramo no cambia nada.',
      'Es la mutación más local cuando lo que importa son las adyacencias, como en el problema del viajante. Dentro del tramo cada gen sigue teniendo los mismos vecinos, solo que en orden inverso, así que, leído como una ruta circular, el mutante conserva todas las aristas del padre salvo las dos de los extremos del tramo. Es exactamente el movimiento 2-opt de Croes (1958): quitar dos aristas de la ruta y volver a unir los dos trozos en el otro sentido. La vista de rutas permite verlo.',
      'En cambio, desordena mucho las posiciones absolutas: casi todos los genes del tramo cambian de sitio. Y si el tramo abarca todo el cromosoma, o todo menos un gen, la ruta es la misma recorrida al revés: no cambia ninguna arista.',
      'No hay que confundirla con el operador de inversión de Holland (1975), que reordena los locus de una cadena binaria sin cambiar lo que codifica; la mutación por inversión de las permutaciones sí cambia la solución.',
      'Coste: tiempo O(n) como mucho, proporcional a la longitud del tramo.',
    ],
    en: [
      'Inversion mutation chooses a stretch of the chromosome at random and reverses the order of its genes. What was 5, 1, 6, 8 in the stretch becomes 8, 6, 1, 5; nothing changes outside it.',
      'It is the most local mutation when adjacencies are what matter, as in the travelling-salesman problem. Inside the stretch every gene keeps the same neighbours, just in reverse order, so, read as a circular route, the mutant keeps every edge of the parent except the two at the ends of the stretch. It is exactly Croes’s (1958) 2-opt move: remove two edges of the route and reconnect the two pieces the other way round. The route view lets you see it.',
      'On the other hand, it scrambles absolute positions a lot: almost every gene in the stretch changes place. And if the stretch covers the whole chromosome, or all but one gene, the route is the same one travelled backwards: no edge changes.',
      'It should not be confused with Holland’s (1975) inversion operator, which reorders the loci of a binary string without changing what it encodes; permutation inversion mutation does change the solution.',
      'Cost: at most O(n) time, proportional to the length of the stretch.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una permutación de {n} genes.',
      copy: 'El mutante empieza siendo una copia del padre.',
      pick: 'Se elige un tramo al azar: de la posición {a} a la {b} ({list}).',
      reverse: 'Se invierte el orden de los genes del tramo: ahora es {list}.',
      done: 'Resultado: el mutante sigue siendo una permutación. Dentro del tramo los genes siguen siendo vecinos entre sí, en orden inverso; leído como una ruta circular, solo cambian {broken} de las {n} adyacencias, las de los extremos del tramo (nuevas: {newEdges}). Es el movimiento 2-opt del viajante. En cambio, solo {posKept} de las {n} posiciones siguen igual.',
      doneSame: 'Resultado: el tramo cubre todo el cromosoma, o todo menos un gen, así que, leído como una ruta circular, el mutante es la misma ruta recorrida al revés: conserva las {n} adyacencias, aunque solo {posKept} genes siguen en su posición.',
    },
    en: {
      intro: 'We start from a parent, a permutation of {n} genes.',
      copy: 'The mutant starts as a copy of the parent.',
      pick: 'A stretch is chosen at random: from position {a} to {b} ({list}).',
      reverse: 'The order of the genes in the stretch is reversed: it is now {list}.',
      done: 'Result: the mutant is still a permutation. Inside the stretch the genes are still neighbours of each other, in reverse order; read as a circular route, only {broken} of the {n} adjacencies change, those at the ends of the stretch (new: {newEdges}). It is the travelling salesman’s 2-opt move. On the other hand, only {posKept} of the {n} positions stay the same.',
      doneSame: 'Result: the stretch covers the whole chromosome, or all but one gene, so, read as a circular route, the mutant is the same route travelled backwards: it keeps all {n} adjacencies, although only {posKept} genes stay in place.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POR_INVERSIÓN(P)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'pick', indent: 1, text: 'elegir al azar un tramo [a, b) con al menos dos genes' },
      { id: 'reverse', indent: 1, text: 'M[a..b−1] ← M[a..b−1] en orden inverso' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'INVERSION_MUTATION(P)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'pick', indent: 1, text: 'choose a stretch [a, b) with at least two genes at random' },
      { id: 'reverse', indent: 1, text: 'M[a..b−1] ← M[a..b−1] in reverse order' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['elegir', 'devolver'], en: ['choose', 'return'] };
  const stepLines = { intro: ['sig'], copy: ['copy'], pick: ['pick'], reverse: ['reverse'], done: ['return'] };
  const fnName = { python: 'inversion', javascript: 'inversion' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'inversion.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def inversion(parent, a=None, b=None, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if a is None:
        a = rng.randrange(n - 1)
        b = rng.randrange(a + 2, n + 1)
    mutant = list(parent)
    mutant[a:b] = mutant[a:b][::-1]  # {{reverse}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    p = [3, 7, 5, 1, 6, 8, 2, 4]
    print(inversion(p, 2, 6))  # [3, 7, 8, 6, 1, 5, 2, 4]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'inversion.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function inversion(parent, a, b) {
  const n = parent.length;
  if (a === undefined) {
    a = Math.floor(Math.random() * (n - 1));
    b = a + 2 + Math.floor(Math.random() * (n - a - 1));
  }
  const mutant = parent.slice();
  const stretch = mutant.slice(a, b).reverse(); // {{reverse}}
  mutant.splice(a, b - a, ...stretch);
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { inversion };
  if (require.main === module) {
    // {{example}}
    console.log(inversion([3, 7, 5, 1, 6, 8, 2, 4], 2, 6)); // [3, 7, 8, 6, 1, 5, 2, 4]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación por inversión para representación permutacional.',
      ref: 'Referencias: Croes, G. A. (1958); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Mutante con el tramo [a, b) invertido (contando desde 0, b excluido, b - a >= 2). Si se omiten a y b, el tramo se elige al azar.',
      reverse: 'el tramo, al revés: solo cambian sus dos aristas extremas (2-opt)',
      example: 'Ejemplo: se invierte el tramo de las posiciones 3.ª a 6.ª (a = 2, b = 6)',
    },
    en: {
      title: 'Inversion mutation for permutation representations.',
      ref: 'References: Croes, G. A. (1958); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Mutant with the stretch [a, b) reversed (counting from 0, b excluded, b - a >= 2). If a and b are omitted, the stretch is chosen at random.',
      reverse: 'the stretch, reversed: only its two end edges change (2-opt)',
      example: 'Example: the stretch from the 3rd to the 6th position is reversed (a = 2, b = 6)',
    },
  };

  const references = [
    C.ref('croes', {
      es: 'Propone para el problema del viajante el movimiento que invierte un tramo de la ruta, conocido después como 2-opt: quita dos aristas y vuelve a unir la ruta en el otro sentido.',
      en: 'Proposes for the travelling-salesman problem the move that reverses a stretch of the route, later known as 2-opt: it removes two edges and reconnects the route the other way round.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Presenta la inversión como vecindario de las permutaciones y la relaciona con el 2-opt del viajante (capítulo 2), y la recoge como mutación en el apartado 3.3.2.2, con la propiedad de localidad.',
      en: 'The course’s reference textbook. Presents inversion as a permutation neighbourhood and relates it to the travelling salesman’s 2-opt (chapter 2), and includes it as a mutation in section 3.3.2.2, with the locality property.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación de permutaciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers permutation mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('lin', {
      es: 'Generaliza el 2-opt a k-opt (quitar k aristas y reconectar) y estudia su eficacia en el problema del viajante.',
      en: 'Generalises 2-opt to k-opt (remove k edges and reconnect) and studies its effectiveness on the travelling-salesman problem.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.5.1 presenta la mutación por inversión y explica que conserva casi todas las adyacencias, por lo que es adecuada cuando estas son la información importante.',
      en: 'Evolutionary computing textbook. Section 4.5.1 presents inversion mutation and explains that it keeps almost all adjacencies, so it suits problems where they are the important information.',
    }),
    C.ref('holland', {
      es: 'Su operador de inversión, pensado para cadenas binarias, reordena los locus sin cambiar lo que codifica la cadena; es una idea distinta de la mutación por inversión de las permutaciones.',
      en: 'Its inversion operator, designed for binary strings, reorders the loci without changing what the string encodes; it is a different idea from permutation inversion mutation.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'inversion', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).inversion = api;
})(typeof self !== 'undefined' ? self : this);
