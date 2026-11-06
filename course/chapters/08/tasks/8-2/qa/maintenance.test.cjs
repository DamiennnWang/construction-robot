const {test} = require('node:test'), assert = require('node:assert/strict'), M = require('../src/maint.model.js');
const run = (s, ...events) => events.reduce((x, e) => M.reduce(x, typeof e === 'string' ? {type: e} : e), s);
const at = (station, scenario = 'normal') => run(M.initial(), {type: 'station', value: station}, {type: 'case', value: scenario});
const ready = (station, scenario) => run(at(station, scenario), 'prepare', 'isolate', 'energy');
const inspectAll = (s, station) => run(s, ...M.STATIONS[station].points.map(([point]) => ({type: 'inspect', point})));

test('两个工位共用同一条流程：准备 → 隔离 → 能量确认，顺序不能跳', () => {
  for (const id of M.IDS) {
    let s = run(at(id), 'isolate'); assert(s.error); assert(!s.work[id].isolated);
    s = run(at(id), 'energy'); assert(s.error);
    s = ready(id); assert(s.work[id].prepared && s.work[id].isolated && s.work[id].energy);
  }
});

test('发动机还烫时开冷却液盖被拦下，并记为“抢步”尝试', () => {
  let s = run(at('engine'), 'prepare', 'isolate', {type: 'inspect', point: 'coolant'});
  assert(s.error); assert(!s.work.engine.checked.coolant); assert(s.tried.engine.early);
  assert(s.work.engine.temp > M.SAFE_TEMP);
  s = run(s, 'energy'); assert(s.work.engine.temp <= M.SAFE_TEMP);
  s = run(s, {type: 'inspect', point: 'coolant'}); assert(!s.error); assert(s.work.engine.checked.coolant);
});

test('挖掘机铲斗未落地就去检查铰点被拦下', () => {
  const s = run(at('excavator'), {type: 'inspect', point: 'bucketPin'});
  assert(s.error); assert(s.tried.excavator.early); assert(!s.work.excavator.checked.bucketPin);
});

test('正常案例：检查全部点、核对资料、用指定材料处理后才能复查', () => {
  for (const id of M.IDS) {
    let s = ready(id);
    s = run(s, 'service'); assert(s.error, id + ' 未检查完不能处理');
    s = inspectAll(s, id); s = run(s, 'service'); assert(s.error, id + ' 未核对资料不能处理');
    s = run(s, 'read', {type: 'material', value: 'mixed'}, 'service'); assert(s.error); assert(s.tried[id].material);
    s = run(s, {type: 'material', value: 'spec'});
    s = run(s, 'verify'); assert(s.error, id + ' 处理没做完不能复查');
    for (let i = 0; i < M.STATIONS[id].points.length; i++) s = run(s, 'service');
    assert.equal(s.work[id].progress, 1);
    s = run(s, 'verify'); assert(s.work[id].verified);
    assert(s.records.some(r => r.station === id && r.scenario === 'normal' && r.resolved));
  }
});

test('挖掘机逐点加注：每个点只加一次，进度按点数计算', () => {
  let s = run(inspectAll(ready('excavator'), 'excavator'), 'read', {type: 'service', point: 'boomFoot'}, {type: 'service', point: 'boomFoot'});
  assert.equal(s.work.excavator.progress, 1 / 6);
});

for (const [id, scenario, point] of [['engine', 'leak', 'under'], ['engine', 'belt', 'belt'], ['excavator', 'seep', 'boomRod'], ['excavator', 'loose', 'bucketPin']]) {
  test(`${id}/${scenario}：发现异常后不能常规处理，移交后保留未解决`, () => {
    let s = run(ready(id, scenario), {type: 'inspect', point});
    assert(s.error); assert(s.work[id].checked[point]);
    s = run(inspectAll(s, id), 'read', 'service'); assert(s.error); assert.equal(s.work[id].progress, 0);
    s = run(s, 'handoff'); assert(s.work[id].handoff); assert(!s.work[id].verified);
    const r = s.records.find(x => x.id === id + ':' + scenario); assert(r && !r.resolved && r.unresolved.length);
  });
}

test('资料不明：核对资料后不能补加/加注，只能移交', () => {
  for (const id of M.IDS) {
    let s = run(inspectAll(ready(id, 'unknown'), id), 'read');
    assert(s.error);
    s = run(s, 'service'); assert(s.error); assert.equal(s.work[id].progress, 0);
    s = run(s, 'handoff');
    assert(s.records.find(r => r.id === id + ':unknown' && !r.resolved && r.unresolved.some(u => u.includes('资料缺失'))));
  }
});

test('换情境、换工位都保留交接记录；清空才归零', () => {
  let s = run(ready('engine', 'leak'), {type: 'inspect', point: 'under'}, 'handoff', {type: 'case', value: 'normal'}, {type: 'station', value: 'excavator'});
  assert(s.records.some(r => r.id === 'engine:leak'));
  assert.equal(s.work.engine.scenario, 'normal');
  s = run(s, 'reset-all'); assert.equal(s.records.length, 0);
});
