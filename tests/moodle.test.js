'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/moodle.js');
const { swapMutation } = require('../js/operators/swap.js');
const { insertMutation } = require('../js/operators/insert.js');
const { inversionMutation } = require('../js/operators/inversion.js');

const ALL = M.KINDS.map((k) => k.id);
const bank = {};
['es', 'en'].forEach((lang) => {
  bank[lang] = M.generate({ lang, kinds: ALL, levels: M.LEVELS, count: 6, n: 8, seed: 424242 });
  bank[lang].xml = M.toXml(bank[lang]);
});
const bank10 = M.generate({ lang: 'es', kinds: ALL, levels: M.LEVELS, count: 4, n: 10, seed: 99 });

// ---------- Lectura de lo que ve el alumno (independiente de los campos internos) ----------

const numOf = (s) => Number(String(s).replace(',', '.'));
function rows(html) {
  const out = [];
  for (const m of html.matchAll(/<tr><th[^>]*>([^<]*)<\/th>(.*?)<\/tr>/g)) {
    const tds = [...m[2].matchAll(/<td style="([^"]*)">(.*?)<\/td>/g)];
    out.push({
      label: m[1].replace(/&rsquo;|’/g, "'"),
      cells: tds.map((t) => t[2]),
      cuts: tds.map((t, i) => (t[1].includes('border-left') ? i : -1)).filter((i) => i >= 0),
      marks: tds.map((t, i) => (t[1].includes('background') ? i : -1)).filter((i) => i >= 0),
    });
  }
  return rows.length ? out : out;
}
const cloze = (c) => {
  const m = c.match(/^\{1:(SHORTANSWER|NUMERICAL):=([-\d.]+)(?::([\d.]+))?\}$/);
  return { v: Number(m[2]), tol: m[3] ? Number(m[3]) : 0, type: m[1] };
};

function readQuestion(q) {
  const rs = rows(q.text);
  const by = (re) => rs.find((r) => re.test(r.label));
  const pr = by(/^(Padre|Parent)$/);
  const ans = rs.find((r) => /^(Mutante|Mutant)$/.test(r.label) && r.cells[0].startsWith('{1:'));
  const shown = rs.find((r) => /^(Mutante|Mutant)$/.test(r.label) && !r.cells[0].startsWith('{1:')) || by(/estudiante|Student/);
  const opt = (re) => { const r = by(re); return r ? r.cells.map((c) => (c === '—' ? null : numOf(c))) : null; };
  const ij = q.text.match(/i = (\d+)\D+j = (\d+)/);
  return {
    parent: pr.cells.map(numOf), cuts: pr.cuts, marks: pr.marks,
    r: opt(/^r$/), u: opt(/^u$/), z: opt(/^z$/),
    answer: ans ? ans.cells.map(cloze) : null,
    shown: shown ? shown.cells.map(numOf) : null,
    ij: ij ? [Number(ij[1]) - 1, Number(ij[2]) - 1] : null,
  };
}
const hashOf = (link) => new URLSearchParams(link.split('#')[1]);
const segOf = (s) => [s.cuts[0], s.cuts[1] != null ? s.cuts[1] : s.parent.length];

// Resolución independiente a partir de lo que dice el enunciado.
function solve(q, s) {
  const pm = M.PM[q.kind.replace('calc-', '').replace('error-', '')];
  if (q.kind.endsWith('bit-flip')) return s.parent.map((b, i) => (s.r[i] < pm ? 1 - b : b));
  if (q.kind === 'calc-creep') {
    const st = M.STEP[q.level];
    return s.parent.map((g, i) => {
      if (!(s.r[i] < pm)) return g;
      const k = Math.floor(s.u[i] * 2 * st);
      const d = k < st ? k - st : k - st + 1;
      return Math.min(9, Math.max(0, g + d));
    });
  }
  if (q.kind === 'calc-gaussian') return s.parent.map((g, i) => (s.r[i] < pm ? Math.min(10, Math.max(0, g + M.SIGMA[q.level] * s.z[i])) : g));
  if (q.kind === 'calc-swap') return swapMutation(s.parent, ...s.ij).child;
  if (q.kind === 'calc-insert') return insertMutation(s.parent, ...s.ij).child;
  return inversionMutation(s.parent, ...segOf(s)).child;
}

// ---------- Pruebas ----------

test('se generan todos los tipos y niveles sin huecos (n = 8 y n = 10)', () => {
  ['es', 'en'].forEach((lang) => {
    assert.equal(bank[lang].missing.length, 0, JSON.stringify(bank[lang].missing));
    assert.equal(bank[lang].questions.length, ALL.length * M.LEVELS.length * 6);
  });
  assert.equal(bank10.missing.length, 0, JSON.stringify(bank10.missing));
});

