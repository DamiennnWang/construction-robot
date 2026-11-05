/* Shared chapter-one exhibition: fitted layout, learning guide and viewport fullscreen. */
(() => {
 'use strict';
 const W=Workshop,$=W.$,frame=document.createElement('div');
 frame.id='gallery-frame';
 document.body.classList.add('gallery-page');document.body.prepend(frame);
 frame.append(document.querySelector('.course-nav'),document.querySelector('.workshop'));
 frame.style.setProperty('--exhibit-count',W.config.items.length);
 const panel=frame.querySelector('.viewport-panel'),fullscreen=$('fullscreen');
 panel.id='exhibit-viewport';
 panel.querySelector('.view-buttons').append(fullscreen);
 fullscreen.classList.add('viewport-fullscreen');
 fullscreen.setAttribute('aria-controls',panel.id);
 fullscreen.setAttribute('aria-pressed','false');
 fullscreen.setAttribute('aria-label','全屏观察三维模型');
 let expanded=false,busy=false;
 const status=document.createElement('span');
 status.className='sr-only';status.setAttribute('role','status');panel.append(status);

 function fit(){
  const compact=innerWidth<800;
  document.body.classList.toggle('compact-gallery',compact);
  frame.style.setProperty('--gallery-scale',compact?1:Math.min(innerWidth/1600,innerHeight/900));
  frame.style.width=compact?'100%':'1600px';frame.style.height=compact?'100dvh':'900px';
  W.stage.resize();
 }
 function present(value,fallback=false){
  expanded=value;
  document.body.classList.toggle('viewport-expanded',value);
  document.body.classList.toggle('viewport-fallback',value&&fallback);
  panel.classList.toggle('is-expanded',value);
  for(const el of [frame.querySelector('.course-nav'),frame.querySelector('.heading'),$('tabs'),$('side'),frame.querySelector('.work-footer')])el.inert=value;
  fullscreen.innerHTML=value?'⛶ <span>恢复</span>':'⛶ <span>全屏</span>';
  fullscreen.setAttribute('aria-label',value?'恢复展厅布局':'全屏观察三维模型');
  fullscreen.setAttribute('aria-pressed',String(value));
  fullscreen.title=value?'恢复展厅布局（Esc）':'放大三维展示区';
  status.textContent=value?(fallback?'已放大展示区；点击恢复或按 Esc 返回。':'已进入全屏观察；点击恢复或按 Esc 返回。'):'已恢复展厅布局，保留当前动作与观察视角。';
  fit();
  requestAnimationFrame(()=>{W.stage.resize();fullscreen.focus({preventScroll:true});requestAnimationFrame(()=>{W.stage.preserveViewOnResize=expanded;});});
 }
 async function leave(){
  if(document.fullscreenElement===panel){
   try{await document.exitFullscreen();}catch{status.textContent='请按 Esc 退出浏览器全屏。';}
  }else present(false);
 }
 fullscreen.onclick=async()=>{
  if(busy)return;
  busy=true;
  try{
   if(expanded){await leave();return;}
   // Also covers native Escape / browser resize events before fullscreenchange.
   W.stage.preserveViewOnResize=true;
   if(panel.requestFullscreen&&document.fullscreenEnabled){
    try{await panel.requestFullscreen();if(!expanded)present(true);}
    catch{present(true,true);}
   }else present(true,true);
  }finally{busy=false;}
 };
 document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement===panel&&!expanded)present(true);
  else if(expanded&&document.fullscreenElement!==panel&&!document.body.classList.contains('viewport-fallback'))present(false);
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&expanded){e.preventDefault();e.stopImmediatePropagation();leave();}
 },true);

 const guide=W.config.learningGuide;
 if(guide){
  const button=document.createElement('button');button.id='learning-guide';button.textContent='学习引导';
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','learning-guide-dialog');
  $('help').before(button);
  const dialog=document.createElement('dialog');dialog.id='learning-guide-dialog';dialog.className='learning-guide-dialog';
  dialog.setAttribute('aria-labelledby','learning-guide-title');
  const esc=W.esc;
  dialog.innerHTML=`<div class="guide-heading"><div><p class="guide-kicker">${esc(W.config.id)} · 学习引导</p><h2 id="learning-guide-title">${esc(guide.title)}</h2></div><button id="learning-guide-close" aria-label="关闭学习引导" autofocus>关闭</button></div><p class="guide-intro">${esc(guide.intro)}</p><section aria-labelledby="guide-goals-title"><h3 id="guide-goals-title">这一节学什么</h3><ul class="guide-goals">${guide.goals.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section aria-labelledby="guide-steps-title"><h3 id="guide-steps-title">在展厅里这样观察</h3><ol class="guide-steps">${guide.steps.map((x,i)=>`<li><span class="guide-number">0${i+1}</span><div><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></div></li>`).join('')}</ol></section><div class="guide-reflection"><h3>观察后，试着说清楚</h3><p>${esc(guide.reflection)}</p></div><div class="guide-footer"><span>${esc(guide.note)}</span><button id="learning-guide-start" class="primary">开始观察 ↗</button></div>`;
  document.body.append(dialog);
  let start=false;
  button.onclick=()=>{start=false;W.stage.running=false;W.stage.tour=false;W.stage.onPause?.();dialog.showModal();};
  $('learning-guide-close').onclick=()=>dialog.close();
  $('learning-guide-start').onclick=()=>{start=true;dialog.close();};
  dialog.addEventListener('close',()=>{(start?$('scene'):button).focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();}});
 }
 addEventListener('resize',fit);fit();
})();
