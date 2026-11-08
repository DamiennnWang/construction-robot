/* Logical assemblies verified against geom_N in the source MJCF worldbody.
 * Geometry and clips remain in the original licensed shared GLBs. */
(function(g){
 'use strict';const T=g.THREE;
 const map={
  crazyflie:[['propellers','旋翼组',[0],[0,.55,0],'四副旋翼来自原始同一网格组。当前动画展示整机姿态，未单独驱动旋翼。'],['board','控制电路板',[1,2],[0,.22,0],'电路板与金属接点按源模型的材质网格分组。'],['frame','机架与电机外形',[3,4,5,6],[0,-.35,0],'支臂、壳体与电机外形保留原网格；分解是按网格组展开。']],
  iiwa:[['base','安装基座',[0],[0,-.35,0],'固定安装端与第一连杆分开观察。'],['link1','第一连杆',[5],[-.3,0,0],'源模型 link1。动作是预制运动学演示。'],['link2','第二连杆',[11,12],[-.5,.15,0],'橙色外壳与灰色壳体属于同一连杆。'],['link3','第三连杆',[22,23,24],[.35,.25,0],'连杆外壳、饰带与铭牌一起运动。'],['link4','第四连杆',[34,35],[.55,.35,0],'用单步比较这一连杆和相邻连杆的姿态。'],['link5','第五连杆',[42,43,44],[-.35,.5,0],'腕部之前的连杆总成。'],['link6','第六连杆',[54,55],[.35,.65,0],'末端附近的关节连杆。'],['tool','末端连接法兰',[59],[0,.9,0],'末端法兰用于连接工具，当前没有安装工艺工具。']],
  g1:[['pelvis','骨盆与髋部',[0,1],[0,-.05,.4],'骨盆与髋部：连接上身和双腿，髋关节让腿能前后、左右摆动。'],['left-leg','左腿与足端',[3,5,7,9,11,13],[-.5,-.3,0],'左腿与足端：髋、膝、踝三个关节配合弯曲和伸直，脚掌着地支撑身体。'],['right-leg','右腿与足端',[18,20,22,24,26,28],[.5,-.3,0],'右腿与足端：和左腿交替抬起、落下，人形机器人就能迈步。'],['torso','腰部与躯干',[33,34,35,37],[0,.25,-.3],'腰部和躯干支承头部与双臂。'],['head','头部外形',[39],[0,.7,0],'头部外形：一般用来安装摄像头等传感器；这台模型只展示外形。'],['left-arm','左臂与手',[41,43,45,47,49,51,53,55],[-.75,.25,0],'左臂与手：肩、肘、腕几个关节串起来，和机械臂一样能把手送到不同位置。'],['right-arm','右臂与手',[56,58,60,62,64,66,68,70],[.75,.25,0],'右臂与手：挥手动作里可以看到肩、肘、腕依次转动。']],
  go2:[['body','机身总成',[0,1,2,3,4],[0,.5,0],'机身总成：装着电池、控制器和传感器，四条腿都连在机身上。'],['fl','左前腿',[8,9,11,12,14,15,18],[.4,-.2,.5],'左前腿：髋、大腿、小腿三个关节由电机带动，足端着地支撑和推动机身。'],['fr','右前腿',[20,21,23,24,26,27,30],[.4,-.2,-.5],'右前腿：和左前腿结构相同，四条腿按顺序抬落，机身就能走起来。'],['rl','左后腿',[32,33,35,36,38,39,42],[-.4,-.2,.5],'左后腿：后腿主要负责把机身向前推。'],['rr','右后腿',[44,45,47,48,50,51,54],[-.4,-.2,-.5],'右后腿：和左后腿配合，走路时总有几条腿撑在地上，机身才不会倒。']]
 };
 function enhanceHand(m){
  const sharpa=m.id==='sharpa';
  const basePose=m.pose.bind(m),baseClip=m.setClip.bind(m),byName=new Map(m.nodes.map(n=>[n.name,n]));
  const restPositions=new Map(m.nodes.map(n=>[n,n.position.clone()]));let apart=0,clipIndex=0,current={};
  const fingers=[['index','食指','ff',[-.05,.045,.02]],['middle','中指','mf',[0,0,.06]],['ring','无名指','rf',[.05,-.045,.02]],['thumb','拇指','th',[.04,.05,-.025]]];
  if(sharpa)fingers.splice(0,fingers.length,['index','食指','right_index',[-.04,0,.03]],['middle','中指','right_middle',[0,0,.06]],['ring','无名指','right_ring',[.04,0,.03]],['pinky','小指','right_pinky',[.06,0,0]],['thumb','拇指','right_thumb',[-.05,0,-.03]]);
  const bodies={right_index:'right_index_MCP_VL',right_middle:'right_middle_MCP_VL',right_ring:'right_ring_MCP_VL',right_pinky:'right_pinky_MC',right_thumb:'right_thumb_CMC_VL'};
  const groups=[['palm','掌部与安装端',byName.get(sharpa?'right_hand_C_MC_visual_0':'palm_visual_0'),[0,0,0],
    sharpa?'完整掌壳与五指安装结构，采用 Sharpa Wave 开源机型网格。':'掌部提供手指的安装位置。Allegro V3 是四指机械手，模型保留源网格结构。'],
    ...fingers.map(([id,label,prefix,offset])=>[id,label+'与指尖',byName.get(sharpa?bodies[prefix]:prefix+'_base'),offset,
      '沿'+label+'观察指根、指节和浅色指尖。拖动弯曲滑块比较伸展与弯曲姿态；动作仅为教学示意。'])];
  m.nodes.forEach(n=>{delete n.userData.partId;n.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});});
  m.parts=groups.map(([id,label,body,offset,description])=>{body.userData.partId=id;const anchor=new T.Object3D();m.root.add(anchor);return{id,label,node:anchor,members:[body],body,offset:new T.Vector3(...offset),description};});
  m.controls=fingers.map(([id,label])=>({id,label:label+'弯曲',min:0,max:100,step:1,default:0,unit:'%'}));
  const clamp=v=>Math.max(0,Math.min(100,Number.isFinite(v)?v:0));
  const closure=(t,i)=>{const phase=Math.max(0,Math.min(1,t/8));if(!clipIndex)return(1-Math.cos(phase*2*Math.PI))/2;const p=phase*fingers.length-i;return p>=0&&p<=1?Math.sin(Math.PI*p)**2:0;};
  const angle=(name,c)=>name.startsWith('th')?[.4+.4*c,.15+.3*c,.1+.6*c,.12+.6*c][Number(name.at(-1))]:[0,.05+.9*c,.04+c,.06+.8*c][Number(name.at(-1))];
  m.pose=(t,context={})=>{
   m.nodes.forEach(n=>n.position.copy(restPositions.get(n)));basePose(t);
   fingers.forEach(([id,,prefix],i)=>{const percent=context.manual&&Object.hasOwn(context.manual,id)?clamp(context.manual[id]):closure(t,i)*100;current[id]=percent;
    m.nodes.filter(n=>n.userData.jointSpec?.joint.startsWith(prefix)).forEach(n=>{const spec=n.userData.jointSpec,a=sharpa?spec.closeAngle*percent/100:angle(spec.joint,percent/100);n.quaternion.fromArray(spec.restQuaternion).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(...spec.axis),Math.max(spec.range[0],Math.min(spec.range[1],a))));});
   });
   m.parts.forEach(p=>p.body.position.addScaledVector(p.offset,apart));m.root.updateMatrixWorld(true);
   m.parts.forEach(p=>p.node.position.copy(m.root.worldToLocal(new T.Box3().setFromObject(p.body).getCenter(new T.Vector3()))));m.root.updateMatrixWorld(true);
  };
  m.readings=()=>m.controls.map(c=>({id:c.id,label:c.label,value:current[c.id]??0,unit:'%'}));
  m.setExplode=value=>{apart=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));};
  m.setClip=index=>{clipIndex=index;baseClip(index);};
  m.metadata={nature:sharpa?'Sharpa Wave · Apache-2.0 许可网格 · 教学张合示意':'Allegro Hand V3 · BSD-2-Clause 许可网格 · 教学张合示意'};m.pose(0);return m;
 }
 function enhance(m,id){if(id==='allegro'||id==='sharpa')return enhanceHand(m);const specs=map[id];if(!specs)return m;let apart=0;const basePose=m.pose.bind(m),nodes=m.nodes,base=new Map(),sections=[];m.root.updateMatrixWorld(true);const normalized=nodes[0].parent;nodes.forEach(n=>{delete n.userData.partId;base.set(n,n.position.clone());n.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});});
  m.parts=specs.map(([key,label,ids,offset,description])=>{const members=nodes.filter(n=>ids.includes(Number(n.userData.sourceName?.split('_')[1]))),anchor=new T.Object3D();m.root.add(anchor);members.forEach(n=>n.userData.partId=key);const section={id:key,label,node:anchor,members,offset:new T.Vector3(...offset).divideScalar(normalized.scale.x),description};sections.push(section);return section;}).filter(p=>p.members.length);
  m.pose=t=>{nodes.forEach(n=>n.position.copy(base.get(n)));basePose(t);nodes.forEach(n=>base.get(n).copy(n.position));sections.forEach(p=>p.members.forEach(n=>n.position.addScaledVector(p.offset,apart)));m.root.updateMatrixWorld(true);for(const p of sections){const box=new T.Box3();p.members.forEach(n=>box.union(new T.Box3().setFromObject(n)));p.node.position.copy(m.root.worldToLocal(box.getCenter(new T.Vector3())));}m.root.updateMatrixWorld(true);};
  m.setExplode=v=>{apart=Math.max(0,Math.min(1,v));};m.pose(0);return m;
 }
 g.CourseRobotParts={enhance,map};if(typeof module!=='undefined')module.exports=g.CourseRobotParts;
})(typeof window==='undefined'?globalThis:window);
