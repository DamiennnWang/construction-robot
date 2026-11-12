// 打包网站，并发布到两条线路：
//   国外：Cloudflare Workers（配置见 wrangler.jsonc；首次使用前 npx wrangler login）
//   国内：Sealos 对象存储（scripts/deploy-sealos.py；需要仓库外的 kubeconfig，默认 ~/Desktop/kubeconfig）
// 用法：npm run deploy              两条线路都发
//       npm run deploy -- cf        只发 Cloudflare
//       npm run deploy -- sealos    只发 Sealos（不上传视频）
//       npm run deploy -- sealos --dry-run   只列出 Sealos 要上传的文件
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'artifacts/site');
const PROJECT = process.env.DEPLOY_PROJECT || 'construction-robotics';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const named = args.filter(a => !a.startsWith('--'));
const targets = named.length ? named : ['cf', 'sealos'];
const unknown = targets.filter(t => !['cf', 'sealos'].includes(t));
if (unknown.length) { console.error(`不认识的线路：${unknown.join('、')}（可选 cf、sealos）`); process.exit(1); }
const bin = (name) => path.join(ROOT, 'node_modules/.bin', name);
const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { cwd: ROOT, stdio: 'inherit', ...opts });
const quiet = (cmd, argv) => execFileSync(cmd, argv, { cwd: ROOT, encoding: 'utf8' }).trim();

const commit = quiet('git', ['rev-parse', '--short', 'HEAD']);
const message = quiet('git', ['log', '-1', '--format=%s']).slice(0, 300);
const dirty = quiet('git', ['status', '--porcelain']).length > 0;
console.log(`\n== 打包网站（提交 ${commit}${dirty ? '，有未提交改动' : ''}）`);
run('python3', ['scripts/package-site.py']);
if (!existsSync(path.join(SITE, 'index.html'))) throw new Error('打包失败：artifacts/site/index.html 不存在');

// 一条线路失败不影响另一条，最后统一报告
const failed = [];
if (targets.includes('cf') && !dryRun) {
  // Cloudflare 已把 Pages 并入 Workers：按 wrangler.jsonc 发布 artifacts/site 静态资源
  console.log('\n== 发布到 Cloudflare Workers（国外）');
  try { run(bin('wrangler'), ['deploy', '--name', PROJECT, '--message', `${commit} ${message}`.slice(0, 100)]); }
  catch { failed.push('Cloudflare'); }
}
if (targets.includes('sealos')) {
  console.log('\n== 同步到 Sealos（国内）');
  try { run('python3', ['scripts/deploy-sealos.py', ...(dryRun ? ['--dry-run'] : [])]); }
  catch { failed.push('Sealos'); }
}
if (failed.length) { console.error(`\n== 未完成：${failed.join('、')}（见上方报错）`); process.exit(1); }
console.log('\n== 完成');
