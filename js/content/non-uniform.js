/*
 * Contenido docente de la mutación no uniforme de Michalewicz (representación real).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación no uniforme de Michalewicz hace que el tamaño de los saltos dependa del avance de la búsqueda. Al principio los saltos pueden ser grandes, para explorar; a medida que pasan las generaciones se van estrechando, para afinar alrededor de las buenas soluciones. Es una idea parecida al enfriamiento del recocido simulado.',
      'Si el gen muta, se sortea el sentido, arriba o abajo, y el gen recorre una fracción del hueco y que le queda hasta el límite en ese sentido: Δ = y · (1 − u^e), con e = (1 − t/T)^b, donde t es la generación actual y T el número máximo de generaciones. Con t/T = 0, e = 1 y la fracción es uniforme; cuando t/T se acerca a 1, e tiende a 0, u^e se acerca a 1 y Δ, a 0. El parámetro b decide lo deprisa que se estrecha: con b grande, el salto se reduce pronto.',
      'Como Δ nunca supera el hueco hasta el límite, el mutante nunca se sale del intervalo y no hace falta recortarlo. En el panel se ve la distribución del valor mutado: con t/T pequeño se reparte por todo el intervalo, y al subir t/T se concentra junto al padre. Con las propiedades de Talbi (2009), empieza poco local y termina muy local.',
      'Ojo con los nombres: Eiben y Smith (2015) llaman «no uniforme» a la mutación gaussiana, porque no reparte el valor nuevo de forma uniforme. Aquí seguimos a Michalewicz, para quien no uniforme significa «que cambia con el tiempo».',
      'Coste: hasta tres sorteos por posición, en tiempo O(n).',
    ],
    en: [
      'Michalewicz’s non-uniform mutation makes the size of the jumps depend on how far the search has progressed. At first jumps can be large, to explore; as generations go by they narrow, to fine-tune around good solutions. It is an idea similar to the cooling of simulated annealing.',
      'If the gene mutates, a direction is drawn, up or down, and the gene travels a fraction of the gap y left to the bound in that direction: Δ = y · (1 − u^e), with e = (1 − t/T)^b, where t is the current generation and T the maximum number of generations. With t/T = 0, e = 1 and the fraction is uniform; as t/T approaches 1, e tends to 0, u^e approaches 1 and Δ approaches 0. The parameter b decides how fast it narrows: with a large b, the jump shrinks early.',
      'Since Δ never exceeds the gap to the bound, the mutant never leaves the interval and no clamping is needed. The panel shows the distribution of the mutated value: with a small t/T it spreads over the whole interval, and as t/T grows it concentrates next to the parent. In terms of Talbi’s (2009) properties, it starts barely local and ends very local.',
      'Beware of names: Eiben and Smith (2015) call Gaussian mutation “non-uniform”, because it does not spread the new value uniformly. Here we follow Michalewicz, for whom non-uniform means “changing over time”.',
      'Cost: up to three draws per position, in O(n) time.',
    ],
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, un vector de {n} reales entre {lo} y {hi}. Cada posición mutará con probabilidad pm = {pm}. La búsqueda va por t/T = {g}, con b = {b}.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r. Si r < pm, se sortea τ para el sentido (hacia arriba si τ < 0,5) y u para el tamaño: el gen recorre la fracción 1 − u^e del hueco que le queda hasta el límite, con e = (1 − t/T)^b = {e}. Cuanto más avanzada la búsqueda, menor es e y más cortos los saltos.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawUp: 'Posición {pos}: r = {r} < pm = {pm}. τ = {tau} < 0,5: hacia arriba, con un hueco de {y} hasta el límite superior. Con u = {u}, Δ = {y} · (1 − {u}^{e}) = {delta}. Cambia: {a} → {v}.',
      drawDown: 'Posición {pos}: r = {r} < pm = {pm}. τ = {tau} ≥ 0,5: hacia abajo, con un hueco de {y} hasta el límite inferior. Con u = {u}, Δ = {y} · (1 − {u}^{e}) = {delta}. Cambia: {a} → {v}.',
      done: 'Resultado: han cambiado {k} genes (posiciones {list}), con un salto medio de {meanJump}, y ninguno se ha salido del intervalo. Sube t/T y verás que los saltos se acortan.',
      doneOne: 'Resultado: ha cambiado 1 gen (posición {list}), con un salto de {meanJump}, sin salirse del intervalo. Sube t/T y verás que los saltos se acortan.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre.',
    },
    en: {
      intro: 'We start from a parent, a vector of {n} reals between {lo} and {hi}. Each position will mutate with probability pm = {pm}. The search is at t/T = {g}, with b = {b}.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn. If r < pm, τ is drawn for the direction (up if τ < 0.5) and u for the size: the gene travels the fraction 1 − u^e of the gap left to the bound, with e = (1 − t/T)^b = {e}. The further the search has gone, the smaller e and the shorter the jumps.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawUp: 'Position {pos}: r = {r} < pm = {pm}. τ = {tau} < 0.5: upwards, with a gap of {y} to the upper bound. With u = {u}, Δ = {y} · (1 − {u}^{e}) = {delta}. It changes: {a} → {v}.',
      drawDown: 'Position {pos}: r = {r} < pm = {pm}. τ = {tau} ≥ 0.5: downwards, with a gap of {y} to the lower bound. With u = {u}, Δ = {y} · (1 − {u}^{e}) = {delta}. It changes: {a} → {v}.',
      done: 'Result: {k} genes have changed (positions {list}), with an average jump of {meanJump}, and none has left the interval. Raise t/T and you will see the jumps get shorter.',
      doneOne: 'Result: 1 gene has changed (position {list}), with a jump of {meanJump}, without leaving the interval. Raise t/T and you will see the jumps get shorter.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent.',
    },
  };

  const pseudocode = {
    es: [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_NO_UNIFORME(P, pm, t, T, b, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'exp', indent: 1, text: 'e ← (1 − t/T)^b' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'dir', indent: 3, text: 'sortear τ y u en [0, 1)' },
      { id: 'up', indent: 3, text: 'si τ < 0,5:  M[i] ← M[i] + (U − M[i]) · (1 − u^e)' },
      { id: 'down', indent: 3, text: 'si no:      M[i] ← M[i] − (M[i] − L) · (1 − u^e)' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ],
    en: [
      { id: 'sig', indent: 0, text: 'NON_UNIFORM_MUTATION(P, pm, t, T, b, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copy of P' },
      { id: 'exp', indent: 1, text: 'e ← (1 − t/T)^b' },
      { id: 'forPos', indent: 1, text: 'for each position i:' },
      { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
      { id: 'test', indent: 2, text: 'if r < pm:' },
      { id: 'dir', indent: 3, text: 'draw τ and u in [0, 1)' },
      { id: 'up', indent: 3, text: 'if τ < 0.5:  M[i] ← M[i] + (U − M[i]) · (1 − u^e)' },
      { id: 'down', indent: 3, text: 'otherwise:  M[i] ← M[i] − (M[i] − L) · (1 − u^e)' },
      { id: 'return', indent: 1, text: 'return M' },
    ],
  };
  const keywords = { es: ['sortear', 'para cada', 'si no', 'si', 'devolver'], en: ['draw', 'for each', 'otherwise', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'], copy: ['copy'], drawIntro: ['exp', 'forPos', 'draw', 'test'], drawKeep: ['draw', 'test'],
    drawHit: ['test', 'dir', 'up', 'down'], done: ['return'],
  };
  const fnName = { python: 'non_uniform', javascript: 'nonUniform' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'non_uniform.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def non_uniform(parent, t, T, pm=None, b=5.0, low=0.0, high=10.0, rng=random):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    e = (1 - t / T) ** b  # {{exp}}
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:
            tau, u = rng.random(), rng.random()
            v = mutant[i]
            if tau < 0.5:
                mutant[i] = v + (high - v) * (1 - u ** e)  # {{up}}
            else:
                mutant[i] = v - (v - low) * (1 - u ** e)  # {{down}}
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.1, 0.3, 0.5, 0.9, 0.7, 0.6, 0.8])

    class Fixed:
        def random(self):
            return next(draws)

    m = non_uniform([4.2, 1.7, 8.5, 2.1, 6.0], 50, 100, 0.25, 5, rng=Fixed())
    print([round(x, 2) for x in m])  # [4.32, 1.7, 8.5, 2.1, 6.0]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'non-uniform.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function nonUniform(parent, t, T, pm, b = 5, low = 0, high = 10, rng = Math.random) {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const e = Math.pow(1 - t / T, b); // {{exp}}
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) {
      const tau = rng();
      const u = rng();
      const v = mutant[i];
      if (tau < 0.5) mutant[i] = v + (high - v) * (1 - Math.pow(u, e)); // {{up}}
      else mutant[i] = v - (v - low) * (1 - Math.pow(u, e)); // {{down}}
    }
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { nonUniform };
  if (require.main === module) {
    // {{example}}
    const draws = [0.1, 0.3, 0.5, 0.9, 0.7, 0.6, 0.8];
    let k = 0;
    const m = nonUniform([4.2, 1.7, 8.5, 2.1, 6.0], 50, 100, 0.25, 5, 0, 10, () => draws[k++]);
    console.log(m.map((x) => Math.round(x * 100) / 100)); // [4.32, 1.7, 8.5, 2.1, 6]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación no uniforme de Michalewicz para representación real.',
      ref: 'Referencias: Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Mutación cuyo salto se estrecha con el avance de la búsqueda (generación t de un máximo de T). Cada posición muta con probabilidad pm (por defecto 1/n); b controla lo deprisa que se estrecha. rng es cualquier objeto con un método random() en [0, 1).',
      exp: 'exponente: 1 al principio, tiende a 0 al final',
      up: 'hacia arriba: una fracción del hueco hasta high',
      down: 'hacia abajo: una fracción del hueco hasta low',
      example: 'Ejemplo con números aleatorios fijados a mitad de la búsqueda (t/T = 0,5): solo muta el 1.er gen, hacia arriba',
    },
    en: {
      title: 'Michalewicz’s non-uniform mutation for real-valued representations.',
      ref: 'References: Michalewicz, Z. (1996); Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020).',
      doc1: 'Mutation whose jump narrows as the search progresses (generation t out of a maximum T). Each position mutates with probability pm (1/n by default); b controls how fast it narrows. rng is any object with a random() method in [0, 1).',
      exp: 'exponent: 1 at first, tends to 0 at the end',
      up: 'upwards: a fraction of the gap to high',
      down: 'downwards: a fraction of the gap to low',
      example: 'Example with fixed random numbers halfway through the search (t/T = 0.5): only the 1st gene mutates, upwards',
    },
  };

  const references = [
    C.ref('michalewicz', {
      es: 'Propone la mutación no uniforme, cuyo salto se estrecha con las generaciones, para los algoritmos genéticos con codificación real, y la compara con la mutación uniforme.',
      en: 'Proposes non-uniform mutation, whose jump narrows over the generations, for real-coded genetic algorithms, and compares it with uniform mutation.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la mutación de las representaciones reales en el apartado 3.3.2.2; la no uniforme pasa de poco local a muy local a lo largo de la búsqueda.',
      en: 'The course’s reference textbook. Covers mutation for real-valued representations in section 3.3.2.2; non-uniform mutation moves from barely local to very local over the search.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('herrera', {
      es: 'Revisión de los operadores de los algoritmos genéticos con codificación real; describe la mutación no uniforme y su efecto a lo largo de la búsqueda.',
      en: 'Review of the operators of real-coded genetic algorithms; describes non-uniform mutation and its effect over the search.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Ojo: su apartado 4.4.2 llama «no uniforme» a la mutación gaussiana, no a la de Michalewicz.',
      en: 'Evolutionary computing textbook. Beware: its section 4.4.2 calls Gaussian mutation “non-uniform”, not Michalewicz’s.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'non-uniform', explanation, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {})['non-uniform'] = api;
})(typeof self !== 'undefined' ? self : this);
