/* 叠加式网页课件：在课程网页上方翻页讲授；翻到「网页实操」页时收成侧边卡片，下面就是原尺寸的真实网页。
   内容来自 lessons/<任务号>.js（window.LESSON），版式在本文件的 T{} 里，样式在 deck.css。
   与网页的通信（entry.js）：postMessage {deck:1, type:'mode'|'close'|'full', ...}；网页把翻页笔按键转发回来 {deck:1, type:'key'}。 */
(() => {
  'use strict';
  const L = window.LESSON;
  const stage = document.getElementById('stage'), side = document.getElementById('side'), bar = document.getElementById('bar');
  if (!L) { stage.innerHTML = '<p style="padding:80px;font-size:40px">找不到这节课的课件内容。</p>'; return; }
  const embed = window.parent !== window;
  const A = p => `../assets/${L.id}/${p}`;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');   // **加粗**、换行
  const two = n => String(n).padStart(2, '0');
  const st = (n, extra = '') => ` data-step="${n}"${extra}`;

  // 单独打开课件页时，回到课程网页并自动展开课件（课件总是叠在网页上用）
  if (!embed && L.page && !/[?&]standalone/.test(location.search)) {
    const n = parseInt(location.hash.slice(1), 10) || 1;
    const u = new URL(window.DECK_SITE + L.page, location.href); u.searchParams.set('slides', n);
    location.replace(u.href);
    return;
  }

  /* ---------------- 版式 ---------------- */
  const T = {
    cover: s => `<div class="cv-text">
        <div class="kick">${esc(L.chapter)}</div>
        <div class="cv-id">任务 ${esc(L.id)}</div>
        <h1 style="font-size:${[0,128,128,128,128,128,128,112,100,92][L.title.length] || 80}px${L.title.length > 9 ? ';white-space:normal;max-width:820px' : ''}">${esc(L.title)}</h1><p class="cv-sub">${esc(L.subtitle || '')}</p>
        <div class="cv-meta">${(s.meta || []).map(m => `<span>${esc(m)}</span>`).join('')}</div></div>
      <img class="cv-img" src="${A(s.image)}" alt="">`,

    question: s => `<div class="kick">${esc(s.kick || '课前一问')}</div><h1 class="q">${md(s.text)}</h1>
      ${s.sub ? `<p class="q-sub">${md(s.sub)}</p>` : ''}
      <div class="strip${(s.items || []).length <= 3 ? ' few' : ''}" style="grid-template-columns:repeat(${(s.items || []).length || 6},1fr)">${(s.items || []).map(m => `<figure><img src="${A(m.image)}" alt=""><figcaption>${esc(m.name)}</figcaption></figure>`).join('')}</div>`,

    goals: s => head(s) + `<div class="goals">${s.items.map((g, i) => `<div class="goal"><b>${two(i + 1)}</b><span class="tag">${esc(g.tag)}</span><p>${md(g.text)}</p></div>`).join('')}</div>`,

    section: s => `<div class="sec-n">${two(s.n)}</div><h1 class="sec-t">${esc(s.title)}</h1>
      ${s.items ? `<div class="sec-items">${s.items.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}`,

    duo: s => head(s) + `<div class="duo">${s.cols.map((c, i) => `<div class="duo-c${i ? ' r' : ''}">
        ${c.image ? `<img src="${A(c.image)}" alt="">` : ''}
        ${c.big ? `<div class="duo-big">${esc(c.big)}</div>` : ''}
        <div class="duo-h">${esc(c.heading)}</div><ul>${c.lines.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>`).join(s.arrow ? '<div class="duo-arrow">→</div>' : '<div class="duo-vs">vs</div>')}</div>`,

    chars: s => head(s) + `<div class="chars">${s.items.map((c, i) => `<div class="ch"${st(i + 1)}><div class="ch-c">${esc(c.char)}</div>
        <div class="ch-n">${esc(c.name)}</div><p>${md(c.text)}</p></div>`).join('')}</div>${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    statement: s => `<blockquote>${md(s.text)}</blockquote>${s.source ? `<div class="st-src">${esc(s.source)}</div>` : ''}`,

    lineup: s => head(s) + `<div class="lineup">${s.items.map(m => `<figure><img src="${A(m.image)}" alt="">
        <figcaption><b>${esc(m.name)}</b><span>${md(m.text)}</span></figcaption></figure>`).join('')}</div>`,

    families: s => head(s) + `<div class="fam">${s.items.map(f => `<div class="fam-i${f.trap ? ' trap' : ''}">
        <div class="fam-n">${esc(f.name)}</div><div class="fam-d">${md(f.does)}</div><div class="fam-e">${esc(f.examples)}</div></div>`).join('')}</div>
      ${s.trap ? `<div class="trap-bar"${st(1)}><span>易错</span>${md(s.trap)}</div>` : ''}`,

    anatomy: s => `<div class="an-text">${head(s)}${s.lead ? `<p class="lead">${md(s.lead)}</p>` : ''}
        <ul class="an-legend">${s.points.map((p, i) => `<li class="${p.main ? 'main' : ''}"${st(i + 1)}><i>${i + 1}</i><b>${esc(p.label)}</b><span>${md(p.text)}</span></li>`).join('')}</ul></div>
      <div class="an-fig"><div class="an-wrap"><img src="${A(s.image)}" alt="">${s.points.map((p, i) =>
        `<div class="pin${p.main ? ' main' : ''}" style="left:${p.x}%;top:${p.y}%"${st(i + 1)}><i>${i + 1}</i></div>`).join('')}</div></div>`,

    trio: s => head(s) + `<div class="trio n${s.items.length}${s.items[0].image ? '' : ' noimg'}">${s.items.map((m, i) => `<div class="tr${m.hot ? ' hot' : ''}"${s.stepwise ? st(i + 1) : ''}>${m.image ? `<img src="${A(m.image)}" alt="">` : ''}
        ${m.tag ? `<div class="tr-tag">${esc(m.tag)}</div>` : ''}<div class="tr-n">${esc(m.name)}</div>${m.rows.map(r => `<div class="tr-r"><span>${esc(r[0])}</span><p>${md(r[1])}</p></div>`).join('')}</div>`).join('')}</div>
      ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    // 闭环图：四个环节围成一圈
    loop: s => `<div class="lp-text">${head(s)}${s.lead ? `<p class="lead">${md(s.lead)}</p>` : ''}
        <ul class="lp-list">${s.items.map((x, i) => `<li${st(i + 1)}><b>${esc(x.name)}</b><span>${md(x.role)}</span><em>${md(x.example)}</em></li>`).join('')}</ul></div>
      <div class="lp-fig"><svg viewBox="0 0 760 760" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#14263D"/></marker></defs>
        <circle cx="380" cy="380" r="250" fill="none" stroke="#D8DEE6" stroke-width="3"/>
        ${[[380, 130], [630, 380], [380, 630], [130, 380]].map(([x, y], i) => {
          const a = [[470, 150, 610, 290], [610, 470, 470, 610], [290, 610, 150, 470], [150, 290, 290, 150]][i];
          return `<path d="M${a[0]} ${a[1]} Q ${i === 0 ? '590 170' : i === 1 ? '590 590' : i === 2 ? '170 590' : '170 170'} ${a[2]} ${a[3]}" fill="none" stroke="#14263D" stroke-width="4" marker-end="url(#ah)" class="lp-arc"${st(i + 1)}/>`;
        }).join('')}</svg>
        ${s.items.map((x, i) => `<div class="lp-node n${i}"${st(i + 1)}><b>${esc(x.name)}</b><span>${esc(x.short || '')}</span></div>`).join('')}
        ${s.center ? `<div class="lp-c">${md(s.center)}</div>` : ''}</div>`,

    // 逐条判断：每按一下揭晓一条结论
    cases: s => head(s) + `<div class="cs">${s.items.map((c, i) => `<div class="cs-r"><span class="cs-i">${two(i + 1)}</span><p class="cs-q">${md(c.q)}</p>
        <div class="cs-a ${c.tone || ''}"${st(i + 1)}><b>${esc(c.verdict)}</b><span>${md(c.why)}</span></div></div>`).join('')}</div>`,

    // 表格：hot 标出重点行；stepwise 时逐行出现
    table: s => head(s) + `<table class="tb c${s.header.length}${s.dense ? ' dense' : ''}"><thead><tr>${s.header.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${s.rows.map((r, i) => `<tr class="${(s.hot || []).includes(i) ? 'hot' : ''}"${s.stepwise ? st(i + 1) : ''}>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    // 卡片：标题 + 一段话，可带图
    cards: s => head(s) + `<div class="cds n${s.items.length}">${s.items.map((c, i) => `<div class="cd"${s.stepwise ? st(i + 1) : ''}>
        ${c.image ? `<img src="${A(c.image)}" alt="">` : `<i>${two(i + 1)}</i>`}<b>${esc(c.title)}</b><p>${md(c.text)}</p></div>`).join('')}</div>
      ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    // 大号要点（问题清单、步骤清单）
    list: s => head(s) + `<ol class="bigl${s.dense ? ' dense' : ''}">${s.items.map((p, i) => `<li${s.stepwise ? st(i + 1) : ''}><i>${two(i + 1)}</i><p>${md(p)}</p></li>`).join('')}</ol>
      ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    feature: s => `<img class="ft-img${s.framed ? ' framed' : ''}" src="${A(s.image)}" alt=""><div class="ft-text">${head(s)}
        ${s.formula ? `<div class="fx">${md(s.formula)}</div>` : ''}
        <ol class="ft-list${s.dense || s.points.join('').length > 120 ? ' dense' : ''}">${s.points.map((p, i) => `<li${s.static ? '' : st(i + 1)}><i>${two(i + 1)}</i><p>${md(p)}</p></li>`).join('')}</ol>
        ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}</div>`,

    timeline: s => head(s) + `<div class="tl" style="grid-template-columns:repeat(${s.items.length},1fr)">${s.items.map((t, i) => `<div class="tl-i">
        <div class="tl-img">${t.image ? `<img src="${A(t.image)}" alt="">` : ''}</div>
        <div class="tl-dot">${i + 1}</div><div class="tl-n">${esc(t.name)}</div><p class="tl-w">${esc(t.work)}</p>
        <div class="tl-m">${t.machines.map(m => `<span>${esc(m)}</span>`).join('')}</div></div>`).join('')}</div>
      ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    hazards: s => head(s) + `<div class="hz"><div class="hz-h"><span></span><span>危险从哪来</span><span>常见事故</span><span>人要远离</span></div>
      ${s.items.map((h, i) => `<div class="hz-r"${st(i + 1)}><div class="hz-m"><img src="${A(h.image)}" alt=""><b>${esc(h.name)}</b></div>
        <p>${md(h.energy)}</p><p>${md(h.accident)}</p><p class="away">${md(h.away)}</p></div>`).join('')}</div>
      ${s.foot ? `<p class="foot-note">${md(s.foot)}</p>` : ''}`,

    op: s => head(s, '网页实操') + `<div class="op-full">${s.steps.map((x, i) => `<div class="op-s"><i>${two(i + 1)}</i><div><b>${esc(x.name)}</b><p>${md(x.do)}</p></div></div>`).join('')}</div>
      <div class="op-go">按 <kbd>→</kbd> 收起课件，在网页里操作</div>`,

    checklist: s => head(s) + `<div class="ck">${s.cols.map(c => `<div class="ck-c"><div class="ck-h">${esc(c.heading)}</div>
        <ul>${c.items.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>`).join('')}</div>`,

    recap: s => head(s) + `<div class="rc">${s.items.map(m => `<div class="rc-i"><img src="${A(m.image)}" alt=""><b>${esc(m.name)}</b><p>${md(m.text)}</p></div>`).join('')}</div>`,

    quiz: s => `<div class="kick">${esc(s.kick || '课堂小测')}</div><h1 class="qz-q">${md(s.q)}</h1>
      <div class="qz-o">${s.options.map((o, i) => `<div class="opt${'ABCD'[i] === s.answer ? ' right' : ''}"><i>${'ABCD'[i]}</i><p>${md(o)}</p></div>`).join('')}</div>
      <div class="qz-ex"${st(1)}><b>答案 ${esc(s.answer)}</b>${md(s.explain)}</div>`,

    summary: s => head(s) + `<div class="sm"><ol class="sm-l">${s.points.map((p, i) => `<li><i>${two(i + 1)}</i><p>${md(p)}</p></li>`).join('')}</ol>
      <div class="sm-hw"><div class="sm-hh">课后作业</div><ol>${s.homework.map(h => `<li>${md(h)}</li>`).join('')}</ol></div></div>`,
  };
  function head(s, kick) {
    return `<header class="hd"><div class="kick">${esc(s.kick || kick || '')}</div><h2>${md(s.title)}</h2></header>`;
  }

  /* ---------------- 渲染 ---------------- */
  const slides = L.slides;
  stage.innerHTML = slides.map((s, i) => `<section class="slide t-${s.type}${s.dark ? ' dark' : ''}" data-i="${i}">
      ${(T[s.type] || T.statement)(s)}
      ${['cover', 'section', 'statement'].includes(s.type) ? '' : `<div class="pg"><span>${esc(L.title)}</span><b>${two(i + 1)} / ${two(slides.length)}</b></div>`}
    </section>`).join('');
  const secs = [...stage.querySelectorAll('.slide')];
  const stepsOf = i => slides[i].type === 'op' ? slides[i].steps.length - 1 : Math.max(0, ...[...secs[i].querySelectorAll('[data-step]')].map(e => +e.dataset.step));

  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------------- 翻页 ---------------- */
  const KEY = 'deck-' + L.id;
  let cur = 0, step = 0, mode = 'full', presenter = null, t0 = null;
  try { const v = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (v) { cur = v.cur; step = v.step; } } catch (_) {}
  const qs = parseInt(new URLSearchParams(location.search).get('n'), 10) || parseInt(location.hash.slice(1), 10);
  if (qs) { cur = Math.min(slides.length - 1, qs - 1); step = 0; }

  function render() {
    secs.forEach((el, k) => el.classList.toggle('on', k === cur));
    secs[cur].querySelectorAll('[data-step]').forEach(e => e.classList.toggle('shown', +e.dataset.step <= step));
    secs[cur].classList.toggle('answered', step > 0);
    bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    const s = slides[cur];
    const want = s.type === 'op' && !s._expanded ? 'side' : 'full';
    if (want === 'side') drawSide(s);
    setMode(want, s.station);
    try { sessionStorage.setItem(KEY, JSON.stringify({ cur, step })); } catch (_) {}
    history.replaceState(null, '', '#' + (cur + 1));
    if (!t0 && cur > 0) t0 = Date.now();
    syncPresenter();
  }
  function go(i, atEnd) {
    if (i < 0 || i >= slides.length) return;
    slides[cur]._expanded = false;
    cur = i; step = atEnd ? stepsOf(i) : 0;
    render();
  }
  const next = () => (step < stepsOf(cur) ? (step++, render()) : go(cur + 1));
  const prev = () => (step > 0 ? (step--, render()) : go(cur - 1, true));

  /* ---------------- 侧边卡片（网页实操时） ---------------- */
  // 只显示当前这一步，尽量少挡网页；拖动标题栏可以挪位置
  function drawSide(s) {
    const x = s.steps[step], n = s.steps.length;
    side.innerHTML = `<div class="sc">
      <div class="sc-head" title="按住拖动"><span class="sc-k">网页实操 · ${esc(s.kick || '')} ${esc(s.title)}</span>
        <span class="sc-p">${two(cur + 1)}/${two(slides.length)}</span></div>
      <div class="sc-prog">${s.steps.map((_, i) => `<span class="${i < step ? 'done' : i === step ? 'cur' : ''}" data-k="${i}" title="${esc(s.steps[i].name)}"></span>`).join('')}</div>
      <div class="sc-body"><div class="sc-n">挑战 ${two(step + 1)} / ${two(n)}</div><div class="sc-t">${esc(x.name)}</div>
        <p class="sc-do">${md(x.do)}</p>${x.see ? `<p class="sc-see"><span>看</span>${md(x.see)}</p>` : ''}</div>
      <div class="sc-foot"><button data-a="prev" title="上一步（PageUp）">‹</button><button data-a="next" class="pri" title="下一步（PageDown）">${step < n - 1 ? '下一个挑战 ›' : '回到课件 ›'}</button>
        <button data-a="expand" title="展开课件全屏">展开</button><button data-a="dock" title="卡片换到另一边">⇄</button></div></div>`;
    sizeObs.disconnect(); sizeObs.observe(side.firstElementChild);
  }
  // 卡片高度变化（换步骤、iframe 变窄后重新排版）时告诉网页，网页据此调 iframe 高度
  const sizeObs = new ResizeObserver(es => { for (const e of es) post({ type: 'size', h: Math.ceil(e.target.getBoundingClientRect().height) }); });
  side.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a, k = e.target.closest('[data-k]')?.dataset.k;
    if (a === 'prev') prev(); else if (a === 'next') next();
    else if (a === 'expand') { slides[cur]._expanded = true; render(); }
    else if (a === 'dock') post({ type: 'dock' });
    else if (k != null) { step = +k; render(); }
  });
  side.addEventListener('pointerdown', e => {
    if (!e.target.closest('.sc-head')) return;
    let x = e.screenX, y = e.screenY;
    const move = ev => { post({ type: 'drag', dx: ev.screenX - x, dy: ev.screenY - y }); x = ev.screenX; y = ev.screenY; };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });

  function setMode(m, station) {
    mode = m;
    document.body.classList.toggle('side', m === 'side');
    post({ type: 'mode', mode: m, station: station || null });
  }
  function post(msg) { if (embed) window.parent.postMessage(Object.assign({ deck: 1 }, msg), '*'); }

  /* ---------------- 键盘、翻页笔、转发 ---------------- */
  function onKey(k, e) {
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) { e?.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(k)) { e?.preventDefault(); prev(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'Escape') post({ type: 'close' });
    else if (k === 'f' || k === 'F') post({ type: 'full' });
    else if (k === 'b' || k === 'B' || k === '.') document.body.classList.toggle('black');
    else if (k === 'p' || k === 'P' || k === 's' || k === 'S') openPresenter();
    else if (k === 'w' || k === 'W') { if (slides[cur].type === 'op') { slides[cur]._expanded = mode === 'side'; render(); } }
    else if (k === 'h' || k === 'H' || k === '?') document.body.classList.toggle('help');
  }
  addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey && !e.altKey) onKey(e.key, e); });
  addEventListener('message', e => { if (e.data && e.data.deck && e.data.type === 'key') onKey(e.data.key); });

  /* ---------------- 工具条、帮助 ---------------- */
  const tools = document.createElement('div');
  tools.className = 'tools';
  tools.innerHTML = `<button data-a="prev" title="上一页（←）">‹</button><button data-a="next" title="下一页（→）">›</button>
    <button data-a="notes" title="讲稿窗口（P）">讲稿</button><button data-a="full" title="全屏（F）">全屏</button>
    <button data-a="close" title="收起课件，回到网页（Esc）">回到网页 ✕</button>`;
  document.body.append(tools);
  tools.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'prev') prev(); if (a === 'next') next(); if (a === 'notes') openPresenter();
    if (a === 'full') post({ type: 'full' }); if (a === 'close') post({ type: 'close' });
  });
  let hideT = 0;
  addEventListener('mousemove', () => { document.body.classList.add('mouse'); clearTimeout(hideT); hideT = setTimeout(() => document.body.classList.remove('mouse'), 2200); });
  const help = document.createElement('div');
  help.className = 'helpbox';
  help.innerHTML = '<b>→ / 空格 / 翻页笔</b> 下一步　<b>←</b> 上一步　<b>F</b> 全屏　<b>P</b> 讲稿　<b>B</b> 黑屏　<b>Esc</b> 回到网页';
  document.body.append(help);
  document.body.classList.add('help'); setTimeout(() => document.body.classList.remove('help'), 4000);
  stage.addEventListener('click', e => { if (e.target.closest('.op-go')) next(); });

  /* ---------------- 讲稿窗口 ---------------- */
  function openPresenter() {
    presenter = window.open('', 'deck-presenter-' + L.id, 'width=820,height=640');
    if (!presenter) return;
    presenter.document.title = `讲稿 · ${L.id} ${L.title}`;
    presenter.document.body.innerHTML = `<style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;margin:0;padding:26px 30px 90px;background:#0E2A47;color:#fff}
      #h{display:flex;justify-content:space-between;align-items:baseline;color:#9FB6D3;font-size:17px}#clk{font:700 40px Arial;color:#F2B544}
      #t{font-size:30px;font-weight:700;margin:12px 0 0}#n{font-size:23px;line-height:1.8;margin-top:18px;white-space:pre-wrap;color:#E8EEF6}
      #x{position:fixed;left:30px;right:30px;bottom:22px;color:#9FB6D3;font-size:17px;border-top:1px solid #2E4C70;padding-top:12px}</style>
      <div id="h"><span id="i"></span><span id="clk">00:00</span></div><div id="t"></div><div id="n"></div><div id="x"></div>`;
    presenter.addEventListener('keydown', e => onKey(e.key, e));
    syncPresenter();
  }
  function syncPresenter() {
    if (!presenter || presenter.closed) return;
    const d = presenter.document, s = slides[cur], n = slides[cur + 1], k = stepsOf(cur);
    d.getElementById('i').textContent = `第 ${cur + 1} / ${slides.length} 页${k ? `　· 第 ${step + 1} / ${k + 1} 步` : ''}${s.type === 'op' ? '　· 网页实操中' : ''}`;
    d.getElementById('t').textContent = (s.title || s.text || s.q || '').replace(/\*\*/g, '');
    d.getElementById('n').textContent = s.notes || '';
    d.getElementById('x').textContent = n ? '下一页：' + (n.title || n.text || n.q || '').replace(/\*\*/g, '').slice(0, 40) : '最后一页';
  }
  setInterval(() => {
    if (!presenter || presenter.closed || !t0) return;
    const sec = Math.floor((Date.now() - t0) / 1000);
    presenter.document.getElementById('clk').textContent = `${two(Math.floor(sec / 60))}:${two(sec % 60)}`;
  }, 500);

  render();
  window.deck = { go: (i, k = 0) => { go(i); step = k; render(); }, get cur() { return cur; }, get step() { return step; }, slides };
})();
