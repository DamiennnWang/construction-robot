/* 任务 8-1 安全操作 —— 原工地三维场景与 SafetyModel 流程保持不变，搬进统一外壳。
 * 原页面是一条流程（发现 → 停机处置复查 → 复位 → 单独启动），按这三个阶段分成三个工位；
 * 六类危险的选择放在三维区上方（也可直接点场景里的标记），面板按钮转发给原页面同名按钮，状态全部读 SafetyLab.state()。
 */
(() => {
  'use strict';
  const {$} = NativeShell;
  const byId = id => document.getElementById(id);
  // 原页面每次 render 都会重建 #controls 里的按钮，所以点击时再按 id 找原按钮
  const press = id => byId(id)?.click();
  const lab = () => window.SafetyLab;
  const H = () => window.SafetyModel.hazards;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const ICON = {electric: '⚡', collision: '🚜', pinch: '⚙', load: '🏗', edge: '🕳', pressure: '💨'};

  function boot() {
    const EL = {stage: byId('scene'), notice: byId('feedback'), details: byId('details')};

    /* —— 三维区上方：六类危险，带“发现 / 处置 / 复查”进度点 —— */
    const picker = document.createElement('div');
    picker.className = 'c8-hazards';
    picker.setAttribute('role', 'radiogroup'); picker.setAttribute('aria-label', '六类危险');
    const chips = H().map(h => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.id = h.id; b.setAttribute('role', 'radio');
      b.innerHTML = `<span class="c8-ico">${ICON[h.id]}</span><b>${esc(h.label)}</b><i class="c8-dots"><em></em><em></em><em></em></i>`;
      b.addEventListener('click', () => lab().dispatch({type: 'select', value: h.id}));
      picker.append(b);
      return b;
    });
    const paintPicker = s => chips.forEach(b => {
      const it = s.issues[b.dataset.id];
      b.setAttribute('aria-checked', String(s.selected === b.dataset.id));
      b.querySelectorAll('em').forEach((e, i) => e.classList.toggle('on', [it.found, it.controlled, it.verified][i]));
      b.classList.toggle('ok', it.verified);
      b.title = it.verified ? '已复查' : it.controlled ? '已处置，待复查' : it.found ? '已发现，待处置' : '未发现';
    });

    /* —— 用点击场景标记选中的，单独记一下（“在场景里点一处”） —— */
    let pickedInScene = false;
    const st = window.Workshop.stage, onPart = st.onPart;
    st.onPart = p => { pickedInScene = true; onPart(p); };

    // 原页面的报错文字（来自 model.js）用来判断“被拦住”的挑战
    const flags = {blockedRun: false, blockedReset: false, armedStill: false};
    const all = (s, k) => Object.values(s.issues).every(i => i[k]);
    const count = (s, k) => Object.values(s.issues).filter(i => i[k]).length;
    const hazard = s => H().find(h => h.id === s.selected);

    // 急停：红色按钮，和运行状态并排
    const stopButton = c => { const b = c.button('急停', () => press('estop')); b.classList.add('c8-stop'); return b; };

    /* 当前危险卡：名称 + 发现 + 处置办法（随选择变化） */
    function hazardCard(c, into, withControl) {
      const card = c.h('div', 'c8-card');
      into.append(card);
      let key = '';
      c.lab.onState(s => {
        const h = hazard(s), it = s.issues[s.selected];
        const k = [s.selected, it.found, it.controlled, it.verified, withControl].join();
        if (k === key) return; key = k;
        const step = it.verified ? ['ok', '已复查'] : it.controlled ? ['mid', '待复查'] : it.found ? ['mid', '已发现'] : ['', '未记录'];
        card.innerHTML = `<div class="c8-card-head"><span class="c8-ico">${ICON[h.id]}</span><b>${esc(h.label)}</b><span class="c8-tag ${step[0]}">${step[1]}</span></div>`
          + `<p>${esc(h.finding)}</p>`
          + (withControl ? `<p class="c8-do"><span>处置</span>${esc(h.control)}</p>` : '');
      });
      return card;
    }

    const STATIONS = [
      {
        id: 'find', name: '找出危险', lead: '现场先别动手：在上方或场景里点一处危险，近看并记下来。',
        build(c) {
          const g = c.section('当前危险');
          hazardCard(c, g, false);
          g.append(c.row(c.button('近看记录', () => press('inspect'), {primary: true}), c.button('回到全景', () => st.view('home'))));
          const g2 = c.section('发现记录');
          const list = c.h('div', 'c8-found'); g2.append(list);
          const items = H().map(h => { const e = c.h('span', '', ICON[h.id] + ' ' + h.label); list.append(e); return [h.id, e]; });
          c.lab.onState(s => items.forEach(([id, e]) => e.classList.toggle('on', s.issues[id].found)));
          c.challenges([
            {id: 'first', icon: '🔍', title: '记下第一处危险', hint: '选一处，点“近看记录”', check: s => count(s, 'found') >= 1,
              result: '先看清、记下来，再决定怎么处置。'},
            {id: 'scene', icon: '👆', title: '在场景里点一处', hint: '点三维区里的标记', check: () => pickedInScene,
              result: '场景标记和上方按钮选的是同一处危险。'},
            {id: 'edge', icon: '🕳', title: '找到地面上的洞口', hint: '俯视看得更清楚', check: s => s.issues.edge.found,
              result: '洞口紧贴人员路径，没有防护就是坠落危险。'},
            {id: 'six', icon: '📋', title: '六类危险都记下', hint: '用电、碰撞、夹挤……', check: s => all(s, 'found'),
              result: '六处都记下了。光记录还没有消除危险，下一站去处置。'},
          ]);
        },
      },
      {
        id: 'control', name: '停机处置', lead: '先让现场停下来，再逐项处置危险，最后核对复查记录。',
        build(c) {
          const g = c.section('现场');
          const status = c.h('div', 'c8-run'); g.append(c.row(status, stopButton(c)));
          c.lab.onState(s => {
            status.className = 'c8-run ' + (s.running ? 'on' : 'off');
            status.innerHTML = s.running ? '<i></i><b>设备运行中</b><span>处置前先停下来</span>' : `<i></i><b>已停止</b><span>${s.latched ? '急停已锁存' : '设备静止'}</span>`;
          });
          const g2 = c.section('当前危险');
          hazardCard(c, g2, true);
          g2.append(c.row(c.button('近看记录', () => press('inspect')), c.button('处置', () => press('control'), {primary: true}), c.button('核对复查', () => press('verify'))));
          if (EL.details) { const g3 = c.section('复查记录'); c.adopt(EL.details, g3); }
          c.challenges([
            {id: 'blocked', icon: '⛔', title: '运行中处置会怎样', hint: '急停前，处置已记下的一处', check: () => flags.blockedRun,
              result: '设备还在动，处置会被拦下：先停机，再动手。'},
            {id: 'estop', icon: '🛑', title: '按下急停', hint: '让整个现场停下来', check: s => s.latched,
              result: '运动停了，但电、压力和吊物不会因此消失。'},
            {id: 'pressure', icon: '💨', title: '解除残余压力', hint: '选“残余压力”去处置', check: s => !s.energy.pressure,
              result: '喷涂机停了管段仍有压力，要按程序单独核对解除。'},
            {id: 'six', icon: '✅', title: '六处都复查过', hint: '每处：处置 → 核对复查', check: s => all(s, 'verified'),
              result: '处置后还要看复查证据，危险才算真正清除。'},
          ]);
        },
      },
      {
        id: 'restart', name: '复位重启', lead: '急停复位不等于开机：复位后设备保持静止，要单独发出启动指令。',
        build(c) {
          const g = c.section('复位与启动');
          const status = c.h('div', 'c8-run'); g.append(c.row(status, stopButton(c)));
          g.append(c.row(c.button('手动复位', () => press('reset-stop')), c.button('单独启动', () => press('start'), {primary: true})));
          c.lab.onState(s => {
            const [cls, b, t] = s.running ? ['on', '运行中', s.armed ? '已按启动指令恢复' : '急停前的状态'] : s.armed ? ['ready', '已复位，静止', '等待单独启动'] : ['off', '已停止', s.latched ? '急停锁存中' : '设备静止'];
            status.className = 'c8-run ' + cls; status.innerHTML = `<i></i><b>${b}</b><span>${t}</span>`;
          });
          const g2 = c.section('复位前核对');
          const list = c.h('div', 'c8-checks'); g2.append(list);
          const rows = [
            ['verified', '六处危险已复查', s => `${count(s, 'verified')} / 6`, s => all(s, 'verified')],
            ['load', '吊物', s => s.energy.load ? '仍悬吊' : '已落置', s => !s.energy.load],
            ['pressure', '残余压力', s => s.energy.pressure ? '仍有' : '已解除', s => !s.energy.pressure],
            ['power', '电源', s => s.energy.power ? '有电' : '已隔离', () => null],
          ].map(([id, label, val, ok]) => { const r = c.h('div', 'c8-check'); r.innerHTML = `<span>${label}</span><b></b>`; list.append(r); return {r, val, ok}; });
          c.lab.onState(s => rows.forEach(({r, val, ok}) => { const v = ok(s); r.className = 'c8-check' + (v === true ? ' ok' : v === false ? ' no' : ''); r.querySelector('b').textContent = val(s); }));
          c.challenges([
            {id: 'blocked', icon: '🚫', title: '复位被拦住', hint: '还有危险没复查时试复位', check: () => flags.blockedReset,
              result: '还有危险或残余能量没核对，复位会被挡住。'},
            {id: 'armed', icon: '🔓', title: '复位后它会动吗', hint: '全部复查后点“手动复位”', check: () => flags.armedStill,
              result: '复位只解除急停锁存，设备仍然静止。'},
            {id: 'start', icon: '▶', title: '单独发出启动', hint: '复位后点“单独启动”', check: s => s.running && s.armed && all(s, 'verified'),
              result: '启动是另一个独立指令，复位不会自动开机。'},
          ]);
        },
      },
    ];

    let lastMsg = '';
    const fmtState = s => s.running ? '运行' : '停止';
    NativeShell.start({
      task: '8-1', title: '安全操作',
      stage: EL.stage,
      stageTop: picker,
      stations: STATIONS,
      hint: '拖动旋转 · 滚轮缩放 · 点击标记选危险',
      poll() {
        const s = lab().state();
        if (s.error && /仍在运行/.test(s.message)) flags.blockedRun = true;
        if (s.error && /复位被阻止|残余能量/.test(s.message)) flags.blockedReset = true;
        if (s.armed && !s.running && !s.latched) flags.armedStill = true;
        return s;
      },
      reset() { press('restart-case'); pickedInScene = false; Object.keys(flags).forEach(k => { flags[k] = false; }); },
      build(c) {
        picker.hidden = c.station.id === 'restart';
        // 视角开关放三维区左上角；暂停画面只影响动画，不改变教学状态
        c.view('全景', () => st.view('home'));
        c.view('近看', () => st.view('front'));
        c.view('俯视', () => st.view('top'));
        const pause = c.tool('暂停画面', () => press('pause-view'), false);
        const read = c.readouts([
          {id: 'v', label: '已复查'}, {id: 'run', label: '现场'}, {id: 'stop', label: '急停'}, {id: 'e', label: '残余能量'},
        ]);
        lastMsg = lab().state().message;
        c.lab.onState(s => {
          paintPicker(s);
          read('v', count(s, 'verified'), '/ 6');
          read('run', fmtState(s), '');
          read('stop', s.latched ? '锁存' : s.armed ? '已复位' : '未按', '');
          read('e', (s.energy.pressure ? 1 : 0) + (s.energy.load ? 1 : 0), '项');
          pause.set(byId('pause-view')?.textContent.startsWith('播放'));
          if (s.message !== lastMsg) { lastMsg = s.message; if (s.message) c.feedback(s.message, s.error ? 'warn' : 'info'); }
        });
      },
    });
  }

  // 页面由 shared/workshop 在运行时建出：等三维区和 SafetyLab 都就绪再接外壳
  (function wait(n) {
    if (window.SafetyLab && window.Workshop?.stage && byId('scene') && byId('controls')) boot();
    else if (n < 200) setTimeout(() => wait(n + 1), 50);
  })(0);
})();
