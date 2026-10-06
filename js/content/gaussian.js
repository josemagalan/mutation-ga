/*
 * Contenido docente de la mutación gaussiana (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación gaussiana suma al gen un ruido normal de media 0 y desviación típica σ: v′ = v + σ · z, con z de una normal estándar. Los saltos pequeños son los más probables (en unos dos de cada tres casos el salto es menor que σ) y los grandes, raros pero posibles. Es la mutación clásica de las estrategias evolutivas de Rechenberg y Schwefel.',
      'Con las propiedades de Talbi (2009), es muy local (el mutante está casi siempre cerca del padre) y ergódica (con probabilidad pequeña puede llegar a cualquier valor). Si el resultado se sale del intervalo hay que repararlo; aquí se recorta al límite, por eso en el panel aparece un pico en el extremo cuando el padre está cerca de él.',
      'σ es el tamaño del paso, y elegirlo bien es clave: con σ grande se explora pero cuesta afinar; con σ pequeña se afina pero se avanza despacio. En las estrategias evolutivas σ no es fija: se adapta durante la búsqueda (regla del 1/5 de éxitos o autoadaptación, en la que σ forma parte del propio cromosoma y también muta).',
      'El ruido normal se genera aquí con la transformación de Box-Muller: a partir de dos números uniformes u1 y u2, z = √(−2 ln(1 − u1)) · cos(2π u2).',
      'Coste: hasta tres sorteos por posición, en tiempo O(n).',
    ],
    en: [
      'Gaussian mutation adds normal noise with mean 0 and standard deviation σ to the gene: v′ = v + σ · z, with z from a standard normal. Small jumps are the most likely (in about two cases out of three the jump is smaller than σ) and large ones rare but possible. It is the classic mutation of Rechenberg’s and Schwefel’s evolution strategies.',
      'In terms of Talbi’s (2009) properties, it is very local (the mutant is almost always close to the parent) and ergodic (with small probability it can reach any value). If the result leaves the interval it must be repaired; here it is clamped to the bound, which is why the panel shows a spike at the end when the parent is close to it.',
      'σ is the step size, and choosing it well is key: with a large σ the search explores but struggles to fine-tune; with a small σ it fine-tunes but moves slowly. In evolution strategies σ is not fixed: it adapts during the search (the 1/5 success rule, or self-adaptation, where σ is part of the chromosome itself and also mutates).',
      'The normal noise is generated here with the Box-Muller transform: from two uniform numbers u1 and u2, z = √(−2 ln(1 − u1)) · cos(2π u2).',
      'Cost: up to three draws per position, in O(n) time.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, un vector de {n} reales entre {lo} y {hi}. Cada posición mutará con probabilidad pm = {pm}, con una desviación típica σ = {sigma}.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r. Si r < pm, se sortea z de una normal de media 0 y desviación 1 y al gen se le suma σ · z. Los saltos pequeños son los más probables: debajo, la campana del valor mutado, centrada en el padre.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawGauss: 'Posición {pos}: r = {r} < pm = {pm}. z = {z}, así que {a} + {sigma} · {z} = {v}. Cambia: {a} → {v}.',
      drawGaussClamp: 'Posición {pos}: r = {r} < pm = {pm}. z = {z}, así que {a} + {sigma} · {z} = {raw}, que se sale del intervalo: se recorta a {v}.',
      done: 'Resultado: han cambiado {k} genes (posiciones {list}), con un salto medio de {meanJump}. Prueba a cambiar σ: la campana se estrecha o se ensancha, y con ella el tamaño de los saltos.',
      doneOne: 'Resultado: ha cambiado 1 gen (posición {list}), con un salto de {meanJump}. Prueba a cambiar σ: la campana se estrecha o se ensancha, y con ella el tamaño de los saltos.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre.',
    },
    en: {
      intro: 'We start from a parent, a vector of {n} reals between {lo} and {hi}. Each position will mutate with probability pm = {pm}, with standard deviation σ = {sigma}.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn. If r < pm, z is drawn from a normal with mean 0 and standard deviation 1 and σ · z is added to the gene. Small jumps are the most likely: below, the bell curve of the mutated value, centred on the parent.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawGauss: 'Position {pos}: r = {r} < pm = {pm}. z = {z}, so {a} + {sigma} · {z} = {v}. It changes: {a} → {v}.',
      drawGaussClamp: 'Position {pos}: r = {r} < pm = {pm}. z = {z}, so {a} + {sigma} · {z} = {raw}, which is out of the interval: it is clamped to {v}.',
      done: 'Result: {k} genes have changed (positions {list}), with an average jump of {meanJump}. Try changing σ: the bell narrows or widens, and so does the size of the jumps.',
      doneOne: 'Result: 1 gene has changed (position {list}), with a jump of {meanJump}. Try changing σ: the bell narrows or widens, and so does the size of the jumps.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_GAUSSIANA(P, pm, σ, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'normal', indent: 3, text: 'sortear z de una normal N(0, 1)        // Box-Muller' },
      { id: 'mutate', indent: 3, text: 'M[i] ← mín(U, máx(L, M[i] + σ · z))' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'GAUSSIAN_MUTATION(P, pm, σ, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
      { id: 'test', indent: 2, text: 'if r < pm:' },
      { id: 'normal', indent: 3, text: 'draw z from a normal N(0, 1)        // Box-Muller' },
      { id: 'mutate', indent: 3, text: 'M[i] ← min(U, max(L, M[i] + σ · z))' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['sortear', 'para cada', 'si', 'devolver'], en: ['draw', 'for each', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'], copy: ['copy'], drawIntro: ['forPos', 'draw', 'test'], drawKeep: ['draw', 'test'], drawHit: ['test', 'normal', 'mutate'], done: ['return'],
  };
  const fnName = { python: 'gaussian', javascript: 'gaussian' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'gaussian.py',
      template: `"""
{{title}}
{{ref}}
"""
import math
import random


def gaussian(parent, pm=None, sigma=1.0, low=0.0, high=10.0, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:
            u1, u2 = rng.random(), rng.random()
            z = math.sqrt(-2 * math.log(1 - u1)) * math.cos(2 * math.pi * u2)  # {{boxmuller}}
            mutant[i] = min(high, max(low, mutant[i] + sigma * z))  # {{clamp}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.9, 0.1, 0.4, 0.0, 0.7, 0.8, 0.6])

    class Fixed:
        def random(self):
            return next(draws)

    m = gaussian([4.2, 1.7, 8.5, 2.1, 6.0], 0.25, 1.0, rng=Fixed())
    print([round(x, 2) for x in m])  # [4.2, 2.71, 8.5, 2.1, 6.0]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'gaussian.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function gaussian(parent, pm, sigma = 1, low = 0, high = 10, rng = Math.random) {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) {
      const u1 = rng();
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2); // {{boxmuller}}
      mutant[i] = Math.min(high, Math.max(low, mutant[i] + sigma * z)); // {{clamp}}
    }
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { gaussian };
  if (require.main === module) {
    // {{example}}
    const draws = [0.9, 0.1, 0.4, 0.0, 0.7, 0.8, 0.6];
    let k = 0;
    const m = gaussian([4.2, 1.7, 8.5, 2.1, 6.0], 0.25, 1, 0, 10, () => draws[k++]);
    console.log(m.map((x) => Math.round(x * 100) / 100)); // [4.2, 2.71, 8.5, 2.1, 6]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación gaussiana para representación real.',
      ref: 'Referencias: Rechenberg, I. (1973); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Cada posición, con probabilidad pm (por defecto 1/n), recibe un ruido normal de media 0 y desviación sigma; el resultado se recorta a [low, high]. rng es cualquier objeto con un método random() en [0, 1).',
      boxmuller: 'Box-Muller: z sigue una normal N(0, 1)',
      clamp: 'v + σ·z, recortado al intervalo',
      example: 'Ejemplo con números aleatorios fijados: solo muta la 2.ª posición, con z ≈ 1,01',
    },
    en: {
      title: 'Gaussian mutation for real-valued representations.',
      ref: 'References: Rechenberg, I. (1973); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Each position, with probability pm (1/n by default), receives normal noise with mean 0 and standard deviation sigma; the result is clamped to [low, high]. rng is any object with a random() method in [0, 1).',
      boxmuller: 'Box-Muller: z follows a normal N(0, 1)',
      clamp: 'v + σ·z, clamped to the interval',
      example: 'Example with fixed random numbers: only the 2nd position mutates, with z ≈ 1.01',
    },
  };

  const references = [
    C.ref('rechenberg', {
      es: 'Obra fundacional de las estrategias evolutivas, cuya mutación consiste en sumar a cada variable un ruido normal.',
      en: 'Foundational work on evolution strategies, whose mutation adds normal noise to each variable.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la mutación de las representaciones reales en el apartado 3.3.2.2 y las estrategias evolutivas, con su mutación gaussiana y la adaptación de σ, en el capítulo 3.',
      en: 'The course’s reference textbook. Covers mutation for real-valued representations in section 3.3.2.2 and evolution strategies, with their Gaussian mutation and the adaptation of σ, in chapter 3.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('beyer', {
      es: 'Introducción completa a las estrategias evolutivas: mutación gaussiana, regla del 1/5 de éxitos y autoadaptación de σ.',
      en: 'Comprehensive introduction to evolution strategies: Gaussian mutation, the 1/5 success rule and self-adaptation of σ.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.4.2 presenta la mutación gaussiana (que llama «no uniforme») y la autoadaptación del tamaño del paso.',
      en: 'Evolutionary computing textbook. Section 4.4.2 presents Gaussian mutation (which it calls “non-uniform”) and step-size self-adaptation.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'gaussian', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).gaussian = api;
})(typeof self !== 'undefined' ? self : this);
