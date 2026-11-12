"""把打包好的网站（artifacts/site）同步到线上（Sealos）。

线上站点是 Sealos 上的一个 nginx，转发到对象存储桶；更新网站 = 把文件传进这个桶。
本脚本只用 Python 标准库：读 kubeconfig → 向 Kubernetes 接口取对象存储的访问密钥 →
用 S3 签名（SigV4）上传。只传有变化的文件（本地 MD5 与远端 ETag 比较），跳过视频。
令牌和密钥只在内存里使用，不打印、不写盘。

用法（一般经由 npm run deploy 调用，先打包再同步）：
  python3 scripts/deploy-sealos.py            同步
  python3 scripts/deploy-sealos.py --dry-run  只列出要上传的文件
kubeconfig 位置：环境变量 SEALOS_KUBECONFIG，默认 ~/Desktop/kubeconfig（Sealos 控制台下载，放在仓库外，不要提交）。
桶名可用 SEALOS_BUCKET 指定；不指定时取命名空间里名字含 course-site 的桶（只有一个桶时直接用它）。
"""
import base64, datetime, hashlib, hmac, json, mimetypes, os, re, ssl, sys, tempfile
import urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'artifacts' / 'site'
SKIP_EXT = {'.mp4', '.mov', '.webm', '.m4v'}  # 宣传片不放国内线路
REGION = 'us-east-1'
TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
    '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.wasm': 'application/wasm',
    '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.zip': 'application/zip', '.pdf': 'application/pdf',
}


def fail(msg):
    print('Sealos 同步失败：' + msg, file=sys.stderr)
    sys.exit(1)


# —— Kubernetes 接口 ——
cfg_path = Path(os.environ.get('SEALOS_KUBECONFIG', '~/Desktop/kubeconfig')).expanduser()
if not cfg_path.exists():
    fail(f'找不到 kubeconfig：{cfg_path}。从 Sealos 控制台下载后放到这里，或用 SEALOS_KUBECONFIG 指定路径。')
cfg = cfg_path.read_text(encoding='utf-8')
def field(name):
    m = re.search(rf'^\s*{name}:\s*(\S+)', cfg, re.M)
    if not m: fail(f'kubeconfig 里没有 {name}')
    return m.group(1).strip('"\'')
server, token, namespace = field('server'), field('token'), field('namespace')
ca_file = tempfile.NamedTemporaryFile(delete=False, suffix='.crt')
ca_file.write(base64.b64decode(field('certificate-authority-data'))); ca_file.close()
k8s_ctx = ssl.create_default_context(cafile=ca_file.name)

def k8s(path):
    req = urllib.request.Request(server + path.replace('{ns}', namespace), headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, context=k8s_ctx, timeout=60) as r: return json.loads(r.read())
    except urllib.error.HTTPError as e:
        fail(f'Kubernetes 接口返回 {e.code}（{path}）。kubeconfig 可能已过期，请重新下载。')
    except urllib.error.URLError as e:
        fail(f'连不上 Sealos：{e.reason}')

try:
    users = k8s('/apis/objectstorage.sealos.io/v1/namespaces/{ns}/objectstorageusers')['items']
    buckets = k8s('/apis/objectstorage.sealos.io/v1/namespaces/{ns}/objectstoragebuckets')['items']
finally:
    os.unlink(ca_file.name)
if not users: fail('这个命名空间还没有开通对象存储。')
status = users[0].get('status', {})
AK, SK, HOST = status.get('accessKey'), status.get('secretKey'), status.get('external')
if not (AK and SK and HOST): fail('对象存储用户还没有就绪（缺少访问密钥）。')
names = [b.get('status', {}).get('name') for b in buckets if b.get('status', {}).get('name')]
BUCKET = os.environ.get('SEALOS_BUCKET') or next((n for n in names if 'course-site' in n), names[0] if len(names) == 1 else None)
if not BUCKET: fail(f'找不到网站用的桶，请用 SEALOS_BUCKET 指定（现有：{names}）。')


