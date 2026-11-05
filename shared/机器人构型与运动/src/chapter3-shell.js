/* 第三章：把原页面装进统一任务页外壳（shared/lab-shell/lab-shell.js 的原地模式）。
 * 原页面的全部元素先移入一个隐藏容器（仍在文档里，原有程序照常工作），
 * 各任务的 src/stations.js 再把需要的三维区和控件搬进外壳。
 */
(() => {
  'use strict';
  const TASKS = [
    {id: '3-1', label: '3-1', short: '构型与空间', href: 'course/chapters/03/tasks/3-1/index.html'},
    {id: '3-2', label: '3-2', short: '六轴点动', href: 'course/chapters/03/tasks/3-2/index.html'},
    {id: '3-3a', label: '3-3', short: '减速器', href: 'course/chapters/03/tasks/3-3/reducers.html'},
    {id: '3-3b', label: '3-3', short: '运动转换', href: 'course/chapters/03/tasks/3-3/conversion.html'},
    {id: '3-4', label: '3-4', short: '末端与 TCP', href: 'course/chapters/03/tasks/3-4/index.html'},
    {id: '3-5', label: '3-5', short: '移动底盘', href: 'course/chapters/03/tasks/3-5/index.html'},
  ];
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];

  // 外壳里的原有滑轨：已走过的一段用主色填充，跟随拖动和程序改值
  const fill = input => {
    const min = +input.min || 0, max = input.max === '' ? 100 : +input.max, v = +input.value;
    input.style.setProperty('--p', (((v - min) / ((max - min) || 1)) * 100).toFixed(1) + '%');
  };
  document.addEventListener('input', e => { if (e.target.matches?.('input[type="range"]')) fill(e.target); }, true);
  setInterval(() => document.querySelectorAll('.c2-panel input[type="range"], .c2-strip input[type="range"]').forEach(fill), 250);

  window.C3Shell = {
    $, all,
    start(cfg) {
      const layout = window.CHAPTER_LAYOUT || {};
      const legacy = document.createElement('div');
      legacy.className = 'c3-legacy'; legacy.hidden = true;
      [...document.body.children]
        .filter(e => !['SCRIPT', 'STYLE', 'DIALOG', 'TEMPLATE'].includes(e.tagName) && e.id !== 'toast' && !e.matches('.course-theme-toggle'))
        .forEach(e => legacy.append(e));
      document.body.append(legacy);
      document.documentElement.dataset.c3Task = layout.task || '';
      const taskNav = layout.task === '3-3' ? (layout.page === 'conversion' ? '3-3b' : '3-3a') : layout.task;
      LabShell.native({
        chapter: {title: '第三章 · 机器人结构与运动', href: 'course/chapters/03/overview/index.html'},
        tasks: TASKS, taskNav, hint: '', progressKey: taskNav,
        ...cfg,
      });
    },
  };
})();
