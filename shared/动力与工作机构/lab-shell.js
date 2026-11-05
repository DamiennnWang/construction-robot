/* 第二章任务页外壳：页头（本章任务）→ 工位条 → 三维区 + 操作面板。
 * 三维区放原版实验页（iframe，嵌入模式只显示三维视图）；面板由各工位自由设计，通过消息驱动原模型。
 * 菜单只有两层；面板里没有标签页，也没有“学习目标/学习任务”。
 */
(() => {
  'use strict';
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const href = p => (window.courseHref ? window.courseHref(p) : p);
  const fmt = (v, n = 0) => (Number.isFinite(v) ? (Math.abs(v) < Math.pow(10, -n) / 2 ? 0 : v).toFixed(n) : '—');

  function start(cfg) {
    document.title = `${cfg.task} ${cfg.title}｜智能建筑机械与机器人`;
    document.documentElement.dataset.c2Lab = cfg.task;
    const store = 'c2-progress-' + cfg.task;
    let progress = {};
    try { progress = JSON.parse(localStorage.getItem(store) || '{}') || {}; } catch {}
    const save = () => { try { localStorage.setItem(store, JSON.stringify(progress)); } catch {} };

    /* 页头 */
    const top = h('header', 'c2-top course-nav');
    const back = h('a', 'c2-back', '← ' + cfg.chapter.title); back.href = href(cfg.chapter.href);
    const tasks = h('nav', 'c2-tasks'); tasks.setAttribute('aria-label', '本章任务');
    for (const t of cfg.tasks) {
      const a = h('a', '', `${t.id} ${t.short || t.title}`); a.href = href(t.href);
      if (t.id === cfg.task) a.setAttribute('aria-current', 'page');
      tasks.append(a);
    }
    top.append(back, tasks);

    /* 工位条 */
    const bar = h('div', 'c2-bar');
    const title = h('div', 'c2-title');
    title.append(h('span', 'c2-task-id', '任务 ' + cfg.task), h('h1', '', cfg.title));
    const tabs = h('div', 'c2-stations'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '工位');
    bar.append(title, tabs);

    /* 三维区 */
    const main = h('main', 'c2-main');
    const stageBox = h('section', 'c2-stage'); stageBox.setAttribute('aria-label', '三维模型');
    const view = h('div', 'c2-view');
    const loading = h('div', 'c2-loading'); loading.append(h('span', 'c2-spinner'), h('span', '', '正在载入三维模型…'));
    const tools = h('div', 'c2-tools');
    const card = h('div', 'c2-part'); card.hidden = true; card.setAttribute('role', 'status');
    const hint = h('div', 'c2-hint');
    view.append(loading, tools, card, hint);
    const strip = h('div', 'c2-strip');
    const transportBox = h('div', 'c2-transport');
    const readBox = h('div', 'c2-readouts');
    strip.append(transportBox, readBox);
    stageBox.append(view, strip);

    /* 面板 */
    const panel = h('aside', 'c2-panel'); panel.setAttribute('aria-label', '操作面板');
    const head = h('div', 'c2-panel-head');
    const body = h('div', 'c2-panel-body');
    const feedback = h('div', 'c2-feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
    const redo = h('button', 'c2-redo', '↺ 重来'); redo.type = 'button'; redo.title = '把这个工位恢复到开始的样子';
    const next = h('button', 'c2-btn c2-primary c2-next', '去下一站 →'); next.type = 'button';
    panel.append(head, body);
    view.append(feedback);
    let toastTimer = 0;
    main.append(stageBox, panel);
    document.body.append(top, bar, main);

    let current = -1, ctx = null, frame = null, cleanup = [];
    const tabButtons = cfg.stations.map((s, i) => {
      const b = h('button', 'c2-station'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.append(h('span', 'c2-num', String(i + 1)), h('span', 'c2-name', s.name), h('span', 'c2-check', '✓'));
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault(); const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + cfg.stations.length) % cfg.stations.length;
        select(j); tabButtons[j].focus();
      });
      tabs.append(b);
      return b;
    });
    const syncTabs = () => tabButtons.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === current)); b.tabIndex = i === current ? 0 : -1;
      b.classList.toggle('done', Boolean(progress[cfg.stations[i].id]));
    });

    /* 与原版实验页通信（只用 postMessage，file:// 打开也能用） */
    window.addEventListener('message', e => {
      const d = e.data;
      if (!d || d.c2 !== 'lab' || !frame || e.source !== frame.contentWindow) return;
      if (d.type === 'ready' || (d.type === 'state' && ctx && !ctx.lab.ready)) { loading.hidden = true; sendTheme(); ctx?._ready(); }
      if (d.type === 'state') ctx?._state(d.data);
    });
    const sendTheme = () => frame?.contentWindow?.postMessage({c2: 'cmd', op: 'theme', value: window.CourseTheme?.get?.() || 'light'}, '*');
    window.addEventListener('course-theme-change', sendTheme);

    function select(i, fromHash) {
      if (i === current) return;
      cleanup.forEach(f => f()); cleanup = [];
      current = i;
      const s = cfg.stations[i];
      if (!fromHash) history.replaceState(null, '', '#' + s.id);
      const ht = h('div', 'c2-head-row'), name = h('div', 'c2-head-name');
      name.append(h('span', 'c2-head-num', String(i + 1)), h('h2', '', s.name));
      ht.append(name, redo);
      head.replaceChildren(ht, h('p', '', s.lead));
      body.replaceChildren(); clearTimeout(toastTimer); feedback.textContent = ''; feedback.className = 'c2-feedback';
      transportBox.replaceChildren(); readBox.replaceChildren(); tools.replaceChildren(); card.hidden = true;
      hint.textContent = (s.note ? s.note + '　' : '') + (s.hint || '拖动旋转 · 滚轮缩放');
      frame?.remove();
      frame = h('iframe', 'c2-frame'); frame.title = s.name + '三维模型';
      frame.src = s.src; loading.hidden = false;
      view.prepend(frame);
      ctx = makeContext(s);
      s.build(ctx);
      syncTabs();
    }
    redo.addEventListener('click', () => { const i = current; current = -1; select(i); });
    next.addEventListener('click', () => select(Math.min(current + 1, cfg.stations.length - 1)));

    function makeContext(s) {
      const stateFns = new Set(), readyFns = new Set();
      let latest = null, ready = false;
      const send = msg => frame?.contentWindow?.postMessage({c2: 'cmd', ...msg}, '*');
      const c = {
        h, fmt, station: s, body,
        /* —— 原模型 —— */
        lab: {
          click: (sel, index = 0) => send({op: 'click', sel, index}),
          clickText: (sel, text) => send({op: 'clickText', sel, text}),
          set: (sel, value) => send({op: 'set', sel, value}),
          call: (path, ...args) => send({op: 'call', path, args}),
          event: name => send({op: 'event', name}),
          get state() { return latest; },
          get ready() { return ready; },
          onState(fn) { stateFns.add(fn); if (latest) fn(latest); },
          onReady(fn) { readyFns.add(fn); if (ready) fn(); },
        },
        _state(data) { latest = data; stateFns.forEach(f => f(data)); },
        _ready() { if (ready) return; ready = true; readyFns.forEach(f => f()); },
        /* —— 反馈 —— */
        /** 反馈以提示条形式出现在三维区下方，几秒后自动收起，不挤占面板。 */
        feedback(text, kind = 'info', keep = false) {
          clearTimeout(toastTimer);
          feedback.replaceChildren();
          if (text) feedback.append(h('span', 'c2-toast-icon', kind === 'ok' ? '✓' : kind === 'warn' ? '!' : 'i'), h('span', 'c2-toast-text', text));
          feedback.className = 'c2-feedback ' + kind;
          if (!keep && text) toastTimer = setTimeout(() => { feedback.textContent = ''; feedback.className = 'c2-feedback'; }, kind === 'warn' ? 5000 : 7000);
        },
        showPart(name, desc) {
          if (!name) { card.hidden = true; return; }
          card.replaceChildren(h('strong', '', name), h('span', '', desc || ''));
          const x = h('button', 'c2-x', '×'); x.type = 'button'; x.setAttribute('aria-label', '关闭'); x.onclick = () => { card.hidden = true; };
          card.append(x); card.hidden = false;
        },
        /* —— 面板控件 —— */
        section(titleText, extra, into = body) {
          const sec = h('section', 'c2-group');
          if (titleText) { const t = h('h3', ''); t.append(h('span', 'c2-h3-text', titleText)); if (extra) t.append(extra); sec.append(t); }
          into.append(sec); return sec;
        },
        button(text, fn, opts = {}) {
          const b = h('button', 'c2-btn' + (opts.primary ? ' c2-primary' : '') + (opts.small ? ' c2-small' : ''), text);
          b.type = 'button'; b.addEventListener('click', fn); if (opts.title) b.title = opts.title; return b;
        },
        row(...items) { const r = h('div', 'c2-row'); r.append(...items); return r; },
        segmented(options, value, onChange, label) {
          const wrap = h('div', 'c2-seg'); wrap.setAttribute('role', 'radiogroup'); if (label) wrap.setAttribute('aria-label', label);
          let currentValue = value;
          const buttons = options.map(o => {
            const b = h('button', '', o.label); b.type = 'button'; b.setAttribute('role', 'radio'); if (o.title) b.title = o.title;
            b.addEventListener('click', () => { set(o.value); onChange(o.value); });
            wrap.append(b); return [o.value, b];
          });
          const set = v => { currentValue = v; buttons.forEach(([val, b]) => b.setAttribute('aria-checked', String(val === v))); };
          set(value);
          return {el: wrap, set, get: () => currentValue};
        },
        slider({label, min, max, step = 1, value, unit = '', format, onInput}) {
          const wrap = h('label', 'c2-slider');
          const t = h('span', 'c2-slider-top'), name = h('span', '', label), out = h('output', '');
          t.append(name, out);
          const input = h('input'); input.type = 'range'; Object.assign(input, {min, max, step, value});
          const show = v => {
            out.textContent = (format ? format(+v) : v) + (unit ? ' ' + unit : '');
            input.style.setProperty('--p', ((+v - min) / (max - min || 1) * 100).toFixed(1) + '%');
          };
          let touching = 0;
          input.addEventListener('input', () => { touching = performance.now(); show(input.value); onInput(+input.value); });
          show(value); wrap.append(t, input);
          return {
            el: wrap, input,
            /** 跟随模型同步显示；用户正在拖动时不打断。 */
            sync(v) { if (performance.now() - touching < 700 || !Number.isFinite(v)) return; if (Math.abs(+input.value - v) > 1e-9) { input.value = v; show(input.value); } },
            set(v) { input.value = v; show(v); }, get: () => +input.value,
          };
        },
        toggle(label, value, onChange) {
          const b = h('button', 'c2-switch'); b.type = 'button'; b.setAttribute('role', 'switch');
          b.append(h('span', 'c2-knob'), h('span', '', label));
          const set = v => b.setAttribute('aria-checked', String(Boolean(v)));
          b.addEventListener('click', () => { const v = b.getAttribute('aria-checked') !== 'true'; set(v); onChange(v); });
          set(value);
          return {el: b, set};
        },
        /** 部件快捷：点一下镜头飞过去。 */
        chips(items, onPick) {
          const wrap = h('div', 'c2-chips');
          const buttons = items.map(it => {
            const b = h('button', 'c2-chip', it.label); b.type = 'button';
            b.addEventListener('click', () => { buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b))); onPick(it); });
            wrap.append(b); return b;
          });
          return {el: wrap, clear: () => buttons.forEach(x => x.setAttribute('aria-pressed', 'false'))};
        },
        /** 小问题：只用在“看过结果之后”。 */
        choice({prompt, options, answer, onRight, wrong}) {
          const box = h('div', 'c2-choice');
          if (prompt) box.append(h('p', 'c2-prompt', prompt));
          const row = h('div', 'c2-options');
          options.forEach((o, i) => {
            const b = h('button', 'c2-opt', o); b.type = 'button';
            b.addEventListener('click', () => {
              if (box.dataset.solved) return;
              if (i === answer) { b.classList.add('right'); box.dataset.solved = '1'; [...row.children].forEach(x => { x.disabled = x !== b; }); onRight?.(); }
              else { b.classList.add('wrong'); b.disabled = true; c.feedback(typeof wrong === 'function' ? wrong(i) : (wrong || '再看看模型，再选一次。'), 'warn'); }
            });
            row.append(b);
          });
          box.append(row);
          return box;
        },
        /** 先猜一个数，再让模型跑给你看。onGuess 返回 true/false/undefined。 */
        predict({prompt, unit, onGuess, inline}) {
          const box = h('div', 'c2-predict' + (inline ? ' c2-inline' : ''));
          box.append(h('p', 'c2-prompt', prompt));
          const r = h('div', 'c2-row'), input = h('input'); input.type = 'number'; input.inputMode = 'decimal'; input.setAttribute('aria-label', prompt);
          const go = c.button('试试看', () => {
            const v = parseFloat(input.value);
            if (!Number.isFinite(v)) { c.feedback('先填一个数。', 'warn'); return; }
            const ok = onGuess(v); input.classList.toggle('right', ok === true); input.classList.toggle('wrong', ok === false);
          }, {small: true});
          input.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
          r.append(input, h('span', 'c2-unit', unit || ''), go); box.append(r);
          return {el: box, input};
        },
        /** 试一试：几张挑战卡，不分先后；模型状态满足条件就自动打勾。 */
        challenges(list, titleText = '试一试') {
          const counter = h('span', 'c2-count');
          const sec = c.section(titleText, counter);
          const bar = h('div', 'c2-progress'); const fill = h('span'); bar.append(fill);
          const grid = h('div', 'c2-challenges'); sec.append(bar, grid);
          const done = new Set();
          const items = list.map(ch => {
            const li = h('div', 'c2-challenge');
            const mark = h('span', 'c2-mark', ch.icon || '★');
            const txt = h('div', 'c2-ch-text');
            txt.append(h('b', '', ch.title));
            const sub = h('span', '', ch.hint || ''); txt.append(sub);
            li.append(mark, txt);
            if (ch.action) {
              const go = h('button', 'c2-ch-go', ch.action.label); go.type = 'button';
              go.addEventListener('click', e => { e.stopPropagation(); ch.action.fn(); });
              txt.append(go);
            }
            grid.append(li);
            return {ch, li, sub, mark};
          });
          const update = () => { counter.textContent = `${done.size} / ${list.length}`; fill.style.width = (done.size / list.length * 100) + '%'; };
          const complete = id => {
            if (done.has(id)) return;
            const it = items.find(x => x.ch.id === id); if (!it) return;
            done.add(id); it.li.classList.add('done'); it.mark.textContent = '✓';
            if (it.ch.result) c.feedback(it.ch.title + '：' + it.ch.result, 'ok');
            it.sub.textContent = '完成';
            update();
            if (done.size === list.length) {
              progress[s.id] = true; save(); syncTabs();
              setTimeout(() => {
                c.feedback(current < cfg.stations.length - 1 ? '这一站的挑战都完成了！' : '本任务的挑战都完成了！还可以接着随便调一调。', 'ok', current < cfg.stations.length - 1);
                if (current < cfg.stations.length - 1) feedback.append(next);
              }, 2600);
            }
          };
          c.lab.onState(st => { for (const it of items) if (!done.has(it.ch.id)) { try { if (it.ch.check?.(st)) complete(it.ch.id); } catch {} } });
          update();
          return {complete, isDone: id => done.has(id), section: sec};
        },
        /* —— 三维区：工具、播放、读数 —— */
        view(text, fn, titleText) { const b = h('button', 'c2-tool', text); b.type = 'button'; if (titleText) b.title = titleText; b.addEventListener('click', fn); tools.append(b); return b; },
        /** 三维区左上角的一组单选（如 剖开 / 完整 / 去掉外壳）。 */
        toolSeg(options, value, onChange, label) {
          const seg = c.segmented(options, value, onChange, label); seg.el.classList.add('c2-toolseg'); tools.append(seg.el); return seg;
        },
        tool(text, onToggle, pressed = false) {
          const b = h('button', 'c2-tool', text); b.type = 'button'; b.setAttribute('aria-pressed', String(pressed));
          b.addEventListener('click', () => { const p = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(p)); onToggle(p); });
          tools.append(b); return {el: b, set: p => b.setAttribute('aria-pressed', String(Boolean(p)))};
        },
        transport({onToggle, onStep, onReset, stepText = '单步', extra, speeds, onSpeed, speed}) {
          const play = h('button', 'c2-play', ''); play.type = 'button';
          const set = p => { play.textContent = p ? '❚❚ 暂停' : '▶ 运行'; play.setAttribute('aria-pressed', String(Boolean(p))); };
          play.addEventListener('click', () => { const p = play.getAttribute('aria-pressed') !== 'true'; set(p); onToggle(p); });
          set(false); transportBox.append(play);
          if (onStep) { const st = h('button', 'c2-tool', stepText); st.type = 'button'; st.addEventListener('click', onStep); transportBox.append(st); }
          if (onReset) { const rs = h('button', 'c2-tool', '复位'); rs.type = 'button'; rs.addEventListener('click', onReset); transportBox.append(rs); }
          let speedSeg = null;
          if (speeds) { speedSeg = c.segmented(speeds.map(([v, l]) => ({value: v, label: l})), speed ?? speeds[0][0], onSpeed, '快慢'); speedSeg.el.classList.add('c2-speed'); transportBox.append(speedSeg.el); }
          if (extra) transportBox.append(extra);
          return {setPlaying: set, setSpeed: v => speedSeg?.set(v)};
        },
        readouts(defs) {
          const cells = {};
          readBox.replaceChildren();
          for (const d of defs) {
            const cell = h('div', 'c2-read'), v = h('b', '', '—'), u = h('small', '', d.unit || '');
            const val = h('span', 'c2-val'); val.append(v, u);
            cell.append(h('span', 'c2-read-label', d.label), val);
            readBox.append(cell); cells[d.id] = {v, u, cell};
          }
          return (id, value, unit) => {
            const x = cells[id]; if (!x) return;
            if (x.v.textContent !== String(value)) x.v.textContent = value;
            if (unit != null && x.u.textContent !== unit) x.u.textContent = unit;
          };
        },
        onCleanup(fn) { cleanup.push(fn); },
      };
      return c;
    }

    const fromHash = () => {
      const id = location.hash.slice(1), i = cfg.stations.findIndex(s => s.id === id);
      return i < 0 ? 0 : i;
    };
    window.addEventListener('hashchange', () => select(fromHash(), true));
    select(fromHash(), true);
    window.c2Lab = {select, get ctx() { return ctx; }, get frame() { return frame; }};
  }

  window.C2Lab = {start};
})();
