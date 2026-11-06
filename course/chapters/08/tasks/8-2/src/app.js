/* 任务 8-2：状态 + 存储 + 三维场景的连接。对外接口 window.MaintLab（供 stations.js 和验收脚本使用）。 */
(function () {
  'use strict';
  const M = window.MaintModel, KEY = 'course-maintenance-v2';
  let state = M.initial();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && M.IDS.includes(saved.station) && M.IDS.every(id => saved.work?.[id]) && Array.isArray(saved.records)) {
      state = {...M.initial(), ...saved, message: '', error: false, last: null};
    }
  } catch {}
  const listeners = new Set();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({...state, message: '', error: false})); } catch {} };
  const scene = window.MaintScene.create(document.getElementById('m82Stage'));

  function dispatch(event) {
    state = M.reduce(state, event);
    save();
    scene?.sync(state, event);
    listeners.forEach(fn => { try { fn(state, event); } catch (e) { console.warn(e); } });
    return state;
  }
  if (scene) {
    scene.onPoint = id => {
      const w = state.work[state.station];
      // 检查完的点再点一次：挖掘机工位加注；其他情况只是把镜头拉近
      if (w.checked[id] && state.station === 'excavator' && !w.done[id]) dispatch({type: 'service', point: id});
      else if (w.checked[id]) { scene.focus(id); listeners.forEach(fn => fn(state, {type: 'look', point: id})); }
      else dispatch({type: 'inspect', point: id});
    };
    scene.sync(state, null);
  }

  function exportRecord() {
    const data = {说明: '课堂案例交接卡，不是维修许可', 记录: state.records.map(r => ({
      工位: M.STATIONS[r.station].label, 情境: M.label(M.STATIONS[r.station].cases, r.scenario),
      结果: r.resolved ? '已复查' : '已移交 · 未解决', 待处理: r.unresolved,
    }))};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = '班后维护交接卡.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.MaintLab = {
    state: () => JSON.parse(JSON.stringify(state)),
    dispatch, exportRecord,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    focus: id => scene?.focus(id),
    frame: () => scene?.frame(),
    top: () => scene?.top(),
    readouts: () => scene?.readouts() || {temp: state.work.engine.temp, pressure: state.work.excavator.pressure, crank: 0},
    stats: () => scene?.stats() || {webgl: false},
    reset() { state = M.initial(); save(); scene?.sync(state, {type: 'case'}); listeners.forEach(fn => fn(state, {type: 'reset-all'})); },
  };
})();
