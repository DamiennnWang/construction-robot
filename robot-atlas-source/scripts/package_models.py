import json,pathlib,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1];SITE=ROOT/'web';DEST=SITE/'downloads';DEST.mkdir(exist_ok=True)
manifest=json.loads((SITE/'models/manifest.json').read_text())
def add(z,m):
    ident=m['id'];base=ident+'/'
    z.write(SITE/'models'/f'{ident}.glb',base+ident+'.glb')
    z.write(SITE/'licenses'/f'{ident}.txt',base+'LICENSE.txt')
    text=f"Robot Atlas / {ident}\n\nSource: https://github.com/google-deepmind/mujoco_menagerie/tree/f3b6013629c7b94f8ee93fd977b161fa8350f9bc/{m['folder']}\n\nThis GLB contains original licensed geometry converted from MJCF, and added motion clips created using forward kinematics. Motion is an authored demonstration, not a physics simulation, validated controller, or evidence of real robot capability.\n\nAnimations: "+', '.join(a['name'] for a in m['animations'])+"\n\nPreserve LICENSE.txt and original copyright notices when redistributing. Robot hardware/firmware and trademarks may be subject to separate terms.\n"
    z.writestr(base+'SOURCE.txt',text.encode('utf-8'))
    z.writestr(base+'README-中文.txt',('模型内含两种演示动作及初始姿态，可在支持 glTF 动画的软件中打开。\n来源链接与转换说明见 SOURCE.txt；使用或分发前请阅读 LICENSE.txt。\n动作为人工编排的运动学示意，不是物理仿真或实际控制策略。\n').encode('utf-8'))
for m in manifest:
    with zipfile.ZipFile(DEST/f"{m['id']}-model.zip",'w',zipfile.ZIP_DEFLATED) as z:add(z,m)
groups={'arms':['ur5e','panda','aloha','iiwa','so101','gen3'],'legged':['go2','g1','spot','cassie','op3','anymal'],'special':['stretch','leap','shadow','crazyflie']}
for group,ids in groups.items():
    target=DEST/f'robot-atlas-{group}.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
        for m in manifest:
            if m['id'] in ids:add(z,m)
    assert target.stat().st_size<25*1024*1024,(group,'exceeds hosting file limit')
    print(group,round(target.stat().st_size/1024/1024,1),'MB',flush=True)
(ROOT/'artifacts').mkdir(exist_ok=True)
target=ROOT/'artifacts/robot-atlas-all-models.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for m in manifest:add(z,m)
print('all',round(target.stat().st_size/1024/1024,1),'MB')
