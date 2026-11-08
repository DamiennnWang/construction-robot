/* VMC Motion CDZ200L, Apache-2.0. Original CAD-derived GLB geometry retained.
 * Course adaptations: display materials, batching and a pin-bound blade lift.
 * See ../models/dozer/LICENSE.html for source, attribution and modifications. */
(() => {
 'use strict';
 const T=THREE,rootURL=new URL('../../',document.currentScript.src),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 let pending;
 function data(){
  if(!pending)pending=new Promise((resolve,reject)=>{
   if(window.DozerBuffers?.cdz200l)return resolve(window.DozerBuffers.cdz200l);
   const script=document.createElement('script');script.src=new URL('shared/models/dozer/cdz200l.data.js',rootURL).href;
   script.onload=()=>{script.remove();window.DozerBuffers?.cdz200l?resolve(window.DozerBuffers.cdz200l):reject(Error('推土机数据未注册'));};
   script.onerror=()=>{script.remove();reject(Error('推土机模型文件缺失'));};document.head.append(script);
  }).catch(error=>{pending=null;throw error;});return pending;
 }
 async function load(){
  const bytes=Uint8Array.from(atob(await data()),c=>c.charCodeAt(0));
  const gltf=await new Promise((resolve,reject)=>new CourseGLTFLoader().parse(bytes.buffer,'',resolve,reject));
  return assemble(gltf);
 }
 function assemble(gltf){
  const source=gltf.scene,root=new T.Group(),body=new T.Group(),groups=new Map(),buckets=new Map(),parts=[],rig=[],state={blade:0};
  const sourceGeometries=new Set(),sourceMaterials=new Set(),textures=new Set(),geometries=[],materials=new Set();let spread=0,disposed=false,sourceMeshes=0;
  root.add(body);source.updateMatrixWorld(true);
  function center(name){const n=source.getObjectByName(name);if(!n)throw Error('推土机缺少定位部件：'+name);return new T.Box3().setFromObject(n).getCenter(V());}
  // Centres come from the original CAD pins, including the left/right axle offset.
  const p=center('CFramePin_L').add(center('CFramePin_R')).multiplyScalar(.5);
  const pins={};for(const side of ['L','R'])pins[side]={base:center('LiftCylinderTubePin_'+side),end:center('LiftCylinderRodPin_'+side)};
  function group(key){if(!groups.has(key)){const node=new T.Group();node.name=key;body.add(node);groups.set(key,node);}return groups.get(key);}
  function classify(path){
   if(/CrawlerBelt_|Wheels_|TrackFrame_|EqualizerBar/.test(path))return 'tracks';
   if(/CabAssy/.test(path))return 'cab';
   for(const side of ['L','R']){if(path.includes('LiftCylinderTube_'+side))return 'lift'+side+'Barrel';if(path.includes('LiftPistonRod_'+side))return 'lift'+side+'Rod';}
   if(/\/CFrame\//.test(path))return 'frame';
   if(/\/Blade\//.test(path))return 'blade';
   if(/AngleCylinder|AnglePiston|TiltCylinder|TiltPiston|\/DogBone\//.test(path))return 'adjustment';
   return 'body';
  }
  const palette=new Map();
  function material(original){
   if(palette.has(original))return palette.get(original);
   const m=original.clone(),index=gltf.parser.associations.get(original)?.materials;
   if([2,4,6,8,10,12].includes(index)){m.color.setHex(0xd9a62c);m.metalness=.16;m.roughness=.42;}
   else if([0,1,3,5,7,9,11,14].includes(index)){m.color.setHex(index===0?0x263845:0x394650);m.metalness=.35;m.roughness=.55;}
   else if(index===13){m.color.setHex(0x50778a);m.opacity=.28;m.depthWrite=false;m.roughness=.16;}
   else if(index===15){m.color.setHex(0xb6c4cc);m.metalness=.72;m.roughness=.3;}
   palette.set(original,m);materials.add(m);return m;
  }
  source.traverse(o=>{
   if(o.geometry)sourceGeometries.add(o.geometry);
   if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){sourceMaterials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}
   if(!o.isMesh)return;
   const names=[];for(let n=o;n;n=n.parent)names.push(n.name);const path='/'+names.reverse().join('/')+'/';
   // "Hidden" contains the author's complete visual track belts; keep them.
   // Hidden_Colliders contains physics collision proxies and must not be drawn.
   if(path.includes('Hidden_Colliders'))return;
   sourceMeshes++;const key=classify(path),mat=material(o.material),bucketKey=key+'|'+mat.uuid;
   const g=group(key);(g.userData.sourceNames??=[]).push(o.name);
   if(!buckets.has(bucketKey))buckets.set(bucketKey,{key,material:mat,geometries:[]});
   buckets.get(bucketKey).geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  for(const b of buckets.values()){
   const geometry=CourseGeometryUtils.mergeGeometries(b.geometries,false);if(!geometry)throw Error('推土机总成合并失败：'+b.key);
   b.geometries.forEach(g=>g.dispose());geometries.push(geometry);const mesh=new T.Mesh(geometry,b.material);mesh.castShadow=true;mesh.receiveShadow=true;group(b.key).add(mesh);
  }
  sourceGeometries.forEach(g=>g.dispose());sourceMaterials.forEach(m=>m.dispose());
  function pivot(position,keys,name){const node=new T.Group();node.name=name;node.position.copy(position);body.add(node);body.updateMatrixWorld(true);keys.forEach(key=>node.attach(group(key)));return node;}
  const lift=pivot(p,['frame','blade','adjustment'],'blade-lift');
  for(const side of ['L','R']){
   const {base,end}=pins[side],barrel=pivot(base,['lift'+side+'Barrel'],'lift-'+side+'-barrel'),rod=pivot(end,['lift'+side+'Rod'],'lift-'+side+'-rod'),axis=end.clone().sub(base).normalize();
   rig.push(()=>{const moved=end.clone().sub(p).applyAxisAngle(V(0,0,1),T.MathUtils.degToRad(state.blade)).add(p),q=new T.Quaternion().setFromUnitVectors(axis,moved.clone().sub(base).normalize());barrel.quaternion.copy(q);rod.quaternion.copy(q);rod.position.copy(moved);});
  }
  const PART_ROLE={"履带与行走架": "履带与行走架：把整机重量分散到地面，带着挖掘机在松软、不平的场地上行走。", "履带底盘": "履带底盘：接地面积大、抓地牢，让机器在泥地、坡地上也能走、能停稳。", "回转平台与配重": "回转平台与配重：上车整体在这里转身；尾部配重和前面的工作装置相互平衡，防止整机前倾。", "驾驶室": "驾驶室：司机在这里操纵各个动作，同时观察工作装置和周围环境。", "驾驶室与防护架": "驾驶室与防护架：司机操纵的位置，外面的防护架在翻车或落物时保护司机。", "驾驶室与操纵台": "驾驶室与操纵台：司机用操纵杆控制行走和铲刀升降。", "操作室": "操作室：塔吊司机在这里控制起重臂回转、小车行走和吊钩升降。", "动臂与油缸": "动臂与油缸：动臂油缸伸缩，把动臂抬起或放下，决定能挖多深、举多高。", "斗杆与油缸": "斗杆与油缸：斗杆油缸推动斗杆向里收或向外伸，决定铲斗能够到多远。", "铲斗与连杆": "铲斗与连杆：铲斗直接挖土、装土，连杆把铲斗油缸的推力变成铲斗的翻转。", "铲斗与斗齿": "铲斗与斗齿：直接插进料堆、兜住物料的部件，斗齿让它更容易切进土石。", "举升臂": "举升臂：把装满料的铲斗举高，好把料倒进车厢或料斗。", "工作液压缸": "工作液压缸：液压油推动活塞杆伸缩，为举升臂和铲斗提供动作的力。", "提升液压缸": "提升液压缸：伸缩时带动推架和铲刀上下，控制铲刀离地的高度。", "铲刀与外侧推臂": "铲刀与外侧推臂：铲刀直接推土、刮平，推臂把车体的推力传到铲刀上。", "动力车体": "动力车体：装着发动机和传动部件，是整台机器的动力来源和底座。", "铰接车架与动力舱": "铰接车架与动力舱：前后车架在中间铰接，转向时整车折腰拐弯；动力舱提供动力。", "轮胎与轮毂": "轮胎与轮毂：在硬地面上跑得快，适合在工地内来回运料。", "底座与标准节塔身": "底座与标准节塔身：把塔吊稳稳固定在地基上，标准节一节节加高，塔吊就能长高。", "起重臂与回转平台": "起重臂与回转平台：起重臂伸向远处挂吊物，回转平台带着它绕塔身转动。", "平衡臂与配重": "平衡臂与配重：在起重臂的另一侧压住配重，吊重物时塔吊不会向前倾翻。", "小车、钢丝绳与吊钩": "小车、钢丝绳与吊钩：小车沿起重臂前后走，钢丝绳收放带动吊钩升降，把材料吊到指定位置。", "动力舱与主车架": "动力舱与主车架：装着发动机，连接履带和铲刀，是推土机的“身体”。", "履带板、支重轮与履带架": "履带板、支重轮与履带架：履带板抓住地面，支重轮压在履带上承重，让推土机推得动、走得稳。", "弧形铲刀": "弧形铲刀：直接推土、刮平场地的部件；弧形让土向前翻滚，不容易从上面漫过去。", "C 形推架与连接销": "C 形推架与连接销：把车体的推力传给铲刀，连接销让铲刀可以转动和倾斜。", "双侧提升液压缸": "双侧提升液压缸：两根油缸一起伸缩，把铲刀抬起或压下。", "转角、倾斜液压机构": "转角、倾斜液压机构：让铲刀左右斜一点或转个角度，把土推向一侧。"};
  function part(id,label,keys){const members=keys.map(group),bounds=new T.Box3();body.updateMatrixWorld(true);members.forEach(n=>bounds.union(new T.Box3().setFromObject(n)));const node=new T.Object3D(),host=members[0];node.position.copy(host.worldToLocal(bounds.getCenter(V())));host.add(node);members.forEach(n=>n.userData.partId=id);parts.push({id,label,node,members,description:PART_ROLE[label]||label+'。'});}
  part('tracks','履带板、支重轮与履带架',['tracks']);part('body','动力舱与主车架',['body']);part('cab','驾驶室与操纵台',['cab']);part('blade','弧形铲刀',['blade']);part('frame','C 形推架与连接销',['frame']);part('lift','双侧提升液压缸',['liftLBarrel','liftLRod','liftRBarrel','liftRRod']);part('adjustment','转角、倾斜液压机构',['adjustment']);
  body.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(body),size=bounds.getSize(V()),scale=5/Math.max(size.x,size.y,size.z),mid=bounds.getCenter(V());root.scale.setScalar(scale);root.position.set(-mid.x*scale,-bounds.min.y*scale,-mid.z*scale);
  const originals=new Map([...groups].map(([key,g])=>[key,g.position.clone()])),offsets=new Map();for(const [key,g]of groups){const c=new T.Box3().setFromObject(g).getCenter(V()).sub(mid);if(c.length()<.1)c.set(0,1,0);offsets.set(key,c.normalize().multiplyScalar(.45/scale));}
  const controls=[{id:'blade',label:'铲刀抬升',min:0,max:16,step:1,default:0}];
  const model={id:'cdz200l',root,parts,controls,duration:8,metadata:{nature:'VMC Motion CDZ200L · Apache-2.0 · 课堂机构绑定',sourceMeshes,pivot:p.toArray(),pins:Object.fromEntries(Object.entries(pins).map(([side,q])=>[side,{base:q.base.toArray(),end:q.end.toArray()}]))},
   setExplode(value){spread=value;},
   pose(time,{manual}={}){for(const [key,g]of groups)g.position.copy(originals.get(key));state.blade=manual?.blade??(1-Math.cos(time*Math.PI/4))*6.5;lift.rotation.z=T.MathUtils.degToRad(state.blade);rig.forEach(fn=>fn());if(spread)for(const [key,g]of groups)g.position.addScaledVector(offsets.get(key),spread);root.updateMatrixWorld(true);},
   readings:()=>[{id:'blade',value:state.blade,unit:'°'}],
   dispose(){if(disposed)return;disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose();});}
  };model.pose(0);return model;
 }
 window.CourseImportedDozer={load};
})();
