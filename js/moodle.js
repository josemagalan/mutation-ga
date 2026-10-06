/*
 * Generador de bancos de preguntas para Moodle (formato Moodle XML).
 *
 * Cada pregunta se construye con los mismos operadores que la aplicación, así que la respuesta
 * guardada es la que da el operador. La retroalimentación general enlaza a la web publicada con
 * el hash que reproduce el ejercicio (y, en «detectar el error», el paso donde se comete).
 *
 * Tipos: «calcular el mutante» (cloze, una casilla por gen), «identificar el operador» y
 * «detectar el error» (opción múltiple con penalización −1/(k−1) en las erróneas).
 * Niveles: fácil, media y difícil, con filtros por ejemplar (longitud, posiciones que mutan,
 * distancia entre posiciones, longitud del tramo, recortes en los límites…).
 *
 * El nombre de cada pregunta (que el alumno no ve) lleva su semilla, para reproducirla. La semilla
 * base del banco es aleatoria en cada exportación, para que no se pueda regenerar el banco.
 */
(function (root) {
  'use strict';

  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('./rng.js') : root.GAX.rng;
  const B = isNode ? require('./operators/bin-utils.js') : root.GAX.binUtils;
  const I = isNode ? require('./operators/int-utils.js') : root.GAX.intUtils;
  const U = isNode ? require('./operators/real-utils.js') : root.GAX.realUtils;
  const OPS = isNode ? {
    'bit-flip': require('./operators/bit-flip.js'),
    creep: require('./operators/creep.js'),
    gaussian: require('./operators/gaussian.js'),
    swap: require('./operators/swap.js'),
    insert: require('./operators/insert.js'),
    inversion: require('./operators/inversion.js'),
    scramble: require('./operators/scramble.js'),
  } : root.GAX.operators;

  const APP = 'https://josemagalan.github.io/mutation-ga/';
  const LEVELS = ['easy', 'medium', 'hard'];
  const MAX_TRIES = 20000;
  const REAL_TOL = 0.05;

  // ---------- Textos ----------

  const T = {
    es: {
      root: 'Mutación',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      type: { calc: 'Calcular el mutante', identify: 'Identificar el operador', error: 'Detectar el error' },
      op: {
        'bit-flip': 'Inversión de bits', creep: 'Deslizamiento (enteros)', gaussian: 'Gaussiana (reales)',
        swap: 'Intercambio', insert: 'Inserción', inversion: 'Inversión',
      },
      parent: 'Padre',
      mutant: 'Mutante',
      studentMutant: 'Mutante del estudiante',
      shownMutant: 'Mutante',
      apply: (op) => `<p>Aplica la <strong>${op}</strong> a este padre.</p>`,
      opFull: {
        'bit-flip': 'mutación por inversión de bits', creep: 'mutación por deslizamiento (creep)', gaussian: 'mutación gaussiana',
        swap: 'mutación por intercambio', insert: 'mutación por inserción', inversion: 'mutación por inversión',
      },
      conv: {
        'bit-flip': (pm) => `Se da el número aleatorio r de cada posición. La posición muta (su bit se invierte) si r &lt; pm, con pm = ${pm}.`,
        creep: (pm, s, steps) => `Rango de los genes: de 0 a 9. Se da r para cada posición; muta si r &lt; pm, con pm = ${pm}. Si muta, se da también u, y k = ⌊u · ${2 * s}⌋ elige el paso en la lista ${steps} (k = 0 es el primero). Si el valor se sale del rango, se recorta (se queda en 0 o en 9).`,
        gaussian: (pm, sigma) => `Intervalo de los genes: de 0 a 10. Se da r para cada posición; muta si r &lt; pm, con pm = ${pm}. Si muta, se da también z, de una normal N(0, 1), y el gen pasa a valer v + σ · z con σ = ${sigma}, recortado a [0, 10]. Escribe los valores con dos decimales (se admite un error de ±${String(REAL_TOL).replace('.', ',')}).`,
        swap: (i, j) => `Se han elegido las posiciones i = ${i} y j = ${j} (resaltadas).`,
        insert: (i, j) => `Se ha elegido el gen de la posición i = ${i} para moverlo a la posición j = ${j} (resaltadas): el gen acaba exactamente en la posición j y los que hay entre medias se desplazan un lugar.`,
        inversion: (a, b) => `Se ha elegido el tramo de las posiciones ${a} a ${b} (entre las rayas rojas).`,
      },
      drawRow: { r: 'r', u: 'u', z: 'z' },
      solution: (m) => `<p><strong>Solución.</strong> Mutante = ${m}</p>`,
      hitsItem: (list) => `Posiciones que mutan (r &lt; pm): ${list}.`,
      noHits: 'Ninguna posición muta: el mutante es una copia del padre.',
      stepLink: 'Ver la resolución paso a paso de este ejercicio',
      identifyStem: '<p>Una mutación de permutaciones ha transformado el padre en este mutante con <strong>una sola aplicación</strong>.</p>',
      identifyQ: '<p>¿Qué operador se ha aplicado?</p>',
      cand: {
        swap: 'Intercambio de dos genes',
        insert: 'Inserción de un gen en otra posición',
        inversion: 'Inversión de un tramo',
        scramble: 'Ninguno de los tres: se ha reordenado un tramo al azar (mezcla)',
      },
      why: {
        swap: (m) => `Correcto: se han intercambiado los genes de las posiciones ${m[0] + 1} y ${m[1] + 1}.`,
        insert: (m) => `Correcto: el gen de la posición ${m[0] + 1} se ha movido a la ${m[1] + 1}.`,
        inversion: (m) => `Correcto: se ha invertido el tramo de las posiciones ${m[0] + 1} a ${m[1]}.`,
        scramble: (m) => `Correcto: ni un intercambio, ni una inserción, ni una inversión dan este mutante; se ha mezclado el tramo de las posiciones ${m[0] + 1} a ${m[1]}.`,
      },
      notThis: {
        swap: 'Ningún intercambio de dos genes da este mutante: cuenta cuántos genes han cambiado de posición.',
        insert: 'Ninguna inserción da este mutante: con una inserción, el orden relativo de todos los demás genes se mantiene.',
        inversion: 'Ninguna inversión da este mutante: con una inversión, el tramo aparecería exactamente al revés.',
        scramble: 'Sí se puede obtener con uno de los otros tres operadores.',
      },
      seeInApp: 'Verlo en la aplicación',
      identifyGeneral: 'Solo una de las opciones explica el mutante con una sola aplicación.',
      seeCorrect: 'Ver el operador correcto paso a paso',
      errQ: '<p>¿Qué error ha cometido?</p>',
      invErrStem: (a, b) => `<p>Un estudiante aplica la <strong>mutación por inversión</strong> a este padre, con el tramo de las posiciones ${a} a ${b} (entre las rayas rojas).</p>`,
      invErr: {
        ends: 'Solo ha intercambiado los dos genes de los extremos del tramo.',
        extra: 'Ha invertido un tramo con un gen de más.',
        shift: 'Ha desplazado el tramo un lugar (el último gen pasa al principio) en lugar de invertirlo.',
        none: 'No hay ningún error.',
        wouldGive: (m) => `Con ese error saldría ${m}.`,
        isIt: 'Correcto: es exactamente lo que ha hecho.',
        noneFb: (m) => `El mutante correcto es ${m}.`,
        general: (m) => `<p><strong>Mutante correcto:</strong> ${m}. Hay que escribir los genes del tramo en orden inverso, sin tocar los de fuera.</p>`,
        link: 'Ver en la aplicación la inversión correcta',
      },
      bitErrStem: (pm) => `<p>Un estudiante aplica la <strong>mutación por inversión de bits</strong> con pm = ${pm} y estos números aleatorios r.</p>`,
      bitErr: {
        complement: 'Ha invertido los bits de las posiciones con r ≥ pm, en lugar de las de r &lt; pm.',
        shift: 'Ha invertido el bit de la posición siguiente a cada r &lt; pm.',
        set1: 'Ha puesto un 1 en las posiciones que mutan, en lugar de invertir su bit.',
        none: 'No hay ningún error.',
        wouldGive: (m) => `Con ese error saldría ${m}.`,
        isIt: 'Correcto: es exactamente lo que ha hecho.',
        noneFb: (m) => `El mutante correcto es ${m}.`,
        general: (m, list) => `<p><strong>Mutante correcto:</strong> ${m}. Mutan las posiciones con r &lt; pm (${list}) y en ellas el bit se invierte: 0 ↔ 1.</p>`,
        link: 'Ver en la aplicación la primera posición que muta',
      },
      errName: { 'bit-flip': 'error', inversion: 'error' },
    },
    en: {
      root: 'Mutation',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      type: { calc: 'Compute the mutant', identify: 'Identify the operator', error: 'Spot the mistake' },
      op: {
        'bit-flip': 'Bit flip', creep: 'Creep (integers)', gaussian: 'Gaussian (reals)',
        swap: 'Swap', insert: 'Insert', inversion: 'Inversion',
      },
      parent: 'Parent',
      mutant: 'Mutant',
      studentMutant: 'Student’s mutant',
      shownMutant: 'Mutant',
      apply: (op) => `<p>Apply <strong>${op}</strong> to this parent.</p>`,
      opFull: {
        'bit-flip': 'bit-flip mutation', creep: 'creep mutation', gaussian: 'Gaussian mutation',
        swap: 'swap mutation', insert: 'insert mutation', inversion: 'inversion mutation',
      },
      conv: {
        'bit-flip': (pm) => `The random number r for each position is given. The position mutates (its bit is flipped) if r &lt; pm, with pm = ${pm}.`,
        creep: (pm, s, steps) => `Gene range: 0 to 9. r is given for each position; it mutates if r &lt; pm, with pm = ${pm}. If it mutates, u is also given, and k = ⌊u · ${2 * s}⌋ picks the step from the list ${steps} (k = 0 is the first). If the value leaves the range, it is clamped (it stays at 0 or 9).`,
        gaussian: (pm, sigma) => `Gene interval: 0 to 10. r is given for each position; it mutates if r &lt; pm, with pm = ${pm}. If it mutates, z from a normal N(0, 1) is also given, and the gene becomes v + σ · z with σ = ${sigma}, clamped to [0, 10]. Write the values with two decimals (an error of ±${REAL_TOL} is accepted).`,
        swap: (i, j) => `Positions i = ${i} and j = ${j} have been chosen (highlighted).`,
        insert: (i, j) => `The gene at position i = ${i} has been chosen to move to position j = ${j} (highlighted): the gene ends up exactly at position j and the ones in between shift by one place.`,
        inversion: (a, b) => `The stretch from position ${a} to ${b} has been chosen (between the red lines).`,
      },
      drawRow: { r: 'r', u: 'u', z: 'z' },
      solution: (m) => `<p><strong>Solution.</strong> Mutant = ${m}</p>`,
      hitsItem: (list) => `Positions that mutate (r &lt; pm): ${list}.`,
      noHits: 'No position mutates: the mutant is a copy of the parent.',
      stepLink: 'See the step-by-step solution of this exercise',
      identifyStem: '<p>A permutation mutation has turned the parent into this mutant with <strong>a single application</strong>.</p>',
      identifyQ: '<p>Which operator was applied?</p>',
      cand: {
        swap: 'Swapping two genes',
        insert: 'Inserting a gene at another position',
        inversion: 'Reversing a stretch',
        scramble: 'None of the three: a stretch has been randomly reordered (scramble)',
      },
      why: {
        swap: (m) => `Correct: the genes at positions ${m[0] + 1} and ${m[1] + 1} have been swapped.`,
        insert: (m) => `Correct: the gene at position ${m[0] + 1} has been moved to position ${m[1] + 1}.`,
        inversion: (m) => `Correct: the stretch from position ${m[0] + 1} to ${m[1]} has been reversed.`,
        scramble: (m) => `Correct: no swap, insertion or inversion gives this mutant; the stretch from position ${m[0] + 1} to ${m[1]} has been scrambled.`,
      },
      notThis: {
        swap: 'No swap of two genes gives this mutant: count how many genes have changed position.',
        insert: 'No insertion gives this mutant: with an insertion, the relative order of all the other genes is kept.',
        inversion: 'No inversion gives this mutant: with an inversion, the stretch would appear exactly reversed.',
        scramble: 'It can be obtained with one of the other three operators.',
      },
      seeInApp: 'See it in the app',
      identifyGeneral: 'Only one of the options explains the mutant with a single application.',
      seeCorrect: 'See the correct operator step by step',
      errQ: '<p>What mistake did they make?</p>',
      invErrStem: (a, b) => `<p>A student applies <strong>inversion mutation</strong> to this parent, with the stretch from position ${a} to ${b} (between the red lines).</p>`,
      invErr: {
        ends: 'They only swapped the two genes at the ends of the stretch.',
        extra: 'They reversed a stretch one gene too long.',
        shift: 'They shifted the stretch by one place (the last gene moves to the front) instead of reversing it.',
        none: 'There is no mistake.',
        wouldGive: (m) => `With that mistake the result would be ${m}.`,
        isIt: 'Correct: that is exactly what they did.',
        noneFb: (m) => `The correct mutant is ${m}.`,
        general: (m) => `<p><strong>Correct mutant:</strong> ${m}. The genes of the stretch must be written in reverse order, leaving the others untouched.</p>`,
        link: 'See the correct inversion in the app',
      },
      bitErrStem: (pm) => `<p>A student applies <strong>bit-flip mutation</strong> with pm = ${pm} and these random numbers r.</p>`,
      bitErr: {
        complement: 'They flipped the bits at the positions with r ≥ pm instead of those with r &lt; pm.',
        shift: 'They flipped the bit at the position after each r &lt; pm.',
        set1: 'They wrote a 1 at the positions that mutate instead of flipping their bit.',
        none: 'There is no mistake.',
        wouldGive: (m) => `With that mistake the result would be ${m}.`,
        isIt: 'Correct: that is exactly what they did.',
        noneFb: (m) => `The correct mutant is ${m}.`,
        general: (m, list) => `<p><strong>Correct mutant:</strong> ${m}. The positions with r &lt; pm mutate (${list}) and there the bit is flipped: 0 ↔ 1.</p>`,
        link: 'See the first position that mutates in the app',
      },
      errName: { 'bit-flip': 'mistake', inversion: 'mistake' },
    },
  };

  // ---------- Tipos de pregunta y niveles ----------

  const KINDS = [
    { id: 'calc-bit-flip', type: 'calc', op: 'bit-flip' },
    { id: 'calc-creep', type: 'calc', op: 'creep' },
    { id: 'calc-gaussian', type: 'calc', op: 'gaussian' },
    { id: 'calc-swap', type: 'calc', op: 'swap' },
    { id: 'calc-insert', type: 'calc', op: 'insert' },
    { id: 'calc-inversion', type: 'calc', op: 'inversion' },
    { id: 'identify', type: 'identify', op: null },
    { id: 'error-bit-flip', type: 'error', op: 'bit-flip' },
    { id: 'error-inversion', type: 'error', op: 'inversion' },
  ];
  const kindById = (id) => KINDS.find((k) => k.id === id);

  const LEN = {   // longitud del cromosoma por representación y nivel (en permutaciones, la que se elija)
    binary: { easy: 8, medium: 10, hard: 12 },
    integer: { easy: 6, medium: 8, hard: 10 },
    real: { easy: 5, medium: 6, hard: 8 },
  };
  const HITS = { easy: [1, 2], medium: [2, 3], hard: [3, 4] };   // posiciones que mutan
  const DIST = { easy: [1, 3], medium: [3, 4], hard: [5, 11] };  // |i − j| en intercambio e inserción
  const SEG = { easy: [3, 3], medium: [4, 4], hard: [5, 6] };    // genes del tramo en la inversión
  // En «detectar el error», tramos de al menos 4 genes: con 3, intercambiar los extremos ya es invertir.
  const SEG_ERR = { easy: [4, 4], medium: [5, 5], hard: [6, 7] };
  const PM = { 'bit-flip': 0.25, creep: 0.4, gaussian: 0.4 };
  const SIGMA = { easy: 0.5, medium: 1, hard: 1.5 };
  const STEP = { easy: 1, medium: 1, hard: 2 };
  const inRange = (x, [lo, hi]) => x >= lo && x <= hi;
  /** Pasos posibles del deslizamiento, en el orden en que los elige k: −s…−1, +1…+s. */
  const stepList = (s) => Array.from({ length: 2 * s }, (_, k) => (k < s ? `−${s - k}` : `+${k - s + 1}`));

  // ---------- Utilidades ----------

  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (v, lang, d) => {
    const s = v.toFixed(d);
    return lang === 'es' ? s.replace('.', ',') : s;
  };
  const geneText = (v, lang, real) => (real ? num(v, lang, 2) : String(v));
  const fmt = (g, lang, real) => g.map((v) => geneText(v, lang, real)).join(' ');

  function appLink(op, pb, lang, extra) {
    extra = extra || {};
    const q = new URLSearchParams([['op', op], ['lang', lang]]);
    if (extra.v) q.set('v', extra.v);
    if (extra.r) q.set('r', String(extra.r));
    if (extra.params) Object.keys(extra.params).forEach((k) => q.set(k, String(extra.params[k])));
    q.set('p', pb.parent.join('-'));
    if (extra.marks && extra.marks.length) q.set('c', extra.marks.join('-'));
    q.set('s', String(pb.seed % 1000000));   // la aplicación también reduce s= a menos de 10^6
    if (extra.step != null) q.set('step', String(extra.step));
    return `${APP}#${q.toString()}`;
  }
  const a = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;

  const CELL = 'padding:4px 8px;text-align:center;font-family:monospace;font-size:1.1em;';
  const CUT = 'border-left:3px solid #c00;';
  const MARK = 'background:#fde68a;font-weight:bold;';
  /** Fila de una tabla: cuts = posiciones con raya roja a la izquierda; marks = casillas resaltadas. */
  function row(label, cells, o) {
    o = o || {};
    const cs = new Set(o.cuts || []);
    const ms = new Set(o.marks || []);
    const td = cells.map((c, i) => `<td style="${cs.has(i) ? CUT : ''}${ms.has(i) ? MARK : ''}${CELL}">${o.cell ? o.cell(c, i) : esc(c)}</td>`).join('');
    return `<tr><th style="padding:4px 10px;text-align:left;white-space:nowrap;">${esc(label)}</th>${td}</tr>`;
  }
  function posHeader(n, cuts) {
    const cs = new Set(cuts || []);
    const td = Array.from({ length: n }, (_, i) => `<td style="${cs.has(i) ? CUT : ''}padding:0 8px;text-align:center;color:#777;font-size:0.8em;">${i + 1}</td>`).join('');
    return `<tr><th></th>${td}</tr>`;
  }
  const table = (rows) => `<table style="border-collapse:collapse;margin:0.6em 0;">${rows.join('')}</table>`;
  const clozeShort = (v) => `{1:SHORTANSWER:=${v}}`;
  const clozeNum = (v) => `{1:NUMERICAL:=${v.toFixed(2)}:${REAL_TOL}}`;
  const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const gapCuts = (m, n) => [m[0]].concat(m[1] < n ? [m[1]] : []);   // rayas de un tramo [a, b)

  function base(kind, level, pb, L, lang, extraName) {
    const opName = kind.op ? L.op[kind.op] : null;
    const cat = kind.type === 'identify' ? [L.type.identify, L.level[level]] : [opName, L.type[kind.type], L.level[level]];
    const name = [kind.type === 'identify' ? L.type.identify : `${opName} · ${L.type[kind.type]}`, L.level[level].toLowerCase(), `n=${pb.parent.length}`, `s=${pb.seed}`]
      .concat(extraName || []).join(' · ');
    const tags = [`mutation-${kind.op || 'identify'}`, `type-${kind.type}`, `level-${level}`, `lang-${lang}`];
    return { kind: kind.id, level, seed: pb.seed, n: pb.parent.length, category: cat, name, tags, parent: pb.parent };
  }

  // La aplicación reduce el sorteo r= a menos de 10^6: se usa ya reducido para que el enlace lo reproduzca.
  const drawOf = (seed) => (seed % 999999) + 1;

  function pairWithin(r, n, [lo, hi]) {
    for (let t = 0; t < 50; t++) {
      const i = R.randInt(r, 0, n - 1);
      const j = R.randInt(r, 0, n - 1);
      if (i !== j && inRange(Math.abs(i - j), [lo, Math.min(hi, n - 1)])) return [i, j];
    }
    return null;
  }
  function segmentOf(r, n, [lo, hi]) {
    const len = R.randInt(r, lo, Math.min(hi, n - 1));
    const s = R.randInt(r, 0, n - len);
    return [s, s + len];
  }

  // ---------- «Calcular el mutante» ----------

  function calcDrawn(seed, level, L, lang, kind) {
    const op = kind.op;
    const rng = R.mulberry32(seed);
    const rep = op === 'bit-flip' ? 'binary' : op === 'creep' ? 'integer' : 'real';
    const n = LEN[rep][level];
    const parent = rep === 'binary' ? B.randomBits(rng, n) : rep === 'integer' ? I.randomInts(rng, n) : U.randomReals(rng, n);
    const pb = { parent, seed };
    const draw = drawOf(seed);
    const params = { pm: PM[op] };
    if (op === 'creep') params.smax = STEP[level];
    if (op === 'gaussian') params.sigma = SIGMA[level];
    const v = op === 'bit-flip' ? 'flip' : op === 'creep' ? 'clamp' : null;
    const res = OPS[op].spec.run(parent, [], { variant: v, seed: draw, params });
    const items = res.aux.items;
    const hits = items.map((it, i) => (it.hit ? i : -1)).filter((i) => i >= 0);
    if (!inRange(hits.length, HITS[level])) return null;
    if (!res.mutated.length) return null;
    // Difícil: en enteros y reales, al menos un valor se sale del rango y hay que recortarlo
    const clamped = res.steps.some((s) => /Clamp/.test(s.text.key));
    if (level === 'hard' && op !== 'bit-flip' && !clamped) return null;
    if (level !== 'hard' && op !== 'bit-flip' && clamped) return null;

    const real = rep === 'real';
    const rRow = row(L.drawRow.r, items.map((it) => num(it.r, lang, 2)));
    let extraRow = null;
    if (op === 'creep') extraRow = row(L.drawRow.u, items.map((it) => (it.hit ? num(it.s, lang, 2) : '—')));
    if (op === 'gaussian') {
      const zs = res.steps.filter((s) => s.type === 'drawHit').map((s) => s.text.params.z);
      let k = 0;
      extraRow = row(L.drawRow.z, items.map((it) => (it.hit ? num(zs[k++], lang, 2) : '—')));
    }
    const conv = op === 'bit-flip' ? L.conv['bit-flip'](num(params.pm, lang, 2))
      : op === 'creep' ? L.conv.creep(num(params.pm, lang, 2), params.smax, `(${stepList(params.smax).join(', ')})`)
        : L.conv.gaussian(num(params.pm, lang, 2), num(params.sigma, lang, 1));
    const link = appLink(op, pb, lang, { v, r: draw, params });
    const m = res.child;
    const q = base(kind, level, pb, L, lang, [`r=${draw}`]);
    return Object.assign(q, {
      qtype: 'cloze', answer: m, draw, real,
      text: L.apply(L.opFull[op]) +
        table([posHeader(n), row(L.parent, parent.map((g) => geneText(g, lang, real))), rRow].concat(extraRow ? [extraRow] : [])) +
        `<p>${conv}</p>` +
        table([posHeader(n), row(L.mutant, m, { cell: real ? clozeNum : clozeShort })]),
      general: L.solution(fmt(m, lang, real)) + `<p>${L.hitsItem(hits.map((i) => i + 1).join(', '))}</p>` + `<p>${a(link, L.stepLink)}</p>`,
      link,
    });
  }

  function calcPerm(seed, level, L, lang, kind, n) {
    const op = kind.op;
    const rng = R.mulberry32(seed);
    const parent = R.randomPermutation(rng, n);
    const pb = { parent, seed };
    const marks = op === 'inversion' ? segmentOf(rng, n, SEG[level]) : pairWithin(rng, n, DIST[level]);
    if (!marks) return null;
    const res = OPS[op].spec.run(parent, marks, {});
    const m = res.child;
    const cuts = op === 'inversion' ? gapCuts(marks, n) : null;
    const hl = op === 'inversion' ? null : marks;
    const conv = op === 'inversion' ? L.conv.inversion(marks[0] + 1, marks[1]) : L.conv[op](marks[0] + 1, marks[1] + 1);
    const link = appLink(op, pb, lang, { marks });
    const q = base(kind, level, pb, L, lang);
    return Object.assign(q, {
      qtype: 'cloze', answer: m, marks,
      text: L.apply(L.opFull[op]) +
        table([posHeader(n, cuts), row(L.parent, parent, { cuts, marks: hl })]) +
        `<p>${conv}</p>` +
        table([posHeader(n, cuts), row(L.mutant, m, { cuts, cell: clozeShort })]),
      general: L.solution(fmt(m, lang)) + `<p>${a(link, L.stepLink)}</p>`,
      link,
    });
  }

  // ---------- «Identificar el operador» ----------

  /** Qué operadores (intercambio, inserción, inversión) dan `child` desde `parent` con una sola aplicación. */
  function reachable(parent, child) {
    const n = parent.length;
    const out = new Set();
    const key = child.join();
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (i < j && OPS.swap.swapMutation(parent, i, j).child.join() === key) out.add('swap');
        if (OPS.insert.insertMutation(parent, i, j).child.join() === key) out.add('insert');
      }
    }
    for (let x = 0; x < n; x++) for (let y = x + 2; y <= n; y++) if (OPS.inversion.inversionMutation(parent, x, y).child.join() === key) out.add('inversion');
    return out;
  }

  const CANDS = ['swap', 'insert', 'inversion', 'scramble'];

  function identify(seed, level, L, lang, kind, n) {
    const rng = R.mulberry32(seed);
    const parent = R.randomPermutation(rng, n);
    const pb = { parent, seed };
    const target = CANDS[seed % 4];
    let marks;
    if (target === 'inversion') marks = segmentOf(rng, n, SEG[level]);
    else if (target === 'scramble') marks = segmentOf(rng, n, [Math.max(4, SEG[level][0]), Math.max(4, SEG[level][1])]);
    else marks = pairWithin(rng, n, DIST[level]);
    if (!marks) return null;
    const draw = drawOf(seed);
    const res = OPS[target].spec.run(parent, marks, { seed: draw });
    const shown = res.child;
    if (same(shown, parent)) return null;
    const can = reachable(parent, shown);
    if (target === 'scramble' ? can.size !== 0 : !(can.size === 1 && can.has(target))) return null;
    const correct = CANDS.indexOf(target);
    const lnk = (op) => appLink(op, pb, lang, op === target ? { marks, r: op === 'scramble' ? draw : null } : {});
    const q = base(kind, level, pb, L, lang, [`ok=${target}`]);
    return Object.assign(q, {
      qtype: 'multichoice', shown, correct, marks, target, draw,
      options: CANDS.map((c, i) => ({
        text: esc(L.cand[c]), correct: i === correct,
        feedback: i === correct ? `${L.why[c](marks)} ${a(lnk(c), L.seeInApp)}` : L.notThis[c],
      })),
      text: L.identifyStem + table([posHeader(n), row(L.parent, parent), row(L.shownMutant, shown)]) + L.identifyQ,   // sin pistas de posiciones
      general: `<p>${L.identifyGeneral} ${a(lnk(target), L.seeCorrect)}</p>`,
      link: lnk(target),
    });
  }

  // ---------- «Detectar el error» ----------

  /** Errores de la inversión: solo los extremos, un gen de más, desplazar en vez de invertir. */
  function inversionMistakes(parent, a0, b0) {
    const n = parent.length;
    const ends = OPS.swap.swapMutation(parent, a0, b0 - 1).child;
    const extra = b0 < n ? OPS.inversion.inversionMutation(parent, a0, b0 + 1).child : OPS.inversion.inversionMutation(parent, a0 - 1, b0).child;
    const shift = parent.slice(0, a0).concat([parent[b0 - 1]], parent.slice(a0, b0 - 1), parent.slice(b0));
    return { ends, extra, shift };
  }

  function errorInversion(seed, level, L, lang, kind, n) {
    const rng = R.mulberry32(seed);
    const parent = R.randomPermutation(rng, n);
    const pb = { parent, seed };
    const [a0, b0] = segmentOf(rng, n, SEG_ERR[level]);
    const good = OPS.inversion.inversionMutation(parent, a0, b0).child;
    const errs = inversionMistakes(parent, a0, b0);
    if (new Set([good, errs.ends, errs.extra, errs.shift].map((x) => x.join())).size !== 4) return null;
    const which = ['ends', 'extra', 'shift'][seed % 3];
    const shown = errs[which];
    const E = L.invErr;
    const cuts = gapCuts([a0, b0], n);
    const link = appLink('inversion', pb, lang, { marks: [a0, b0], step: 3 });
    const order = ['ends', 'extra', 'shift', 'none'];
    const q = base(kind, level, pb, L, lang, [`${L.errName.inversion}=${which}`]);
    return Object.assign(q, {
      qtype: 'multichoice', shown, correct: order.indexOf(which), mistake: which, marks: [a0, b0], step: 3,
      options: order.map((o) => ({
        text: E[o], correct: o === which,
        feedback: o === which ? E.isIt : o === 'none' ? esc(E.noneFb(fmt(good, lang))) : esc(E.wouldGive(fmt(errs[o], lang))),
      })),
      text: L.invErrStem(a0 + 1, b0) +
        table([posHeader(n, cuts), row(L.parent, parent, { cuts }), row(L.studentMutant, shown, { cuts })]) + L.errQ,
      general: E.general(fmt(good, lang)) + `<p>${a(link, E.link)}</p>`,
      link,
    });
  }

  /** Errores de la inversión de bits: r ≥ pm, la posición siguiente, poner un 1. */
  function bitMistakes(parent, hits) {
    const n = parent.length;
    const hs = new Set(hits);
    return {
      complement: parent.map((b, i) => (hs.has(i) ? b : 1 - b)),
      shift: parent.map((b, i) => (hs.has((i - 1 + n) % n) ? 1 - b : b)),
      set1: parent.map((b, i) => (hs.has(i) ? 1 : b)),
    };
  }

  function errorBitFlip(seed, level, L, lang, kind) {
    const rng = R.mulberry32(seed);
    const n = LEN.binary[level];
    const parent = B.randomBits(rng, n);
    const pb = { parent, seed };
    const draw = drawOf(seed);
    const pm = PM['bit-flip'];
    const res = OPS['bit-flip'].spec.run(parent, [], { variant: 'flip', seed: draw, params: { pm } });
    const items = res.aux.items;
    const hits = items.map((it, i) => (it.hit ? i : -1)).filter((i) => i >= 0);
    if (!inRange(hits.length, [Math.max(2, HITS[level][0]), Math.max(2, HITS[level][1])])) return null;
    const good = res.child;
    const errs = bitMistakes(parent, hits);
    if (new Set([good, errs.complement, errs.shift, errs.set1].map((x) => x.join())).size !== 4) return null;
    const which = ['complement', 'shift', 'set1'][seed % 3];
    const shown = errs[which];
    const E = L.bitErr;
    const step = res.steps.findIndex((s) => s.type === 'drawHit');
    const link = appLink('bit-flip', pb, lang, { v: 'flip', r: draw, params: { pm }, step });
    const order = ['complement', 'shift', 'set1', 'none'];
    const q = base(kind, level, pb, L, lang, [`r=${draw}`, `${L.errName['bit-flip']}=${which}`]);
    return Object.assign(q, {
      qtype: 'multichoice', shown, correct: order.indexOf(which), mistake: which, draw, step,
      options: order.map((o) => ({
        text: E[o], correct: o === which,
        feedback: o === which ? E.isIt : o === 'none' ? esc(E.noneFb(fmt(good, lang))) : esc(E.wouldGive(fmt(errs[o], lang))),
      })),
      text: L.bitErrStem(num(pm, lang, 2)) +
        table([posHeader(n), row(L.parent, parent), row(L.drawRow.r, items.map((it) => num(it.r, lang, 2))), row(L.studentMutant, shown)]) + L.errQ,
      general: E.general(fmt(good, lang), hits.map((i) => i + 1).join(', ')) + `<p>${a(link, E.link)}</p>`,
      link,
    });
  }

  const BUILDERS = {
    'calc-bit-flip': calcDrawn, 'calc-creep': calcDrawn, 'calc-gaussian': calcDrawn,
    'calc-swap': calcPerm, 'calc-insert': calcPerm, 'calc-inversion': calcPerm,
    identify, 'error-bit-flip': errorBitFlip, 'error-inversion': errorInversion,
  };

  // ---------- Generación ----------

  /**
   * Genera las preguntas.
   * opts: { lang, kinds: [id], levels: [id], count, n (permutaciones), seed (base; aleatoria si falta) }
   * → { seed, lang, questions: [...], missing: [{ kind, level, made, wanted }] }
   */
  function generate(opts) {
    const lang = T[opts.lang] ? opts.lang : 'es';
    const L = T[lang];
    const n = Math.max(8, Math.min(10, opts.n || 8));
    const count = Math.max(1, Math.min(50, opts.count || 10));
    const seed = Number.isFinite(opts.seed) ? opts.seed : R.newSeed();
    const questions = [];
    const missing = [];
    const used = new Set();
    let block = 0;
    (opts.kinds || []).forEach((kid) => {
      const kind = kindById(kid);
      if (!kind) return;
      LEVELS.filter((lv) => (opts.levels || []).indexOf(lv) !== -1).forEach((level) => {
        // Cada bloque (tipo × nivel) empieza en su propia zona de semillas.
        let s = seed * 1000 + (block++) * 100003;
        let made = 0;
        for (let tries = 0; made < count && tries < MAX_TRIES; tries++, s++) {
          const sd = s % 2147483647;
          const q = BUILDERS[kid](sd, level, L, lang, kind, n);
          if (!q) continue;
          const key = `${kid}|${q.parent.join()}|${(q.marks || []).join()}|${q.draw || ''}`;
          if (used.has(key)) continue;
          used.add(key);
          questions.push(q);
          made++;
        }
        if (made < count) missing.push({ kind: kid, level, made, wanted: count });
      });
    });
    return { seed, lang, questions, missing };
  }

  // ---------- Moodle XML ----------

  const cdata = (s) => `<![CDATA[${String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

  function toXml(result) {
    const L = T[result.lang] || T.es;
    const out = [];
    let lastCat = null;
    result.questions.forEach((q) => {
      const cat = [L.root].concat(q.category).join('/');
      if (cat !== lastCat) {
        out.push(`  <question type="category">\n    <category><text>$course$/top/${esc(cat)}</text></category>\n  </question>`);
        lastCat = cat;
      }
      let body = '';
      if (q.qtype === 'multichoice') {
        const k = q.options.length;
        const wrong = (-(100 / (k - 1))).toFixed(5);
        body = `    <single>true</single>
    <shuffleanswers>1</shuffleanswers>
    <answernumbering>abc</answernumbering>
    <showstandardinstruction>0</showstandardinstruction>
    <correctfeedback format="html"><text></text></correctfeedback>
    <partiallycorrectfeedback format="html"><text></text></partiallycorrectfeedback>
    <incorrectfeedback format="html"><text></text></incorrectfeedback>
