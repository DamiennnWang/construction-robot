/* 方案A：课程网页右上角（「深色模式」左边）的「课件」按钮。
   点开后课件以全屏图层盖在网页上；翻到「网页实操」页时收成侧边卡片，下面就是原尺寸的网页，可直接操作。
   网页本身不需要改动，只要加载这个脚本。 */
(() => {
  'use strict';
  if (window.top !== window.self) return;
  const LESSONS = ['1-1',  '1-2',  '1-3',  '2-1',  '2-2',  '2-3',  '3-1',  '3-2',  '3-3',  '3-4',  '3-5',  '4-1',  '4-2',  '4-3',  '5-1',  '5-2',  '5-3',  '6-1',  '6-2',  '6-3',  '6-4',  '7-1',  '7-2',  '8-1',  '8-2'];   // 已做好课件的任务
  // 没有任务网页的课，挂在哪个页面上（第一章总览会跳到课程主页的 #chapter-1）
  const HOSTS = { '1-1': () => /\/course\/home\//.test(decodeURIComponent(location.pathname)) && /^#chapter-1$/.test(location.hash) };
  const me = document.currentScript;
  const BASE = new URL('.', me ? me.src : location.href).href;   // deck/ 目录
  function lessonHere() {
    const m = decodeURIComponent(location.pathname).match(/\/tasks\/(\d-\d)\//);
    if (m) return LESSONS.includes(m[1]) ? m[1] : null;
    return Object.keys(HOSTS).find(k => LESSONS.includes(k) && HOSTS[k]()) || null;
  }
  let id = lessonHere();

  const css = document.createElement('style');
  css.textContent = `
    .slides-entry{display:inline-flex;align-items:center;gap:6px;height:32px;box-sizing:border-box;padding:0 14px;margin-right:8px;border-radius:999px;border:0;cursor:pointer;
      background:#14263D;color:#fff;font:600 13px/1 "PingFang SC","Microsoft YaHei",sans-serif;white-space:nowrap;vertical-align:middle;box-shadow:0 2px 8px rgba(20,38,61,.25)}
    .slides-entry:hover{background:#E8A317;color:#14263D}.slides-entry svg{width:11px;height:11px;fill:currentColor}
    .slides-entry.floating{position:fixed;top:12px;z-index:101;height:40px}
    html[data-theme="dark"] .slides-entry{background:#F2B544;color:#14263D}
    #deck-layer{position:fixed;z-index:2147483000;border:0!important;padding:0!important;margin:0!important;max-height:none!important;overflow:hidden!important;background:transparent!important;transition:opacity .2s}
    #deck-layer.dk-full{inset:0;width:100vw;height:100vh;border-radius:0;box-shadow:none}
    #deck-layer.dk-side{width:370px;border-radius:14px;box-shadow:0 18px 50px rgba(10,25,45,.3);top:250px;bottom:auto}
    #deck-layer.dk-side.dk-left{left:24px;right:auto}#deck-layer.dk-side.dk-right{right:24px;left:auto}
    html.deck-open,html.deck-open body{overflow:hidden!important}`;
  document.head.append(css);

  let frame = null, dock = 'left';
  function open(n) {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.id = 'deck-layer'; frame.className = 'dk-full';
    frame.setAttribute('allow', 'fullscreen');
    frame.title = '网页课件';
    frame.src = `${BASE}index.html?lesson=${id}${n ? '&n=' + n : ''}`;
    document.documentElement.append(frame);   // 挂在 html 上：网页会把 body 里的元素搬进自己的容器
    document.documentElement.classList.add('deck-open');
    frame.addEventListener('load', () => frame.contentWindow.focus());
  }
  function close() {
    if (!frame) return;
    frame.remove(); frame = null;
    document.documentElement.classList.remove('deck-open');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  function setStation(s) {
    if (!s || location.hash.slice(1) === s) return;
    history.replaceState(null, '', location.pathname + location.search + '#' + s);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  addEventListener('message', e => {
    const d = e.data;
    if (!frame || e.source !== frame.contentWindow || !d || !d.deck) return;
    if (d.type === 'mode') {
      frame.className = d.mode === 'side' ? `dk-side dk-${dock}` : 'dk-full';
      if (d.mode !== 'side') frame.style.left = frame.style.right = frame.style.top = frame.style.height = '';
      document.documentElement.classList.toggle('deck-open', d.mode !== 'side');
      if (d.mode === 'side') { setStation(d.station); window.focus(); }
      else frame.contentWindow.focus();
      setTimeout(() => dispatchEvent(new Event('resize')), 60);   // 让网页三维画面按新尺寸重绘
    }
    if (d.type === 'size' && frame.classList.contains('dk-side')) frame.style.height = Math.min(d.h, innerHeight - 36) + 'px';
    if (d.type === 'drag' && frame.classList.contains('dk-side')) {
      const r = frame.getBoundingClientRect();
      frame.style.left = Math.max(0, Math.min(innerWidth - r.width, r.left + d.dx)) + 'px'; frame.style.right = 'auto';
      frame.style.top = Math.max(0, Math.min(innerHeight - 60, r.top + d.dy)) + 'px';
    }
    if (d.type === 'dock') { frame.style.left = frame.style.right = frame.style.top = ''; dock = dock === 'left' ? 'right' : 'left'; frame.classList.remove('dk-left', 'dk-right'); frame.classList.add('dk-' + dock); }
    if (d.type === 'close') close();
    if (d.type === 'full') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
  });
  // 课件收成卡片、老师在网页里操作时，翻页笔（PageUp/PageDown）仍然翻课件
  addEventListener('keydown', e => {
    if (!frame || !frame.classList.contains('dk-side')) return;
    if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); e.stopPropagation(); frame.contentWindow.postMessage({ deck: 1, type: 'key', key: e.key }, '*'); }
  }, true);

  function mount() {
    if (!id) { document.querySelector('.slides-entry')?.remove(); return true; }
    const t = [...document.querySelectorAll('#course-theme-toggle, .course-theme-toggle')].find(x => x.getClientRects().length);
    const old = document.querySelector('.slides-entry');
    if (!t) return false;
    if (old && old.getClientRects().length) return true;
    old?.remove();
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'slides-entry'; b.title = `打开任务${id}的课件（翻页讲授）`;
    b.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L10.4 6z"/></svg>课件';
    b.title = `打开任务${id}的课件（翻页讲授）`;
    b.addEventListener('click', () => open());
    if (t.classList.contains('course-theme-floating')) {
      b.classList.add('floating'); document.body.append(b);
      const place = () => { b.style.right = (t.offsetWidth + 24) + 'px'; }; place(); addEventListener('resize', place);
    } else t.before(b);
    return true;
  }
  let tries = 0;
  (function loop() { if (!mount() && ++tries < 40) setTimeout(loop, 250); })();
  addEventListener('hashchange', () => { if (frame) return; const n = lessonHere(); if (n !== id) { id = n; document.querySelector('.slides-entry')?.remove(); tries = 0; mount(); } });

  // 网址带 ?slides=页码 时自动展开课件（直接打开课件链接会跳到这里）
  const q = new URLSearchParams(location.search).get('slides');
  if (q !== null) open(parseInt(q, 10) || 1);
})();
