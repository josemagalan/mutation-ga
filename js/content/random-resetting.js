/*
 * Contenido docente de la mutación de reinicio aleatorio (representación entera).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación de reinicio aleatorio (random resetting) es la generalización a enteros de la inversión de bits. Cada posición se sortea por separado y, con probabilidad pm, el gen toma un valor cualquiera del rango permitido, todos con la misma probabilidad. Aquí el rango es de 0 a 9.',
      'Es la mutación adecuada cuando los valores son categorías sin orden: qué máquina hace cada tarea, qué color tiene cada región, qué proveedor atiende cada pedido. Si la máquina 3 no se parece más a la 4 que a la 9, no tiene sentido dar pasos pequeños, y cualquier valor es un cambio tan razonable como otro (Eiben y Smith, 2015).',
      'Con las propiedades que pide Talbi (2009), es válida (el valor nuevo está en el rango) y ergódica (cualquier vector puede salir), pero poco local si los valores sí tienen orden: un gen puede saltar de 0 a 9 de golpe. Para cantidades ordenadas conviene la mutación por deslizamiento, que da pasos pequeños.',
      'Como el valor nuevo se sortea entre todos los del rango, incluido el que había, con k valores posibles el gen solo cambia con probabilidad pm · (k − 1)/k. En binario (k = 2) es la variante «alelo aleatorio» de la inversión de bits.',
      'Coste: uno o dos sorteos por posición, en tiempo O(n).',
    ],
    en: [
      'Random-resetting mutation is the integer generalisation of bit flipping. Each position is drawn separately and, with probability pm, the gene takes any value in the allowed range, all equally likely. Here the range is 0 to 9.',
      'It is the right mutation when values are unordered categories: which machine does each job, which colour each region gets, which supplier serves each order. If machine 3 is no more similar to machine 4 than to machine 9, small steps make no sense, and any value is as reasonable a change as any other (Eiben & Smith, 2015).',
      'In terms of the properties Talbi (2009) asks of a mutation, it is valid (the new value is in range) and ergodic (any vector can come out), but not very local if the values do have an order: a gene can jump from 0 to 9 at once. For ordered quantities creep mutation, which takes small steps, is better.',
      'Since the new value is drawn among all those in the range, including the old one, with k possible values the gene only changes with probability pm · (k − 1)/k. In binary (k = 2) it is the “random allele” variant of bit flipping.',
      'Cost: one or two draws per position, in O(n) time.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, un vector de {n} enteros entre {lo} y {hi}. Cada posición mutará con probabilidad pm = {pm}.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r entre 0 y 1. Si r < pm, se sortea otro número s y el gen toma el valor {lo} + ⌊s · {size}⌋: cualquiera del rango, con la misma probabilidad.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawNew: 'Posición {pos}: r = {r} < pm = {pm}. Valor nuevo: s = {s}, {lo} + ⌊{s} · {size}⌋ = {v}. Cambia: {a} → {v}.',
      drawSame: 'Posición {pos}: r = {r} < pm = {pm}. Valor nuevo: s = {s}, {lo} + ⌊{s} · {size}⌋ = {v}, el mismo que había: el gen no cambia.',
      done: 'Resultado: han cambiado {k} genes (posiciones {list}). Los saltos no tienen por qué ser pequeños: el mayor ha sido de {maxJump} y la media, de {meanJump}.',
      doneOne: 'Resultado: ha cambiado 1 gen (posición {list}), con un salto de {maxJump}. Los saltos no tienen por qué ser pequeños: cualquier valor del rango es igual de probable.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre. Con pm pequeña ocurre a menudo.',
    },
    en: {
      intro: 'We start from a parent, a vector of {n} integers between {lo} and {hi}. Each position will mutate with probability pm = {pm}.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn between 0 and 1. If r < pm, another number s is drawn and the gene takes the value {lo} + ⌊s · {size}⌋: any value in the range, all equally likely.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawNew: 'Position {pos}: r = {r} < pm = {pm}. New value: s = {s}, {lo} + ⌊{s} · {size}⌋ = {v}. It changes: {a} → {v}.',
      drawSame: 'Position {pos}: r = {r} < pm = {pm}. New value: s = {s}, {lo} + ⌊{s} · {size}⌋ = {v}, the same as before: the gene does not change.',
      done: 'Result: {k} genes have changed (positions {list}). The jumps need not be small: the largest was {maxJump} and the average {meanJump}.',
      doneOne: 'Result: 1 gene has changed (position {list}), with a jump of {maxJump}. Jumps need not be small: every value in the range is equally likely.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent. With a small pm this happens often.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'REINICIO_ALEATORIO(P, pm, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'mutate', indent: 3, text: 'sortear s en [0, 1);  M[i] ← L + ⌊s · (U − L + 1)⌋' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'RANDOM_RESETTING(P, pm, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
      { id: 'test', indent: 2, text: 'if r < pm:' },
      { id: 'mutate', indent: 3, text: 'draw s in [0, 1);  M[i] ← L + ⌊s · (U − L + 1)⌋' },
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
      filename: 'random_resetting.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def random_resetting(parent, pm=None, low=0, high=9, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:  # {{hit}}
            mutant[i] = low + int(rng.random() * (high - low + 1))  # {{reset}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.68, 0.12, 0.75, 0.9, 0.05, 0.33, 0.6, 0.4, 0.8, 0.95])

    class Fixed:
        def random(self):
            return next(draws)

    print(random_resetting([3, 7, 1, 4, 6, 0, 9, 2], 0.2, rng=Fixed()))  # [3, 7, 1, 3, 6, 0, 9, 2]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'random-resetting.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function randomResetting(parent, pm, low = 0, high = 9, rng = Math.random) {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) { // {{hit}}
      mutant[i] = low + Math.floor(rng() * (high - low + 1)); // {{reset}}
    }
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { randomResetting };
  if (require.main === module) {
    // {{example}}
    const draws = [0.68, 0.12, 0.75, 0.9, 0.05, 0.33, 0.6, 0.4, 0.8, 0.95];
    let k = 0;
    console.log(randomResetting([3, 7, 1, 4, 6, 0, 9, 2], 0.2, 0, 9, () => draws[k++])); // [3, 7, 1, 3, 6, 0, 9, 2]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación de reinicio aleatorio (random resetting) para representación entera.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. y Smith, J. E. (2015).',
      doc1: 'Cada posición, con probabilidad pm (por defecto 1/n), toma un valor al azar del rango [low, high], que puede coincidir con el que había. rng es cualquier objeto con un método random() en [0, 1).',
      hit: 'la posición i muta',
      reset: 'cualquier valor del rango, todos igual de probables',
      example: 'Ejemplo con números aleatorios fijados: la 2.ª posición muta pero vuelve a salir 7; la 4.ª pasa de 4 a 3',
    },
    en: {
      title: 'Random-resetting mutation for integer representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. & Smith, J. E. (2015).',
      doc1: 'Each position, with probability pm (1/n by default), takes a random value in the range [low, high], which may match the old one. rng is any object with a random() method in [0, 1).',
      hit: 'position i mutates',
      reset: 'any value in the range, all equally likely',
      example: 'Example with fixed random numbers: the 2nd position mutates but 7 comes up again; the 4th goes from 4 to 3',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Para las representaciones discretas, la mutación sustituye el valor de un gen por otro del alfabeto (apartado 3.3.2.2), y debe ser válida, ergódica y local.',
      en: 'The course’s reference textbook. For discrete representations, mutation replaces a gene’s value by another from the alphabet (section 3.3.2.2), and it should be valid, ergodic and local.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la representación de las soluciones y su mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers solution representation and mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.3.1 presenta el reinicio aleatorio para enteros y explica que es adecuado cuando los valores son atributos sin orden (cardinales).',
      en: 'Evolutionary computing textbook. Section 4.3.1 presents random resetting for integers and explains that it suits values that are unordered (cardinal) attributes.',
    }),
    C.ref('luke', {
      es: 'Para vectores de enteros presenta el reinicio aleatorio y lo contrasta con mutaciones que dan pasos pequeños, para cuando los valores sí tienen orden.',
      en: 'For integer vectors presents random resetting and contrasts it with mutations that take small steps, for when the values do have an order.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'random-resetting', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['random-resetting'] = api;
})(typeof self !== 'undefined' ? self : this);
