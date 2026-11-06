(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const copy = {
    '2-1': {tag:'POWER SOURCE',note:'看电机和柴油机怎样让轴转起来。',label:'认识动力装置'},
    '2-2': {tag:'TRANSMISSION',note:'齿轮、皮带、链条、液压与气压：传过去以后，变了多少？',label:'传递与变换'},
    '2-3': {tag:'MECHANISM & ACTION',note:'伸缩变转动、转动变直线：动力变成施工动作。',label:'工作机构'},
  };
  const tasks = window.ChapterTasks.map(task=>({id:task.id,name:task.title,...copy[task.id],
    links:(task.demos||[{title:copy[task.id].label,file:task.demo}]).map(({title,file})=>[title,courseHref(file)])}));
  const exhibits = [
    {id:'motor',task:'2-1',title:'电流与磁场，让转子动起来。',description:'播放动作，分辨固定磁铁、转子和输出轴，了解机器人关节的动力从哪里来。',link:tasks[0].links[0]},
    {id:'diesel',task:'2-1',title:'四个冲程，接续输出动力。',description:'对比单缸和四缸，观察活塞怎样通过连杆带动曲轴。',link:tasks[0].links[1]},
    {id:'transmission',task:'2-2',title:'输入改变，输出怎样响应？',description:'换齿轮、皮带、链条，再比比液压缸和气缸：传过去以后，快慢、方向和力气变了多少？',link:tasks[1].links[0]},
    {id:'mechanisms',task:'2-3',title:'把动力，变成施工需要的动作。',description:'液压缸一伸一缩，动臂和连杆就转；丝杠一圈圈转，滑台就直走。',link:tasks[2].links[0]}
  ];
  let selected=null,timer=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('task-cards').innerHTML=tasks.map(t=>`<article class="task-card" data-task="${t.id}"><div class="task-top"><span>任务 ${t.id}</span><small>${t.tag}</small></div><button class="task-select">${t.name}</button><p>${t.note}</p><div class="task-links">${t.links.map(([name,url])=>`<a href="${url}">${name} <span>↗</span></a>`).join('')}</div></article>`).join('');
  function select(id){
    const e=exhibits.find(e=>e.id===id);selected=e?.id||null;
    document.querySelectorAll('.task-card').forEach(c=>c.classList.toggle('selected',c.dataset.task===e?.task));
    window.CourseScene?.focus(selected);
    $('story-label').textContent=e?`任务 ${e.task} / ${tasks.find(t=>t.id===e.task).tag}`:'三项任务 · 一条动力链';
    $('story-title').textContent=e?.title||'看见动力，理解动作。';
    $('story-description').textContent=e?.description||'观察电机、柴油机与传动机构，亲手改变条件，追踪动力如何变成转动和升降。';
    const [label,url]=e?.link||['从动力源开始探索',tasks[0].links[0][1]];
    $('story-actions').innerHTML=`<a class="entry-primary" href="${url}">${e?'进入'+label:label} <span>↗</span></a><button id="overview" class="entry-secondary">全部展品</button>`;
    $('overview').onclick=()=>{stopTour();select(null);window.CourseScene?.resetView();};
  }
  function stopTour(){if(timer)clearInterval(timer);timer=null;$('tour').setAttribute('aria-pressed','false');$('tour').textContent='▷ 逐站巡展';}
  window.CourseUI={model(id){stopTour();select(id);},preview(id){if(!timer)select(id);}};
  document.querySelectorAll('.task-select').forEach(b=>b.onclick=()=>{stopTour();select(exhibits.find(e=>e.task===b.closest('[data-task]').dataset.task).id);});
  $('tour').onclick=()=>{if(timer){stopTour();return;}let i=Math.max(0,exhibits.findIndex(e=>e.id===selected));select(exhibits[i].id);$('tour').setAttribute('aria-pressed','true');$('tour').textContent='■ 停止巡展';timer=setInterval(()=>{i=(i+1)%exhibits.length;select(exhibits[i].id);},4500);};
  $('reset-view').onclick=()=>window.CourseScene?.resetView();
  function motion(){window.CourseScene?.pause(paused);$('motion').setAttribute('aria-pressed',String(paused));$('motion').textContent=paused?'▷ 播放模型':'Ⅱ 暂停模型';}
  $('motion').onclick=()=>{paused=!paused;motion();};
  $('show-guide').onclick=()=>$('entry-guide').showModal();$('close-guide').onclick=()=>$('entry-guide').close();
  $('entry-full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});};
  function fit(){$('entry-screen').style.transform=`translate(-50%,-50%) scale(${Math.min(innerWidth/1600,innerHeight/900)})`;}
  addEventListener('resize',fit);addEventListener('pagehide',stopTour);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTour();});
  fit();window.CourseScene?.show(2);motion();select(null);
  /* Clicking an exhibit or anywhere on a task card enters that task; hover / focus only previews it. */
  const exhibitUrl=id=>exhibits.find(e=>e.id===id)?.link[1],previewOf=task=>exhibits.find(e=>e.task===task)?.id;
  window.CourseUI.model=id=>{const url=exhibitUrl(id);if(!url)return;stopTour();location.href=url;};
  document.querySelectorAll('.task-card').forEach(card=>{const b=card.querySelector('.task-select');b.onclick=null;card.style.cursor='pointer';
    card.addEventListener('click',e=>{if(e.target.closest('a'))return;const a=card.querySelector('.task-links a');if(a){stopTour();location.href=a.href;}});
    const show=()=>window.CourseUI.preview(previewOf(card.dataset.task));card.addEventListener('mouseenter',show);b.addEventListener('focus',show);});
  window.ChapterEntry={select,stopTour,state:()=>({selected,touring:!!timer,paused,models:window.CourseScene?.getState()})};
})();
