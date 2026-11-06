/* 任务 8-2 保养排查 —— 统一任务页外壳。两个工位结构对称：
 * 三维区上方选情境；三维区底部四格读数；面板依次是 维护流程（准备、隔离、能量确认、逐点检查、资料与材料、处理、复查/移交）→ 试一试 → 交接记录。
 * 所有操作都交给 window.MaintLab.dispatch（src/app.js），状态与存储（localStorage course-maintenance-v2）都在那里。
 */
(() => {
  'use strict';
  const S = window.NativeShell, lab = window.MaintLab, M = window.MaintModel;
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, fn) => { const b = h('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; };

  const SPEC = {
    engine: {
      normal: ['🛢', '完成一次班后点检', '选“班后点检”，走完流程再复查', '油位补到刻线之间，复查通过才算完成这一单。'],
      anomaly: ['💧', '发现渗油，停下移交', '选“底部渗油”，看过底部后移交', '有渗漏就不做常规保养，问题原样交给检修。'],
      early: ['🔥', '还烫就开冷却液盖？', '停机后不等冷却，直接点冷却液壶', '机体还烫时冷却系统带压，开盖会喷出热液——先等冷却。'],
      anomalyCases: ['leak', 'belt'], anomalyPoint: 'under',
    },
    excavator: {
      normal: ['🔧', '完成一次班后润滑', '选“班后润滑”，六个点都加注再复查', '每个铰点都有新脂挤出，复查通过才算完成。'],
      anomaly: ['💧', '油缸渗漏，停下移交', '选“动臂油缸渗漏”，看过油缸后移交', '渗漏要检修，加多少润滑脂都盖不住问题。'],
      early: ['⚠', '铲斗悬空就去加注？', '铲斗还没落地时点一个黄油嘴', '铲斗悬在空中，人不能进到工作装置下面——先落地。'],
      anomalyCases: ['seep', 'loose'], anomalyPoint: 'boomRod',
    },
  };

  const caseBar = h('div', 'm82-cases');
  caseBar.setAttribute('role', 'radiogroup'); caseBar.setAttribute('aria-label', '情境');
  let view = null;

  function buildStation(c) {
    const id = c.station.id, st = M.STATIONS[id], spec = SPEC[id];
    const act = ev => lab.dispatch(ev);

    /* 情境 */
    caseBar.replaceChildren(h('span', 'm82-cases-label', '情境'));
    const caseButtons = st.cases.map(([value, text]) => {
      const b = btn('m82-case', text, () => { if (lab.state().work[id].scenario !== value || closed()) act({type: 'case', value}); });
      b.setAttribute('role', 'radio'); b.dataset.value = value;
      if (value === 'unknown') b.classList.add('unk'); else if (value !== 'normal') b.classList.add('abn');
      caseBar.append(b); return b;
    });
    const closed = () => { const w = lab.state().work[id]; return w.verified || w.handoff; };

    /* 三维区底部读数（与 8-1 同一位置）：四格 */
    const read = c.readouts(id === 'engine'
      ? [{id: 'a', label: '发动机'}, {id: 'b', label: '机体温度', unit: '℃'}, {id: 'c', label: '电源'}, {id: 'd', label: '已检查'}]
      : [{id: 'a', label: '铲斗'}, {id: 'b', label: '液压残压', unit: 'bar'}, {id: 'c', label: '先导锁定'}, {id: 'd', label: '已加注'}]);

    /* 维护流程 */
    const gFlow = c.section('维护流程');
    const flow = h('ol', 'm82-flow'); gFlow.append(flow);
    const step = (text, type) => {
      const li = h('li', 'm82-step'), b = btn('m82-step-btn', null, type ? () => act({type}) : null);
      b.append(h('span', 'm82-dot'), h('span', 'm82-step-text', text)); li.append(b); flow.append(li); return {li, b};
    };
    const sPrep = step(st.steps.prepare, 'prepare');
    const sIso = step(st.steps.isolate, 'isolate');
    const sEnergy = step(st.steps.energy, 'energy');
    const sCheck = step(id === 'engine' ? '逐点检查（点模型上的编号）' : '逐个检查铰点（点模型上的编号）');
    sCheck.b.classList.add('static'); sCheck.b.disabled = true;
    const chips = h('div', 'm82-chips');
    const chipButtons = st.points.map(([p, name], i) => {
      const b = btn('m82-chip', null, () => { const w = lab.state().work[id]; if (w.checked[p] && id === 'excavator' && !w.done[p]) act({type: 'service', point: p}); else if (w.checked[p]) lab.focus(p); else act({type: 'inspect', point: p}); });
      b.dataset.point = p; b.append(h('i', '', String(i + 1)), h('span', '', name)); chips.append(b); return b;
    });
    sCheck.li.append(chips);
    const sRead = step('核对型号与资料', 'read');
    const sMat = step(id === 'engine' ? '选机油' : '选润滑脂');
    sMat.b.classList.add('static'); sMat.b.disabled = true;
    const mats = h('div', 'm82-mats');
    const matButtons = st.materials.map(([value, text]) => { const b = btn('m82-mat' + (value === 'spec' ? ' ok' : ''), text, () => act({type: 'material', value})); b.setAttribute('role', 'radio'); b.dataset.value = value; mats.append(b); return b; });
    sMat.li.append(mats);
    const sService = step(st.service, 'service');
    const pct = h('b', 'm82-pct', '0%'); sService.b.append(pct);
    const bar = h('div', 'm82-bar'), fill = h('span'); bar.append(fill); sService.li.append(bar);
    if (id === 'excavator') sService.li.append(h('p', 'm82-tip', '检查过的黄油嘴再点一次就加注；也可以按这一步，按顺序加注下一个。'));
    const ends = h('li', 'm82-step m82-ends');
    ends.append(btn('c2-btn c2-primary', '复查', () => act({type: 'verify'})), btn('c2-btn m82-hand', '移交检修', () => act({type: 'handoff'})));
    flow.append(ends);
    const verdict = h('div', 'm82-verdict'); verdict.hidden = true; gFlow.append(verdict);

    /* 试一试 */
    const mine = (s, fn) => (s.records || []).some(r => r.station === id && fn(r));
    c.challenges([
      {id: 'normal', icon: spec.normal[0], title: spec.normal[1], hint: spec.normal[2], result: spec.normal[3],
        check: s => mine(s, r => r.scenario === 'normal' && r.resolved)},
      {id: 'anomaly', icon: spec.anomaly[0], title: spec.anomaly[1], hint: spec.anomaly[2], result: spec.anomaly[3],
        check: s => mine(s, r => spec.anomalyCases.includes(r.scenario) && !r.resolved && r.unresolved.some(u => !u.startsWith('未发现')))},
      {id: 'early', icon: spec.early[0], title: spec.early[1], hint: spec.early[2], result: spec.early[3],
        check: s => !!s.tried?.[id]?.early},
      {id: 'unknown', icon: '❓', title: '资料不明时不猜', hint: '选资料不明的情境，核对资料后移交', result: '查不到规格就不补加、不混用，把待确认事项交出去。',
        check: s => mine(s, r => r.scenario === 'unknown' && !r.resolved)},
    ]);

    /* 交接记录（两个工位共用） */
    const count = h('span', 'c2-count');
    const gRec = c.section('交接记录', count);
    const list = h('ul', 'm82-records');
    const tools = h('div', 'm82-rec-tools');
    const bExport = btn('c2-btn c2-small', '导出交接卡', () => lab.exportRecord());
    const bClear = btn('c2-btn c2-small m82-clear', '清空全部记录', () => {
      if (!confirm('清空两个工位的全部处理与交接记录？')) return;
      lab.reset(); c.feedback('记录已清空，两个工位都回到开始。', 'info');
    });
    tools.append(bExport, bClear); gRec.append(list, tools);

    c.view('全景', () => lab.frame());
    c.view('俯视', () => lab.top());

    let key = '';
    view = s => {
      const w = s.work[id], r = lab.readouts();
      const k = JSON.stringify([w, s.records, r.temp, r.pressure]);
      if (k === key) return; key = k;
      caseButtons.forEach(b => b.setAttribute('aria-checked', String(b.dataset.value === w.scenario)));
      const nPts = st.points.length, nC = st.points.filter(([p]) => w.checked[p]).length, nD = st.points.filter(([p]) => w.done[p]).length;
      if (id === 'engine') {
        read('a', w.prepared ? '已停机' : '运转中'); read('b', r.temp); read('c', w.isolated ? '断开·挂牌' : '接通'); read('d', nC + ' / ' + nPts);
      } else {
        read('a', w.prepared ? '已落地' : '悬空'); read('b', r.pressure); read('c', w.isolated ? '放下·挂牌' : '未锁定'); read('d', nD + ' / ' + nPts);
      }
      const mark = (s0, done) => s0.li.classList.toggle('done', Boolean(done));
      const nChecked = st.points.filter(([p]) => w.checked[p]).length;
      mark(sPrep, w.prepared); mark(sIso, w.isolated); mark(sEnergy, w.energy);
      mark(sCheck, nChecked === st.points.length); mark(sRead, w.read && w.scenario !== 'unknown');
      sRead.li.classList.toggle('bad', w.read && w.scenario === 'unknown');
      mark(sMat, w.material === 'spec' && w.read && w.scenario !== 'unknown');
      sMat.li.classList.toggle('bad', w.material !== 'spec');
      matButtons.forEach(b => b.setAttribute('aria-checked', String(b.dataset.value === w.material)));
      chipButtons.forEach(b => { const p = b.dataset.point, f = M.finding(id, w.scenario, p); b.dataset.state = w.done[p] ? 'done' : w.checked[p] ? (f.abnormal ? 'bad' : 'ok') : 'todo'; b.title = w.checked[p] ? f.text : '点一下检查'; });
      sCheck.li.classList.toggle('bad', M.abnormal(id, w).length > 0);
      mark(sService, w.progress >= 1);
      fill.style.width = Math.round(w.progress * 100) + '%'; pct.textContent = Math.round(w.progress * 100) + '%';
      const order = [[sPrep, w.prepared], [sIso, w.isolated], [sEnergy, w.energy], [sCheck, nChecked === st.points.length], [sRead, w.read], [sService, w.progress >= 1]];
      const next = (w.verified || w.handoff) ? null : order.find(([, d]) => !d)?.[0];
      for (const [s0] of order) s0.li.classList.toggle('next', s0 === next);
      verdict.hidden = !(w.verified || w.handoff);
      verdict.className = 'm82-verdict ' + (w.verified ? 'ok' : 'warn');
      verdict.textContent = w.verified ? '✓ 复查通过，已记入交接记录' : '⇢ 已移交 · 未解决：' + w.unresolved.join('；');
      const all = s.records || [];
      count.textContent = `${all.filter(x => x.resolved).length} 复查 · ${all.filter(x => !x.resolved).length} 未解决`;
      list.replaceChildren(...(all.length ? all.slice().reverse().map(x => {
        const li = h('li', x.resolved ? 'ok' : 'open');
        li.append(h('span', 'm82-rec-st', M.STATIONS[x.station].label), h('span', 'm82-rec-case', M.label(M.STATIONS[x.station].cases, x.scenario)), h('b', '', x.resolved ? '已复查' : '未解决'));
        li.title = x.unresolved.join('；'); return li;
      }) : [h('li', 'm82-empty', '还没有记录。复查或移交后会出现在这里。')]));
      bExport.disabled = !all.length;
    };
    view(lab.state());
    const off = lab.onChange((s, ev) => {
      if (ev?.type === 'station' || ev?.type === 'look') return;
      window.c2Lab?.ctx?._state(s);   // 立即刷新面板，不等 200 ms 轮询
      if (s.message && ev) c.feedback(s.message, s.error ? 'warn' : (ev.type === 'verify' ? 'ok' : 'info'));
    });
    c.onCleanup(off);
    c.lab.onState(s => view(s));
  }

  const STATIONS = M.IDS.map(id => ({id, name: M.STATIONS[id].label, lead: '', hint: '拖动旋转 · 滚轮缩放 · 点编号检查', build: buildStation}));

  // shared/theme.js 会把主题按钮放进第一个 .course-nav；本页没有旧导航，按钮落在外壳页头
  S.start({
    task: '8-2', title: '保养排查',
    stage: document.getElementById('m82Stage'),
    stageTop: caseBar,
    stations: STATIONS,
    current: () => lab.state().station,
    select: id => { if (lab.state().station !== id) lab.dispatch({type: 'station', value: id}); },
    poll: () => lab.state(),
    reset: id => { const w = lab.state().work[id]; lab.dispatch({type: 'case', value: w.scenario}); },
  });
})();
