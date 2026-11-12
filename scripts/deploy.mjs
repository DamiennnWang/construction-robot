// 打包网站，同步到线上（Sealos 对象存储，见 scripts/deploy-sealos.py；需要仓库外的 kubeconfig，默认 ~/Desktop/kubeconfig）。
// 用法：npm run deploy              打包并同步（不上传视频）
//       npm run deploy -- --dry-run 打包后只列出要上传的文件
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'artifacts/site');
const dryRun = process.argv.slice(2).includes('--dry-run');
const run = (cmd, argv) => execFileSync(cmd, argv, { cwd: ROOT, stdio: 'inherit' });
const quiet = (cmd, argv) => execFileSync(cmd, argv, { cwd: ROOT, encoding: 'utf8' }).trim();

const commit = quiet('git', ['rev-parse', '--short', 'HEAD']);
const dirty = quiet('git', ['status', '--porcelain']).length > 0;
console.log(`\n== 打包网站（提交 ${commit}${dirty ? '，有未提交改动' : ''}）`);
run('python3', ['scripts/package-site.py']);
if (!existsSync(path.join(SITE, 'index.html'))) throw new Error('打包失败：artifacts/site/index.html 不存在');

console.log('\n== 同步到 Sealos');
run('python3', ['scripts/deploy-sealos.py', ...(dryRun ? ['--dry-run'] : [])]);
console.log('\n== 完成');
