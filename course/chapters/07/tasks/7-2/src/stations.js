/* 任务 7-2 无人机立面巡检 —— 原页面的三维场景、合成照片和记录逻辑保持不变，搬进统一外壳。
 * 原来的四步（规划 / 采集 / 复核 / 交付）合成三个工位：规划航线并入“航拍采集”。
 * 点位 A1～B3 放在三维区上方（选研究对象）；采集取景框、复核照片、证据台账作为三维区里的浮层。
 * 照片、意见、量测和记录人都沿用原页面的存储（localStorage: uav-facade-lab-v1）。
 */
(() => {
  'use strict';
  const {$, all} = NativeShell;
  const lab = () => window.uavLab;
  const EL = {
    stage: $('.scene-card'), points: $('#points'),
    viewfinder: $('#panel-capture .preview-frame'), photo: $('#panel-review .review-preview'), ledger: $('.evidence-ledger'),
    presets: $('#panel-capture .preset-row'), controls: all('#panel-capture .control'), shutter: $('#panel-capture .shutter-row'),
    quality: $('#capture-quality'), captureRow: $('#capture')?.closest('.action-row'),
    route: [$('#route-checks'), $('#route-order')], routeBtn: $('#preview-route'),
    ai: $('#ai-result'), tools: $('#panel-review .review-tools'), compare: $('#compare-photos'), empty: $('#review-empty'),
    form: $('#review-form'), reviewFeedback: $('#review-feedback'),
    student: [null, $('#student')],
    score: $('#panel-report .report-score'), status: $('#report-status'), checks: $('#report-checks'),
    exportRow: $('#export-json')?.closest('.action-row'), reset: $('#reset'),
    toast: $('#toast'), gsd: $('#gsd-value'), blur: $('#blur-value'),
  };

  // 取景框、复核照片和台账放进三维区（不随工位停放，按工位显隐）
  for (const n of [EL.viewfinder, EL.photo, EL.ledger]) if (n) { n.classList.add('c7-overlay'); EL.stage.append(n); }
  EL.photo?.classList.add('c7-photo'); EL.viewfinder?.classList.add('c7-viewfinder'); EL.ledger?.classList.add('c7-ledger');
  // 台账标题只留一行；按钮文字收短
  const lh = EL.ledger?.querySelector('.ledger-heading h2'); if (lh) lh.textContent = '证据台账';
  EL.ledger?.querySelector('.ledger-heading .eyebrow')?.setAttribute('hidden', '');
  // 采集质量结论贴在取景框下方，和画面一起看
  if (EL.quality && EL.viewfinder) EL.viewfinder.append(EL.quality);

  // 记录：预演过航线、导出过记录（只在本次打开页面期间）
  let previewed = false, exported = false;
  for (const id of ['export-json', 'export-csv']) document.getElementById(id)?.addEventListener('click', () => { exported = true; });

  // adopt 会把元素设为可见；原页面自己按状态隐藏的元素（无照片时的复核表单等）要保留原状
  const keep = (c, nodes, into) => { const list = [].concat(nodes).filter(Boolean), hs = list.map(n => n.hidden); c.adopt(list, into); list.forEach((n, i) => { n.hidden = hs[i]; }); };
  const latest = (s, id) => s.captures.filter(p => p.cellId === id).at(-1);
  const hasIssue = (s, code) => s.captures.some(p => p.metrics?.issueCodes?.includes(code));

  const STATIONS = [
    {
      id: 'capture', name: '航拍采集', hint: '拖动旋转 · 滚轮缩放 · 点墙上的点位也能选',
      lead: '在上方选点位，调距离、角度、速度和快门，看右上角取景清不清，再按采集。',
      build(c) {
        const g = c.section('拍摄条件');
        keep(c, [EL.presets, ...EL.controls, EL.shutter, EL.captureRow], g);
        const g2 = c.section('航线预演');
        keep(c, EL.route[1], g2.querySelector('h3'));
        const row = c.row(); g2.append(row);
        keep(c, [EL.route[0], EL.routeBtn], row);
        c.challenges([
          {id: 'far', icon: '🔭', title: '离远了拍一张', hint: '距离拉到 12 m 再采集', check: s => hasIssue(s, 'detail'),
            result: '离得越远，一个像素对应的墙面越大，细线就看不清了。'},
          {id: 'blur', icon: '💨', title: '拍出拖影', hint: '飞得快、快门慢', check: s => hasIssue(s, 'motion'),
            result: '快门打开的那一刻相机还在移动，画面就拖出了影子。'},
          {id: 'route', icon: '🛸', title: '预演一次航线', hint: '勾选航点，按预演', check: () => previewed,
            result: '无人机按顺序飞过每个航点；预演只看顺序，不会替你拍照。'},
          {id: 'all', icon: '📸', title: '六个点位都拍清楚', hint: '每处最新照片都合格', check: s => s.mission.qualityCount === 6,
            result: '六个点位都有合格照片了，接下来去复核疑点。'},
        ]);
      },
    },
    {
      id: 'review', name: '复核疑点', hint: '照片上的橙色框是预设检测结果',
      lead: '逐个点位看照片：框里是真病害、误报，还是证据不够要补拍？没框的照片也要找一找。',
      build(c) {
        const g = c.section('预设检测');
        keep(c, [EL.ai, EL.tools, EL.compare, EL.empty], g);
        const g2 = c.section('你的判断');
        keep(c, EL.form, g2);
        c.challenges([
          {id: 'false', icon: '🚫', title: '揪出一个误报', hint: '分数高也可能不是裂缝',
            check: s => s.mission.results.some(r => ['A3', 'B1'].includes(r.cellId) && r.correct),
            result: '笔直的分格缝、会随光线移动的阴影，都会被当成裂缝框出来。'},
          {id: 'missed', icon: '🔍', title: '找到漏检', hint: '没框的照片也要细看', check: s => s.mission.missedFound,
            result: '“没检出”不等于“没病害”，人工补记把漏掉的疑点找了回来。'},
          {id: 'again', icon: '🔁', title: '补拍后重新复核', hint: '同一点位拍第二张',
            check: s => Object.entries(s.reviews || {}).some(([id, r]) => s.captures.filter(p => p.cellId === id).length >= 2 && r.photoId === latest(s, id)?.id),
            result: '旧照片和旧意见都留着；新照片要重新看一遍才算数。'},
          {id: 'measure', icon: '📏', title: '近拍量一次宽度', hint: '点“近拍量测练习”', check: s => s.measurement?.value != null && s.measurement.boundaryAccepted,
            result: '标尺和裂缝在同一平面、边界清楚，才能按比例换算宽度。'},
        ]);
      },
    },
    {
      id: 'report', name: '交付记录', hint: '绿色点位已复核完成',
      lead: '每条意见都对应一个点位和一张照片。写上记录人，导出给同伴核对。',
      build(c) {
        const g = c.section('记录人');
        keep(c, EL.student[1], g);
        const g2 = c.section('完成情况');
        keep(c, [EL.score, EL.status, EL.checks], g2);
        const g3 = c.section('导出');
        keep(c, [EL.exportRow, EL.reset], g3);
        c.challenges([
          {id: 'name', icon: '✍', title: '写上记录人', hint: '填小组或姓名', check: s => Boolean(s.student?.trim()),
            result: '有了记录人，别人拿到记录才知道该找谁核对。'},
          {id: 'done', icon: '💯', title: '完成度到 100', hint: '六处都复核正确', check: s => s.mission.complete,
            result: '六个点位：照片合格、意见正确、漏检已补记。'},
          {id: 'export', icon: '📤', title: '导出一份记录', hint: 'JSON 或表格都行', check: () => exported,
            result: '导出的记录里，每条意见都能追到照片编号和拍摄参数。'},
        ]);
      },
    },
  ];

  // 原页面的提示（#toast、复核反馈）转成外壳三维区上方的提示条
  const say = (text, kind) => { const c = window.c2Lab?.ctx; if (c && text) c.feedback(text, kind); };
  const warnRe = /请|不足|偏|无法|先|尚未|不能|错误|不对|再/;
  if (EL.toast) new MutationObserver(() => { const t = EL.toast.textContent.trim(); if (t) say(t, warnRe.test(t) && !/已保存.*可进入/.test(t) ? 'warn' : 'info'); })
    .observe(EL.toast, {childList: true, characterData: true, subtree: true});
  if (EL.reviewFeedback) new MutationObserver(() => {
    const t = EL.reviewFeedback.textContent.trim();
    if (t) say(t, EL.reviewFeedback.classList.contains('correct') ? 'ok' : 'warn');
  }).observe(EL.reviewFeedback, {childList: true, characterData: true, subtree: true});

  NativeShell.start({
    task: '7-2', title: '无人机立面巡检',
    stage: EL.stage,
    stageTop: [EL.points],
    stations: STATIONS,
    redo: false,
    current: () => { const st = lab()?.snapshot().step; return st === 'plan' ? 'capture' : st; },
    select: id => document.querySelector(`.c3-legacy [data-step="${id}"]`)?.click(),
    poll() {
      const s = lab().snapshot();
      if (s.routePlaying) previewed = true;
      return s;
    },
    build(c) {
      EL.stage.dataset.c7Station = c.station.id;
      const read = c.readouts([
        {id: 'cov', label: '点位采集', unit: '/ 6'},
        {id: 'gsd', label: '影像分辨率', unit: 'mm/px'},
        {id: 'blur', label: '预计拖影', unit: 'px'},
        {id: 'ok', label: '复核完成', unit: '/ 6'},
      ]);
      c.lab.onState(s => {
        read('cov', s.mission.capturedCount);
        read('gsd', EL.gsd?.textContent || '—');
        read('blur', EL.blur?.textContent || '—');
        read('ok', s.mission.correctCount);
      });
    },
  });
})();
