/*
 * Contenido docente de la mutación por deslizamiento (creep, representación entera).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La mutación por deslizamiento (creep) cambia cada gen, con probabilidad pm, sumándole un paso pequeño, positivo o negativo. Aquí el paso se elige al azar entre −s…−1 y +1…+s, todos con la misma probabilidad, donde s es el paso máximo. El valor se «desliza» hacia un vecino, en lugar de saltar a cualquier parte.',
      'Es la mutación adecuada cuando los valores son cantidades ordenadas: número de unidades de un lote, operarios de un turno, días de holgura. Entonces un valor próximo suele ser una solución parecida, y los pasos pequeños dan una mutación muy local, que es lo que pide Talbi (2009). Eiben y Smith (2015) la proponen precisamente para atributos ordinales, frente al reinicio aleatorio para los cardinales.',
      'Hay que decidir qué hacer en los extremos del rango. Lo habitual es recortar: si el valor se sale, se queda en el límite, y entonces un gen que ya está en el extremo no cambia si el paso lo empuja hacia fuera. La otra opción es dar la vuelta, tratando el rango como circular (después del 9 viene el 0), que solo tiene sentido si la variable es cíclica, como una hora del día o un día de la semana; si no lo es, un paso pequeño se convierte en un salto enorme.',
      'Con el paso máximo s se controla cuánto explora la mutación: s = 1 es lo más local; un s mayor permite moverse más deprisa, a costa de perder localidad.',
      'Coste: uno o dos sorteos por posición, en tiempo O(n).',
    ],
    en: [
      'Creep mutation changes each gene, with probability pm, by adding a small step, positive or negative. Here the step is drawn at random among −s…−1 and +1…+s, all equally likely, where s is the maximum step. The value “creeps” to a neighbour instead of jumping anywhere.',
      'It is the right mutation when values are ordered quantities: units in a batch, workers on a shift, days of slack. Then a nearby value is usually a similar solution, and small steps give a very local mutation, which is what Talbi (2009) asks for. Eiben and Smith (2015) propose it precisely for ordinal attributes, as opposed to random resetting for cardinal ones.',
      'One must decide what happens at the ends of the range. The usual choice is to clamp: if the value goes out, it stays at the bound, so a gene already at the bound does not change if the step pushes it outwards. The other option is to wrap around, treating the range as circular (0 comes after 9), which only makes sense if the variable is cyclic, such as an hour of the day or a day of the week; otherwise a small step becomes a huge jump.',
      'The maximum step s controls how much the mutation explores: s = 1 is the most local; a larger s moves faster, at the cost of locality.',
      'Cost: one or two draws per position, in O(n) time.',
    ],
  };

  const variants = {
    clamp: {
      name: { es: 'Recortar en los límites', en: 'Clamp at the bounds' },
      desc: {
        es: 'Si el valor se sale del rango, se queda en el extremo. Es la opción habitual.',
        en: 'If the value goes out of range, it stays at the bound. This is the usual option.',
      },
    },
    wrap: {
      name: { es: 'Dar la vuelta', en: 'Wrap around' },
      desc: {
        es: 'El rango se trata como circular: después del 9 viene el 0. Solo tiene sentido si la variable es cíclica.',
        en: 'The range is treated as circular: 0 comes after 9. It only makes sense if the variable is cyclic.',
      },
    },
  };

  const narration = {
    es: {
      intro: 'Partimos de un padre, un vector de {n} enteros entre {lo} y {hi}. Cada posición mutará con probabilidad pm = {pm}, con un paso de, como mucho, {step}.',
      copy: 'El mutante empieza siendo una copia del padre.',
      drawIntro: 'Para cada posición se sortea r entre 0 y 1. Si r < pm, se sortea otro número u y se elige el paso entre {steps}, todos igual de probables: k = ⌊u · {twoS}⌋ indica cuál.',
      drawKeep: 'Posición {pos}: r = {r} ≥ pm = {pm}. El gen no muta.',
      drawStep: 'Posición {pos}: r = {r} < pm = {pm}. Paso: u = {s}, k = {k}, que corresponde a {delta}. Cambia: {a} {delta} = {v}.',
      drawClamp: 'Posición {pos}: r = {r} < pm = {pm}. Paso: u = {s}, que corresponde a {delta}. {a} {delta} = {raw} se sale del rango [{lo}, {hi}]: se recorta a {v}.',
      drawClampSame: 'Posición {pos}: r = {r} < pm = {pm}. Paso: u = {s}, que corresponde a {delta}. {a} {delta} = {raw} se sale del rango [{lo}, {hi}] y se recorta a {v}, el valor que ya tenía: el gen no cambia.',
      drawWrap: 'Posición {pos}: r = {r} < pm = {pm}. Paso: u = {s}, que corresponde a {delta}. {a} {delta} = {raw} se sale del rango [{lo}, {hi}]: se da la vuelta y queda en {v}.',
      done: 'Resultado: han cambiado {k} genes (posiciones {list}), y ninguno se ha movido más de {step}: la mutación es local, el mutante es un vecino próximo del padre.',
      doneWrap: 'Resultado: han cambiado {k} genes (posiciones {list}). Al dar la vuelta, algún gen ha saltado {maxJump} unidades aunque el paso máximo es {step}: si la variable no es cíclica, se pierde la localidad.',
      doneOne: 'Resultado: ha cambiado 1 gen (posición {list}) y no se ha movido más de {step}: la mutación es local, el mutante es un vecino próximo del padre.',
      doneWrapOne: 'Resultado: ha cambiado 1 gen (posición {list}). Al dar la vuelta ha saltado {maxJump} unidades aunque el paso máximo es {step}: si la variable no es cíclica, se pierde la localidad.',
      doneNone: 'Resultado: no ha cambiado ningún gen y el mutante es una copia del padre.',
    },
    en: {
      intro: 'We start from a parent, a vector of {n} integers between {lo} and {hi}. Each position will mutate with probability pm = {pm}, with a step of at most {step}.',
      copy: 'The mutant starts as a copy of the parent.',
      drawIntro: 'For each position r is drawn between 0 and 1. If r < pm, another number u is drawn and the step is chosen among {steps}, all equally likely: k = ⌊u · {twoS}⌋ says which.',
      drawKeep: 'Position {pos}: r = {r} ≥ pm = {pm}. The gene does not mutate.',
      drawStep: 'Position {pos}: r = {r} < pm = {pm}. Step: u = {s}, k = {k}, which means {delta}. It changes: {a} {delta} = {v}.',
      drawClamp: 'Position {pos}: r = {r} < pm = {pm}. Step: u = {s}, which means {delta}. {a} {delta} = {raw} is out of the range [{lo}, {hi}]: it is clamped to {v}.',
      drawClampSame: 'Position {pos}: r = {r} < pm = {pm}. Step: u = {s}, which means {delta}. {a} {delta} = {raw} is out of the range [{lo}, {hi}] and is clamped to {v}, the value it already had: the gene does not change.',
      drawWrap: 'Position {pos}: r = {r} < pm = {pm}. Step: u = {s}, which means {delta}. {a} {delta} = {raw} is out of the range [{lo}, {hi}]: it wraps around to {v}.',
      done: 'Result: {k} genes have changed (positions {list}), and none has moved more than {step}: the mutation is local, the mutant is a close neighbour of the parent.',
      doneWrap: 'Result: {k} genes have changed (positions {list}). Wrapping around, some gene has jumped {maxJump} units although the maximum step is {step}: if the variable is not cyclic, locality is lost.',
      doneOne: 'Result: 1 gene has changed (position {list}) and it has not moved more than {step}: the mutation is local, the mutant is a close neighbour of the parent.',
      doneWrapOne: 'Result: 1 gene has changed (position {list}). Wrapping around, it has jumped {maxJump} units although the maximum step is {step}: if the variable is not cyclic, locality is lost.',
      doneNone: 'Result: no gene has changed and the mutant is a copy of the parent.',
    },
  };

  function pseudocode(lang, variant) {
    const wrap = variant === 'wrap';
    if (lang === 'en') {
      return [
        { id: 'sig', indent: 0, text: 'CREEP_MUTATION(P, pm, s, L, U)' },
        { id: 'copy', indent: 1, text: 'M ← copy of P' },
        { id: 'forPos', indent: 1, text: 'for each position i:' },
        { id: 'draw', indent: 2, text: 'draw r in [0, 1)' },
        { id: 'test', indent: 2, text: 'if r < pm:' },
        { id: 'step', indent: 3, text: 'd ← step drawn among −s…−1, +1…+s' },
        { id: 'mutate', indent: 3, text: 'M[i] ← M[i] + d' },
        wrap
          ? { id: 'bounds', indent: 3, text: 'if M[i] is out of [L, U]: wrap around (U + 1 → L, L − 1 → U)' }
          : { id: 'bounds', indent: 3, text: 'M[i] ← min(U, max(L, M[i]))        // clamp' },
        { id: 'return', indent: 1, text: 'return M' },
      ];
    }
    return [
      { id: 'sig', indent: 0, text: 'MUTACIÓN_POR_DESLIZAMIENTO(P, pm, s, L, U)' },
      { id: 'copy', indent: 1, text: 'M ← copia de P' },
      { id: 'forPos', indent: 1, text: 'para cada posición i:' },
      { id: 'draw', indent: 2, text: 'sortear r en [0, 1)' },
      { id: 'test', indent: 2, text: 'si r < pm:' },
      { id: 'step', indent: 3, text: 'd ← paso sorteado entre −s…−1, +1…+s' },
      { id: 'mutate', indent: 3, text: 'M[i] ← M[i] + d' },
      wrap
        ? { id: 'bounds', indent: 3, text: 'si M[i] sale de [L, U]: dar la vuelta (U + 1 → L, L − 1 → U)' }
        : { id: 'bounds', indent: 3, text: 'M[i] ← mín(U, máx(L, M[i]))        // recortar' },
      { id: 'return', indent: 1, text: 'devolver M' },
    ];
  }
  const keywords = { es: ['sortear', 'para cada', 'si', 'devolver'], en: ['draw', 'for each', 'if', 'return'] };
  const stepLines = {
    intro: ['sig'], copy: ['copy'], drawIntro: ['forPos', 'draw', 'test'], drawKeep: ['draw', 'test'],
    drawHit: ['test', 'step', 'mutate', 'bounds'], done: ['return'],
  };
  const fnName = { python: 'creep', javascript: 'creep' };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'creep.py',
      template: `"""
{{title}}
{{ref}}
"""
import random


def creep(parent, pm=None, step=1, low=0, high=9, rng=random, bounds="clamp"):
    """{{doc1}}"""
    n = len(parent)
    if pm is None:
        pm = 1 / n
    mutant = list(parent)
    for i in range(n):
        if rng.random() < pm:
            k = int(rng.random() * 2 * step)  # {{k}}
            d = k - step if k < step else k - step + 1  # {{d}}
            v = mutant[i] + d
            if bounds == "clamp":
                v = min(high, max(low, v))  # {{clamp}}
            else:
                v = low + (v - low) % (high - low + 1)  # {{wrap}}
            mutant[i] = v
    return mutant


if __name__ == "__main__":
    # {{example}}
    draws = iter([0.2, 0.7, 0.1, 0.9, 0.5, 0.8, 0.6])

    class Fixed:
        def random(self):
            return next(draws)

    print(creep([3, 9, 1, 4, 6], 0.25, 1, rng=Fixed()))  # [4, 9, 1, 4, 6]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'creep.js',
      template: `/**
 * {{title}}
 * {{ref}}
 *
 * {{doc1}}
 */
