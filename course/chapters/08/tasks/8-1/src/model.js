(function(g){
 'use strict';
 const hazards=[
  {id:'electric',label:'临时用电',finding:'破损电缆靠近潮湿作业区。',control:'停用并隔离该回路，移交电气专业人员',evidence:'案例复查记录：受损电缆已由专业人员处理，线路与潮湿作业区重新布置。'},
  {id:'collision',label:'回转碰撞',finding:'人员通道进入挖掘机回转示意包络。',control:'调整人员通道并设置隔离',evidence:'重新回放示意路径，人员通道已避开该案例的回转包络。'},
  {id:'pinch',label:'夹挤与传动',finding:'传动部件护罩缺失，接近位置仍可到达。',control:'停用设备，设置防护并隔离接近位置',evidence:'案例防护记录：护罩复位，危险接近位置已隔离。'},
  {id:'load',label:'悬吊物',finding:'悬吊物下方仍有通行路线。',control:'停止吊运动作，处理吊物并隔离路径',evidence:'案例记录：吊物已受控落置，原通行路径已隔离。'},
  {id:'edge',label:'临边与洞口',finding:'楼面洞口未设防护，人员路径经过边缘。',control:'设置洞口防护并改道',evidence:'对照案例图，洞口防护和绕行路径均已设置。'},
  {id:'pressure',label:'残余压力',finding:'喷涂设备虽已停止，管段仍显示残余压力。',control:'核对型号资料及能量隔离确认记录',evidence:'案例确认记录：相关能量已隔离，残余压力已按该设备程序处理并核对。'}
 ];
 const initial=()=>({selected:'electric',running:true,latched:false,armed:false,energy:{power:true,pressure:true,load:true},issues:Object.fromEntries(hazards.map(h=>[h.id,{found:false,controlled:false,verified:false}])),message:'暂停现场，点击标记观察六类危险。',error:false});
 function reduce(state,event){if(event.type==='restart-case')return initial();const s=JSON.parse(JSON.stringify(state));s.error=false;const fail=message=>({...s,error:true,message}),issue=s.issues[s.selected],h=hazards.find(h=>h.id===s.selected);
  if(event.type==='select'){s.selected=event.value;s.message=hazards.find(h=>h.id===event.value).finding;}
  if(event.type==='inspect'){issue.found=true;s.message=h.finding+' 已记录发现；还需要处置与复查。';}
  if(event.type==='estop'){s.running=false;s.latched=true;s.armed=false;s.message='急停已锁存。运动停止，但电源、残余压力和吊物状态仍需分别核对。';}
  if(event.type==='control'){if(!issue.found)return fail('先近看并记录当前危险。');if(s.running)return fail('当前设备仍在运行。先停止现场，再处理危险。');issue.controlled=true;issue.verified=false;if(s.selected==='pressure'){s.energy.pressure=false;s.energy.power=false;}if(s.selected==='load')s.energy.load=false;s.message=h.control+'；案例处置已记录，继续核对复查证据。';}
  if(event.type==='verify'){if(!issue.controlled)return fail('当前问题尚未处置，不能仅点击“已复查”清除危险。');issue.verified=true;s.message=h.evidence;}
  if(event.type==='reset-stop'){if(Object.values(s.issues).some(i=>!i.verified))return fail('仍有未复查危险。复位被阻止，继续逐项处理。');if(s.energy.pressure||s.energy.load)return fail('仍有相关残余能量条件未核对。');s.latched=false;s.armed=true;s.running=false;s.message='已复位，设备保持静止，等待单独的重新启动指令。';}
  if(event.type==='start'){if(!s.armed||s.latched||Object.values(s.issues).some(i=>!i.verified))return fail('不能启动：需完成处置、复查和手动复位。');s.running=true;s.energy.power=true;s.message='收到独立启动指令，恢复案例演示。完成仅代表本课堂案例状态。';}
  return s;
 }
 const api={hazards,initial,reduce};g.SafetyModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
