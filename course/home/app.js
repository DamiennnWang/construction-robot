(() => {
  'use strict';
  const $=id=>document.getElementById(id),data=window.COURSE;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapter=n=>data.chapters.find(c=>c.id===n),links=t=>t.entries||[];
  $('chapter-filter').insertAdjacentHTML('beforeend',data.chapters.map(c=>`<option value="${c.id}">第${c.id}章 · ${esc(c.title)}</option>`).join(''));
  const route=[
    ['从现场认识设备','用场景说明问题，认识机械、机器人与人的分工。',[1]],
    ['从动力走到运动','看动力如何产生与传递，再识读结构、关节和工具。',[2,3]],
    ['从观测走到识别','认识自身状态、环境扫描与图像中的目标和疑点。',[4]],
    ['进入具体施工作业','比较主体结构与装饰装修中的动作、反馈和质量复核。',[5,6]],
    ['把复核与维护接起来','巡检取证、数据复核，再识读安全操作与维护条件。',[7,8]]
  ];
  $('route-list').innerHTML=route.map(([title,text,ids])=>`<li><h3>${title}</h3><p>${text}</p><div>${ids.map(n=>`<a href="${esc(chapter(n).entry)}">0${n} ${esc(chapter(n).title)} ↗</a>`).join('')}</div></li>`).join('');
  $('route-open').onclick=()=>$('learning-route').showModal();$('route-close').onclick=()=>$('learning-route').close();
  function catalog(){
    const query=$('task-search').value.trim().toLowerCase(),filter=Number($('chapter-filter').value);
    let count=0,groups=0;
    $('catalog-content').innerHTML=data.chapters.map(c=>{
      if(filter&&c.id!==filter)return '';
      const tasks=c.tasks.filter(t=>(`${t.id} ${t.title} ${c.title} ${t.kind} 第${c.id}章`).toLowerCase().includes(query));
      if(!tasks.length)return '';count+=tasks.length;groups++;
      return `<section class="catalog-group" data-catalog-chapter="${c.id}"><h3><a href="${esc(c.entry)}">0${c.id} ${esc(c.title)} ↗</a><small>${tasks.length} 项任务</small></h3>${tasks.map(t=>`<article class="catalog-row" data-task="${t.id}"><span class="task-code">${t.id}</span><div class="task-info"><a class="task-title" href="${esc(links(t)[0].file)}">${esc(t.title)} ↗</a><small>${esc(t.kind)}</small>${links(t).length>1?`<div class="task-sub">${links(t).map(e=>`<a href="${esc(e.file)}">${esc(e.title)} ↗</a>`).join('')}</div>`:''}</div></article>`).join('')}</section>`;
    }).join('');
    $('catalog-count').textContent=`显示 ${count} 项任务 · ${groups} 个章节`;
    if(!count)$('catalog-content').innerHTML='<p class="empty-search">没有找到对应任务，请换一个关键词或章节。</p>';
  }
  function openCatalog(n=0){$('task-search').value='';$('chapter-filter').value=String(n);catalog();$('catalog').showModal();$('task-search').focus();}
  $('catalog-open').onclick=()=>openCatalog();$('catalog-close').onclick=()=>$('catalog').close();
  $('task-search').oninput=catalog;$('chapter-filter').onchange=catalog;
  for(const dialog of [$('catalog'),$('learning-route')])dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  function markChapter(){const match=location.hash.match(/^#chapter-([1-8])$/);if(match)window.CourseScene?.focus(Number(match[1]));}
  addEventListener('hashchange',markChapter);markChapter();
  let paused=true;
  function motion(){
    const available=CourseScene.getState().webgl;
    if(!available)return;
    const b=$('motion');b.setAttribute('aria-pressed',String(!paused));b.textContent=paused?'▷ 演示动作':'Ⅱ 暂停动作';
    $('motion-status').textContent=paused?'展品已暂停 · 点击模型直接选章':'动作演示中：举臂、关节、飞轮与扫描；安全展品静态陈列。';
    CourseScene.pause(paused);
  }
  $('motion').onclick=()=>{paused=!paused;motion();};
  $('reset-motion').onclick=()=>{CourseScene.reset();paused=true;motion();$('motion-status').textContent='动作已复位，展品已暂停。';};
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches){paused=true;motion();}});
  motion();
  window.CourseHome={state:()=>({chapters:data.chapters.length,tasks:data.chapters.reduce((sum,c)=>sum+c.tasks.length,0),paused,models:CourseScene.getState()}),openCatalog,pause(){paused=true;motion();}};
})();
