/* One navigable exhibit per chapter; mesh picking and labels share destinations. */
(() => {
 'use strict';
 const host=document.getElementById('stage'),labels=document.getElementById('labels');
 const chapters=COURSE.chapters,T=THREE,items=[],scene=new T.Scene();
 let renderer,paused=true,time=0,last=0,frame,hovered=null;
 const camera=new T.OrthographicCamera(-12,12,7,-7,.1,150);
 const kinds=['excavator','engine','arm','sensor','rebar','tiling','inspection','safety'];
 const descriptions=['动臂、斗杆与铲斗联动','飞轮转动','机械臂关节与夹爪动作','扫描范围示意','绑扎机械臂关节动作','铺贴机械臂关节动作','无人机悬停示意','安全帽与点检记录静态展示'];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 labels.innerHTML=chapters.map(c=>`<a class="model-label" id="chapter-${c.id}" data-chapter="${c.id}" href="${courseHref(c.entry)}" title="${esc(c.description)}"><span><b>${String(c.id).padStart(2,'0')}</b><strong>${esc(c.title)}</strong></span><small>${c.tasks.length} 项任务 <span>进入章节 ↗</span></small></a>`).join('');
 function fallback(){
  paused=true;renderer?.domElement.remove();renderer?.dispose();renderer=null;
  document.querySelector('.stage-column').classList.add('is-fallback');
  document.getElementById('fallback').hidden=false;
  document.getElementById('motion').disabled=true;document.getElementById('reset-motion').disabled=true;
  document.getElementById('motion-status').textContent='三维不可用：使用下方章节入口继续学习。';
 }
 try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{fallback();}
 if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  scene.add(new T.HemisphereLight(0xffffff,0x7895aa,2.4));
  const sun=new T.DirectionalLight(0xfffbf3,2.5);sun.position.set(-9,20,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=5;
  Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:60});sun.shadow.normalBias=.045;scene.add(sun);
  chapters.forEach((chapter,i)=>{
   const exhibit=CourseExhibits.make(kinds[i]),stand=new T.Group();
   const shape=new T.Shape(),w=1.85,d=1.5,r=.26;
   shape.moveTo(-w+r,-d);shape.lineTo(w-r,-d);shape.quadraticCurveTo(w,-d,w,-d+r);shape.lineTo(w,d-r);shape.quadraticCurveTo(w,d,w-r,d);shape.lineTo(-w+r,d);shape.quadraticCurveTo(-w,d,-w,d-r);shape.lineTo(-w,-d+r);shape.quadraticCurveTo(-w,-d,-w+r,-d);
   const geometry=new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelThickness:.025,bevelSize:.035,bevelSegments:3,curveSegments:8,steps:1});geometry.rotateX(-Math.PI/2);
   const base=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xf5f8fa,roughness:.65}));base.position.y=-.09;
   const size=new T.Box3().setFromObject(exhibit.root).getSize(new T.Vector3());
   const visualScale=[1.05,.76,1.12,.85,.98,.98,.9,.78][i];
   exhibit.root.scale.multiplyScalar(visualScale*3.1/Math.max(size.x,size.y,size.z));
   base.receiveShadow=true;stand.add(base);exhibit.root.position.y=.14;stand.add(exhibit.root);
   const marker=new T.Object3D();marker.position.set(0,.02,1.9);stand.add(marker);
   stand.userData.chapter=chapter.id;scene.add(stand);exhibit.pose(0);
   items.push({chapter,exhibit,stand,base,marker,label:labels.querySelector(`[data-chapter="${chapter.id}"]`)});
  });
  const ground=new T.Mesh(new T.PlaneGeometry(60,60),new T.ShadowMaterial({opacity:.075}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
 }
 function render(){
  if(!renderer)return;renderer.render(scene,camera);
  items.forEach(item=>{const p=item.marker.getWorldPosition(new T.Vector3()).project(camera);item.label.style.left=`${(p.x+1)*50}%`;item.label.style.top=`${(1-p.y)*50}%`;});
 }
 function resize(){
  if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  const mobile=innerWidth<=800,cols=mobile?2:4,rows=Math.ceil(items.length/cols);
  items.forEach((item,i)=>{item.stand.position.set((i%cols-(cols-1)/2)*4.8,0,(Math.floor(i/cols)-(rows-1)/2)*(mobile?10.5:9.6));});
  const aspect=w/h,height=Math.max(mobile?27:12.5,(mobile?10.6:21.6)/aspect);
  camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;
  camera.position.set(mobile?0:3,21,28);camera.lookAt(0,.3,.7);camera.updateProjectionMatrix();renderer.setSize(w,h,false);render();
 }
 function focus(id){
  hovered=id;
  items.forEach(item=>{const active=item.chapter.id===id;item.base.material.color.setHex(active?0xcde3ff:0xf5f8fa);item.label.classList.toggle('is-focused',active);});
  const c=chapters.find(c=>c.id===id);
  document.getElementById('exhibit-detail').textContent=c?`${String(c.id).padStart(2,'0')} ${c.title} · ${c.description}`:'点击展台、模型或章节铭牌，进入对应章节封面。';
  render();
 }
 labels.querySelectorAll('a').forEach(a=>{a.addEventListener('mouseenter',()=>focus(Number(a.dataset.chapter)));a.addEventListener('focus',()=>focus(Number(a.dataset.chapter)));a.addEventListener('mouseleave',()=>focus(null));a.addEventListener('blur',()=>focus(null));});
 if(renderer){
  const ray=new T.Raycaster(),pointer=new T.Vector2(),canvas=renderer.domElement;let down=null;
  function hit(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);let node=ray.intersectObjects(items.map(i=>i.stand),true)[0]?.object;while(node&&!node.userData.chapter)node=node.parent;if(node)return node.userData.chapter;
   /* Missed every mesh: treat each exhibit card (stand + model projected to screen, joined with its label) as one target. */
   let best=null,bestD=Infinity;for(const item of items){const n=item.label.getBoundingClientRect();if(e.clientX<n.left-12||e.clientX>n.right+12||e.clientY<n.top-12||e.clientY>n.bottom+12)continue;const d=Math.hypot(e.clientX-(n.left+n.right)/2,e.clientY-(n.top+n.bottom)/2);if(d<bestD){bestD=d;best=item.chapter.id;}}if(best)return best;
   for(const item of items){const b=new T.Box3().setFromObject(item.stand);let L=Infinity,Tp=Infinity,R=-Infinity,B=-Infinity;for(let k=0;k<8;k++){const q=new T.Vector3(k&1?b.max.x:b.min.x,k&2?b.max.y:b.min.y,k&4?b.max.z:b.min.z).project(camera);const x=r.left+(q.x+1)*r.width/2,y=r.top+(1-q.y)*r.height/2;L=Math.min(L,x);R=Math.max(R,x);Tp=Math.min(Tp,y);B=Math.max(B,y);}
    const n=item.label.getBoundingClientRect();L=Math.min(L,n.left);R=Math.max(R,n.right);Tp=Math.min(Tp,n.top);B=Math.max(B,n.bottom);if(e.clientX<L-12||e.clientX>R+12||e.clientY<Tp-12||e.clientY>B+12)continue;const d=Math.hypot(e.clientX-(L+R)/2,e.clientY-(Tp+B)/2);if(d<bestD){bestD=d;best=item.chapter.id;}}return best;}
  canvas.addEventListener('pointermove',e=>{if(e.buttons)return;const id=hit(e);canvas.style.cursor=id?'pointer':'default';if(id!==hovered)focus(id);});
  canvas.addEventListener('pointerleave',()=>focus(null));canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){const id=hit(e);if(id)location.href=courseHref(chapters.find(c=>c.id===id).entry);}down=null;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});
 }
 function animate(now){frame=requestAnimationFrame(animate);const dt=Math.min((now-(last||now))/1000,.05);last=now;if(paused||document.hidden||!renderer)return;time+=dt;items.forEach(item=>item.exhibit.pose(time));render();}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();frame=requestAnimationFrame(animate);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.CourseHome?.pause();});
 addEventListener('pagehide',()=>cancelAnimationFrame(frame));addEventListener('pageshow',e=>{if(e.persisted){last=0;frame=requestAnimationFrame(animate);resize();}});
 window.CourseScene={pause(value){paused=value||!renderer;},reset(){paused=true;time=0;items.forEach(i=>i.exhibit.pose(0));render();},focus,render,
  getState(){return {models:items.length,paused,time,webgl:!!renderer,actions:descriptions,
   targets:items.map(i=>{const p=i.stand.localToWorld(new T.Vector3(0,1,0)).project(camera);const r=host.getBoundingClientRect();return {id:i.chapter.id,x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};})};}};
})();
