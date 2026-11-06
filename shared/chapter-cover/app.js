/* Chapter cover interactions; meshes and camera controls remain shared with lessons. */
(() => {
 'use strict';
 const C=window.WorkshopPage, $=id=>document.getElementById(id);
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const stage=new CourseStage($('stage'),{title:C.chapterTitle});
 const exhibits=C.items.map((item,i)=>{
  const model=CourseMachines.make(item.machine),stand=new THREE.Group();
  const bounds=new THREE.Box3().setFromObject(model.root),size=bounds.getSize(new THREE.Vector3());
  model.root.scale.setScalar(3.5/Math.max(size.x,size.y,size.z));
  model.root.position.y=.16;stand.position.x=(i-(C.items.length-1)/2)*4.6;stand.add(model.root);
  const base=new THREE.Mesh(new THREE.BoxGeometry(4.15,.2,3.6),new THREE.MeshStandardMaterial({color:0xf5f8fa}));stand.add(base);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.9,.03,.12),new THREE.MeshStandardMaterial({color:0x327fc0}));stripe.position.set(-1.1,.12,1.55);stand.add(stripe);
  stand.userData.partId=item.id;model.root.traverse(node=>{node.userData.partId=item.id;});
  const marker=new THREE.Object3D();marker.position.set(0,.12,1.9);stand.add(marker);
  return {item,model,stand,base,stripe,marker};
 });
 const root=new THREE.Group();exhibits.forEach(e=>root.add(e.stand));
 stage.set({root,parts:exhibits.map(e=>({id:e.item.id,label:e.item.id+' '+(e.item.exhibitLabel||(e.item.machine==='excavator'?'挖掘机 · 机械用途':'六轴机械臂 · 反馈与分工')),node:e.marker})),pose(t){if(C.motionEnabled!==false)exhibits.forEach(e=>e.model.pose(t));},dispose(){exhibits.forEach(e=>{e.model.dispose();for(const mesh of [e.base,e.stripe]){mesh.geometry.dispose();mesh.material.dispose();}});}});
 stage.ground.visible=false;
 let selected=null;
 $('task-cards').style.setProperty('--task-count',C.items.length);
 $('task-cards').innerHTML=C.items.map(item=>`<article class="task-card" data-task="${esc(item.id)}"><div class="task-top"><span>任务 ${esc(item.id)}</span><small>${esc(item.kind||'观察 · 操作 · 说明')}</small></div><button class="task-select" aria-pressed="false">${esc(item.title)}</button><p>${esc(item.description)}</p><div class="task-links"><a href="${courseHref(item.entry)}">${esc(item.entryLabel||'进入认知课堂')} <span>↗</span></a></div></article>`).join('');
 $('guide-content').innerHTML=C.summary;
 function motion(){
  if(C.motionEnabled===false){stage.running=false;$('motion').hidden=true;return;}
  $('motion').textContent=stage.running?'Ⅱ 暂停动作':'▷ 演示部件动作';
  $('motion').setAttribute('aria-pressed',String(stage.running));
 }
 function select(id){
  const item=C.items.find(item=>item.id===id);if(!item)return;
  selected=id;exhibits.forEach(e=>e.base.material.color.setHex(e.item.id===id?0xdcecff:0xf5f8fa));stage.dirty=true;
  stage.hotspots.forEach(p=>p.button.setAttribute('aria-pressed',String(p.id===id)));
  document.querySelectorAll('.task-card').forEach(card=>{
   const active=card.dataset.task===id;card.classList.toggle('selected',active);
   card.querySelector('button').setAttribute('aria-pressed',String(active));
  });
  $('story-label').textContent=`任务 ${item.id} / ${item.kind||'认知课堂'}`;
  $('story-title').textContent=item.title;
  $('story-description').textContent=item.description;
  $('story-actions').innerHTML=`<a class="entry-primary" href="${courseHref(item.entry)}">${esc(item.entryLabel||'进入认知课堂')} <span>↗</span></a>`;
  $('part-detail').textContent=C.motionDescription||'挖掘机：动臂、斗杆与铲斗联动；六轴机械臂：关节转动与夹爪开合。';
 }
 stage.onTick=()=>stage.model?.pose(stage.elapsed);
 const enter=id=>{const item=C.items.find(item=>item.id===id);if(item)location.href=courseHref(item.entry);};
 stage.onPart=part=>enter(part.id);
 /* Whole exhibit area is a link: mesh hit first, then each stand's projected screen box plus its hotspot label. */
 function exhibitAt(e){
  if(!stage.renderer||!stage.model)return null;const rect=stage.host.getBoundingClientRect();
  stage.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);stage.ray.setFromCamera(stage.pointer,stage.camera);
  let node=stage.ray.intersectObject(stage.model.root,true)[0]?.object;while(node&&!node.userData.partId)node=node.parent;if(node)return node.userData.partId;
  const pad=14*rect.width/(stage.host.clientWidth||rect.width);let best=null,bestDistance=Infinity;
  /* Labels win over overlapping model boxes, so the area around a label always enters its own task. */
  for(const p of stage.hotspots){if(p.button.hidden)continue;const q=p.button.getBoundingClientRect();if(e.clientX<q.left-pad||e.clientX>q.right+pad||e.clientY<q.top-pad||e.clientY>q.bottom+pad)continue;const d=Math.hypot(e.clientX-(q.left+q.right)/2,e.clientY-(q.top+q.bottom)/2);if(d<bestDistance){bestDistance=d;best=p.id;}}
  if(best)return best;
  exhibits.forEach(ex=>{
   const box=new THREE.Box3().setFromObject(ex.stand);let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;
   for(let k=0;k<8;k++){const p=new THREE.Vector3(k&1?box.max.x:box.min.x,k&2?box.max.y:box.min.y,k&4?box.max.z:box.min.z).project(stage.camera);const x=rect.left+(p.x+1)*rect.width/2,y=rect.top+(1-p.y)*rect.height/2;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   const label=stage.hotspots.find(p=>p.id===ex.item.id)?.button;if(label&&!label.hidden){const q=label.getBoundingClientRect();l=Math.min(l,q.left);r=Math.max(r,q.right);t=Math.min(t,q.top);b=Math.max(b,q.bottom);}
   if(e.clientX<l-pad||e.clientX>r+pad||e.clientY<t-pad||e.clientY>b+pad)return;
   const d=Math.hypot(e.clientX-(l+r)/2,e.clientY-(t+b)/2);if(d<bestDistance){bestDistance=d;best=ex.item.id;}
  });
  return best;
 }
 stage.pick=e=>{const id=exhibitAt(e);if(id)enter(id);};
 let hoverId=null;
 stage.host.addEventListener('pointermove',e=>{if(e.buttons||e.target.closest('button')){return;}const id=exhibitAt(e);stage.host.style.cursor=id?'pointer':'';if(id&&id!==hoverId)select(id);hoverId=id;});
 stage.host.addEventListener('pointerleave',()=>{stage.host.style.cursor='';hoverId=null;});
 document.querySelectorAll('.task-card').forEach(card=>{
  const id=card.dataset.task;card.style.cursor='pointer';
  card.addEventListener('click',e=>{if(e.target.closest('a'))return;enter(id);});
  card.addEventListener('mouseenter',()=>select(id));card.querySelector('.task-select').addEventListener('focus',()=>select(id));
 });
 $('motion').onclick=()=>{stage.running=!stage.running;motion();};
 function resetView(){stage.view('home');stage.distance*=innerWidth<=800?.9:(C.viewScale??.7);stage.orbit();}
 $('reset-view').onclick=resetView;
 $('reset-model').onclick=()=>{stage.running=false;stage.elapsed=0;stage.model.pose(0);resetView();motion();};
 $('stage').ondblclick=resetView;
 $('stage').addEventListener('keydown',e=>{if(e.key==='Home')resetView();});
 $('show-guide').onclick=()=>$('entry-guide').showModal();
 $('close-guide').onclick=()=>$('entry-guide').close();
 $('entry-full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
 CourseTheme.register(theme => { stage.scene.background.set(theme === 'dark' ? 0x142b42 : 0xeff6ff); stage.render(); });
 function fit(){
  const mobile=innerWidth<=800;
  $('entry-screen').style.transform=mobile?'none':`translate(-50%,-50%) scale(${Math.min(innerWidth/1600,innerHeight/900)})`;
  stage.resize();
 }
 addEventListener('resize',fit);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stage.running=false;motion();}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){stage.running=false;motion();}});
 select(C.items[0].id);motion();fit();resetView();
 window.ChapterEntry={select,state:()=>({selected,models:exhibits.length,machines:exhibits.map(e=>e.item.machine),visible:exhibits.map(e=>e.stand.visible),paused:!stage.running,time:stage.elapsed,az:stage.az,zoom:stage.zoom,fallback:!stage.renderer,resources:{...stage.stats}})};
})();
