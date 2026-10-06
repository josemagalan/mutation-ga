/*
 * Vista D3 de un operador de mutación: el padre arriba, el mutante abajo y, si el operador lo
 * pide, un panel auxiliar entre los dos (p. ej. los números aleatorios de cada posición).
 * Dibuja los marcadores arrastrables (posiciones o tramo elegidos) y anima cada paso de la traza:
 * los genes «vuelan» del padre al mutante (o dentro del mutante, al recolocarse) y los que
 * cambian de valor «giran».
 */
(function (root) {
  'use strict';
  const d3 = root.d3;
  const W_WIDE = 1000;
  const CELL_MAX = 72;

  // Paneles auxiliares: cada operador puede declarar uno (spec.aux) y la traza indica en cada
  // paso si se ve (auxVisible), qué casillas se han revelado (revealed) y cuáles resalta (auxActive).
  const AUX = {
    // Números aleatorios por posición (inversión de bits): r, y el bit sorteado si lo hay.
    draws: {
      caption: 'drawsCaption',
      captionShort: 'drawsCaptionShort',
      height: ({ s }) => Math.round(Math.max(34, Math.min(52, s * 0.8))),
      show(g, step, aux, geo, opts) {
        const shown = new Set(step.revealed || []);
        const act = step.auxActive || [];
        const h = geo.auxH;
        const cells = g.selectAll('g.dcell')
          .data(aux.items.map((it, i) => Object.assign({ i }, it)), (d) => d.i)
          .join((enter) => {
            const c = enter.append('g').attr('class', 'dcell');
            c.append('rect').attr('class', 'dcell-rect');
            c.append('text').attr('class', 'dcell-r');
            c.append('text').attr('class', 'dcell-s');
            return c;
          });
        const x = (i) => geo.x0 + i * geo.cell + (geo.cell - geo.s) / 2;
        cells.attr('transform', (d) => `translate(${x(d.i)},${geo.yAux})`)
          .classed('shown', (d) => shown.has(d.i))
          .classed('hit', (d) => shown.has(d.i) && d.hit)
          .classed('active', (d) => act.indexOf(d.i) !== -1);
        cells.select('.dcell-rect').attr('width', geo.s).attr('height', h).attr('rx', 5);
        const fs = Math.round(Math.min(h * 0.36, geo.s * 0.3));
        cells.select('.dcell-r')
          .attr('x', geo.s / 2).attr('y', (d) => (shown.has(d.i) && (d.s != null || d.val != null) ? h * 0.36 : h / 2)).attr('dy', '0.36em')
          .style('font-size', `${fs}px`)
          .text((d) => (shown.has(d.i) ? opts.formatDraw(d.r) : '?'));
        cells.select('.dcell-s')
          .attr('x', geo.s / 2).attr('y', h * 0.74).attr('dy', '0.36em')
          .style('font-size', `${Math.round(fs * 0.82)}px`)
          .text((d) => {
            if (!shown.has(d.i) || (d.s == null && d.val == null)) return '';
            if (d.delta != null) return d.delta;   // deslizamiento: el paso
            return d.val != null ? `→ ${opts.format(d.val)}` : `s ${opts.formatDraw(d.s)}`;
          });
      },
    },
  };

  // Representación real: la tira de números aleatorios y, debajo, la distribución del valor
  // mutado en la posición activa (histograma de muchas mutaciones con los mismos ajustes), con el
  // valor del padre y, cuando se conoce, el del mutante. Es el equivalente de la nube de BLX-α/SBX.
  const HIST = { gap: 30, h: (compact) => (compact ? 92 : 124), foot: 24 };
  AUX.real = {
    caption: 'drawsCaption',
    captionShort: 'drawsCaptionShort',
    height: ({ s, compact }) => AUX.draws.height({ s }) + HIST.gap + HIST.h(compact) + HIST.foot,
    show(g, step, aux, geo, opts) {
      const stripH = AUX.draws.height({ s: geo.s });
      const strip = g.selectAll('g.real-strip').data([0]).join('g').attr('class', 'real-strip');
      AUX.draws.show(strip, step, aux, Object.assign({}, geo, { auxH: stripH }), opts);

      const hg = g.selectAll('g.real-hist').data(aux.hists ? [0] : []).join('g').attr('class', 'real-hist');
      if (!aux.hists) return;
      const pos = step.histPos != null ? step.histPos : 0;
      const bins = aux.hists[pos];
      const hh = HIST.h(geo.compact);
      const y0 = geo.yAux + stripH + HIST.gap;
      const xL = geo.x0 + (geo.cell - geo.s) / 2;
      const W = geo.cell * geo.n - (geo.cell - geo.s);
      const X = (v) => xL + ((v - aux.lo) / (aux.hi - aux.lo)) * W;
      const bw = W / bins.length;
      const max = Math.max.apply(null, bins) || 1;

      hg.selectAll('text.hist-title').data([0]).join('text').attr('class', 'hist-title')
        .attr('x', xL + W / 2).attr('y', y0 - 10)
        .text(opts.label('histTitle', { pos: pos + 1, samples: aux.samples }));
      hg.selectAll('rect.hist-frame').data([0]).join('rect').attr('class', 'hist-frame')
        .attr('x', xL).attr('y', y0).attr('width', W).attr('height', hh).attr('rx', 6);
      hg.selectAll('rect.hist-bar').data(bins.map((f, k) => ({ f, k })), (d) => d.k).join('rect')
        .attr('class', 'hist-bar')
        .attr('x', (d) => xL + d.k * bw + 1).attr('width', Math.max(1, bw - 2))
        .attr('y', (d) => y0 + hh - (d.f / max) * (hh - 8)).attr('height', (d) => (d.f / max) * (hh - 8));
      const ticks = [aux.lo, (aux.lo + aux.hi) / 2, aux.hi];
      hg.selectAll('text.hist-tick').data(ticks).join('text').attr('class', 'hist-tick')
        .attr('x', (v) => X(v)).attr('y', y0 + hh + 16)
        .attr('text-anchor', (v, i) => (i === 0 ? 'start' : i === 2 ? 'end' : 'middle'))
        .text((v) => opts.format(v));

      const pv = aux.parent[pos];
      const pm = hg.selectAll('g.hist-parent').data([pv]).join((enter) => {
        const e = enter.append('g').attr('class', 'hist-parent');
        e.append('line');
        e.append('text');
        return e;
      });
      pm.select('line').attr('x1', X(pv)).attr('x2', X(pv)).attr('y1', y0 - 2).attr('y2', y0 + hh + 2);
      pm.select('text').attr('x', X(pv) + (X(pv) > xL + W - 70 ? -6 : 6)).attr('y', y0 + 14)
        .attr('text-anchor', X(pv) > xL + W - 70 ? 'end' : 'start')
        .text(`${opts.label('parentShortHist')} ${opts.format(pv)}`);

      const mv = step.histMark;
      const r = 8;
      hg.selectAll('path.hist-mut').data(mv != null ? [mv] : []).join('path').attr('class', 'hist-mut')
        .attr('d', (v) => `M ${X(v)} ${y0 + hh - 2 * r} L ${X(v) + r} ${y0 + hh - r} L ${X(v)} ${y0 + hh} L ${X(v) - r} ${y0 + hh - r} Z`);
    },
  };

  function createChromosomeView(svgEl, opts) {
    const svg = d3.select(svgEl);
    const label = opts.label;                 // (key, params) => texto traducido
    const fmt = opts.format || ((v) => v);   // valor de un gen => texto (decimales según el idioma)
    const duration = opts.duration;           // () => ms de animación
    const onMarkDrag = opts.onMarkDrag;       // (índice del marcador, posición deseada) => void

    let geo = null;
    let problem = null;   // { parent, marks: [..], markType: 'gene' | 'gap' | null, markNames, aux: { type, ... } | null }
    let current = null;

    // Patrón rayado para los genes recolocados (permutaciones)
    const defs = svg.append('defs');
    const pat = defs.append('pattern')
      .attr('id', 'hatch-moved')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 9).attr('height', 9)
      .attr('patternTransform', 'rotate(45)');
    pat.append('rect').attr('width', 9).attr('height', 9).style('fill', 'var(--p1)');
    pat.append('rect').attr('width', 4).attr('height', 9).attr('class', 'hatch-stripe');

    const gBands = svg.append('g').attr('class', 'bands');
    const gLabels = svg.append('g').attr('class', 'labels');
    const gIdx = svg.append('g').attr('class', 'indices');
    const gCutLines = svg.append('g').attr('class', 'cut-lines');
    const gSlots = svg.append('g').attr('class', 'slots');
    const gParent = svg.append('g').attr('class', 'parents');
    const gChild = svg.append('g').attr('class', 'children');
    const gAux = svg.append('g').attr('class', 'aux');
    const gGhost = svg.append('g').attr('class', 'ghosts');
    const gHandles = svg.append('g').attr('class', 'handles');

    function layout(n, auxType) {
      const hasAux = !!(auxType && AUX[auxType]);
      const compact = svgEl.clientWidth > 0 && svgEl.clientWidth < 640;
      const left = compact ? 44 : 128;
      const right = compact ? 8 : 16;
      const W = compact ? left + right + n * CELL_MAX : W_WIDE;
      const avail = W - left - right;
      const cell = Math.min(CELL_MAX, avail / n);
      const s = Math.round(cell * 0.84);
      const x0 = left + (avail - cell * n) / 2;
      const yHandle = 14;
      const yIdx = 44;
      const yP = 58;
      const yAux = yP + s + 52;
      const auxSq = Math.round(Math.min(34, s * 0.62));
      const auxH = hasAux && AUX[auxType].height ? AUX[auxType].height({ s, compact }) : auxSq;
      const yC = hasAux ? yAux + auxH + 40 : yP + s + 64;
      const H = yC + s + 18;
      return { W, n, compact, left, cell, s, x0, yHandle, yIdx, yAux, auxSq, auxH, H, rowY: { p: yP, c: yC } };
    }

    const geneX = (i) => geo.x0 + i * geo.cell + (geo.cell - geo.s) / 2;
    const gapX = (g) => geo.x0 + g * geo.cell;

    // Dibuja un gen dentro de un <g> (genes, mutante y «fantasmas»). El cuerpo va en un <g>
    // interior para poder girarlo sin tocar la posición del gen.
    function paintGene(g, d) {
      const s = geo.s;
      g.selectAll('*').remove();
      const body = g.append('g').attr('class', 'gene-body');
      const mutated = d.kind === 'mutated';
      const moved = d.kind === 'moved';
      body.append('rect')
        .attr('class', 'gene-rect')
        .attr('width', s).attr('height', s)
        .attr('rx', Math.max(4, s * 0.14))
        .style('fill', mutated ? 'var(--mut)' : moved ? 'url(#hatch-moved)' : 'var(--p1)');
      const txt = String(fmt(d.v));
      const fs = Math.min(s * 0.44, (s * 0.9) / (txt.length * 0.58));
      body.append('text')
        .attr('class', moved ? 'gene-num gene-num-halo' : mutated ? 'gene-num ink-mut' : 'gene-num ink-p1')
        .attr('x', s / 2).attr('y', s / 2)
        .attr('dy', '0.36em')
        .style('font-size', `${Math.round(fs)}px`)
        .text(txt);
      if (moved && s >= 40) {   // en pantallas estrechas basta el rayado
        const r = Math.max(7, s * 0.15);
        const b = body.append('g').attr('class', 'badge').attr('transform', `translate(${s - r * 0.55},${r * 0.55})`);
        b.append('circle').attr('r', r);
        b.append('text').attr('dy', '0.35em').style('font-size', `${Math.round(r * 1.3)}px`).text('↔');
      }
      return body;
    }

    function setProblem(np) {
      const sizeChanged = !geo || geo.n !== np.parent.length;
      const auxChanged = !problem || (problem.aux && problem.aux.type) !== (np.aux && np.aux.type);
      problem = np;
      geo = layout(np.parent.length, np.aux && np.aux.type);
      svg.attr('viewBox', `0 0 ${geo.W} ${geo.H}`);
      if (sizeChanged) {
        gParent.selectAll('*').remove();
        gChild.selectAll('*').remove();
        gSlots.selectAll('*').remove();
      }
      if (auxChanged || sizeChanged) gAux.selectAll('*').remove();
      drawLabels();
      drawIndices();
      drawParent();
      drawSlots();
      drawMarks();
    }

    function drawLabels() {
      const short = geo.compact ? 'Short' : '';
      const rows = [{ key: 'parent', row: 'p' }, { key: 'mutant', row: 'c' }];
      gLabels.selectAll('text.row-label')
        .data(rows, (d) => d.key)
        .join('text')
        .attr('class', (d) => `row-label lbl-${d.row}`)
        .attr('x', geo.left - (geo.compact ? 10 : 18))
        .attr('y', (d) => geo.rowY[d.row] + geo.s / 2)
        .attr('dy', '0.35em')
        .text((d) => label(d.key + short));
      const A = problem.aux && AUX[problem.aux.type];
      gLabels.selectAll('text.aux-caption')
        .data(A ? [(geo.compact && A.captionShort) || A.caption] : [])
        .join('text')
        .attr('class', 'aux-caption')
        .classed('visible', !!(current && current.auxVisible))
        .attr('x', geo.x0 + (geo.cell * geo.n) / 2)
        .attr('y', geo.yAux - 16)
        .text((key) => label(key));
    }

    function drawIndices() {
      gIdx.selectAll('text')
        .data(d3.range(geo.n))
        .join('text')
        .attr('class', 'idx')
        .attr('x', (i) => geneX(i) + geo.s / 2)
        .attr('y', geo.yIdx)
        .text((i) => i + 1);
    }

    function drawParent() {
      const data = problem.parent.map((v, pos) => ({ row: 'p', pos, v, kind: 'parent' }));
      gParent.selectAll('g.gene')
        .data(data, (d) => `${d.row}-${d.pos}`)
        .join('g')
        .attr('class', 'gene')
        .attr('transform', (d) => `translate(${geneX(d.pos)},${geo.rowY.p})`)
        .each(function (d) { paintGene(d3.select(this), d); });
    }

    function drawSlots() {
      gSlots.selectAll('rect.slot')
        .data(d3.range(geo.n), (d) => d)
        .join('rect')
        .attr('class', 'slot')
        .attr('x', (pos) => geneX(pos))
        .attr('y', geo.rowY.c)
        .attr('width', geo.s).attr('height', geo.s)
        .attr('rx', Math.max(4, geo.s * 0.14));
    }

    // Marcadores: posiciones de genes (◆ sobre el gen y su columna sombreada) o un tramo entre
    // dos huecos (◆ en cada corte y el tramo sombreado), como los cortes de los cruces.
    function drawMarks() {
      const marks = problem.marks || [];
      const type = problem.markType;
      const pad = 10;
      const y0 = geo.rowY.p - pad;
      const y1 = geo.rowY.c + geo.s + pad;
      let bands = [];
      if (type === 'gene') bands = marks.map((m, k) => ({ id: `g${k}`, from: m, to: m + 1 }));
      if (type === 'gap' && marks.length === 2) bands = [{ id: 'seg', from: marks[0], to: marks[1] }];
      gBands.selectAll('rect.band')
        .data(bands, (d) => d.id)
        .join('rect')
        .attr('class', 'band visible')
        .attr('x', (d) => gapX(d.from) + (type === 'gene' ? 3 : 0))
        .attr('width', (d) => gapX(d.to) - gapX(d.from) - (type === 'gene' ? 6 : 0))
        .attr('y', y0)
        .attr('height', y1 - y0)
        .attr('rx', 10);

      gCutLines.selectAll('line.cut')
        .data(type === 'gap' ? marks.map((m, k) => ({ k, m })) : [], (d) => d.k)
        .join('line')
        .attr('class', 'cut')
        .attr('x1', (d) => gapX(d.m)).attr('x2', (d) => gapX(d.m))
        .attr('y1', y0).attr('y2', y1);

      const xOf = (m) => (type === 'gene' ? geneX(m) + geo.s / 2 : gapX(m));
      const handles = gHandles.selectAll('g.handle')
        .data(marks.map((_, i) => i), (d) => d)
        .join((enter) => {
          const g = enter.append('g')
            .attr('class', 'handle')
            .attr('tabindex', 0)
            .attr('role', 'slider');
          g.append('rect').attr('class', 'handle-hit');
          g.append('line').attr('class', 'handle-stem');
          g.append('path').attr('class', 'handle-diamond').attr('d', 'M0,-10 L10,0 L0,10 L-10,0 Z');
          g.append('text').attr('class', 'handle-name').attr('x', 14).attr('dy', '0.35em');
          g.call(dragBehavior);
          g.on('keydown', onHandleKey);
          return g;
        });
      handles
        .attr('transform', (d) => `translate(${xOf(marks[d])},${geo.yHandle})`)
        .attr('aria-label', (d) => `${label('markLabel')} ${d + 1}`)
        .attr('aria-valuenow', (d) => marks[d] + (type === 'gene' ? 1 : 0));
      handles.select('.handle-hit')
        .attr('x', -18).attr('y', -geo.yHandle)
        .attr('width', 36).attr('height', geo.rowY.p + geo.s + 12);
      handles.select('.handle-stem').attr('y1', 10).attr('y2', geo.rowY.p - 10 - geo.yHandle);
      handles.select('.handle-name').text((d) => (problem.markNames ? problem.markNames[d] : ''));
    }

    // Se crea una sola vez: redibujar no interrumpe un arrastre en curso.
    const dragBehavior = d3.drag()
      .container(svgEl)
      .subject((event) => ({ x: event.x, y: event.y }))
      .on('start', function () { d3.select(this).classed('dragging', true); })
      .on('drag', function (event, h) {
        const u = (event.x - geo.x0) / geo.cell;
        onMarkDrag(h, problem.markType === 'gene' ? Math.floor(u) : Math.round(u));
      })
      .on('end', function () { d3.select(this).classed('dragging', false); });

    function onHandleKey(event, h) {
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      onMarkDrag(h, problem.marks[h] + delta);
    }

    const has = (obj, row, pos) => !!(obj && obj[row] && obj[row].indexOf(pos) !== -1);

    function show(step, { animate } = {}) {
      const prev = current;
      current = step;
      const dur = animate ? duration() : 0;

      gGhost.selectAll('*').interrupt().remove();
      gChild.selectAll('g.gene').interrupt().style('opacity', null);

      // Padre: resaltar / atenuar
      const hl = step.highlight.p;
      gParent.selectAll('g.gene')
        .classed('active', (d) => has(step.highlight, 'p', d.pos))
        .classed('dim', (d) => !!(hl && hl.length) && !has(step.highlight, 'p', d.pos));

      // Mutante
      const data = [];
      step.child.forEach((g, pos) => { if (g) data.push(Object.assign({ row: 'c', pos }, g)); });
      const flyTargets = new Set(step.fly.map((f) => `${f.to[0]}-${f.to[1]}`));
      const flips = new Set(step.flip || []);
      const genes = gChild.selectAll('g.gene')
        .data(data, (d) => `${d.row}-${d.pos}`)
        .join('g')
        .attr('class', 'gene')
        .attr('transform', (d) => `translate(${geneX(d.pos)},${geo.rowY.c})`)
        .each(function (d) { paintGene(d3.select(this), d); })
        .classed('active', (d) => has(step.highlight, 'c', d.pos))
        .classed('conflict', (d) => has(step.conflict, 'c', d.pos));

      // Panel auxiliar del operador
      gAux.classed('visible', !!step.auxVisible);
      gLabels.selectAll('text.aux-caption').classed('visible', !!step.auxVisible);
      if (problem.aux && AUX[problem.aux.type]) AUX[problem.aux.type].show(gAux, step, problem.aux, geo, opts);

      if (dur <= 0) return;

      // Animación: el gen «vuela» desde su origen hasta su hueco en el mutante
      if (step.fly.length) {
        genes.filter((d) => flyTargets.has(`${d.row}-${d.pos}`))
          .style('opacity', 0)
          .transition().delay(dur).duration(0).style('opacity', 1);
        step.fly.forEach((f, idx) => {
          const d = step.child[f.to[1]];
          const ghost = gGhost.append('g')
            .attr('class', 'gene ghost')
            .attr('transform', `translate(${geneX(f.from[1])},${geo.rowY[f.from[0]]})`);
          paintGene(ghost, d);
          const delay = Math.min(idx * 40, dur * 0.4);
          ghost.transition()
            .delay(delay)
            .duration(dur - delay)
            .ease(d3.easeCubicInOut)
            .attr('transform', `translate(${geneX(f.to[1])},${geo.rowY[f.to[0]]})`)
            .remove();
        });
      }

      // Animación: el gen que cambia de valor gira (el valor anterior se pliega y aparece el nuevo)
      if (flips.size) {
        const half = Math.round(dur / 2);
        genes.filter((d) => flips.has(d.pos)).each(function () {
          d3.select(this).select('.gene-body')
            .classed('flip-in', true)
            .style('animation-duration', `${half}ms`)
            .style('animation-delay', `${half}ms`);
        });
        flips.forEach((pos) => {
          const old = prev && prev.child[pos];
          if (!old) return;
          const ghost = gGhost.append('g')
            .attr('class', 'gene ghost')
            .attr('transform', `translate(${geneX(pos)},${geo.rowY.c})`);
          paintGene(ghost, old).classed('flip-out', true).style('animation-duration', `${half}ms`);
          ghost.transition().delay(half).duration(0).remove();
        });
      }
    }

    function refreshLabels() {
      if (!geo) return;
      drawLabels();
      drawParent();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!geo || !problem) return;
        const compact = svgEl.clientWidth > 0 && svgEl.clientWidth < 640;
        if (compact !== geo.compact) {
          setProblem(problem);
          if (current) show(current, { animate: false });
        }
      }, 150);
    });

    return { setProblem, show, refreshLabels, get step() { return current; } };
  }

  (root.GAX = root.GAX || {}).createChromosomeView = createChromosomeView;
})(typeof self !== 'undefined' ? self : this);
