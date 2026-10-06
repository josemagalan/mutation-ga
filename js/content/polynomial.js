/*
 * Contenido docente de la mutación polinómica (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación polinómica de Deb y Goyal (1996) perturba el gen con una distribución de probabilidad polinómica, acotada y centrada en el valor del padre: v′ = v + δ · (U − L), con δ entre −1 y 1. Es la mutación que suele acompañar al cruce SBX, del mismo autor, y la habitual en algoritmos como NSGA-II.',
      'δ se obtiene de un número uniforme u: si u < 0,5, δ = (2u)^(1/(η+1)) − 1 (salto hacia abajo); si no, δ = 1 − (2(1 − u))^(1/(η+1)) (hacia arriba). El índice de distribución η controla la forma: con η pequeño los saltos grandes son relativamente frecuentes; con η grande δ se concentra cerca de 0 y el mutante se parece mucho al padre. Valores típicos están entre 20 y 100.',
      'A diferencia de la gaussiana, el salto está acotado (nunca supera U − L) y la distribución tiene un pico afilado en el padre. Con las propiedades de Talbi (2009), η es el mando de la localidad. Si el resultado se sale del intervalo, aquí se recorta; Deb propuso después una versión que ajusta la distribución a la distancia a cada límite para no tener que recortar.',
      'Coste: hasta dos sorteos por posición, en tiempo O(n).',
    ],
    en: [
      'Deb and Goyal’s (1996) polynomial mutation perturbs the gene with a bounded polynomial probability distribution centred on the parent’s value: v′ = v + δ · (U − L), with δ between −1 and 1. It is the mutation that usually accompanies the same author’s SBX crossover, and the usual one in algorithms such as NSGA-II.',
      'δ is obtained from a uniform number u: if u < 0.5, δ = (2u)^(1/(η+1)) − 1 (a downward jump); otherwise δ = 1 − (2(1 − u))^(1/(η+1)) (upward). The distribution index η controls the shape: with a small η large jumps are relatively frequent; with a large η, δ concentrates near 0 and the mutant closely resembles its parent. Typical values are between 20 and 100.',
      'Unlike Gaussian mutation, the jump is bounded (it never exceeds U − L) and the distribution has a sharp peak at the parent. In terms of Talbi’s (2009) properties, η is the locality knob. If the result leaves the interval, here it is clamped; Deb later proposed a version that fits the distribution to the distance to each bound so that no clamping is needed.',
      'Cost: up to two draws per position, in O(n) time.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, un vector de {n} reales entre {lo} y {hi}. Cada posición mutará con probabilidad pm = {pm}, con índice de distribución η = {eta}.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r. Si r < pm, se sortea u y se calcula δ entre −1 y 1: δ = (2u)^(1/(η+1)) − 1 si u < 0,5, o δ = 1 − (2(1 − u))^(1/(η+1)) si no. El gen se mueve δ · {w}. Con η = {eta}, δ casi siempre es pequeño: mira el pico de la distribución.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawPoly: 'Posición {pos}: r = {r} < pm = {pm}. u = {u}, así que δ = {delta} y {a} + {delta} · {w} = {v}. Cambia: {a} → {v}.',
      drawPolyClamp: 'Posición {pos}: r = {r} < pm = {pm}. u = {u}, así que δ = {delta} y {a} + {delta} · {w} = {raw}, que se sale del intervalo: se recorta a {v}.',
      done: 'Resultado: han cambiado {k} genes (posiciones {list}), con un salto medio de {meanJump}. Prueba a mover η: con η pequeño la distribución se abre y con η grande se concentra alrededor del padre.',
      doneOne: 'Resultado: ha cambiado 1 gen (posición {list}), con un salto de {meanJump}. Prueba a mover η: con η pequeño la distribución se abre y con η grande se concentra alrededor del padre.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre.',
    },
    en: {
      intro: 'We start from a parent, a vector of {n} reals between {lo} and {hi}. Each position will mutate with probability pm = {pm}, with distribution index η = {eta}.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn. If r < pm, u is drawn and δ between −1 and 1 is computed: δ = (2u)^(1/(η+1)) − 1 if u < 0.5, or δ = 1 − (2(1 − u))^(1/(η+1)) otherwise. The gene moves by δ · {w}. With η = {eta}, δ is almost always small: look at the peak of the distribution.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawPoly: 'Position {pos}: r = {r} < pm = {pm}. u = {u}, so δ = {delta} and {a} + {delta} · {w} = {v}. It changes: {a} → {v}.',
      drawPolyClamp: 'Position {pos}: r = {r} < pm = {pm}. u = {u}, so δ = {delta} and {a} + {delta} · {w} = {raw}, which is out of the interval: it is clamped to {v}.',
      done: 'Result: {k} genes have changed (positions {list}), with an average jump of {meanJump}. Try moving η: with a small η the distribution opens up and with a large η it concentrates around the parent.',
      doneOne: 'Result: 1 gene has changed (position {list}), with a jump of {meanJump}. Try moving η: with a small η the distribution opens up and with a large η it concentrates around the parent.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POLINÓMICA(P, pm, η, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'u', indent: 3, text: 'sortear u en [0, 1)' },
      { id: 'delta', indent: 3, text: 'δ ← (2u)^(1/(η+1)) − 1  si u < 0,5;  si no, δ ← 1 − (2(1 − u))^(1/(η+1))' },
      { id: 'mutate', indent: 3, text: 'M[i] ← mín(U, máx(L, M[i] + δ · (U − L)))' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'POLYNOMIAL_MUTATION(P, pm, η, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
      { id: 'test', indent: 2, text: 'if r < pm:' },
      { id: 'u', indent: 3, text: 'draw u in [0, 1)' },
      { id: 'delta', indent: 3, text: 'δ ← (2u)^(1/(η+1)) − 1  if u < 0.5;  otherwise δ ← 1 − (2(1 − u))^(1/(η+1))' },
      { id: 'mutate', indent: 3, text: 'M[i] ← min(U, max(L, M[i] + δ · (U − L)))' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['sortear', 'para cada', 'si no', 'si', 'devolver'], en: ['draw', 'for each', 'otherwise', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'], copy: ['copy'], drawIntro: ['forPos', 'draw', 'test'], drawKeep: ['draw', 'test'], drawHit: ['test', 'u', 'delta', 'mutate'], done: ['return'],
  };
  const fnName = { python: 'polynomial', javascript: 'polynomial' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'polynomial.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def polynomial(parent, pm=None, eta=20.0, low=0.0, high=10.0, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:
            u = rng.random()
            if u < 0.5:
                delta = (2 * u) ** (1 / (eta + 1)) - 1  # {{down}}
            else:
                delta = 1 - (2 * (1 - u)) ** (1 / (eta + 1))  # {{up}}
            mutant[i] = min(high, max(low, mutant[i] + delta * (high - low)))
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.9, 0.1, 0.3, 0.6, 0.7, 0.8])

    class Fixed:
        def random(self):
            return next(draws)

    m = polynomial([4.2, 1.7, 8.5, 2.1, 6.0], 0.25, 20, rng=Fixed())
    print([round(x, 2) for x in m])  # [4.2, 1.46, 8.5, 2.1, 6.0]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'polynomial.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function polynomial(parent, pm, eta = 20, low = 0, high = 10, rng = Math.random) {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) {
      const u = rng();
      const delta = u < 0.5
        ? Math.pow(2 * u, 1 / (eta + 1)) - 1 // {{down}}
        : 1 - Math.pow(2 * (1 - u), 1 / (eta + 1)); // {{up}}
      mutant[i] = Math.min(high, Math.max(low, mutant[i] + delta * (high - low)));
    }
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { polynomial };
  if (require.main === module) {
    // {{example}}
    const draws = [0.9, 0.1, 0.3, 0.6, 0.7, 0.8];
    let k = 0;
    const m = polynomial([4.2, 1.7, 8.5, 2.1, 6.0], 0.25, 20, 0, 10, () => draws[k++]);
    console.log(m.map((x) => Math.round(x * 100) / 100)); // [4.2, 1.46, 8.5, 2.1, 6]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación polinómica de Deb y Goyal para representación real (versión básica).',
      ref: 'Referencias: Deb, K. y Goyal, M. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Cada posición, con probabilidad pm (por defecto 1/n), se perturba con delta * (high - low), donde delta sigue una distribución polinómica en (-1, 1) con índice eta; el resultado se recorta a [low, high]. rng es cualquier objeto con un método random() en [0, 1).',
      down: 'u < 0,5: salto hacia abajo',
      up: 'u >= 0,5: salto hacia arriba',
      example: 'Ejemplo con números aleatorios fijados: solo muta la 2.ª posición, con u = 0,3',
    },
    en: {
      title: 'Deb and Goyal’s polynomial mutation for real-valued representations (basic version).',
      ref: 'References: Deb, K. & Goyal, M. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Each position, with probability pm (1/n by default), is perturbed by delta * (high - low), where delta follows a polynomial distribution in (-1, 1) with index eta; the result is clamped to [low, high]. rng is any object with a random() method in [0, 1).',
      down: 'u < 0.5: downward jump',
      up: 'u >= 0.5: upward jump',
      example: 'Example with fixed random numbers: only the 2nd position mutates, with u = 0.3',
    },
  };

  const references = [
    C.ref('debGoyal', {
      es: 'Proponen la mutación polinómica, junto con el cruce SBX, para algoritmos genéticos con codificación real aplicados al diseño en ingeniería.',
      en: 'Propose polynomial mutation, together with SBX crossover, for real-coded genetic algorithms applied to engineering design.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la mutación de las representaciones reales en el apartado 3.3.2.2; en la polinómica, el índice η regula la localidad.',
      en: 'The course’s reference textbook. Covers mutation for real-valued representations in section 3.3.2.2; in polynomial mutation, the index η governs locality.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('deb2001', {
      es: 'Manual de optimización multiobjetivo con algoritmos evolutivos; describe la mutación polinómica tal como se usa en NSGA-II.',
      en: 'Textbook on multi-objective optimisation with evolutionary algorithms; describes polynomial mutation as used in NSGA-II.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'polynomial', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).polynomial = api;
})(typeof self !== 'undefined' ? self : this);