${q.options.map((o) => `    <answer fraction="${o.correct ? 100 : wrong}" format="html">
      <text>${cdata(o.text)}</text>
      <feedback format="html"><text>${cdata(o.feedback)}</text></feedback>
    </answer>`).join('\n')}
`;
      }
      out.push(`  <question type="${q.qtype}">
    <name><text>${esc(q.name)}</text></name>
    <questiontext format="html"><text>${cdata(q.text)}</text></questiontext>
    <generalfeedback format="html"><text>${cdata(q.general)}</text></generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
${body}    <tags>${q.tags.map((t) => `<tag><text>${esc(t)}</text></tag>`).join('')}</tags>
  </question>`);
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${esc(L.root)} · seed ${result.seed} · ${APP} -->\n<quiz>\n${out.join('\n')}\n</quiz>\n`;
  }

  /** Texto de la pregunta para la vista previa: las casillas cloze se sustituyen por campos vacíos. */
  function previewHtml(q) {
    return q.text.replace(/\{1:(SHORTANSWER|NUMERICAL):=[^}]*\}/g, '<input size="3" disabled aria-label="…">');
  }

  const api = {
    generate, toXml, previewHtml, KINDS, LEVELS, LEN, HITS, DIST, SEG, SEG_ERR, PM, SIGMA, STEP, REAL_TOL,
    texts: T, APP, reachable, inversionMistakes, bitMistakes, stepList,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).moodle = api;
})(typeof self !== 'undefined' ? self : this);