function creep(parent, pm, step = 1, low = 0, high = 9, rng = Math.random, bounds = 'clamp') {
  const n = parent.length;
  if (pm === undefined) pm = 1 / n;
  const mutant = parent.slice();
  for (let i = 0; i < n; i++) {
    if (rng() < pm) {
      const k = Math.floor(rng() * 2 * step); // {{k}}
      const d = k < step ? k - step : k - step + 1; // {{d}}
      let v = mutant[i] + d;
      if (bounds === 'clamp') v = Math.min(high, Math.max(low, v)); // {{clamp}}
      else v = low + ((((v - low) % (high - low + 1)) + (high - low + 1)) % (high - low + 1)); // {{wrap}}
      mutant[i] = v;
    }
  }
  return mutant;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { creep };
  if (require.main === module) {
    // {{example}}
    const draws = [0.2, 0.7, 0.1, 0.9, 0.5, 0.8, 0.6];
    let k = 0;
    console.log(creep([3, 9, 1, 4, 6], 0.25, 1, 0, 9, () => draws[k++])); // [4, 9, 1, 4, 6]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Mutación por deslizamiento (creep) para representación entera.',
      ref: 'Referencias: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. y Smith, J. E. (2015).',
      doc1: 'Cada posición, con probabilidad pm (por defecto 1/n), se desplaza un paso al azar entre -step..-1 y +1..+step. Con bounds="clamp" el valor se recorta a [low, high]; con bounds="wrap" el rango es circular. rng es cualquier objeto con un método random() en [0, 1).',
      k: 'k = 0 .. 2·step − 1, todos igual de probables',
      d: 'paso: -step..-1 o +1..+step (nunca 0)',
      clamp: 'recortar: se queda en el extremo',
      wrap: 'dar la vuelta: rango circular',
      example: 'Ejemplo con números aleatorios fijados: el 1.er gen sube 1; el 9 de la 2.ª posición se recorta',
    },
    en: {
      title: 'Creep mutation for integer representations.',
      ref: 'References: Talbi, E.-G. (2009); Bautista-Valhondo, J. (2020); Eiben, A. E. & Smith, J. E. (2015).',
      doc1: 'Each position, with probability pm (1/n by default), moves by a random step among -step..-1 and +1..+step. With bounds="clamp" the value is clamped to [low, high]; with bounds="wrap" the range is circular. rng is any object with a random() method in [0, 1).',
      k: 'k = 0 .. 2·step − 1, all equally likely',
      d: 'step: -step..-1 or +1..+step (never 0)',
      clamp: 'clamp: it stays at the bound',
      wrap: 'wrap around: circular range',
      example: 'Example with fixed random numbers: the 1st gene goes up by 1; the 9 at the 2nd position is clamped',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. La propiedad de localidad (apartado 3.3.2.2) pide que el mutante se parezca al padre; con valores ordenados, los pasos pequeños del deslizamiento la cumplen mejor que el reinicio aleatorio.',
      en: 'The course’s reference textbook. The locality property (section 3.3.2.2) asks the mutant to resemble its parent; with ordered values, the small steps of creep meet it better than random resetting.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Trata la representación de las soluciones y su mutación en el capítulo 8, dedicado a los algoritmos genéticos.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Covers solution representation and mutation in chapter 8, on genetic algorithms.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Su apartado 4.3.2 presenta la mutación por deslizamiento para atributos ordinales: sumar un valor pequeño, positivo o negativo, sacado de una distribución simétrica alrededor de cero.',
      en: 'Evolutionary computing textbook. Section 4.3.2 presents creep mutation for ordinal attributes: adding a small positive or negative value drawn from a distribution symmetric around zero.',
    }),
    C.ref('luke', {
      es: 'Para vectores de enteros presenta una mutación por paseo aleatorio (random walk) que, como el deslizamiento, mueve el gen a valores próximos.',
      en: 'For integer vectors presents a random-walk mutation that, like creep, moves the gene to nearby values.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({ id: 'creep', explanation, variants, narration, pseudocode, keywords, stepLines, fnName, codeTemplates, references }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).creep = api;
})(typeof self !== 'undefined' ? self : this);
