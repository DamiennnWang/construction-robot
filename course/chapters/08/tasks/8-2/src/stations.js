/* 任务 8-2 保养排查 —— 原页面（shared/workshop + src/app.js）的三维场景与维护模型保持不变，搬进统一外壳。
 * 原页面的四个页签（喷涂、泵车、发动机、轴承）就是四个工位；情境选择放在三维区上方。
 * 原页面每次操作都会重建右侧控件，所以面板里的流程按钮由这里生成，点击仍交给原页面的 MaintenanceLab.dispatch，
 * 状态、交接记录和存储（localStorage course-maintenance-v1）都沿用原页面。原控件留在隐藏容器里。
 */
(() => {
  'use strict';
  const S = window.NativeShell;
  const lab = () => window.MaintenanceLab;
  const M = () => window.MaintenanceModel;
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  // 与 src/app.js 的材料选项一致（原页面没有导出这份表）
  const MATERIALS = {
    sprayer: [['compatible', '案例资料指定清洗介质'], ['unknown', '来源不明的溶剂'], ['wrong', '未核对的替代介质']],
    pump: [['compatible', '案例指定受控清洗方案'], ['unknown', '清洗路径与回收方式不明'], ['wrong', '任意加压冲洗']],
    engine: [['compatible', '型号资料指定维护方案'], ['unknown', '未知机油或冷却介质'], ['wrong', '不核对型号直接替换']],
    bearing: [['compatible', '案例卡指定润滑品种'], ['unknown', '标签不明的润滑脂'], ['wrong', '随意混合不同润滑脂']],
  };
  const SERVICE = {sprayer: '逐步清理', pump: '逐步清理', engine: '逐步维护', bearing: '逐步润滑'};
  const ANOMALY = {sprayer: ['blocked', 'leak'], pump: ['blocked', 'leak'], engine: ['leak'], bearing: ['damage']};
  const NAMES = {sprayer: '喷涂收尾', pump: '泵车收尾', engine: '发动机点检', bearing: '轴承润滑'};

  /* —— 每个工位的说明与试一试（四个工位结构对称） —— */
  const SPEC = {
    sprayer: {
      normal: ['🧽', '完成一次正常收尾', '选“正常收尾”，走完流程再复查'],
      anomaly: ['🚫', '喷嘴堵了，停下移交', '选“喷嘴堵塞”，记录后移交'],
    },
    pump: {
      normal: ['🧽', '完成一次班后收尾', '选“正常班后收尾”，走完流程'],
      anomaly: ['🚫', '输送管堵了，停下移交', '选“输送管堵塞”，记录后移交'],
    },
    engine: {
      normal: ['🔧', '完成一次班后点检', '选“班后点检”，走完流程'],
      anomaly: ['🚫', '发现漏油，停下移交', '选“发现油液泄漏”，记录后移交'],
    },
    bearing: {
      normal: ['🛢', '按已知型号润滑一次', '选“已知型号润滑”，走完流程'],
      anomaly: ['🚫', '滚道有损伤，停下移交', '选“滚道损伤线索”，记录后移交'],
    },
  };

  const recs = st => st?.records || [];
  const tried = {material: new Set(), early: new Set()};   // 被拦下的尝试（本次打开页面内记录）

  function act(c, event) {
    const before = lab().state();
    lab().dispatch(event);
    const s = lab().state();
    if (s.error && /材料或方案与案例资料不符/.test(s.message)) tried.material.add(s.station);
    if (s.error && /维护条件尚未核对完整/.test(s.message)) tried.early.add(s.station);
    if (s.message && (s.message !== before.message || s.error || event.type !== 'station')) c.feedback(s.message, s.error ? 'warn' : 'info');
    refresh(s);
  }

  /* —— 三维区上方：情境选择（原页面“载入情境”下拉框） —— */
  const caseBar = h('div', 'm82-cases');
  caseBar.setAttribute('role', 'radiogroup'); caseBar.setAttribute('aria-label', '载入情境');

  let view = null;   // 当前工位面板里需要随状态刷新的元素
  function refresh(st = lab()?.state()) { if (st && view) view(st); }

  function buildStation(c) {
    const id = c.station.id, spec = SPEC[id];
    const st0 = lab().state();

    /* 情境 */
    caseBar.replaceChildren(h('span', 'm82-cases-label', '情境'));
    const caseButtons = M().cases[id].map(([value, label]) => {
      const b = h('button', 'm82-case', label); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.value = value;
      if (['blocked', 'leak', 'damage', 'hot', 'dry'].includes(value)) b.classList.add('abn');
      if (value === 'unknown') b.classList.add('unk');
      b.addEventListener('click', () => { if (lab().state().work[id].scenario !== value) act(c, {type: 'case', value}); });
      caseBar.append(b); return b;
    });

    /* 现场 */
    const gSite = c.section('现场情况');
    const site = h('div', 'm82-site');
    const finding = h('p', 'm82-finding');
    const pills = h('div', 'm82-pills');
    const pill = (k) => { const p = h('span', 'm82-pill'); p.append(h('i'), h('span', '', k), h('b')); pills.append(p); return p; };
    const pPress = pill('残余压力'), pHot = pill('温热状态'), pDoc = pill('案例资料');
    site.append(finding, pills); gSite.append(site);

    /* 流程 */
    const gFlow = c.section('维护流程');
    const flow = h('ol', 'm82-flow'); gFlow.append(flow);
    const step = (label, type) => {
      const li = h('li', 'm82-step'), b = h('button', 'm82-step-btn'); b.type = 'button';
      b.append(h('span', 'm82-dot'), h('span', 'm82-step-text', label));
      if (type) b.addEventListener('click', () => act(c, {type}));
      li.append(b); flow.append(li); return {li, b};
    };
    const sInspect = step('检查并记录现象', 'inspect');
    const sRead = step('核对型号与案例资料', 'read');
    const sIsolate = step('确认停用与隔离', 'isolate');
    const sEnergy = step('核对能量确认记录', 'energy');
    const sMat = step(id === 'bearing' ? '选润滑品种' : '选材料或处理方案');
    sMat.b.disabled = true; sMat.b.classList.add('static');
    const mats = h('div', 'm82-mats'); mats.setAttribute('role', 'radiogroup');
    const matButtons = MATERIALS[id].map(([value, label]) => {
      const b = h('button', 'm82-mat' + (value === 'compatible' ? ' ok' : ''), label); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.value = value;
      b.addEventListener('click', () => act(c, {type: 'material', value}));
      mats.append(b); return b;
    });
    sMat.li.append(mats);
    const sService = step('按案例方案' + SERVICE[id], 'service');
    const bar = h('div', 'm82-bar'), fill = h('span'); bar.append(fill);
    const pct = h('b', 'm82-pct', '0%');
    sService.b.append(pct); sService.li.append(bar);
    const ends = h('li', 'm82-step m82-ends');
    const bVerify = h('button', 'c2-btn c2-primary', '处理后复查'); bVerify.type = 'button';
    const bHand = h('button', 'c2-btn m82-hand', '保留问题并移交'); bHand.type = 'button';
    bVerify.addEventListener('click', () => act(c, {type: 'verify'}));
    bHand.addEventListener('click', () => act(c, {type: 'handoff'}));
    ends.append(bVerify, bHand); flow.append(ends);
    const verdict = h('div', 'm82-verdict'); verdict.hidden = true; gFlow.append(verdict);

    /* 试一试 */
    const has = (st, fn) => recs(st).some(r => r.station === id && fn(r));
    c.challenges([
      {id: 'normal', icon: spec.normal[0], title: spec.normal[1], hint: spec.normal[2],
        check: st => has(st, r => r.scenario === 'normal' && r.resolved),
        result: '复查通过只代表这份课堂案例的条件，不是真实维修许可。'},
      {id: 'anomaly', icon: spec.anomaly[0], title: spec.anomaly[1], hint: spec.anomaly[2],
        check: st => has(st, r => ANOMALY[id].includes(r.scenario) && !r.resolved),
        result: '有异常就不做常规保养，问题原样记下来交给检修。'},
      {id: 'unknown', icon: '❓', title: '资料不明时不猜', hint: '选资料缺失的情境，再移交',
        check: st => has(st, r => r.scenario === 'unknown' && !r.resolved),
        result: '不知道型号和材料，就不推测清洗介质、润滑品种或周期。'},
      {id: 'material', icon: '⚠', title: '换一种方案试试', hint: '核对完条件，选别的方案处理',
        check: () => tried.material.has(id),
        result: '未经案例资料支持的材料或方案会被拦下，不能混用或强行加压。'},
    ]);

    /* 交接记录（四个工位共用） */
    const count = h('span', 'c2-count');
    const gRec = c.section('交接记录', count);
    const list = h('ul', 'm82-records');
    const tools = h('div', 'm82-rec-tools');
    const bExport = h('button', 'c2-btn c2-small', '导出交接卡'); bExport.type = 'button';
    const bClear = h('button', 'c2-btn c2-small m82-clear', '清空全部记录'); bClear.type = 'button';
    bExport.addEventListener('click', () => document.getElementById('export-record')?.click());
    bClear.addEventListener('click', () => {
      if (!confirm('清空四个工位的全部处理与交接记录？')) return;
      document.getElementById('reset-all')?.click();
      c.feedback('记录已清空，四个工位都回到开始。', 'info'); refresh();
    });
    tools.append(bExport, bClear);
    gRec.append(list, tools);

    /* 三维区工具：原页面的视角按钮 */
    for (const [t, label] of [['home', '全景'], ['front', '近看'], ['top', '俯视']]) c.view(label, () => window.Workshop?.stage?.view(t));

    let last = '';
    view = st => {
      const w = st.work[id];
      const key = JSON.stringify([w, st.records, st.station]);
      if (key === last) return; last = key;
      caseButtons.forEach(b => b.setAttribute('aria-checked', String(b.dataset.value === w.scenario)));
      finding.textContent = M().finding(id, w);
      const setPill = (p, state, text) => { p.dataset.s = state; p.querySelector('b').textContent = text; };
      setPill(pPress, w.pressure ? 'warn' : 'ok', w.pressure ? '待核对' : '无/已确认');
      setPill(pHot, w.hot ? 'warn' : 'ok', w.hot ? '待确认' : '条件已知');
      setPill(pDoc, w.scenario === 'unknown' ? 'bad' : w.read ? 'ok' : 'idle', w.scenario === 'unknown' ? '缺失' : w.read ? '已核对' : '未核对');
      const mark = (s, done) => s.li.classList.toggle('done', Boolean(done));
      mark(sInspect, w.inspected); mark(sRead, w.read); mark(sIsolate, w.isolated); mark(sEnergy, w.energyChecked);
      mark(sMat, w.material === 'compatible' && w.energyChecked);
      sMat.li.classList.toggle('bad', w.material !== 'compatible');
      matButtons.forEach(b => b.setAttribute('aria-checked', String(b.dataset.value === w.material)));
      mark(sService, w.progress >= 1);
      fill.style.width = Math.round(w.progress * 100) + '%'; pct.textContent = Math.round(w.progress * 100) + '%';
      const next = [sInspect, sRead, sIsolate, sEnergy].find((s, i) => ![w.inspected, w.read, w.isolated, w.energyChecked][i]) || (w.progress < 1 ? sService : null);
      for (const s of [sInspect, sRead, sIsolate, sEnergy, sService]) s.li.classList.toggle('next', s === next && !w.handoff && !w.verified);
      verdict.hidden = !(w.verified || w.handoff);
      verdict.className = 'm82-verdict ' + (w.verified ? 'ok' : 'warn');
      verdict.textContent = w.verified ? '✓ 本案例已复查' : '⇢ 已移交 · 问题未解决：' + (w.unresolved || []).join('；');
      const all = recs(st), open = all.filter(r => !r.resolved).length;
      count.textContent = `${all.filter(r => r.resolved).length} 复查 · ${open} 未解决`;
      list.replaceChildren(...(all.length ? all.slice().reverse().map(r => {
        const li = h('li', r.resolved ? 'ok' : 'open');
        const label = (M().cases[r.station].find(x => x[0] === r.scenario) || [, r.scenario])[1];
        li.append(h('span', 'm82-rec-st', NAMES[r.station] || r.station), h('span', 'm82-rec-case', label), h('b', '', r.resolved ? '已复查' : '未解决'));
        return li;
      }) : [h('li', 'm82-empty', '还没有记录。复查或移交后会出现在这里，切换工位也保留。')]));
      bExport.disabled = !all.length;
    };
    view(st0);
    c.lab.onState(st => view(st));
  }

  const STATIONS = ['sprayer', 'pump', 'engine', 'bearing'].map(id => ({
    id, name: NAMES[id], lead: '', hint: '拖动旋转 · 滚轮缩放 · 点击部件', build: buildStation,
  }));

  // shared/theme.js 在 DOMContentLoaded 时把主题按钮放进第一个 .course-nav（并在 resize 时重放）：
  // 原页面的导航会收进隐藏容器，先去掉它的这个类名，让按钮落在外壳页头（.c2-top.course-nav）
  document.querySelector('nav.course-nav:not(.c2-top)')?.classList.replace('course-nav', 'm82-old-nav');

  function boot() {
    const scene = document.getElementById('scene');
    if (!scene || !lab() || !M() || !window.Workshop?.stage) return setTimeout(boot, 50);
    // 点部件：原页面会把镜头对准部件并在原提示条写说明；外壳里用部件卡显示
    const stage = window.Workshop.stage, orig = stage.onPart;
    let ctx = null;
    stage.onPart = p => { orig?.(p); ctx?.showPart(p.label, p.description || '观察这个部件，再记录现象和核对案例资料。'); };
    S.start({
      task: '8-2', title: '保养排查',
      stage: scene,
      stageTop: caseBar,
      stations: STATIONS,
      current: () => lab()?.state().station,
      select: id => { if (lab().state().station !== id) lab().dispatch({type: 'station', value: id}); },
      poll: () => lab().state(),
      reset: id => { const w = lab().state().work[id]; lab().dispatch({type: 'case', value: w.scenario}); },
      build(c) { ctx = c; },
    });
    // 若主题按钮已被 shared/theme.js 放进原导航（已收进隐藏容器），挪到外壳页头
    const toggle = document.getElementById('course-theme-toggle'), top = document.querySelector('.c2-top');
    if (toggle && top && !top.contains(toggle)) top.append(toggle);
  }
  boot();
})();
