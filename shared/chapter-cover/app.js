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
 stage.onPart=part=>select(part.id);
 document.querySelectorAll('.task-select').forEach(button=>button.onclick=()=>select(button.closest('[data-task]').dataset.task));
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
