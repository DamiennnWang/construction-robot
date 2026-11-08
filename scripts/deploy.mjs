// 打包网站并发布到 Cloudflare Workers（国外线路，配置见 wrangler.jsonc）。
// 用法：npm run deploy
// 首次使用前先登录一次：npx wrangler login
// 国内线路（Sealos）需手动更新，见 README「发布」一节。
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'artifacts/site');
const PROJECT = process.env.DEPLOY_PROJECT || 'construction-robotics';
const bin = (name) => path.join(ROOT, 'node_modules/.bin', name);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
const quiet = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }).trim();

const commit = quiet('git', ['rev-parse', '--short', 'HEAD']);
const message = quiet('git', ['log', '-1', '--format=%s']).slice(0, 300);
const dirty = quiet('git', ['status', '--porcelain']).length > 0;
console.log(`\n== 打包网站（提交 ${commit}${dirty ? '，有未提交改动' : ''}）`);
run('python3', ['scripts/package-site.py']);
if (!existsSync(path.join(SITE, 'index.html'))) throw new Error('打包失败：artifacts/site/index.html 不存在');

// Cloudflare 已把 Pages 并入 Workers：按 wrangler.jsonc 发布 artifacts/site 静态资源
console.log('\n== 发布到 Cloudflare Workers');
run(bin('wrangler'), ['deploy', '--name', PROJECT, '--message', `${commit} ${message}`.slice(0, 100)]);
console.log('\n== 完成');