# —— S3（SigV4 签名） ——
s3_ctx = ssl.create_default_context()
def s3(method, key='', query='', body=b'', extra=None):
    now = datetime.datetime.now(datetime.timezone.utc)
    amz, day = now.strftime('%Y%m%dT%H%M%SZ'), now.strftime('%Y%m%d')
    path = '/' + BUCKET + '/' + urllib.parse.quote(key, safe='/~')
    payload = hashlib.sha256(body).hexdigest()
    hdr = {'host': HOST, 'x-amz-content-sha256': payload, 'x-amz-date': amz, **{k.lower(): v for k, v in (extra or {}).items()}}
    names_ = sorted(hdr)
    canonical = '\n'.join([method, path, query, ''.join(f'{n}:{hdr[n].strip()}\n' for n in names_), ';'.join(names_), payload])
    scope = f'{day}/{REGION}/s3/aws4_request'
    to_sign = '\n'.join(['AWS4-HMAC-SHA256', amz, scope, hashlib.sha256(canonical.encode()).hexdigest()])
    k = ('AWS4' + SK).encode()
    for part in (day, REGION, 's3', 'aws4_request'): k = hmac.new(k, part.encode(), hashlib.sha256).digest()
    hdr['authorization'] = (f'AWS4-HMAC-SHA256 Credential={AK}/{scope}, SignedHeaders={";".join(names_)}, '
                            f'Signature={hmac.new(k, to_sign.encode(), hashlib.sha256).hexdigest()}')
    url = f'https://{HOST}{path}' + ('?' + query if query else '')
    req = urllib.request.Request(url, data=body if method == 'PUT' else None, method=method, headers={k: v for k, v in hdr.items() if k != 'host'})
    try:
        with urllib.request.urlopen(req, context=s3_ctx, timeout=120) as r: return r.read()
    except urllib.error.HTTPError as e:
        fail(f'对象存储返回 {e.code}（{method} {key or "列表"}）')

def remote_listing():
    out, token_ = {}, None
    while True:
        q = {'list-type': '2', 'max-keys': '1000', **({'continuation-token': token_} if token_ else {})}
        query = '&'.join(f'{urllib.parse.quote(a, safe="-_.~")}={urllib.parse.quote(b, safe="-_.~")}' for a, b in sorted(q.items()))
        x = ET.fromstring(s3('GET', '', query)); ns = {'s': x.tag.split('}')[0].strip('{')}
        for c in x.findall('s:Contents', ns): out[c.findtext('s:Key', namespaces=ns)] = c.findtext('s:ETag', namespaces=ns).strip('"')
        if x.findtext('s:IsTruncated', namespaces=ns) != 'true': return out
        token_ = x.findtext('s:NextContinuationToken', namespaces=ns)


# —— 同步 ——
if not (SITE / 'index.html').exists(): fail('artifacts/site 不存在，先运行 npm run package。')
local = {p.relative_to(SITE).as_posix(): p for p in sorted(SITE.rglob('*'))
         if p.is_file() and p.suffix.lower() not in SKIP_EXT and p.name != '.DS_Store'}
remote = remote_listing()
todo = [(k, p) for k, p in local.items() if remote.get(k) != hashlib.md5(p.read_bytes()).hexdigest()]
extra = sorted(k for k in remote if k not in local)
size = sum(p.stat().st_size for _, p in todo)
print(f'Sealos 桶 {BUCKET}：远端 {len(remote)} 个、本地 {len(local)} 个文件（不含视频），要上传 {len(todo)} 个（{size / 1e6:.1f} MB）')
if extra: print(f'  远端多出 {len(extra)} 个本地已没有的文件（保留不删）：' + '、'.join(extra[:8]) + (' …' if len(extra) > 8 else ''))
if '--dry-run' in sys.argv:
    for k, p in todo: print('  ', k)
    sys.exit(0)
for i, (key, p) in enumerate(todo, 1):
    ctype = TYPES.get(p.suffix.lower()) or mimetypes.guess_type(key)[0] or 'application/octet-stream'
    s3('PUT', key, '', p.read_bytes(), {'content-type': ctype, 'cache-control': 'no-cache'})
    if i % 20 == 0 or i == len(todo): print(f'  已上传 {i}/{len(todo)}')
print('Sealos 同步完成：https://xemxwwheozbw.sealosbja.site/course/home/index.html')
