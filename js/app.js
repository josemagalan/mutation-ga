/*
 * Controlador de la página: enrutado (inicio / operador / acerca de), estado, controles,
 * reproductor, idioma y URL.
 *
 * URL: #lang=es                          → pantalla inicial
 *      #op=bit-flip&lang=es&v=…&r=…&pm=…&p=…&c=…&s=…&step=…  → página de un operador
 *      (v: variante; r: semilla del sorteo; pm…: parámetros del operador; p: padre;
 *       c: marcadores —posiciones o tramo—; s: semilla del padre; m=1: ver como rutas)
 *      #cmp=binary&lang=es&from=bit-flip&avg=…&v=…&r=…&<parámetros de from>&p=…&c=…&s=…
 *                                          → comparar los operadores de una representación
 *      #page=about&lang=es               → acerca de
 *      #page=moodle&lang=es              → bancos de preguntas para Moodle
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { rng: R, i18n, registry, createChromosomeView, createLearnPanel, createHome, createRouteMaps, createCompareView } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), opView: $('opView'), repGrid: $('repGrid'),
    opEyebrow: $('opEyebrow'), opTitle: $('opTitle'), opSubtitle: $('opSubtitle'),
    opSwitch: $('opSwitch'), vizLabel: $('vizLabel'), legend: $('legend'), dragHint: $('dragHint'),
    len: $('len'), lenOut: $('lenOut'), seed: $('seed'),
    variantField: $('variantField'), variant: $('variant'), variantDesc: $('variantDesc'),
    btnRandom: $('btnRandom'), btnMarks: $('btnMarks'), btnDraw: $('btnDraw'),
    manualForm: $('manualForm'), inP: $('inP'), err: $('err'), manualHint: $('manualHint'),
    paramsBox: $('paramsBox'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'),
    speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'),
    btnCompare: $('btnCompare'),
    cmpView: $('cmpView'), cmpBack: $('cmpBack'), cmpBackText: $('cmpBackText'), cmpEyebrow: $('cmpEyebrow'),
    cmpRandom: $('cmpRandom'), cmpDraw: $('cmpDraw'), cmpAvg: $('cmpAvg'), cmpProgress: $('cmpProgress'),
    btnRoutes: $('btnRoutes'), routeCard: $('routeCard'), routeLegend: $('routeLegend'),
    playerBox: $('playerBox'), narrationBox: $('narrationBox'),
    btnPractice: $('btnPractice'), practiceCard: $('practiceCard'), practiceIntro: $('practiceIntro'),
    practiceGivens: $('practiceGivens'), practiceForm: $('practiceForm'), prM: $('prM'),
    practiceErr: $('practiceErr'), practiceResult: $('practiceResult'), btnPracticeExit: $('btnPracticeExit'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'),
    moodleView: $('moodleView'), moodleBody: $('moodleBody'),
  };

  const state = {
    lang: (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: null,          // 'home' | 'op' | 'about'
    opId: null,
    variant: null,       // variante del operador, si tiene varias
    draw: 1,             // semilla de los números aleatorios del operador
    params: {},          // parámetros del operador (pm…)
    n: 8, seed: 0, parent: [], marks: [],
    result: null, step: 0,
    playing: false, speed: 1, errKey: null,
    routes: false,       // permutaciones: ver los cromosomas como rutas sobre un mapa de ciudades
    practice: false,     // modo «predice el mutante»: paso fijo en la intro, sin reproductor
    cmp: null,           // pantalla de comparar: { rep, from, variant, params, marks, rows, avg }
  };
  const CMP_REPS = 1000;   // mutaciones del mismo padre para las medias de la comparación
  // Media con padres al azar: padres, mutaciones por padre y operador, semilla fija y tamaño de cada tanda.
  const CMP_RAND = { parents: 1000, reps: 10, seed: 1, chunk: 20 };
  const randCache = new Map();   // clave de ajustes → medias ya calculadas
  let randToken = 0;
  let randJob = null;             // cálculo en curso: { key, token, done }
  let cmpToken = 0;
  let timer = null;
  let learn = null;

  // Los números no enteros se muestran con uno o dos decimales y la coma o el punto del idioma.
  const locale = () => (state.lang === 'es' ? 'es-ES' : 'en-GB');
  const fmtValue = (v) => (typeof v === 'number' && !Number.isInteger(v)
    ? v.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : v);
  // Números aleatorios sorteados: con dos decimales (0,70 y no 0,7) o cuatro, si los tienen.
  const fmtDraw = (v) => v.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  // Genes: en la representación real, siempre con decimales (5,0 y no 5), para distinguirlos de las otras.
  const curRep = () => (state.view === 'cmp' ? state.cmp.rep : state.opId ? repId() : null);
  const fmtGene = (v) => (curRep() === 'real' && typeof v === 'number'
    ? v.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : v);
  const DRAW_PARAMS = ['r', 's', 'u', 'tau', 'z'];
  const FINE_PARAMS = ['delta', 'e'];   // números pequeños: hasta tres decimales
  const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, p) => {
    if (params[p] == null) return m;
    if (params.genes && params.genes.indexOf(p) !== -1) return fmtGene(params[p]);
    if (FINE_PARAMS.indexOf(p) !== -1 && typeof params[p] === 'number') return params[p].toLocaleString(locale(), { maximumFractionDigits: 3 });
    return DRAW_PARAMS.indexOf(p) !== -1 && typeof params[p] === 'number' ? fmtDraw(params[p]) : fmtValue(params[p]);
  }) : s);
  const t = (key, params) => fill(i18n.t(state.lang, key), params);

  // Textos del operador actual (narración...) con la interfaz general como respaldo.
  function tOp(key, params) {
    const c = state.opId && G.content[state.opId];
    const table = c && c.narration && (c.narration[state.lang] || c.narration.es);
    return table && table[key] != null ? fill(table[key], params) : t(key, params);
  }

  const impl = () => G.operators[state.opId];           // { spec, validateParent, ... }
  const spec = () => impl().spec;
  const meta = () => registry.getOperator(state.opId);   // nombre, resumen, subtítulo
  const repId = () => meta().representation;

  // ---------- Marcadores (posiciones de genes o un tramo) ----------

  const markSpec = () => spec().marks || null;

  function validMarks(n, marks) {
    const ms = markSpec();
    if (!ms) return true;
    if (!Array.isArray(marks) || marks.length !== ms.count || !marks.every(Number.isInteger)) return false;
    if (ms.type === 'gene') return marks.every((m) => m >= 0 && m < n) && new Set(marks).size === marks.length;
    const [a, b] = marks;
    return a >= 0 && b <= n && b - a >= 2;
  }

  function randomMarks(rng, n) {
    const ms = markSpec();
    if (!ms) return [];
    if (ms.type === 'gene') return R.shuffle(rng, Array.from({ length: n }, (_, i) => i)).slice(0, ms.count);
    const a = R.randInt(rng, 0, n - 2);
    return [a, R.randInt(rng, a + 2, n)];
  }

  // Posición válida más cercana a la pedida al arrastrar el marcador i (null si no cambia).
  function clampMark(i, g) {
    const n = state.n;
    const c = state.marks.slice();
    if (markSpec().type === 'gene') {
      const v = Math.max(0, Math.min(n - 1, g));
      if (c.some((m, k) => k !== i && m === v)) return null;
      c[i] = v;
    } else if (i === 0) c[0] = Math.max(0, Math.min(g, c[1] - 2));
    else c[1] = Math.min(n, Math.max(g, c[0] + 2));
    return c;
  }

  // ---------- Vista ----------

  const view = createChromosomeView($('viz'), {
    label: (key, params) => tOp(key, params),
    format: (v) => fmtGene(v),
    formatDraw: (v) => fmtDraw(v),
    duration: () => Math.round(750 / state.speed),
    onMarkDrag: (i, g) => {
      const c = clampMark(i, g);
      if (c && c.join() !== state.marks.join()) { state.marks = c; recompute(state.step); }
    },
  });

  const routeMaps = createRouteMaps({
    svgs: [$('routeMap1'), $('routeMap2')], caps: [$('routeCap1'), $('routeCap2')],
  }, {
    t: (k, p) => t(k, p),
    tourLength: G.cities.tourLength,
    formatLength: (v) => Math.round(v).toLocaleString(locale()),
  });
  const routesOn = () => state.routes && state.view === 'op' && repId() === 'permutation';

  function renderRoutes() {
    const perm = state.view === 'op' && repId() === 'permutation';
    el.btnRoutes.hidden = !perm;
    el.btnRoutes.textContent = t(state.routes ? 'hideRoutes' : 'showRoutes');
    el.btnRoutes.setAttribute('aria-pressed', String(!!state.routes));
    el.routeCard.hidden = !routesOn();
    const items = [['sw-line sw-route-p1', 'routeLegendParent'], ['sw-line sw-route-kept', 'routeLegendKept'],
      ['sw-line sw-route-new', 'routeLegendNew'], ['sw-city', 'routeLegendCity']];
    if (perm && spec().invalidChildren) items.push(['sw-city-missing', 'routeLegendMissing']);
    el.routeLegend.replaceChildren(...items.map(([cls, k]) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${cls}`;
      const lab = document.createElement('span');
      lab.textContent = t(k);
      li.append(sw, lab);
      return li;
    }));
    if (routesOn() && state.result) {
      routeMaps.setProblem({ parent: state.parent, cities: G.cities.randomCities(state.seed, state.n) });
      routeMaps.show(state.result.steps[state.step]);
    }
  }

  const home = createHome(el.repGrid, { registry, t: (k, p) => t(k, p), lang: () => state.lang });

  // ---------- Problema ----------

  // Padre aleatorio según la representación del operador.
  const GENERATORS = {
    binary: (r, n) => G.binUtils.randomBits(r, n),
    permutation: (r, n) => R.randomPermutation(r, n),
    integer: (r, n) => G.intUtils.randomInts(r, n),
    real: (r, n) => G.realUtils.randomReals(r, n),
  };

  function generate(seed, n) {
    const r = R.mulberry32(seed);
    const parent = GENERATORS[repId()](r, n);
    Object.assign(state, { seed, n, parent, marks: randomMarks(r, n) });
  }

  function recompute(step) {
    stop();
    state.result = spec().run(state.parent, state.marks, { variant: state.variant, seed: state.draw, params: state.params });
    view.setProblem({
      parent: state.parent,
      marks: state.marks,
      markType: markSpec() ? markSpec().type : null,
      markNames: markSpec() ? markSpec().names || null : null,
      aux: state.result.aux || null,
    });
    if (routesOn()) routeMaps.setProblem({ parent: state.parent, cities: G.cities.randomCities(state.seed, state.n) });
    goTo(state.practice ? 0 : (step || 0), false);
    syncControls();
    // El problema ha podido cambiar (padre, marcadores, parámetros): refrescar los datos y la predicción.
    if (state.practice) { renderPracticeGivens(); resetPracticeForm(); }
    // Los enlaces a los otros operadores llevan el padre actual
    el.opSwitch.querySelectorAll('a.op-chip[data-op]').forEach((a) => { a.href = sameProblemHref(a.dataset.op); });
    el.btnCompare.href = compareHref();
  }

  // ---------- Reproductor ----------

  function goTo(i, animate) {
    const steps = state.result.steps;
    state.step = Math.max(0, Math.min(steps.length - 1, i));
    const step = steps[state.step];
    view.show(step, { animate });
    if (routesOn()) routeMaps.show(step);
    learn.setStep(step);
    renderNarration();
    el.btnPrev.disabled = el.btnReset.disabled = state.step === 0;
    el.btnNext.disabled = state.step === steps.length - 1;
    el.barFill.style.width = `${(100 * state.step) / Math.max(1, steps.length - 1)}%`;
    writeHash();
  }

  function renderNarration() {
    const steps = state.result.steps;
    const step = steps[state.step];
    el.counter.textContent = t('stepOf', { i: state.step + 1, n: steps.length });
    el.narration.textContent = tOp(step.text.key, step.text.params);
  }

  function next() {
    if (state.step < state.result.steps.length - 1) goTo(state.step + 1, true);
    else stop();
  }
  function prev() { stop(); goTo(state.step - 1, false); }
  function reset() { stop(); goTo(0, false); }

  function play() {
    if (state.step >= state.result.steps.length - 1) goTo(0, false);
    state.playing = true;
    el.btnPlay.classList.add('playing');
    el.btnPlay.title = t('pause');
    el.btnPlay.setAttribute('aria-label', t('pause'));
    const tick = () => {
      if (!state.playing) return;
      next();
      if (state.step >= state.result.steps.length - 1) { stop(); return; }
      timer = setTimeout(tick, Math.round(2600 / state.speed));
    };
    timer = setTimeout(tick, 250);
  }
  function stop() {
    state.playing = false;
    clearTimeout(timer);
    el.btnPlay.classList.remove('playing');
    el.btnPlay.title = t('play');
    el.btnPlay.setAttribute('aria-label', t('play'));
  }
  function togglePlay() { if (state.playing) stop(); else play(); }

  // ---------- Modo práctica («predice el mutante») ----------

  function setPracticeMode(on) {
    state.practice = on;
    el.btnPractice.textContent = t(on ? 'exitPractice' : 'practiceMode');
    el.btnPractice.setAttribute('aria-pressed', String(on));
    el.practiceCard.hidden = !on;
    el.playerBox.hidden = on;
    el.narrationBox.hidden = on;
    stop();
    if (on) {
      renderPracticeIntro();
      renderPracticeGivens();
      resetPracticeForm();
      goTo(0, false);
    } else {
      goTo(state.step, false);
    }
  }

  function renderPracticeIntro() {
    el.practiceIntro.textContent = t('practiceIntro') + (repId() === 'real' ? ` ${t('practiceRealTol')}` : '');
  }

  // Lo que el algoritmo ha sorteado: sin ello el mutante no tendría una única respuesta.
  function renderPracticeGivens() {
    const g = G.practice.givens(spec(), state.result, state.marks);
    const rows = [];
    if (g.marks) {
      const m = g.marks.marks;
      let value;
      if (g.marks.type === 'gap') value = t('practiceSegment', { a: m[0] + 1, b: m[1] });
      else if (g.marks.count === 1) value = String(m[0] + 1);
      else value = m.map((x, k) => `${(g.marks.names || [])[k] || k + 1} = ${x + 1}`).join(', ');
      rows.push({ label: t(`practiceMarks_${g.marks.type}${g.marks.count}`), value });
    }
    if (g.perPos) {
      const value = g.perPos.map((p) => {
        let s = `${t('practicePos', { i: p.pos })}: r = ${fmtDraw(p.r)}`;
        if (p.hit && p.extra.length) s += `, ${p.extra.map((v, k) => `${g.extraNames[k] || 's'} = ${fmtDraw(v)}`).join(', ')}`;
        return s;
      }).join(' · ');
      rows.push({ label: t('practiceGivenDraws'), value, hint: t('practiceGivenDrawsHint') });
    }
    if (g.sequence) rows.push({ label: t('practiceGivenSequence'), value: g.sequence.map(fmtDraw).join(' · '), hint: t('practiceGivenSequenceHint') });

    el.practiceGivens.replaceChildren();
    el.practiceGivens.hidden = !rows.length;
    rows.forEach((row) => {
      const p = document.createElement('p');
      p.className = 'practice-given';
      const strong = document.createElement('strong');
      strong.textContent = `${row.label}: `;
      p.append(strong, document.createTextNode(row.value));
      if (row.hint) {
        const hint = document.createElement('span');
        hint.className = 'practice-given-hint';
        hint.textContent = ` ${row.hint}`;
        p.append(hint);
      }
      el.practiceGivens.append(p);
    });
  }

  function resetPracticeForm() {
    el.prM.value = '';
    el.prM.placeholder = state.parent.map(fmtGene).join(' ');
    el.practiceErr.textContent = '';
    el.prM.removeAttribute('aria-invalid');
    el.practiceResult.replaceChildren();
    el.btnPracticeExit.hidden = true;
  }

  function gradePractice() {
    const guess = parseList(el.prM.value);
    const err = G.practice.validateGuess(repId(), guess, state.n);
    el.practiceErr.textContent = err ? t(err) : '';
    el.prM.setAttribute('aria-invalid', String(!!err));
    if (err) { el.practiceResult.replaceChildren(); el.btnPracticeExit.hidden = true; return; }
    const cells = G.practice.grade(repId(), guess, state.result.child);
    el.practiceResult.replaceChildren();
    const line = document.createElement('div');
    line.className = 'practice-result-row';
    const label = document.createElement('span');
    label.className = 'practice-result-label';
    label.textContent = `${t('mutant')}:`;
    line.append(label);
    let ok = 0;
    cells.forEach((c) => {
      if (c.ok) ok++;
      const chip = document.createElement('span');
      chip.className = `practice-gene ${c.ok ? 'ok' : 'bad'}`;
      chip.textContent = c.ok ? fmtGene(c.correct) : `${fmtGene(c.guess)} → ${fmtGene(c.correct)}`;
      line.append(chip);
    });
    const summary = document.createElement('p');
    summary.className = `practice-score${ok === cells.length ? ' all' : ''}`;
    summary.textContent = ok === cells.length ? t('practiceAllCorrect') : t('practiceResultScore', { ok, total: cells.length });
    el.practiceResult.append(line, summary);
    el.btnPracticeExit.hidden = false;
  }

  // ---------- Comparar operadores ----------

  const cmpView = createCompareView({
    parents: $('cmpParents'), children: $('cmpChildren'), legend: $('cmpLegend'),
    table: $('cmpTable'), tableNote: $('cmpTableNote'), defs: $('cmpDefs'), refs: $('cmpRefs'),
  }, {
    t: (k, p) => t(k, p),
    metrics: G.compare.METRICS,
    format: (v) => fmtGene(v),
    opName: (id) => registry.getOperator(id).name[state.lang],
    opHref: (row) => opHref(row.id, { variant: row.variant, params: row.params, marks: row.marks, draw: state.draw }),
    opMeta: (row) => cmpMeta(row),
    value: (m, v) => cmpValue(m, v),
  });

  const PARAM_SYMBOL = { pm: 'pm', smax: 's', g: 't/T', b: 'b', sigma: 'σ', eta: 'η' };

  // Enlace a la página de un operador con el padre actual y los ajustes dados.
  function opHref(id, o) {
    const target = G.operators[id].spec;
    const q = new URLSearchParams([['op', id], ['lang', state.lang]]);
    if (o.variant) q.set('v', o.variant);
    if (target.random && o.draw) q.set('r', String(o.draw));
    (target.params || []).forEach((pr) => { if (o.params && o.params[pr.id] != null) q.set(pr.id, String(o.params[pr.id])); });
    q.set('p', state.parent.join('-'));
    if (o.marks && o.marks.length) q.set('c', o.marks.join('-'));
    q.set('s', String(state.seed));
    return `#${q.toString()}`;
  }

  // Enlace a la comparación desde la página de un operador: mismo padre, marcadores, variante y parámetros.
  function compareHref() {
    const q = new URLSearchParams([['cmp', repId()], ['lang', state.lang], ['from', state.opId]]);
    if (state.variant) q.set('v', state.variant);
    if (usesDraw()) q.set('r', String(state.draw));
    (spec().params || []).forEach((pr) => q.set(pr.id, String(state.params[pr.id])));
    q.set('p', state.parent.join('-'));
    if (state.marks.length) q.set('c', state.marks.join('-'));
    q.set('s', String(state.seed));
    return `#${q.toString()}`;
  }

  // Ajustes con los que ha mutado cada operador: marcadores, variante y parámetros.
  function cmpMeta(row) {
    const target = G.operators[row.id].spec;
    const parts = [];
    const ms = target.marks;
    if (ms && row.marks.length) {
      if (ms.type === 'gap') parts.push(t('cmpSegment', { a: row.marks[0] + 1, b: row.marks[1] }));
      else if (ms.count === 1) parts.push(t('cmpPosition', { a: row.marks[0] + 1 }));
      else parts.push(row.marks.map((m, k) => `${(ms.names || [])[k] || k + 1} = ${m + 1}`).join(', '));
    }
    if (row.variant) parts.push(`${t('variant').toLowerCase()}: ${G.content[row.id].variants[row.variant].name[state.lang]}`);
    (target.params || []).forEach((pr) => parts.push(`${PARAM_SYMBOL[pr.id] || pr.id} = ${fmtValue(row.params[pr.id])}`));
    return parts.join(' · ');
  }

  function cmpValue(m, v) {
    if (m.kind === 'pct') return v.toLocaleString(locale(), { style: 'percent', maximumFractionDigits: 0 });
    return v.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const cmpOps = (rep) => registry.getRepresentation(rep).operators
    .filter((op) => op.ready && G.operators[op.id] && G.content[op.id])
    .map((op) => ({ id: op.id, spec: G.operators[op.id].spec }));

  function compareOpts(reps) {
    const c = state.cmp;
    return {
      rep: c.rep, ops: cmpOps(c.rep), parent: state.parent, marks: c.marks,
      from: c.from, variant: c.variant, params: c.params, draw: state.draw, reps, seed: state.seed + 1,
    };
  }

  // Primero el ejemplo (rápido); las medias, justo después, para no bloquear el primer dibujado.
  function recomputeCompare() {
    const token = ++cmpToken;
    const c = state.cmp;
    c.rows = G.compare.compare(compareOpts(0));
    cmpView.render(cmpModel());
    syncAvg();
    writeHash();
    setTimeout(() => {
      if (token !== cmpToken || state.view !== 'cmp') return;
      c.rows = G.compare.compare(compareOpts(CMP_REPS));
      cmpView.setTable(cmpModel());
      if (c.avg === 'rand') ensureRandMean();
    }, 30);
  }

  // Modelo para la vista: en el modo «padres al azar», la media mostrada es la de muchos padres.
  function cmpModel() {
    const c = state.cmp;
    const rand = c.avg === 'rand' ? randCache.get(randKey()) || null : null;
    const rows = (c.rows || []).map((r) => (c.avg === 'rand' ? Object.assign({}, r, { mean: rand ? rand[r.id] : null }) : r));
    return {
      rep: c.rep, n: state.n, parent: state.parent, rows, reps: CMP_REPS, from: c.from,
      mode: c.avg, parents: CMP_RAND.parents, randReps: CMP_RAND.reps,
    };
  }

  // La media con padres al azar solo depende de la representación, la longitud y los ajustes.
  function randKey() {
    const c = state.cmp;
    return JSON.stringify([c.rep, state.n, c.from, c.variant, c.params]);
  }

  // Calcula (por tandas, sin bloquear la página) la media con padres al azar, si no está ya.
  function ensureRandMean() {
    const key = randKey();
    if (randCache.has(key)) { el.cmpProgress.textContent = ''; return; }
    if (randJob && randJob.key === key) return;
    const token = ++randToken;
    randJob = { key, token, done: 0 };
    const c = state.cmp;
    const acc = G.compare.randomMeanStart({
      rep: c.rep, ops: cmpOps(c.rep), n: state.n, from: c.from, variant: c.variant, params: c.params,
      parents: CMP_RAND.parents, reps: CMP_RAND.reps, seed: CMP_RAND.seed,
    });
    const tick = () => {
      if (token !== randToken || state.view !== 'cmp' || randKey() !== key) {
        if (randJob && randJob.token === token) randJob = null;
        return;
      }
      const done = G.compare.randomMeanStep(acc, CMP_RAND.chunk);
      randJob.done = done;
      if (done < 1) {
        showRandProgress();
        setTimeout(tick, 0);
        return;
      }
      randCache.set(key, G.compare.randomMeanResult(acc));
      randJob = null;
      el.cmpProgress.textContent = '';
      if (state.cmp.avg === 'rand') cmpView.setTable(cmpModel());
    };
    showRandProgress();
    setTimeout(tick, 0);
  }

  function showRandProgress() {
    const busy = randJob && state.cmp && state.cmp.avg === 'rand' && randJob.key === randKey();
    el.cmpProgress.textContent = busy ? t('compareProgress', { p: Math.floor(100 * randJob.done) }) : '';
  }

  function syncAvg() {
    el.cmpAvg.querySelectorAll('button[data-avg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.avg === state.cmp.avg)));
    showRandProgress();
  }

  function renderCompareHeader() {
    const c = state.cmp;
    const rep = registry.getRepresentation(c.rep);
    el.cmpEyebrow.textContent = t('representationOf', { name: rep.name[state.lang] });
    document.title = t('compareDocTitle', { name: rep.name[state.lang] });
    if (c.from) {
      const src = c.rows && c.rows.find((r) => r.id === c.from);
      el.cmpBackText.textContent = t('compareBackTo', { name: registry.getOperator(c.from).name[state.lang] });
      el.cmpBack.href = opHref(c.from, { variant: c.variant, params: c.params, marks: src ? src.marks : c.marks, draw: state.draw });
    } else {
      el.cmpBackText.textContent = t('allOperators');
      el.cmpBack.href = `#lang=${state.lang}`;
    }
  }

  function showCompare(rep, q) {
    stop();
    const ops = cmpOps(rep);
    const from = ops.some((o) => o.id === q.get('from')) ? q.get('from') : null;
    const fromSpec = from ? G.operators[from].spec : null;
    const params = {};
    if (fromSpec) {
      (fromSpec.params || []).forEach((pr) => {
        const v = q.has(pr.id) && q.get(pr.id) !== '' ? Number(q.get(pr.id)) : NaN;
        params[pr.id] = Number.isFinite(v) && v >= pr.min && v <= pr.max ? v : pr.default;
      });
    }
    const variant = fromSpec && fromSpec.variants && fromSpec.variants.indexOf(q.get('v')) !== -1 ? q.get('v') : null;
    const r = parseInt(q.get('r'), 10);
    state.draw = Number.isFinite(r) && r > 0 ? r % 1000000 : R.newSeed() + 1;
    state.view = 'cmp';
    state.cmp = { rep, from, variant, params, marks: [], rows: null, avg: q.get('avg') === 'rand' ? 'rand' : 'same' };

    const seed = parseInt(q.get('s'), 10);
    const parent = (q.get('p') || '').split('-').filter(Boolean).map(Number);
    const marks = (q.get('c') || '').split('-').filter((x) => x !== '').map(Number);
    if (parent.length && !G.operators[ops[0].id].validateParent(parent)) {
      Object.assign(state, { parent, n: parent.length, seed: Number.isFinite(seed) ? Math.abs(seed) % 1000000 : state.seed });
      state.cmp.marks = marks.every((c) => Number.isInteger(c) && c >= 0 && c <= parent.length) ? marks : [];
    } else {
      cmpParent(Number.isFinite(seed) ? Math.abs(seed) % 1000000 : R.newSeed(), state.n || 8);
    }
    showOnly('cmp');
    recomputeCompare();
    renderCompareHeader();
    window.scrollTo(0, 0);
  }

  // Padre aleatorio para la comparación.
  function cmpParent(seed, n) {
    const parent = GENERATORS[state.cmp.rep](R.mulberry32(seed), n);
    Object.assign(state, { seed, n, parent });
  }

  // ---------- Cabecera, selector de operadores y leyenda ----------

  const LEGEND = {
    copy: ['sw-p1', 'legendCopy'],
    mutated: ['sw-mut', 'legendMutated'],
    drawHit: ['sw-hit', 'legendDrawHit'],
    mark: ['sw-segment', 'legendMark'],
    moved: ['sw-moved', 'legendMoved'],
    segment: ['sw-segment', 'legendSegment'],
    conflict: ['sw-conflict', 'legendConflict'],
    dist: ['sw-dist', 'legendDist'],
  };

  // Enlace a otro operador de la misma representación con el mismo padre.
  function sameProblemHref(id) {
    const q = new URLSearchParams([['op', id], ['lang', state.lang], ['p', state.parent.join('-')], ['s', String(state.seed)]]);
    if (routesOn()) q.set('m', '1');
    return `#${q.toString()}`;
  }

  function renderOpHeader() {
    const m = meta();
    const rep = registry.getRepresentation(m.representation);
    const l = state.lang;
    el.opEyebrow.textContent = t('representationOf', { name: rep.name[l] });
    el.opTitle.textContent = m.name[l];
    el.opSubtitle.textContent = m.subtitle ? m.subtitle[l] : m.summary[l];
    el.vizLabel.textContent = t('svgLabel', { name: m.name[l] });
    document.title = t('opTitleDoc', { name: m.name[l] });

    el.opSwitch.replaceChildren(...rep.operators.map((op) => {
      const current = op.id === state.opId;
      const chip = document.createElement(op.ready && !current ? 'a' : 'span');
      chip.className = 'op-chip' + (current ? ' current' : '') + (op.ready ? '' : ' soon');
      chip.textContent = op.name[l];
      if (current) chip.setAttribute('aria-current', 'page');
      else if (op.ready) { chip.dataset.op = op.id; chip.href = sameProblemHref(op.id); }
      else {
        chip.title = t('comingSoon');
        const s = document.createElement('span');
        s.className = 'sr-only';
        s.textContent = ` (${t('comingSoon')})`;
        chip.append(s);
      }
      return chip;
    }));

    el.legend.replaceChildren(...spec().legend.map((key) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${LEGEND[key][0]}`;
      const lab = document.createElement('span');
      lab.textContent = tOp(LEGEND[key][1]);
      li.append(sw, lab);
      return li;
    }));

    const ms = markSpec();
    el.btnMarks.hidden = !ms;
    el.dragHint.hidden = !ms;
    if (ms) {
      el.btnMarks.textContent = t(`randomMarks_${ms.type}${ms.count}`);
      el.dragHint.textContent = t(`dragHint_${ms.type}${ms.count}`);
    }
    renderVariants();
    renderParams();
    el.manualHint.textContent = t(`manualHint_${repId()}`);
    const PH = {
      binary: '1 1 0 0 1 0 0 1', integer: '3 7 1 4 6 0 9 2', permutation: '3 7 5 1 6 8 2 4',
      real: state.lang === 'es' ? '4,2 1,7 8,5 2,1 6,0 9,6' : '4.2 1.7 8.5 2.1 6.0 9.6',
    };
    el.inP.placeholder = PH[repId()];
  }

  // Controles de los parámetros del operador (p. ej. la probabilidad de mutación pm).
  function renderParams() {
    const ps = spec().params || [];
    el.paramsBox.hidden = !ps.length;
    el.paramsBox.replaceChildren(...ps.map((pr) => {
      const id = `param-${pr.id}`;
      const field = document.createElement('div');
      field.className = 'field';
      const lab = document.createElement('label');
      lab.htmlFor = id;
      lab.textContent = tOp(`param${pr.id.toUpperCase()}`);
      const wrap = document.createElement('div');
      wrap.className = 'range-wrap';
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', id, min: pr.min, max: pr.max, step: pr.step, value: state.params[pr.id] });
      const out = document.createElement('output');
      out.htmlFor = id;
      out.textContent = fmtValue(state.params[pr.id]);
      input.addEventListener('input', () => { out.textContent = fmtValue(Number(input.value)); });
      input.addEventListener('change', () => {
        state.params[pr.id] = Number(input.value);
        recompute(0);
      });
      wrap.append(input, out);
      field.append(lab, wrap);
      return field;
    }));
  }

  const usesDraw = () => !!spec().random;

  function renderVariants() {
    const vs = spec().variants;
    el.variantField.hidden = !vs;
    el.variantDesc.hidden = !vs;
    el.btnDraw.hidden = !usesDraw();
    if (!vs) return;
    const vm = G.content[state.opId].variants;
    const l = state.lang;
    el.variant.replaceChildren(...vs.map((v) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = vm[v].name[l];
      return o;
    }));
    el.variant.value = state.variant;
    el.variantDesc.textContent = vm[state.variant].desc[l];
  }

  // ---------- Idioma ----------

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
      node.setAttribute('aria-label', t(node.dataset.i18nTitle));
    });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    el.err.textContent = state.errKey ? t(state.errKey) : '';
    if (state.playing) { el.btnPlay.title = t('pause'); el.btnPlay.setAttribute('aria-label', t('pause')); }
    G.about.renderFooter(el.siteFoot, state.lang);
    $('moodleLink').href = `#page=moodle&lang=${state.lang}`;
    $('sisterLink').href = G.about.sisterUrl(state.lang);
    if (state.view === 'moodle') {
      document.title = `${G.moodlePage.text[state.lang].title} · ${t('brand')}`;
      G.moodlePage.renderMoodle(el.moodleBody, state.lang);
    }
    if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    }
    if (state.view === 'home') {
      document.title = t('homeTitleDoc');
      home.render();
    } else if (state.view === 'op') {
      renderOpHeader();
      view.refreshLabels();
      view.show(view.step, { animate: false });   // números con la coma o el punto del idioma
      learn.refresh();
      renderNarration();
      syncControls();
      renderRoutes();
      el.btnPractice.textContent = t(state.practice ? 'exitPractice' : 'practiceMode');
      if (state.practice) { renderPracticeIntro(); renderPracticeGivens(); resetPracticeForm(); }
      el.btnCompare.href = compareHref();
    } else if (state.view === 'cmp') {
      renderCompareHeader();
      cmpView.render(cmpModel());
      showRandProgress();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function showOnly(which) {
    el.homeView.hidden = which !== 'home';
    el.opView.hidden = which !== 'op';
    el.aboutView.hidden = which !== 'about';
    el.cmpView.hidden = which !== 'cmp';
    el.moodleView.hidden = which !== 'moodle';
  }

  function showMoodle() {
    stop();
    const changed = state.view !== 'moodle';
    state.view = 'moodle';
    showOnly('moodle');
    if (changed) window.scrollTo(0, 0);
  }

  function showHome() {
    stop();
    state.view = 'home';
    showOnly('home');
  }

  function showAbout() {
    stop();
    const changed = state.view !== 'about';
    state.view = 'about';
    showOnly('about');
    if (changed) window.scrollTo(0, 0);
  }

  function showOp(id, q) {
    stop();
    const changed = id !== state.opId || state.view !== 'op';
    state.view = 'op';
    state.opId = id;
    state.errKey = null;
    state.routes = q.get('m') === '1';
    state.practice = false;
    el.practiceCard.hidden = true;
    el.playerBox.hidden = false;
    el.narrationBox.hidden = false;
    el.btnPractice.setAttribute('aria-pressed', 'false');
    showOnly('op');   // visible antes de dibujar, para medir el ancho disponible

    const vs = impl().spec.variants;
    const v = q.get('v');
    state.variant = vs ? (vs.indexOf(v) !== -1 ? v : impl().spec.defaultVariant) : null;
    state.params = {};
    (impl().spec.params || []).forEach((pr) => {
      const x = q.has(pr.id) && q.get(pr.id) !== '' ? Number(q.get(pr.id)) : NaN;
      state.params[pr.id] = Number.isFinite(x) && x >= pr.min && x <= pr.max ? x : pr.default;
    });
    const r = parseInt(q.get('r'), 10);
    state.draw = Number.isFinite(r) && r > 0 ? r % 1000000 : R.newSeed() + 1;
    if (!learn) {
      learn = createLearnPanel({ content: G.content[id], t: (k, p) => t(k, p), lang: () => state.lang });
      learn.setVariant(state.variant);
    } else learn.setContent(G.content[id], state.variant);

    const seed = parseInt(q.get('s'), 10);
    const parent = (q.get('p') || '').split('-').filter(Boolean).map(Number);
    const marks = (q.get('c') || '').split('-').filter((x) => x !== '').map(Number);
    const s0 = Number.isFinite(seed) ? Math.abs(seed) % 1000000 : state.seed;
    if (parent.length && !impl().validateParent(parent)) {
      // Padre válido: se conserva; si los marcadores no valen para este operador, se sortean.
      const okMarks = validMarks(parent.length, marks) ? marks : randomMarks(R.mulberry32(s0 + 1), parent.length);
      Object.assign(state, { parent, marks: okMarks, n: parent.length, seed: s0 });
    } else {
      generate(Number.isFinite(seed) ? Math.abs(seed) % 1000000 : R.newSeed(), state.n);
    }
    renderOpHeader();
    recompute(parseInt(q.get('step'), 10) || 0);
    renderRoutes();
    if (changed) window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    const id = q.get('op');
    const cmp = q.get('cmp');
    if (id && registry.isReady(id) && G.operators[id] && G.content[id]) showOp(id, q);
    else if (cmp && registry.getRepresentation(cmp) && cmpOps(cmp).length > 1) showCompare(cmp, q);
    else if (q.get('page') === 'about') showAbout();
    else if (q.get('page') === 'moodle') showMoodle();
    else showHome();
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = { lang: state.lang };
    let paramIds = [];
    if (state.view === 'about') params.page = 'about';
    if (state.view === 'moodle') params.page = 'moodle';
    if (state.view === 'op') {
      Object.assign(params, {
        op: state.opId,
        v: state.variant || undefined,
        r: usesDraw() ? String(state.draw) : undefined,
        p: state.parent.join('-'),
        c: state.marks.length ? state.marks.join('-') : undefined,
        s: String(state.seed),
        step: String(state.step),
        m: routesOn() ? '1' : undefined,
      });
      paramIds = (spec().params || []).map((pr) => pr.id);
      paramIds.forEach((k) => { params[k] = String(state.params[k]); });
    }
    if (state.view === 'cmp') {
      const c = state.cmp;
      Object.assign(params, {
        cmp: c.rep,
        from: c.from || undefined,
        avg: c.avg === 'rand' ? 'rand' : undefined,
        v: c.variant || undefined,
        r: String(state.draw),
        p: state.parent.join('-'),
        c: c.marks.length ? c.marks.join('-') : undefined,
        s: String(state.seed),
      });
      paramIds = Object.keys(c.params);
      paramIds.forEach((k) => { params[k] = String(c.params[k]); });
    }
    const order = ['page', 'op', 'cmp', 'lang', 'from', 'avg', 'v', 'r'].concat(paramIds, ['p', 'c', 's', 'm', 'step']).filter((k) => params[k] != null && params[k] !== '');
    const h = new URLSearchParams(order.map((k) => [k, params[k]])).toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  // ---------- Controles ----------

  function syncControls() {
    el.len.value = state.n;
    el.lenOut.textContent = state.n;
    el.seed.value = state.seed;
    el.inP.value = state.parent.map(fmtGene).join(' ');
  }

  el.len.addEventListener('input', () => { el.lenOut.textContent = el.len.value; });
  el.len.addEventListener('change', () => {
    generate(state.seed, Number(el.len.value));
    recompute(0);
  });
  el.seed.addEventListener('change', () => {
    const s = Math.abs(parseInt(el.seed.value, 10));
    if (!Number.isFinite(s)) { el.seed.value = state.seed; return; }
    generate(s % 1000000, state.n);
    recompute(0);
  });
  el.btnRandom.addEventListener('click', () => {
    generate(R.newSeed(), state.n);
    recompute(0);
  });
  el.btnDraw.addEventListener('click', () => {
    state.draw = R.newSeed() + 1;
    recompute(0);
  });
  el.btnMarks.addEventListener('click', () => {
    const r = R.mulberry32((Date.now() ^ state.seed) >>> 0);
    let marks;
    do { marks = randomMarks(r, state.n); } while (marks.join() === state.marks.join());
    state.marks = marks;
    recompute(0);
  });

  // Lista de números; en binaria y entera (genes de una cifra) también se admite una cadena seguida como 10110.
  const parseList = (s) => {
    // real: coma o punto decimal; entonces los genes se separan con espacios o punto y coma
    if (repId() === 'real') return s.trim().split(/[\s;]+/).filter(Boolean).map((x) => Number(x.replace(',', '.')));
    const tokens = s.trim().split(/[\s,;]+/).filter(Boolean);
    if ((repId() === 'binary' || repId() === 'integer') && tokens.length === 1 && /^\d{2,}$/.test(tokens[0])) return tokens[0].split('').map(Number);
    return tokens.map(Number);
  };
  el.manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const parent = parseList(el.inP.value);
    const err = impl().validateParent(parent);
    state.errKey = err;
    el.err.textContent = err ? t(err) : '';
    el.inP.setAttribute('aria-invalid', String(!!err));
    if (err) return;
    const n = parent.length;
    let marks = state.marks;
    if (n !== state.n || !validMarks(n, marks)) marks = randomMarks(R.mulberry32(state.seed), n);
    Object.assign(state, { n, parent, marks });
    recompute(0);
  });

  el.cmpRandom.addEventListener('click', () => {
    cmpParent(R.newSeed(), state.n);
    recomputeCompare();
    renderCompareHeader();
  });
  el.cmpDraw.addEventListener('click', () => {
    state.draw = R.newSeed() + 1;
    recomputeCompare();
    renderCompareHeader();
  });
  el.cmpAvg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-avg]');
    if (!b || b.dataset.avg === state.cmp.avg) return;
    state.cmp.avg = b.dataset.avg;
    syncAvg();
    cmpView.setTable(cmpModel());
    if (state.cmp.avg === 'rand') ensureRandMean();
    writeHash();
  });

  el.btnPractice.addEventListener('click', () => setPracticeMode(!state.practice));
  el.btnPracticeExit.addEventListener('click', () => setPracticeMode(false));
  el.practiceForm.addEventListener('submit', (e) => { e.preventDefault(); gradePractice(); });

  el.btnRoutes.addEventListener('click', () => {
    state.routes = !state.routes;
    renderRoutes();
    el.opSwitch.querySelectorAll('a.op-chip[data-op]').forEach((a) => { a.href = sameProblemHref(a.dataset.op); });
    writeHash();
  });

  el.variant.addEventListener('change', () => {
    state.variant = el.variant.value;
    el.variantDesc.textContent = G.content[state.opId].variants[state.variant].desc[state.lang];
    learn.setVariant(state.variant);
    recompute(state.step);   // mismo paso, para comparar variantes
  });

  el.speed.addEventListener('input', () => {
    state.speed = Number(el.speed.value);
    el.speedOut.textContent = `${state.speed}×`;
  });

  el.btnNext.addEventListener('click', () => { stop(); next(); });
  el.btnPrev.addEventListener('click', prev);
  el.btnReset.addEventListener('click', reset);
  el.btnPlay.addEventListener('click', togglePlay);

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('backLink'), $('aboutBack'), $('moodleBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'op') return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (state.practice) return;   // el paso queda fijo en la intro mientras se practica
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary' && tag !== 'a') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  window.addEventListener('hashchange', route);

  // ---------- Arranque ----------
  route();
})();