test('«calcular el mutante»: las casillas coinciden con lo que se obtiene del enunciado', () => {
  bank.es.questions.concat(bank.en.questions, bank10.questions).filter((q) => q.kind.startsWith('calc-')).forEach((q) => {
    const s = readQuestion(q);
    const exp = solve(q, s);
    assert.equal(s.answer.length, exp.length, q.name);
    s.answer.forEach((c, i) => {
      if (q.kind === 'calc-gaussian') {
        assert.equal(c.type, 'NUMERICAL');
        // z se muestra con dos decimales: el error que introduce cabe en la tolerancia
        assert.ok(Math.abs(c.v - exp[i]) <= c.tol, `${q.name}: ${c.v} frente a ${exp[i]}`);
      } else assert.equal(c.v, exp[i], q.name);
    });
    if (/swap|insert|inversion/.test(q.kind)) assert.equal(new Set(exp).size, exp.length, q.name);
    assert.notDeepEqual(s.answer.map((c) => c.v), s.parent, `${q.name}: el mutante no es una copia`);
  });
});

test('opción múltiple: una sola correcta y penalización −1/(k−1)', () => {
  const blocks = [...bank.es.xml.matchAll(/<question type="multichoice">([\s\S]*?)<\/question>/g)].map((m) => m[1]);
  assert.ok(blocks.length > 0);
  blocks.forEach((b) => {
    const fr = [...b.matchAll(/<answer fraction="([^"]+)"/g)].map((m) => Number(m[1]));
    assert.equal(fr.length, 4);
    assert.equal(fr.filter((f) => f === 100).length, 1);
    fr.filter((f) => f !== 100).forEach((f) => assert.ok(Math.abs(f + 100 / 3) < 1e-4));
    assert.match(b, /<shuffleanswers>1<\/shuffleanswers>/);
  });
});

test('«identificar el operador»: solo la opción correcta explica el mutante', () => {
  const qs = bank.es.questions.concat(bank10.questions).filter((q) => q.kind === 'identify');
  const targets = new Set();
  qs.forEach((q) => {
    const s = readQuestion(q);
    const can = M.reachable(s.parent, s.shown);
    if (q.target === 'scramble') assert.equal(can.size, 0, q.name);
    else assert.deepEqual([...can], [q.target], q.name);
    assert.equal(q.options.findIndex((o) => o.correct), q.correct);
    targets.add(q.target);
  });
  assert.equal(targets.size, 4, 'aparecen los cuatro operadores como respuesta correcta');
});

test('«detectar el error»: el mutante del estudiante lleva exactamente el error marcado como correcto', () => {
  const mistakes = new Set();
  bank.es.questions.filter((q) => q.kind.startsWith('error-')).forEach((q) => {
    const s = readQuestion(q);
    if (q.kind === 'error-inversion') {
      const [a, b] = segOf(s);
      const errs = M.inversionMistakes(s.parent, a, b);
      assert.deepEqual(s.shown, errs[q.mistake], q.name);
      assert.notDeepEqual(s.shown, inversionMutation(s.parent, a, b).child);
    } else {
      const hits = s.r.map((r, i) => (r < M.PM['bit-flip'] ? i : -1)).filter((i) => i >= 0);
      assert.deepEqual(s.shown, M.bitMistakes(s.parent, hits)[q.mistake], q.name);
      assert.notDeepEqual(s.shown, solve(q, s));
    }
    assert.ok(q.options[q.correct].correct);
    mistakes.add(`${q.kind}/${q.mistake}`);
  });
  assert.equal(mistakes.size, 6, 'aparecen los tres errores de cada tipo');
});

test('los niveles respetan sus filtros', () => {
  bank.es.questions.forEach((q) => {
    const s = readQuestion(q);
    if (q.kind === 'calc-bit-flip' || q.kind === 'error-bit-flip') assert.equal(s.parent.length, M.LEN.binary[q.level], q.name);
    if (q.kind === 'calc-creep') assert.equal(s.parent.length, M.LEN.integer[q.level], q.name);
    if (q.kind === 'calc-gaussian') assert.equal(s.parent.length, M.LEN.real[q.level], q.name);
    if (q.kind === 'calc-bit-flip' || q.kind === 'calc-creep' || q.kind === 'calc-gaussian') {
      const pm = M.PM[q.kind.replace('calc-', '')];
      const hits = s.r.filter((r) => r < pm).length;
      assert.ok(hits >= M.HITS[q.level][0] && hits <= M.HITS[q.level][1], `${q.name}: ${hits} posiciones`);
    }
    if (q.kind === 'calc-swap' || q.kind === 'calc-insert') {
      const d = Math.abs(s.ij[0] - s.ij[1]);
      assert.ok(d >= M.DIST[q.level][0] && d <= M.DIST[q.level][1], `${q.name}: distancia ${d}`);
      assert.deepEqual(s.marks.slice().sort(), s.ij.slice().sort(), `${q.name}: casillas resaltadas`);
    }
    if (q.kind === 'calc-inversion' || q.kind === 'error-inversion') {
      const [a, b] = segOf(s);
      const range = (q.kind === 'calc-inversion' ? M.SEG : M.SEG_ERR)[q.level];
      assert.ok(b - a >= range[0] && b - a <= range[1], `${q.name}: tramo de ${b - a}`);
    }
  });
});

