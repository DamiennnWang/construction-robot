(function(g){
 'use strict';
 const stations=[{id:'sprayer',label:'喷涂收尾',model:'sprayer'},{id:'pump',label:'泵车收尾',model:'pump'},{id:'engine',label:'发动机点检',model:'engine'},{id:'bearing',label:'轴承润滑',model:'bearing'}];
 const cases={sprayer:[['normal','正常收尾'],['blocked','喷嘴堵塞'],['leak','管路泄漏'],['unknown','涂料与清洗条件不明']],pump:[['normal','正常班后收尾'],['blocked','输送管堵塞'],['leak','连接处异常'],['unknown','清洗方案资料缺失']],engine:[['normal','班后点检'],['hot','温热状态待冷却'],['leak','发现油液泄漏'],['unknown','型号与油液资料缺失']],bearing:[['normal','已知型号润滑'],['dry','润滑不足案例'],['damage','滚道损伤线索'],['unknown','润滑脂资料缺失']]};
 function fresh(station,scenario='normal'){return {scenario,inspected:false,read:false,isolated:false,energyChecked:false,pressure:['sprayer','pump'].includes(station),hot:scenario==='hot',material:'compatible',progress:0,verified:false,handoff:false,unresolved:[]};}
 const initial=()=>({station:'sprayer',work:Object.fromEntries(stations.map(s=>[s.id,fresh(s.id)])),records:[],message:'先检查设备状态，再核对当前案例资料。',error:false});
 const finding=(station,w)=>w.scenario==='unknown'?'型号、材料或维护资料不足，需要保留待确认事项。':w.scenario==='blocked'?'已发现堵塞线索，不能靠继续加压或强行拆开来跳过。':w.scenario==='leak'?'已发现泄漏或连接异常，停止常规收尾并移交检修。':w.scenario==='damage'?'滚道有损伤线索，仅补充润滑不能替代检修。':w.scenario==='hot'?'发动机仍处于温热状态，冷却与压力条件尚未确认。':w.scenario==='dry'?'当前已知型号案例提示润滑不足；先按资料核对品种。':({sprayer:'设备已停，过滤器和喷嘴处仍有残留，管段仍可能带压。',pump:'料斗与管路有残留，按案例方案核对隔离、压力与废料回收。',engine:'检查油液、冷却系统、滤清器与传动护罩；检查条件需分别确认。',bearing:'检查轴承状态与润滑记录，核对本案例指定品种。'}[station]);
 function reduce(state,event){if(event.type==='reset-all')return initial();const s=JSON.parse(JSON.stringify(state));s.error=false;const w=s.work[s.station],fail=message=>({...s,error:true,message});
  if(event.type==='station'){s.station=event.value;s.message='已切换工位，保留其他工位的处理与交接记录。';}
  if(event.type==='case'){s.work[s.station]=fresh(s.station,event.value);s.message='已载入独立案例，其他工位记录保留。';}
  if(event.type==='inspect'){w.inspected=true;s.message=finding(s.station,w);}
  if(event.type==='read'){w.read=true;s.message=w.scenario==='unknown'?'资料仍不充分，不能推测清洗介质、润滑品种或维护周期。':'案例资料已核对：按指定材料和受控维护条件处理，不外推为所有型号的通用程序。';}
  if(event.type==='isolate'){if(!w.inspected||!w.read)return fail('先检查现状并核对资料，再进入维护条件确认。');if(w.scenario==='unknown')return fail('资料不明，无法确认维护方案。请移交并保留待确认项。');w.isolated=true;s.message='案例停用与相关隔离状态已记录；残余压力或温热状态仍需另外核对。';}
  if(event.type==='energy'){if(!w.isolated)return fail('先核对停用和隔离条件。');w.energyChecked=true;w.pressure=false;w.hot=false;s.message='已核对给定案例的能量确认记录；这一步不是实际设备的通用泄压操作。';}
  if(event.type==='material'){w.material=event.value;s.message=event.value==='compatible'?'已选案例资料指定材料/方案。':'所选材料或方案未得到案例资料支持，处理将被阻止。';}
  if(event.type==='service'){if(!w.inspected||!w.read||!w.isolated||!w.energyChecked||w.pressure||w.hot)return fail('维护条件尚未核对完整，不能清洗、接近传动件或润滑。');if(['blocked','leak','damage','unknown'].includes(w.scenario))return fail('该案例包含异常或资料不足，应转待检修/移交，不能用常规保养掩盖问题。');if(w.material!=='compatible')return fail('材料或方案与案例资料不符；不能混用未知材料或强行加压。');w.progress=Math.min(1,w.progress+.5);w.verified=false;s.message=w.progress<1?'已完成第一段处理，观察残留或润滑状态变化，再继续。':'案例处理完成，仍需复查并保留记录。';}
  if(event.type==='verify'){if(w.progress<1)return fail('处理尚未完成，不能直接确认复查通过。');w.verified=true;w.handoff=false;w.unresolved=[];s.message='本案例复查记录已保存。完成仅指课堂给定条件，不生成真实维修许可。';}
  if(event.type==='handoff'){if(!w.inspected)return fail('先记录现象，再移交。');w.handoff=true;w.verified=false;w.unresolved=[finding(s.station,w)];s.message='已移交，原问题保留为未解决；不会显示为修复完成。';}
  if(event.type==='verify'&&w.verified||event.type==='handoff'&&w.handoff){s.records=s.records||[];const id=s.station+':'+w.scenario;const record={id,station:s.station,scenario:w.scenario,resolved:w.verified,unresolved:[...w.unresolved],inspected:w.inspected,read:w.read};s.records=s.records.filter(r=>r.id!==id);s.records.push(record);}
  return s;
 }
 const api={stations,cases,fresh,initial,reduce,finding};g.MaintenanceModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
