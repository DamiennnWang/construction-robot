/* 任务 8-2 班后维护：纯状态模型（浏览器与 node 测试共用，不碰 DOM 与三维）。
 * 两个工位：发动机班后点检、挖掘机班后润滑。每个工位都按同一条线走：
 *   准备（停机/落地）→ 隔离（拔钥匙等）→ 能量确认（冷却/泄压）→ 逐点检查 → 核对资料与材料 → 处理 → 复查或移交。
 * 情境、检查结果与材料均为课堂案例，不代表任何具体机型的维修规程。
 */
(function (g) {
  'use strict';
  const STATIONS = {
    engine: {
      label: '发动机点检',
      cases: [['normal', '班后点检'], ['leak', '底部渗油'], ['belt', '皮带裂纹'], ['unknown', '机油规格不明']],
      steps: {prepare: '熄火停机', isolate: '拔钥匙、断开电源总开关', energy: '等发动机冷却下来'},
      points: [['dipstick', '机油尺'], ['coolant', '冷却液壶'], ['belt', '附件皮带'], ['under', '底部与地面']],
      materials: [['spec', '资料指定机油'], ['unknown', '标签不明的机油'], ['mixed', '两种机油混用']],
      service: '补加机油到刻度',
    },
    excavator: {
      label: '挖掘机润滑',
      cases: [['normal', '班后润滑'], ['seep', '动臂油缸渗漏'], ['loose', '铲斗销松旷'], ['unknown', '润滑脂资料不明']],
      steps: {prepare: '铲斗落地', isolate: '熄火拔钥匙、放下先导锁定杆', energy: '释放液压残压'},
      points: [['boomFoot', '动臂根部'], ['boomRod', '动臂油缸'], ['boomTip', '动臂—斗杆铰点'], ['stickRod', '斗杆油缸'], ['bucketPin', '铲斗销'], ['linkPin', '摇杆销']],
      materials: [['spec', '资料指定润滑脂'], ['unknown', '标签不明的润滑脂'], ['mixed', '不同润滑脂混用']],
      service: '逐点加注润滑脂',
    },
  };
  const IDS = Object.keys(STATIONS);
  const START_TEMP = 88, SAFE_TEMP = 45, START_PRESSURE = 35;

  /* 每个检查点在各情境下看到什么；abnormal 为真时这一项必须移交。 */
  const FINDINGS = {
    engine: {
      dipstick: c => c === 'unknown' ? {text: '油位在下刻线附近，需要补加；但本机机油规格资料缺失。', doc: true} : {text: '油位在下刻线附近，需要补加一点。', low: true},
      coolant: () => ({text: '液位在 MIN 与 MAX 之间，颜色正常。'}),
      belt: c => c === 'belt' ? {text: '附件皮带内侧有多道横向裂纹。', abnormal: true} : {text: '皮带无裂纹，张紧正常。'},
      under: c => c === 'leak' ? {text: '油底壳放油螺塞处在渗油，地面有新鲜油迹。', abnormal: true} : {text: '底部和地面干净，没有油迹。'},
    },
    excavator: {
      boomFoot: () => ({text: '销轴无异响，旧润滑脂已发干。'}),
      boomRod: c => c === 'seep' ? {text: '动臂油缸活塞杆上有油膜，下方地面有油滴。', abnormal: true} : {text: '活塞杆干净，无渗漏。'},
      boomTip: () => ({text: '铰点正常，需要补充润滑。'}),
      stickRod: () => ({text: '斗杆油缸杆端正常，需要补充润滑。'}),
      bucketPin: c => c === 'loose' ? {text: '铲斗销和销孔之间有明显松旷间隙。', abnormal: true} : {text: '铲斗销正常，需要补充润滑。'},
      linkPin: () => ({text: '摇杆销正常，需要补充润滑。'}),
    },
  };

  function fresh(station, scenario = 'normal') {
    return {
      scenario, prepared: false, isolated: false, energy: false,
      temp: station === 'engine' ? START_TEMP : null,
      pressure: station === 'excavator' ? START_PRESSURE : null,
      checked: {}, read: false, material: 'spec', done: {}, progress: 0,
      verified: false, handoff: false, unresolved: [],
    };
  }
  const initial = () => ({
    station: 'engine',
    work: Object.fromEntries(IDS.map(id => [id, fresh(id)])),
    records: [], tried: Object.fromEntries(IDS.map(id => [id, {}])),
    message: '', error: false, last: null,
  });

  const label = (list, id) => (list.find(x => x[0] === id) || [, id])[1];
  const finding = (station, scenario, point) => FINDINGS[station][point](scenario);
  const abnormal = (station, w) => Object.keys(w.checked).filter(p => finding(station, w.scenario, p).abnormal);
  const allChecked = (station, w) => STATIONS[station].points.every(([p]) => w.checked[p]);

  function reduce(state, event) {
    if (event.type === 'reset-all') return initial();
    const s = JSON.parse(JSON.stringify(state));
    s.error = false; s.last = event.type;
    s.tried = s.tried || Object.fromEntries(IDS.map(id => [id, {}]));
    if (event.type === 'station') {
      if (STATIONS[event.value]) s.station = event.value;
      s.message = ''; return s;
    }
    const id = s.station, st = STATIONS[id], w = s.work[id], steps = st.steps;
    const ok = m => { s.message = m; return s; };
    const fail = (m, flag) => { if (flag) s.tried[id][flag] = true; s.error = true; s.message = m; return s; };
    const closed = () => w.verified || w.handoff;

    switch (event.type) {
      case 'case':
        if (!st.cases.some(c => c[0] === event.value)) return s;
        s.work[id] = fresh(id, event.value);
        return ok('载入“' + label(st.cases, event.value) + '”。其他记录都保留。');
      case 'prepare':
        if (closed()) return fail('这一单已经结束。换一个情境，或按“重来”。');
        w.prepared = true;
        return ok(id === 'engine' ? '发动机已熄火，曲轴停转。机体还很烫。' : '铲斗已平放在地面上，工作装置不再悬空。');
      case 'isolate':
        if (!w.prepared) return fail(id === 'engine' ? '先熄火停机。' : '先把铲斗放到地面。', 'early');
        w.isolated = true;
        return ok(id === 'engine' ? '钥匙已拔下并挂牌，电源总开关已断开。' : '钥匙已拔下并挂牌，先导锁定杆已放下。');
      case 'energy':
        if (!w.isolated) return fail('先完成“' + steps.isolate + '”。');
        w.energy = true;
        if (id === 'engine') { w.temp = 40; return ok('等了一段时间，机体温度降到 40 ℃ 左右，可以开盖检查。'); }
        w.pressure = 0; return ok('按资料往复扳动操纵手柄释放残压，压力表回零。');
      case 'inspect': {
        const p = event.point;
        if (!st.points.some(x => x[0] === p)) return s;
        if (closed()) return fail('这一单已经结束。换一个情境，或按“重来”。');
        if (!w.prepared || !w.isolated || !w.energy) {
          const why = id === 'engine'
            ? (!w.prepared ? '发动机还在运转，不能靠近检查。' : (p === 'coolant' && !w.energy) ? '机体还烫，冷却系统带压，现在拧开冷却液盖会喷出热液。' : '先完成停机、隔离和冷却，再动手检查。')
            : (!w.prepared ? '铲斗还悬在空中，人不能进到工作装置下面。' : '先完成隔离和泄压，再靠近工作装置。');
          return fail(why, 'early');
        }
        w.checked[p] = true;
        const f = finding(id, w.scenario, p);
        if (f.abnormal) return fail('发现异常：' + f.text + ' 这一项要移交检修。');
        return ok(label(st.points, p) + '：' + f.text);
      }
      case 'read':
        if (closed()) return fail('这一单已经结束。');
        w.read = true;
        if (w.scenario === 'unknown') return fail(id === 'engine' ? '资料里查不到本机机油规格。不能猜，也不能拿手边的机油补加。' : '资料里查不到本机润滑脂品种。不能猜，也不能混用。');
        return ok(id === 'engine' ? '已核对资料：本机用资料指定牌号的机油，补到上下刻线之间。' : '已核对资料：各铰点用资料指定的润滑脂，加注到旧脂被挤出为止。');
      case 'material':
        if (!st.materials.some(m => m[0] === event.value)) return s;
        w.material = event.value;
        return ok('选用：' + label(st.materials, event.value) + '。');
      case 'service': {
        if (closed()) return fail('这一单已经结束。');
        if (!w.prepared || !w.isolated || !w.energy) return fail('维护前的停机、隔离和能量确认还没做完。', 'early');
        if (!allChecked(id, w)) return fail('先把所有检查点看一遍，再动手处理。');
        if (abnormal(id, w).length) return fail('已经发现异常，不能用常规保养掩盖问题。请移交。');
        if (!w.read) return fail('先核对型号与资料。');
        if (w.scenario === 'unknown') return fail('资料缺失，不能补加或加注。请移交，保留待确认事项。');
        if (w.material !== 'spec') return fail('所选材料没有资料依据，不能混用或代用。', 'material');
        if (id === 'engine') {
          w.done.oil = true; w.progress = 1;
          return ok('已补加资料指定机油，等几分钟再看油尺复查。');
        }
        const p = event.point || st.points.find(x => !w.done[x[0]])?.[0];
        if (!p || w.done[p]) return ok('这个点已经加注过了。');
        w.done[p] = true;
        w.progress = st.points.filter(x => w.done[x[0]]).length / st.points.length;
        return ok(label(st.points, p) + '加注完成，新脂把旧脂挤了出来。' + (w.progress < 1 ? '' : ' 全部加注完成，复查一遍。'));
      }
      case 'verify':
        if (w.progress < 1) return fail('处理还没做完，不能确认复查。');
        if (closed()) return fail('这一单已经结束。');
        w.verified = true; w.unresolved = [];
        record(s, id, w, true);
        return ok(id === 'engine' ? '复查：油位回到两条刻线之间，皮带、地面正常。已记入交接记录。' : '复查：每个铰点都有新脂挤出，地面无油迹。已记入交接记录。');
      case 'handoff': {
        if (closed()) return fail('这一单已经结束。');
        if (!Object.keys(w.checked).length && !w.read) return fail('先检查并记录现象，再移交。');
        const issues = abnormal(id, w).map(p => label(st.points, p) + '：' + finding(id, w.scenario, p).text);
        if (w.scenario === 'unknown' && w.read) issues.push(id === 'engine' ? '机油规格资料缺失，未补加' : '润滑脂资料缺失，未加注');
        if (!issues.length) issues.push('未发现异常的项目也一并移交，待确认');
        w.handoff = true; w.unresolved = issues;
        record(s, id, w, false);
        return ok('已移交检修，问题原样保留在交接记录里，不算修好。');
      }
      default: return s;
    }
  }

  function record(s, id, w, resolved) {
    const key = id + ':' + w.scenario;
    s.records = (s.records || []).filter(r => r.id !== key);
    s.records.push({id: key, station: id, scenario: w.scenario, resolved, unresolved: [...w.unresolved], checked: Object.keys(w.checked)});
  }

  const api = {STATIONS, IDS, FINDINGS, SAFE_TEMP, initial, fresh, reduce, finding, abnormal, allChecked, label};
  g.MaintModel = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
