/*
 * Contenido docente de la mutación por inserción (representación permutacional).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación por inserción (también llamada de desplazamiento, shift) saca un gen de su posición i y lo vuelve a colocar en la posición j. Para hacerle hueco, los genes que había entre las dos posiciones se desplazan un lugar; los demás no se mueven.',
      'Su virtud es que conserva el orden relativo de todos los demás genes: si el 5 iba antes que el 8, sigue yendo antes. Solo cambia la colocación del gen insertado respecto a los que salta. Por eso es la mutación natural en problemas de secuenciación, como el orden de las tareas en una máquina, donde importa qué va antes que qué más que la posición exacta (Talbi, 2009).',
      'En posiciones absolutas, en cambio, puede ser muy disruptiva: todos los genes entre i y j cambian de sitio. Y leída como ruta circular cambia como mucho tres adyacencias: las dos del gen que sale y la del hueco donde entra.',
      'Hay dos convenciones habituales. Aquí, el gen de la posición i acaba exactamente en la posición j. Eiben y Smith (2015) la describen eligiendo dos genes y colocando el segundo justo detrás del primero; el efecto es el mismo tipo de movimiento.',
      'Coste: tiempo O(n), por el desplazamiento de los genes intermedios.',
    ],
    en: [
      'Insert mutation (also called shift mutation) takes a gene out of its position i and puts it back at position j. To make room, the genes between the two positions shift by one place; the rest do not move.',
      'Its strength is that it keeps the relative order of every other gene: if 5 came before 8, it still does. Only the placement of the inserted gene relative to the ones it jumps over changes. That is why it is the natural mutation for sequencing problems, such as the order of jobs on a machine, where what comes before what matters more than the exact position (Talbi, 2009).',
      'In terms of absolute positions, however, it can be very disruptive: every gene between i and j changes place. And read as a circular route it changes at most three adjacencies: the two around the gene that leaves and the one at the gap where it enters.',
      'There are two common conventions. Here, the gene at position i ends up exactly at position j. Eiben and Smith (2015) describe it by choosing two genes and placing the second right after the first; it is the same kind of move.',
      'Cost: O(n) time, for shifting the genes in between.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una permutación de {n} genes.',
      copy: 'El mutante empieza siendo una copia del padre.',
      pick: 'Se eligen al azar el gen que se mueve, el de la posición i = {i} (el {g}), y su posición de destino, j = {j}.',
      insertRight: 'El {g} sale de la posición {i} y se inserta en la {j}. Para hacerle hueco, los {count} genes que había entre medias ({list}) se desplazan un lugar a la izquierda.',
      insertLeft: 'El {g} sale de la posición {i} y se inserta en la {j}. Para hacerle hueco, los {count} genes que había entre medias ({list}) se desplazan un lugar a la derecha.',
      done: 'Resultado: el mutante sigue siendo una permutación y el orden relativo de los demás genes no ha cambiado: solo se ha movido el {g}. Conserva {posKept} de las {n} posiciones del padre y, leído como una ruta circular, {edgesKept} de sus {n} adyacencias; las nuevas son {newEdges}.',
    },
    en: {
      intro: 'We start from a parent, a permutation of {n} genes.',
      copy: 'The mutant starts as a copy of the parent.',
      pick: 'The gene to move, the one at position i = {i} ({g}), and its target position j = {j} are chosen at random.',
      insertRight: '{g} leaves position {i} and is inserted at position {j}. To make room, the {count} genes in between ({list}) shift one place to the left.',
      insertLeft: '{g} leaves position {i} and is inserted at position {j}. To make room, the {count} genes in between ({list}) shift one place to the right.',
      done: 'Result: the mutant is still a permutation and the relative order of the other genes has not changed: only {g} has moved. It keeps {posKept} of the parent’s {n} positions and, read as a circular route, {edgesKept} of its {n} adjacencies; the new ones are {newEdges}.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POR_INSERCIÓN(P)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'pick', indent: 1, text: 'elegir al azar dos posiciones distintas i (origen) y j (destino)' },
      { id: 'remove', indent: 1, text: 'g ← M[i];  quitar g de M' },
      { id: 'insert', indent: 1, text: 'insertar g en M en la posición j' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'INSERT_MUTATION(P)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'pick', indent: 1, text: 'choose two different positions i (origin) and j (target) at random' },
      { id: 'remove', indent: 1, text: 'g ← M[i];  remove g from M' },
      { id: 'insert', indent: 1, text: 'insert g into M at position j' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['elegir', 'quitar', 'insertar', 'devolver'], en: ['choose', 'remove', 'insert', 'return'] };
  const stepLines = { intro: ['sig'], copy: ['copy'], pick: ['pick'], insert: ['remove', 'insert'], done: ['return'] };
  const fnName = { python: 'insert', javascript: 'insert' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'insert.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def insert(parent, i=None, j=None, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if i is None:
        i, j = rng.sample(range(n), 2)
    mutant = list(parent)
    g = mutant.pop(i)  # {{remove}}
    mutant.insert(j, g)  # {{insert}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    p = [3, 7, 5, 1, 6, 8, 2, 4]
    print(insert(p, 1, 5))  # [3, 5, 1, 6, 8, 7, 2, 4]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'insert.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function insert(parent, i, j) {
  const n = parent.length;
  if (i === undefined) {
    i = Math.floor(Math.random() * n);
    do { j = Math.floor(Math.random() * n); } while (j === i);
  }
  const mutant = parent.slice();
  const [g] = mutant.splice(i, 1); // {{remove}}
  mutant.splice(j, 0, g); // {{insert}}
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { insert };
  if (require.main === module) {
    // {{example}}
    console.log(insert([3, 7, 5, 1, 6, 8, 2, 4], 1, 5)); // [3, 5, 1, 6, 8, 7, 2, 4]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación por inserción para representación permutacional.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Syswerda, G. (1991).',
      doc1: 'Mutante en el que el gen de la posición i pasa a la posición j (distintas, contando desde 0); los genes intermedios se desplazan un lugar. Si se omiten, se eligen al azar.',
      remove: 'se saca el gen: los posteriores avanzan un lugar',
      insert: 'se inserta en j: desde j, retroceden un lugar',
      example: 'Ejemplo: el 7 (2.ª posición) pasa a la 6.ª (i = 1, j = 5 contando desde 0)',
    },
    en: {
      title: 'Insert mutation for permutation representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Syswerda, G. (1991).',
      doc1: 'Mutant in which the gene at position i moves to position j (different, counting from 0); the genes in between shift by one place. If omitted, they are chosen at random.',
      remove: 'take the gene out: later genes move up one place',
      insert: 'insert it at j: from j on, genes move back one place',
      example: 'Example: 7 (2nd position) moves to the 6th (i = 1, j = 5 counting from 0)',
    },
  };

  const references = [
    C.ref('syswerda1991', {
      es: 'Propone, para problemas de secuenciación de tareas, la mutación basada en la posición (position-based mutation), que saca un gen y lo inserta en otro lugar, y la compara con el intercambio.',
      en: 'Proposes, for task-scheduling problems, position-based mutation, which takes a gene out and inserts it elsewhere, and compares it with swap.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Presenta la inserción (desplazamiento) como vecindario de las permutaciones (capítulo 2) y como mutación (apartado 3.3.2.2), y la relaciona con los problemas de secuenciación, donde importa el orden relativo.',
      en: 'The course’s reference textbook. Presents insertion (shift) as a permutation neighbourhood (chapter 2) and as a mutation (section 3.3.2.2), and relates it to sequencing problems, where relative order matters.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación de permutaciones en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers permutation mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.5.1 describe la mutación por inserción eligiendo dos genes y colocando el segundo detrás del primero.',
      en: 'Evolutionary computing textbook. Section 4.5.1 describes insert mutation by choosing two genes and placing the second right after the first.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'insert', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).insert = api;
})(typeof self !== 'undefined' ? self : this);
