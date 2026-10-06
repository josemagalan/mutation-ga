/*
 * Contenido docente de la mutación por inversión de bits (representación binaria).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación por inversión de bits (bit-flip) es la mutación clásica de la representación binaria. Cada posición se trata por separado: se sortea si muta, con una probabilidad pm pequeña, y si muta su bit se invierte: el 0 pasa a 1 y el 1 pasa a 0.',
      'El número de bits que cambian no es fijo: sigue una distribución binomial de parámetros n y pm, con media pm · n. La recomendación más extendida es pm = 1/n (Bäck, 1993): en promedio cambia un bit por mutante, aunque a veces no cambia ninguno, con probabilidad (1 − 1/n)ⁿ ≈ 1/e ≈ 0,37, y a veces cambian varios. Eiben y Smith (2015) sitúan los valores habituales entre 1/(tamaño de la población) y 1/(longitud del cromosoma).',
      'Algunos textos describen la mutación como «sustituir el gen por un alelo elegido al azar» en lugar de «invertirlo». En binario no es lo mismo: el alelo sorteado coincide con el que había la mitad de las veces, así que el bit solo cambia con probabilidad pm/2. La variante «alelo aleatorio» permite verlo.',
      'Papel de la mutación: el cruce solo recombina lo que ya hay en la población, y si en una posición todos los individuos tienen el mismo bit, ningún cruce lo puede cambiar. La mutación introduce valores nuevos, recupera los perdidos y hace que cualquier cadena tenga una probabilidad positiva de aparecer. En los algoritmos genéticos de Holland (1975) es un operador secundario, que se aplica con probabilidad baja para mantener la diversidad.',
      'Talbi (2009) pide a un operador de mutación tres propiedades: ergodicidad (desde cualquier solución se puede llegar a cualquier otra), validez (el mutante es una solución válida) y localidad (el mutante se parece al padre). La inversión de bits cumple las tres: con pm > 0 cualquier cadena puede salir, el resultado sigue siendo una cadena de bits y, con pm pequeña, cambia muy pocas posiciones.',
      'Coste: un sorteo por posición, en tiempo O(n).',
    ],
    en: [
      'Bit-flip mutation is the classic mutation for binary representations. Each position is handled separately: a draw decides whether it mutates, with a small probability pm, and if it does its bit is flipped: 0 becomes 1 and 1 becomes 0.',
      'The number of bits that change is not fixed: it follows a binomial distribution with parameters n and pm, with mean pm · n. The most widespread recommendation is pm = 1/n (Bäck, 1993): on average one bit per mutant changes, although sometimes none does, with probability (1 − 1/n)ⁿ ≈ 1/e ≈ 0.37, and sometimes several do. Eiben and Smith (2015) place typical values between 1/(population size) and 1/(chromosome length).',
      'Some texts describe mutation as “replacing the gene by a randomly chosen allele” rather than “flipping it”. In binary this is not the same: the drawn allele matches the old one half of the time, so the bit only changes with probability pm/2. The “random allele” variant lets you see this.',
      'Role of mutation: crossover only recombines what is already in the population, and if every individual has the same bit at some position, no crossover can change it. Mutation introduces new values, recovers lost ones and gives every string a positive probability of appearing. In Holland’s (1975) genetic algorithms it is a secondary operator, applied with low probability to maintain diversity.',
      'Talbi (2009) asks three properties of a mutation operator: ergodicity (any solution can be reached from any other), validity (the mutant is a valid solution) and locality (the mutant resembles its parent). Bit-flip mutation meets all three: with pm > 0 any string can come out, the result is still a bit string and, with a small pm, very few positions change.',
      'Cost: one draw per position, in O(n) time.',
    ],
  };

  const variants = {
    flip: {
      name: { es: 'Invertir el bit', en: 'Flip the bit' },
      desc: {
        es: 'Si la posición muta, su bit se invierte. Es la versión habitual: cada bit cambia con probabilidad pm.',
        en: 'If the position mutates, its bit is flipped. This is the usual version: each bit changes with probability pm.',
      },
    },
    random: {
      name: { es: 'Alelo aleatorio', en: 'Random allele' },
      desc: {
        es: 'Si la posición muta, se sortea un bit nuevo, que puede coincidir con el que había: cada bit cambia solo con probabilidad pm/2.',
        en: 'If the position mutates, a new bit is drawn, which may match the old one: each bit only changes with probability pm/2.',
      },
    },
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, una cadena de {n} bits. Cada posición mutará con probabilidad pm = {pm}: en promedio, pm · n = {expected} bits por mutante.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea un número r entre 0 y 1. Si r < pm, el bit de esa posición se invierte (0 ↔ 1); si no, se queda como está.',
      drawIntroRandom: 'Para cada posición se sortea un número r entre 0 y 1. Si r < pm, la posición muta: se sortea un bit nuevo s (0 si s < 0,5; 1 si no), que puede coincidir con el que había.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El bit no muta.',
      drawFlip: 'Posición {pos}: r = {r} < pm = {pm}. El bit muta: {a} → {b}.',
      drawResetNew: 'Posición {pos}: r = {r} < pm = {pm}, así que la posición muta. Bit nuevo: s = {s}, que da {b}. Cambia: {a} → {b}.',
      drawResetSame: 'Posición {pos}: r = {r} < pm = {pm}, así que la posición muta. Bit nuevo: s = {s}, que da {b}, el mismo que había: el gen no cambia.',
      done: 'Resultado: han cambiado {k} bits (posiciones {list}), así que el mutante está a distancia de Hamming {k} del padre. Lo esperado era pm · n = {expected}, pero el número de bits que cambian es aleatorio.',
      doneOne: 'Resultado: ha cambiado 1 bit (posición {list}), así que el mutante está a distancia de Hamming 1 del padre.',
      doneNone: 'Resultado: no ha cambiado ningún bit y el mutante es una copia exacta del padre. Con pm pequeña ocurre a menudo: la probabilidad es (1 − pm)ⁿ.',
    },
    en: {
      intro: 'We start from a parent, a string of {n} bits. Each position will mutate with probability pm = {pm}: on average, pm · n = {expected} bits per mutant.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position a number r between 0 and 1 is drawn. If r < pm, the bit at that position is flipped (0 ↔ 1); otherwise it stays as it is.',
      drawIntroRandom: 'For each position a number r between 0 and 1 is drawn. If r < pm, the position mutates: a new bit s is drawn (0 if s < 0.5; 1 otherwise), which may match the old one.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The bit does not mutate.',
      drawFlip: 'Position {pos}: r = {r} < pm = {pm}. The bit mutates: {a} → {b}.',
      drawResetNew: 'Position {pos}: r = {r} < pm = {pm}, so the position mutates. New bit: s = {s}, which gives {b}. It changes: {a} → {b}.',
      drawResetSame: 'Position {pos}: r = {r} < pm = {pm}, so the position mutates. New bit: s = {s}, which gives {b}, the same as before: the gene does not change.',
      done: 'Result: {k} bits have changed (positions {list}), so the mutant is at Hamming distance {k} from the parent. The expected number was pm · n = {expected}, but how many bits change is random.',
      doneOne: 'Result: 1 bit has changed (position {list}), so the mutant is at Hamming distance 1 from the parent.',
      doneNone: 'Result: no bit has changed and the mutant is an exact copy of the parent. With a small pm this happens often: the probability is (1 − pm)ⁿ.',
    },
  };

  function pseudocode(lang, variant) {
    const random = variant === 'random';
    if (lang === 'en') {
      return [
        { id: 'sig', indent: 0, text: 'BIT_FLIP_MUTATION(P, pm)' },
        { id: 'copy', indent: 1, text: 'M ← copy of P' },
        { id: 'forPos', indent: 1, text: 'for each position i:' },
        { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
        { id: 'test', indent: 2, text: 'if r < pm:' },
        random
          ? { id: 'mutate', indent: 3, text: 'draw s in [0, 1);  M[i] ← 0 if s < 0.5, otherwise 1' }
          : { id: 'mutate', indent: 3, text: 'M[i] ← 1 − M[i]' },
        { id: 'return', indent: 1, text: 'return M' },
      ];
    }
    return [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POR_INVERSIÓN_DE_BITS(P, pm)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      random
        ? { id: 'mutate', indent: 3, text: 'sortear s en [0, 1);  M[i] ← 0 si s < 0,5; si no, 1' }
        : { id: 'mutate', indent: 3, text: 'M[i] ← 1 − M[i]' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ];
  }
  const keywords = { es: ['sortear', 'para cada', 'si no', 'si', 'devolver'], en: ['draw', 'for each', 'otherwise', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'],
    copy: ['copy'],
    drawIntro: ['forPos', 'draw', 'test'],
    drawKeep: ['draw', 'test'],
    drawHit: ['test', 'mutate'],
    done: ['return'],
  };
  const fnName = { python: 'bit_flip', javascript: 'bitFlip' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'bit_flip.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def bit_flip(parent, pm=None, rng=random, variant="flip"):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n  # {{default}}
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:  # {{hit}}
            if variant == "flip":
                mutant[i] = 1 - mutant[i]
            else:  # {{randomAllele}}
                mutant[i] = 0 if rng.random() < 0.5 else 1
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.68, 0.77, 0.21, 0.62, 0.08, 0.59, 0.72, 0.45])

    class Fixed:
        def random(self):
            return next(draws)

    p = [1, 1, 0, 0, 1, 0, 0, 1]
    print(bit_flip(p, 0.3, Fixed()))  # [1, 1, 1, 0, 0, 0, 0, 1]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'bit-flip.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function bitFlip(parent, pm, rng = Math.random, variant = 'flip') {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n; // {{default}}
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) { // {{hit}}
      if (variant === 'flip') mutant[i] = 1 - mutant[i];
      else mutant[i] = rng() < 0.5 ? 0 : 1; // {{randomAllele}}
    }
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { bitFlip };
  if (require.main === module) {
    // {{example}}
    const draws = [0.68, 0.77, 0.21, 0.62, 0.08, 0.59, 0.72, 0.45];
    let k = 0;
    const fixed = () => draws[k++];
    console.log(bitFlip([1, 1, 0, 0, 1, 0, 0, 1], 0.3, fixed)); // [1, 1, 1, 0, 0, 0, 0, 1]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación por inversión de bits para representación binaria.',
      ref: 'Referencias: Holland, J. H. (1975); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Bäck, T. (1993).',
      doc1: 'Mutante de la inversión de bits: cada posición muta con probabilidad pm (por defecto, 1/n). Con variant="flip" el bit se invierte; con variant="random" se sortea un bit nuevo, que puede coincidir con el anterior. rng es cualquier objeto con un método random() en [0, 1).',
      default: 'recomendación habitual: en promedio, un bit por mutante',
      hit: 'la posición i muta',
      randomAllele: 'alelo aleatorio: puede salir el mismo bit',
      example: 'Ejemplo con números aleatorios fijados: r < 0,3 en las posiciones 3 y 5',
    },
    en: {
      title: 'Bit-flip mutation for binary representations.',
      ref: 'References: Holland, J. H. (1975); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Bäck, T. (1993).',
      doc1: 'Bit-flip mutant: each position mutates with probability pm (1/n by default). With variant="flip" the bit is flipped; with variant="random" a new bit is drawn, which may match the old one. rng is any object with a random() method in [0, 1).',
      default: 'usual recommendation: one bit per mutant on average',
      hit: 'position i mutates',
      randomAllele: 'random allele: the same bit may come up',
      example: 'Example with fixed random numbers: r < 0.3 at positions 3 and 5',
    },
  };

  const references = [
    C.ref('holland', {
      es: 'Obra fundacional de los algoritmos genéticos. Presenta la mutación como un operador secundario que mantiene la diversidad y recupera alelos perdidos.',
      en: 'Foundational work on genetic algorithms. Presents mutation as a secondary operator that maintains diversity and recovers lost alleles.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. En el apartado 3.3.2.2, dedicado a la reproducción en los algoritmos evolutivos, presenta la mutación antes que el cruce: sus propiedades deseables (ergodicidad, validez y localidad) y los operadores de cada representación, entre ellos la inversión de bits (flip) de la binaria.',
      en: 'The course’s reference textbook. Section 3.3.2.2, on reproduction in evolutionary algorithms, presents mutation before crossover: its desirable properties (ergodicity, validity and locality) and the operators for each representation, including bit flipping for binary.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación junto al cruce en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers mutation alongside crossover in chapter 8, on genetic algorithms.',
    }),
    C.ref('goldberg', {
      es: 'Manual clásico de algoritmos genéticos. Explica la mutación como la alteración ocasional de una posición de la cadena, con probabilidad pequeña, y su papel frente al cruce.',
      en: 'Classic genetic algorithms textbook. Explains mutation as the occasional alteration of a string position, with small probability, and its role alongside crossover.',
    }),
    C.ref('back', {
      es: 'Estudia la tasa de mutación óptima en problemas binarios y apoya la regla pm = 1/n.',
      en: 'Studies the optimal mutation rate on binary problems and supports the pm = 1/n rule.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.2.1 presenta la mutación de la representación binaria y los valores habituales de pm.',
      en: 'Evolutionary computing textbook. Section 4.2.1 presents mutation for binary representations and the usual values of pm.',
    }),
    C.ref('droste', {
      es: 'Análisis teórico del algoritmo evolutivo (1+1), que solo usa esta mutación con pm = 1/n: tiempo esperado de optimización en funciones binarias.',
      en: 'Theoretical analysis of the (1+1) evolutionary algorithm, which only uses this mutation with pm = 1/n: expected optimisation time on binary functions.',
    }),
    C.ref('luke', {
      es: 'Presenta el algoritmo de la mutación por inversión de bits (bit-flip mutation) con la notación que usan las transparencias del curso.',
      en: 'Presents the bit-flip mutation algorithm with the notation used in the course slides.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'bit-flip', explanation, variants, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['bit-flip'] = api;
})(typeof self !== 'undefined' ? self : this);
