// 任务 8-1 安全操作：独立三维页面。page.html + model/scene/app 内联生成 index.html，再套统一任务页外壳（stations.js）。
import {readFileSync, writeFileSync} from 'node:fs';
import {labShell} from '../../../../../../shared/lab-shell/native-layout.mjs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const values = {CSS: read('./style.css'), MODEL: safe(read('./model.js')), SCENE: safe(read('./scene.js')), APP: safe(read('./app.js'))};
let html = read('./page.html').replace(/\{\{(CSS|MODEL|SCENE|APP)\}\}/g, (_, k) => values[k]);
html = labShell(html, '8-1');
writeFileSync(new URL('../index.html', import.meta.url), html);
console.log('Built task 8-1 index.html', Math.round(Buffer.byteLength(html) / 1024) + ' KB');
