/* 任务 6-1 砌筑机器人 —— 原页面的三维工作台、砌筑闯关和机器人取放演示保持不变，搬进统一外壳。
 * 原来的三个学习阶段（先亲手砌一砌 / 发现人工难点 / 再让机器人介入）成为工位，中间加一个“拌砂浆”工位（砂浆搅拌机）。
 * 三维区上方放“选研究对象”：闯关的三关、三种施工问题、固定/移动工位；面板里是原有的改变条件的控件和试一试。
 */
(() => {
  'use strict';
  const {$, all} = NativeShell;
  const lab = () => window.masonryLab;
  const game = () => lab()?.game;
  const issueBlocks = all('#issueControls > .control-block');
  const robotBlocks = all('#robotControls > .control-block');
  const mortarBlocks = all('#mortarControls > .control-block');
  const EL = {
    stage: $('.stage-wrap'),
    metrics: $('.metrics'), live: $('#liveReadout'),
    manual: $('#manualControls'),
    mortarFeed: mortarBlocks[0], mortarMix: mortarBlocks[1], mortarOut: mortarBlocks[2],
    issuePicker: $('#issueChoices'), issueSlider: issueBlocks[1], observation: $('#issueControls .observation'), connection: $('#issueControls .connection'),
    platformPicker: $('#robotControls .segmented'), platformNote: $('#platformNote'),
    timeline: robotBlocks[1], datum: robotBlocks[2],
    explodeLabel: $('label[for="explode"]'), explode: $('#explode'),
    reset: $('#reset'),
  };
  // 外壳里已有工位名、引子和小标题：原来的阶段标题、“去下一站”链接、重复的小标签收起
  for (const e of all('#issuesToRobot, #issueControls .section-label, #robotControls .section-label, #mortarControls .section-label')) e.setAttribute('hidden', '');

  /* 三维区上方：人工砌筑的三关（原闯关自带的关卡导航每次重绘都会重建，这里另做一排，调用原接口切关） */
  const LESSONS = ['认识一块砖', '拼出墙厚', '检查上下皮'];
  const lessonPicker = document.createElement('div');
  lessonPicker.className = 'c61-picker';
  lessonPicker.setAttribute('role', 'radiogroup'); lessonPicker.setAttribute('aria-label', '砌筑关卡');
  const lessonButtons = LESSONS.map((name, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'radio');
    b.innerHTML = `<b>${i + 1}</b><span>${name}</span>`;
    b.addEventListener('click', () => game()?.setLesson(i));
    lessonPicker.append(b);
    return b;
  });
  const syncLessons = s => lessonButtons.forEach((b, i) => {
    b.setAttribute('aria-checked', String(s.lesson === i));
    b.classList.toggle('done', Boolean(s.completed?.[i]));
    b.querySelector('b').textContent = s.completed?.[i] ? '✓' : String(i + 1);
  });

  // 挑战用到的“做到过”标记（原状态只记当前值）
  let built = new Set(), sawMortar = false, sawDatum = false, robot = {};
  const clearMarks = id => {
    if (id === 'manual') built = new Set();
    if (id === 'issues') { sawMortar = false; sawDatum = false; }
    if (id === 'robot') robot = {};
  };

  const STATIONS = [
    {
      id: 'manual', name: '亲手砌一砌', lead: '在上方选一关：转砖、拼墙厚、让接缝错开。',
      build(c) {
        const g = c.section('砌筑台');
        c.adopt(EL.manual, g);
        c.challenges([
          {id: 'orient', icon: '🧱', title: '分清顺、丁、侧', hint: '第 1 关：三种摆法', check: s => s.manual.completed[0],
            result: '顺丁看长边朝哪，平侧看哪个面朝下：丁砖不是立起来的砖。'},
          {id: 'w240', icon: '📏', title: '拼出 24 墙', hint: '第 2 关：240 mm', check: () => built.has(240),
            result: '一块丁砖的长边正好跨过 240 mm 墙厚。'},
          {id: 'w365', icon: '📐', title: '拼出一砖半墙', hint: '第 2 关：365 mm', check: () => built.has(365),
            result: '240 + 10 + 115 = 365 mm：丁砖、灰缝、顺砖拼成一砖半厚。'},
          {id: 'bond', icon: '🧩', title: '让上下皮错缝', hint: '第 3 关：调偏移和灰缝', check: s => s.manual.completed[2],
            result: '顺丁换皮、错开 62.5 mm，竖缝不再上下连通，墙才连成一体。'},
        ]);
      },
    },
    {
      id: 'mortar', name: '拌砂浆', lead: '投料、开机拌匀，再倾翻出料、送到砌筑位。',
      build(c) {
        const g = c.section('投料');
        c.adopt(EL.mortarFeed, g);
        const g2 = c.section('搅拌');
        c.adopt(EL.mortarMix, g2);
        const g3 = c.section('出料与送料');
        c.adopt(EL.mortarOut, g3);
        c.challenges([
          {id: 'recipe', icon: '🥣', title: '按示例投料', hint: '砂 4 · 水泥 1 · 水 1', check: s => s.mortar.recipeHit,
            result: '砂、水泥、水按设定的份数投进滚筒，砂浆质量先从配料开始。'},
          {id: 'mixed', icon: '🌀', title: '拌匀再出料', hint: '拌到 100%，再摇手轮', check: s => s.mortar.poured.includes('good'),
            result: '滚筒转动时叶片不停翻料，拌匀后颜色一致，再倾翻倒进灰车。'},
          {id: 'wet', icon: '💧', title: '拌一筒太稀的', hint: '多加水，拌匀看看', check: s => s.mortar.wetMixed,
            result: '水多了砂浆太稀，铺灰会流淌，灰缝厚度就难控制。'},
          {id: 'deliver', icon: '🧱', title: '送到砌筑位', hint: '合格的料倒进灰槽', check: s => s.mortar.delivered.includes('good'),
            result: '砂浆要连续送到砌筑位：供料一断，人工和机器人都得停下来等。'},
        ]);
      },
    },
    {
      id: 'issues', name: '人工难点', lead: '在上方选一个问题，先放大它，再修正回来。',
      build(c) {
        const g = c.section('改变它');
        c.adopt(EL.issueSlider, g);
        const g2 = c.section('现场会发生什么');
        c.adopt(EL.observation, g2);
        const g3 = c.section('机器人怎样介入');
        c.adopt(EL.connection, g3);
        c.challenges([
          {id: 'joints', icon: '🧱', title: '消掉通缝', hint: '上下皮通缝：把上皮错开', check: s => s.issue === 'joints' && s.issueAmount >= 10,
            result: '上皮错开后竖缝不再连通；具体搭接量还要按组砌方案复核。'},
          {id: 'mortar', icon: '〰', title: '把灰缝调匀', hint: '灰缝不均：先放大，再归零', check: s => sawMortar && s.issue === 'mortar' && s.issueAmount === 0,
            result: '每层差一点，几皮下来就累计成明显的高差；要靠材料和标高一起控制。'},
          {id: 'datum', icon: '🎯', title: '对准基准', hint: '基准偏移：把墙拉回基准带', check: s => sawDatum && s.issue === 'datum' && s.issueAmount === 0,
            result: '基准偏了，每块砖都会稳定地放偏；先对准共同基准，动作才有意义。'},
        ]);
      },
    },
    {
      id: 'robot', name: '机器人取放', lead: '在上方选工位，一步步看它取砖、转向、落砖。',
      build(c) {
        const g = c.section('拆开一次取放');
        if (EL.platformNote) { EL.platformNote.classList.add('c61-note'); c.adopt(EL.platformNote, g); }
        c.adopt(EL.timeline, g);
        const g2 = c.section('闭环定位实验');
        c.adopt(EL.datum, g2);
        const g3 = c.section('夹具外壳');
        const row = c.h('div', 'c61-explode'); g3.append(row);
        c.adopt([EL.explodeLabel, EL.explode], row);
        c.challenges([
          {id: 'full', icon: '▶', title: '完整看一次取放', hint: '播放到“复测”', check: () => robot.full,
            result: '先夹紧再提升，先有支承再松夹：位置和姿态都要对。'},
          {id: 'mobile', icon: '🚚', title: '移动工位也走一遍', hint: '上方换“移动工位”', check: () => robot.mobile,
            result: '移动到新站位后要先稳住、重新测量，才能用同一套目标。'},
          {id: 'fault', icon: '⚠', title: '找出 18 mm 偏差', hint: '勾选站位偏差，播到复测', check: () => robot.fault,
            result: '动作一样准地重复，砖照样放偏：问题出在基准上。'},
          {id: 'fix', icon: '✅', title: '修正后复测为 0', hint: '重新测量基准，再播一次', check: () => robot.fixed,
            result: '测量 → 修正目标 → 再复测，这就是反馈闭环；成墙质量仍要人工复核。'},
        ]);
      },
    },
  ];

  let lastFeedback = '', lastNoteAt = 0;
  NativeShell.start({
    task: '6-1', title: '砌筑工程与机器人',
    stage: EL.stage,
    stageTop: [lessonPicker, EL.issuePicker, EL.platformPicker],
    stations: STATIONS,
    hint: '拖动旋转 · 滚轮缩放',
    current: () => lab()?.snapshot().tab,
    select: id => lab()?.setTab(id),
    reset(id) {
      clearMarks(id);
      if (id === 'manual') {
        const g = game(); if (!g) return;
        g.width = 240; g.kind = 'header';
        for (const i of [2, 1, 0]) { g.lesson = i; g.reset(); }
        g.setLesson(0);
      }
      EL.reset?.click();
    },
    poll() {
      const s = lab().snapshot(), m = s.manual, r = s.robot;
      if (m.lesson === 1 && m.completed[1]) built.add(m.width);
      if (s.issue === 'mortar' && s.issueAmount > 0) sawMortar = true;
      if (s.issue === 'datum' && s.issueAmount > 0) sawDatum = true;
      if (s.tab === 'robot' && r.measured) {
        robot.full = true;
        if (r.platform === 'mobile') robot.mobile = true;
        if (r.fault && !r.corrected && r.error > 0) robot.fault = true;
        if (r.fault && r.corrected && r.error === 0) robot.fixed = true;
      }
      return s;
    },
    build(c) {
      const id = c.station.id;
      lessonPicker.hidden = id !== 'manual';
      if (EL.issuePicker) EL.issuePicker.hidden = id !== 'issues';
      if (EL.platformPicker) EL.platformPicker.hidden = id !== 'robot';
      c.stripAdopt([EL.metrics, EL.live]);
      // 原闯关的文字反馈改为三维区上方的提示条
      lastFeedback = game()?.feedback || '';
      c.lab.onState(s => {
        if (id === 'manual') syncLessons(s.manual);
        const g = game(), text = g?.feedback || '';
        if (id === 'manual' && text && text !== lastFeedback) c.feedback(text, g.feedbackTone === 'retry' ? 'warn' : 'info');
        lastFeedback = text;
        // 搅拌机的提示（投料、出料、送料）同样转成提示条
        const m = s.mortar;
        if (id === 'mortar' && m.note && m.noteAt > lastNoteAt) c.feedback(m.note, /先|没|空|不在|太|不好/.test(m.note) ? 'warn' : 'info');
        lastNoteAt = Math.max(lastNoteAt, m.noteAt);
      });
    },
  });
})();