test('los enlaces reproducen el ejercicio (padre, sorteo, marcadores, parámetros y paso)', () => {
  const OPS = {
    'bit-flip': require('../js/operators/bit-flip.js').spec,
    creep: require('../js/operators/creep.js').spec,
    gaussian: require('../js/operators/gaussian.js').spec,
    swap: require('../js/operators/swap.js').spec,
    insert: require('../js/operators/insert.js').spec,
    inversion: require('../js/operators/inversion.js').spec,
    scramble: require('../js/operators/scramble.js').spec,
  };
  bank.es.questions.forEach((q) => {
    const s = readQuestion(q);
    const h = hashOf(q.link);
    assert.ok(q.link.startsWith(M.APP + '#'), q.link);
    assert.equal(h.get('lang'), 'es');
    assert.ok(q.general.includes(q.link.replace(/&/g, '&amp;')), `${q.name}: el enlace está en la retroalimentación`);
    assert.ok(!q.text.includes(M.APP), `${q.name}: el enunciado no enlaza a la aplicación`);
    assert.ok(Number(h.get('s')) < 1e6);
    const spec = OPS[h.get('op')];
    const parent = h.get('p').split('-').map(Number);
    assert.deepEqual(parent, s.parent, q.name);
    const params = {};
    (spec.params || []).forEach((p) => { if (h.has(p.id)) params[p.id] = Number(h.get(p.id)); });
    const marks = h.has('c') ? h.get('c').split('-').map(Number) : [];
    const r = h.has('r') ? Number(h.get('r')) : undefined;
    if (r != null) assert.ok(r > 0 && r < 1e6);
    const res = spec.run(parent, marks, { variant: h.get('v') || undefined, seed: r, params });
    if (q.kind.startsWith('calc-')) {
      res.child.forEach((v, i) => assert.ok(Math.abs(v - s.answer[i].v) <= (q.kind === 'calc-gaussian' ? 0.005 + 1e-9 : 0), q.name));
    }
    if (q.kind === 'identify') assert.deepEqual(res.child, s.shown, q.name);
    if (q.kind === 'error-inversion') assert.equal(res.steps[Number(h.get('step'))].type, 'reverse');
    if (q.kind === 'error-bit-flip') assert.equal(res.steps[Number(h.get('step'))].type, 'drawHit');
  });
});

test('misma semilla, mismo banco; semillas distintas, bancos distintos; sin ejercicios repetidos', () => {
  const opts = { lang: 'es', kinds: ['calc-swap', 'identify'], levels: ['medium'], count: 5, n: 9 };
  assert.equal(M.toXml(M.generate(Object.assign({ seed: 5 }, opts))), M.toXml(M.generate(Object.assign({ seed: 5 }, opts))));
  assert.notEqual(M.toXml(M.generate(Object.assign({ seed: 5 }, opts))), M.toXml(M.generate(Object.assign({ seed: 6 }, opts))));
  const keys = bank.es.questions.map((q) => `${q.kind}|${q.parent.join()}|${q.text.length}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(Number.isInteger(M.generate({ lang: 'es', kinds: ['calc-swap'], levels: ['easy'], count: 1 }).seed));
});

test('el XML está bien formado y trae una categoría por tipo y nivel', () => {
  ['es', 'en'].forEach((lang) => {
    const xml = bank[lang].xml;
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
    const bare = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(bare, /&(?!amp;|lt;|gt;|quot;|apos;)/);
    const stack = [];
    for (const m of bare.matchAll(/<(\/?)([a-z]+)[^>]*?(\/?)>/g)) {
      if (m[3]) continue;
      if (m[1]) assert.equal(stack.pop(), m[2]);
      else stack.push(m[2]);
    }
    assert.equal(stack.length, 0);
    const cats = [...xml.matchAll(/<category><text>\$course\$\/top\/([^<]+)<\/text>/g)].map((m) => m[1]);
    assert.equal(new Set(cats).size, ALL.length * M.LEVELS.length);
    assert.ok(cats.every((c) => c.startsWith(M.texts[lang].root + '/')));
    const names = [...xml.matchAll(/<name><text>([^<]+)<\/text>/g)].map((m) => m[1]);
    assert.ok(names.every((n) => /s=\d+/.test(n)));
  });
});

test('el banco en inglés no arrastra textos en español', () => {
  const visible = bank.en.questions.map((q) => q.text + q.general + (q.options || []).map((o) => o.text + o.feedback).join('')).join(' ');
  assert.doesNotMatch(visible, /Padre|Mutante|posición|Correcto|tramo|Ver |muta /);
});
