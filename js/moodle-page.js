/*
 * Página «Preguntas para Moodle»: formulario del generador, descarga del banco en Moodle XML,
 * vista previa de una pregunta e instrucciones de uso. Textos propios en ES y EN.
 */
(function (root) {
  'use strict';

  const M = root.GAX.moodle;

  const text = {
    es: {
      title: 'Bancos de preguntas para Moodle',
      lead: 'Genera preguntas con los mismos operadores de la aplicación y descárgalas en formato Moodle XML para importarlas en el banco de preguntas de tu curso. Cada pregunta enlaza, en su retroalimentación, con la resolución paso a paso de ese mismo ejercicio.',
      typesTitle: 'Tipos de pregunta',
      calc: 'Calcular el mutante',
      calcHint: 'Una casilla por gen, con puntuación parcial. Como en la mutación todo es azar, el enunciado da los números sorteados o las posiciones elegidas.',
      kind: {
        'calc-bit-flip': 'Inversión de bits (con los r de cada posición)',
        'calc-creep': 'Deslizamiento, enteros (con r y u)',
        'calc-gaussian': 'Gaussiana, reales (con r y z; ±0,05)',
        'calc-swap': 'Intercambio (con i y j)',
        'calc-insert': 'Inserción (con i y j)',
        'calc-inversion': 'Inversión (con el tramo)',
        identify: 'Identificar el operador: intercambio, inserción, inversión o mezcla',
        'error-bit-flip': 'Detectar el error en la inversión de bits',
        'error-inversion': 'Detectar el error en la mutación por inversión',
      },
      mc: 'Opción múltiple',
      mcHint: 'Cuatro opciones barajadas; las erróneas restan un tercio. Cada opción explica qué mutante habría salido.',
      levelsTitle: 'Niveles de dificultad',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      levelsHint: 'Fácil: cadenas cortas, 1–2 posiciones que mutan, posiciones cercanas, tramos de 3 genes. Media: 2–3 posiciones que mutan, tramos de 4. Difícil: cadenas largas, 3–4 posiciones que mutan, posiciones lejanas, tramos de 5–6 y valores que hay que recortar en los límites.',
      sizeTitle: 'Tamaño',
      count: 'Ejemplares por categoría',
      n: 'Genes de las permutaciones (n)',
      summary: (q, c) => `Se generarán ${q} preguntas en ${c} categorías (una por operador, tipo y nivel).`,
      nothing: 'Elige al menos un tipo de pregunta y un nivel.',
      download: 'Descargar banco (Moodle XML)',
      done: (q, s, f) => `Descargado ${f}: ${q} preguntas, semilla del banco ${s}.`,
      missing: (list) => `No se han encontrado bastantes ejemplares distintos para: ${list}.`,
      previewTitle: 'Vista previa',
      previewHint: 'Así se verá una pregunta del banco (sin el estilo de Moodle). La solución y los enlaces van en la retroalimentación.',
      previewSolution: 'Retroalimentación general',
      howTitle: 'Cómo usarlo en Moodle',
      how: [
        'En el curso: Banco de preguntas → Importar → formato «Moodle XML». Se crea una categoría por operador, tipo y nivel dentro de «Mutación».',
        'En el cuestionario, añade una «pregunta aleatoria» de cada categoría: cada estudiante recibe ejemplares distintos del mismo nivel.',
        'En las opciones de revisión, muestra la «Retroalimentación general» solo «Después de cerrar el cuestionario»: contiene la solución y el enlace a la resolución paso a paso.',
        'Si usas Safe Exam Browser, comprueba que los enlaces se puedan abrir durante la revisión.',
      ],
      seedNote: 'Cada descarga usa una semilla nueva, así que el banco no se puede volver a generar desde aquí. El nombre de cada pregunta (que el alumnado no ve) lleva su semilla para reproducir el ejercicio ante una reclamación.',
      file: 'banco-mutacion',
    },
    en: {
      title: 'Question banks for Moodle',
      lead: 'Generate questions with the same operators used in the app and download them in Moodle XML format to import them into your course question bank. Each question’s feedback links to the step-by-step solution of that very exercise.',
      typesTitle: 'Question types',
      calc: 'Compute the mutant',
      calcHint: 'One box per gene, with partial credit. Since everything in mutation is random, the question gives the drawn numbers or the chosen positions.',
      kind: {
        'calc-bit-flip': 'Bit flip (with r for each position)',
        'calc-creep': 'Creep, integers (with r and u)',
        'calc-gaussian': 'Gaussian, reals (with r and z; ±0.05)',
        'calc-swap': 'Swap (with i and j)',
        'calc-insert': 'Insert (with i and j)',
        'calc-inversion': 'Inversion (with the stretch)',
        identify: 'Identify the operator: swap, insert, inversion or scramble',
        'error-bit-flip': 'Spot the mistake in bit-flip mutation',
        'error-inversion': 'Spot the mistake in inversion mutation',
      },
      mc: 'Multiple choice',
      mcHint: 'Four shuffled options; wrong answers deduct one third. Each option explains which mutant it would have produced.',
      levelsTitle: 'Difficulty levels',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      levelsHint: 'Easy: short strings, 1–2 positions mutate, nearby positions, stretches of 3 genes. Medium: 2–3 positions mutate, stretches of 4. Hard: long strings, 3–4 positions mutate, distant positions, stretches of 5–6 and values that must be clamped at the bounds.',
      sizeTitle: 'Size',
      count: 'Instances per category',
      n: 'Permutation length (n)',
      summary: (q, c) => `${q} questions will be generated in ${c} categories (one per operator, type and level).`,
      nothing: 'Choose at least one question type and one level.',
      download: 'Download bank (Moodle XML)',
      done: (q, s, f) => `Downloaded ${f}: ${q} questions, bank seed ${s}.`,
      missing: (list) => `Not enough distinct instances were found for: ${list}.`,
      previewTitle: 'Preview',
      previewHint: 'This is how a question from the bank will look (without Moodle’s styling). The solution and the links go in the feedback.',
      previewSolution: 'General feedback',
      howTitle: 'How to use it in Moodle',
      how: [
        'In the course: Question bank → Import → “Moodle XML” format. One category per operator, type and level is created under “Mutation”.',
        'In the quiz, add a “random question” from each category: each student gets different instances of the same level.',
        'In the review options, show the “General feedback” only “After the quiz is closed”: it contains the solution and the link to the step-by-step solution.',
        'If you use Safe Exam Browser, check that the links can be opened during the review.',
      ],
      seedNote: 'Each download uses a new seed, so the bank cannot be regenerated from here. Each question’s name (hidden from students) includes its seed, to reproduce the exercise if a student queries the mark.',
      file: 'mutation-bank',
    },
  };

  // Selección del formulario: se conserva al cambiar de idioma o volver a la página.
  const sel = {
    kinds: new Set(['calc-bit-flip', 'calc-creep', 'calc-swap', 'calc-insert', 'calc-inversion', 'identify', 'error-bit-flip', 'error-inversion']),
    levels: new Set(['medium']),
    count: 10,
    n: 8,
  };
  let last = null;   // { lang, text } del último resultado mostrado

  function node(tag, cls, content) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  }

  function check(label, checked, onChange) {
    const l = node('label', 'mq-check');
    const i = node('input');
    i.type = 'checkbox';
    i.checked = checked;
    i.addEventListener('change', () => onChange(i.checked));
    l.append(i, node('span', null, label));
    return l;
  }

  function numberField(label, value, min, max, onChange) {
    const l = node('label', 'mq-num');
    const i = node('input');
    i.type = 'number';
    i.min = String(min);
    i.max = String(max);
    i.step = '1';
    i.value = String(value);
    i.addEventListener('change', () => {
      const v = Math.max(min, Math.min(max, Math.round(Number(i.value)) || value));
      i.value = String(v);
      onChange(v);
    });
    l.append(node('span', null, label), i);
    return l;
  }

  function group(title, hint, items) {
    const f = node('fieldset', 'mq-group');
    f.append(node('legend', null, title));
    if (hint) f.append(node('p', 'hint', hint));
    const box = node('div', 'mq-items');
    box.append(...items);
    f.append(box);
    return f;
  }

  function download(name, content) {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = node('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderMoodle(container, lang) {
    const L = text[lang] || text.es;
    const levels = () => M.LEVELS.filter((lv) => sel.levels.has(lv));
    const kinds = () => M.KINDS.map((k) => k.id).filter((k) => sel.kinds.has(k));

    const summary = node('p', 'mq-summary');
    const btn = node('button', 'btn primary', L.download);
    btn.type = 'button';
    const status = node('p', 'mq-status');
    status.setAttribute('role', 'status');
    const preview = node('div', 'mq-preview');

    function renderPreview() {
      // Ejemplar fijo para la vista previa: el primer tipo marcado, en el nivel más bajo marcado.
      preview.replaceChildren();
      const ks = kinds(); const lv = levels();
      if (!ks.length || !lv.length) return;
      const r = M.generate({ lang, kinds: [ks[0]], levels: [lv[0]], count: 1, n: sel.n, seed: 1 });
      const q = r.questions[0];
      if (!q) return;
      const qt = node('div', 'mq-qtext');
      qt.innerHTML = M.previewHtml(q);
      if (q.qtype === 'multichoice') {
        const ol = node('ol', 'mq-options');
        q.options.forEach((o) => { const li = node('li'); li.innerHTML = o.text; ol.append(li); });
        qt.append(ol);
      }
      const fb = node('details', 'mq-feedback');
      const sm = node('summary', null, L.previewSolution);
      const body = node('div');
      body.innerHTML = q.general;
      fb.append(sm, body);
      preview.append(node('p', 'mq-qname', q.name), qt, fb);
    }

    function refresh() {
      const nk = kinds().length; const nl = levels().length;
      const cats = nk * nl;
      summary.textContent = cats ? L.summary(cats * sel.count, cats) : L.nothing;
      btn.disabled = !cats;
      renderPreview();
    }

    const calcItems = M.KINDS.filter((k) => k.type === 'calc').map((k) => check(L.kind[k.id], sel.kinds.has(k.id), (on) => {
      if (on) sel.kinds.add(k.id); else sel.kinds.delete(k.id);
      refresh();
    }));
    const mcItems = M.KINDS.filter((k) => k.type !== 'calc').map((k) => check(L.kind[k.id], sel.kinds.has(k.id), (on) => {
      if (on) sel.kinds.add(k.id); else sel.kinds.delete(k.id);
      refresh();
    }));
    const levelItems = M.LEVELS.map((lv) => check(L.level[lv], sel.levels.has(lv), (on) => {
      if (on) sel.levels.add(lv); else sel.levels.delete(lv);
      refresh();
    }));

    btn.addEventListener('click', () => {
      const r = M.generate({ lang, kinds: kinds(), levels: levels(), count: sel.count, n: sel.n });
      const date = new Date().toISOString().slice(0, 10);
      const file = `${L.file}-${date}-s${r.seed}.xml`;
      download(file, M.toXml(r));
      let msg = L.done(r.questions.length, r.seed, file);
      if (r.missing.length) {
        const T = M.texts[lang] || M.texts.es;
        const list = r.missing.map((m) => `${L.kind[m.kind].split(':')[0]} · ${T.level[m.level]} (${m.made}/${m.wanted})`).join('; ');
        msg += ` ${L.missing(list)}`;
      }
      last = { lang, text: msg };
      status.textContent = msg;
    });

    const how = node('ol', 'mq-how');
    L.how.forEach((h) => how.append(node('li', null, h)));

    const form = node('div', 'mq-form');
    form.append(
      node('h2', null, L.typesTitle),
      group(L.calc, L.calcHint, calcItems),
      group(L.mc, L.mcHint, mcItems),
      group(L.levelsTitle, L.levelsHint, levelItems),
      group(L.sizeTitle, null, [
        numberField(L.count, sel.count, 1, 50, (v) => { sel.count = v; refresh(); }),
        numberField(L.n, sel.n, 8, 10, (v) => { sel.n = v; refresh(); }),
      ]),
    );
    const actions = node('div', 'mq-actions');
    actions.append(summary, btn, status);
    if (last && last.lang === lang) status.textContent = last.text;

    const sec = (title, ...kids) => { const s = node('section', 'about-section'); s.append(node('h2', null, title), ...kids); return s; };
    container.replaceChildren(
      node('h1', null, L.title),
      node('p', 'lead', L.lead),
      form,
      actions,
      sec(L.previewTitle, node('p', 'hint', L.previewHint), preview),
      sec(L.howTitle, how, node('p', 'hint', L.seedNote)),
    );
    refresh();
  }

  (root.GAX = root.GAX || {}).moodlePage = { renderMoodle, text };
})(typeof self !== 'undefined' ? self : this);
