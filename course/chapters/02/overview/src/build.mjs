import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const safe=s=>s.replace(/<\/script/gi,'<\\/script');
const tasks=JSON.parse(read('../../../../catalog.json')).tasks.filter(task=>task.scene===2);
let html=read('./page.html').replace('/*TASKS*/',safe(JSON.stringify(tasks.map(({id,title,demo,demos})=>({id,title,demo,demos})))));
for(const [key,value] of [['STYLE',read('../../../../../shared/styles/chapter-overview.css')+'\n'+read('./style.css')],['THREE',safe(read('../../../../../shared/vendor/three-r160.min.js'))],['SCENE',safe(read('./scene.js'))],['APP',safe(read('./app.js'))]])html=html.replace(`/*${key}*/`,()=>value);
writeFileSync(new URL('../index.html',import.meta.url),html);
console.log('Built second chapter entrance: chapter task catalog');
