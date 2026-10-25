"""Bake licensed MJCF geometry + forward-kinematic demonstration clips into GLB.
No dynamics, trained policy, or claim of physically validated motion is included.
"""
import json, pathlib, shutil, struct, math
import numpy as np
import mujoco, trimesh

ROOT=pathlib.Path(__file__).resolve().parents[1]; SRC=ROOT/'model-source'; OUT=ROOT/'web'
MODELS=[('ur5e','universal_robots_ur5e','ur5e.xml'),('panda','franka_emika_panda','panda.xml'),('go2','unitree_go2','go2.xml'),('g1','unitree_g1','g1.xml'),('stretch','hello_robot_stretch_3','stretch.xml'),('aloha','aloha','aloha.xml'),('leap','leap_hand','right_hand.xml'),('crazyflie','bitcraze_crazyflie_2','cf2.xml'),('spot','boston_dynamics_spot','spot.xml'),('iiwa','kuka_iiwa_14','iiwa14.xml'),('cassie','agility_cassie','cassie.xml'),('op3','robotis_op3','op3.xml'),('so101','robotstudio_so101','so101.xml'),('anymal','anybotics_anymal_c','scene.xml'),('gen3','kinova_gen3','gen3.xml'),('shadow','shadow_hand','right_hand.xml')]
N=121; DURATION=6.; TIMES=np.linspace(0,DURATION,N,dtype=np.float32)
names=lambda m,kind,n:[mujoco.mj_id2name(m,kind,i) or '' for i in range(n)]

def make_mesh(m,i):
    gt=m.geom_type[i]
    if gt==mujoco.mjtGeom.mjGEOM_MESH:
        k=m.geom_dataid[i];v=m.mesh_vertadr[k];n=m.mesh_vertnum[k];f=m.mesh_faceadr[k];nf=m.mesh_facenum[k]
        mesh=trimesh.Trimesh(m.mesh_vert[v:v+n].copy(),m.mesh_face[f:f+nf].copy(),process=False)
    elif gt==mujoco.mjtGeom.mjGEOM_BOX:mesh=trimesh.creation.box(extents=m.geom_size[i]*2)
    elif gt==mujoco.mjtGeom.mjGEOM_CYLINDER:mesh=trimesh.creation.cylinder(radius=m.geom_size[i,0],height=m.geom_size[i,1]*2,sections=32)
    elif gt==mujoco.mjtGeom.mjGEOM_SPHERE:mesh=trimesh.creation.icosphere(subdivisions=2,radius=m.geom_size[i,0])
    elif gt==mujoco.mjtGeom.mjGEOM_CAPSULE:mesh=trimesh.creation.capsule(radius=m.geom_size[i,0],height=m.geom_size[i,1]*2,count=[16,16])
    else:return None
    color=m.mat_rgba[m.geom_matid[i]] if m.geom_matid[i]>=0 else m.geom_rgba[i]
    mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(baseColorFactor=np.round(color*255).astype(np.uint8),metallicFactor=.12,roughnessFactor=.48,doubleSided=True))
    return mesh

def transform(d,i):
    t=np.eye(4);t[:3,:3]=d.geom_xmat[i].reshape(3,3);t[:3,3]=d.geom_xpos[i];return t

def bake_poses(m,d,slug,home):
    jnames=names(m,mujoco.mjtObj.mjOBJ_JOINT,m.njnt)
    hinges=[j for j in range(m.njnt) if m.jnt_type[j] in (mujoco.mjtJoint.mjJNT_HINGE,mujoco.mjtJoint.mjJNT_SLIDE)]
    def setj(name,value,relative=False):
        if name not in jnames:return
        j=jnames.index(name);a=m.jnt_qposadr[j];v=home[a]+value if relative else value
        if m.jnt_limited[j]:v=np.clip(v,*m.jnt_range[j])
        d.qpos[a]=v
    quadruped=slug in ('go2','spot','anymal')
    if quadruped:
        mujoco.mj_forward(m,d)
        feet=[i for i in range(m.ngeom) if m.geom_type[i]==mujoco.mjtGeom.mjGEOM_SPHERE and ('calf' in (mujoco.mj_id2name(m,mujoco.mjtObj.mjOBJ_BODY,m.geom_bodyid[i]) or '').lower() or 'lleg' in (mujoco.mj_id2name(m,mujoco.mjtObj.mjOBJ_BODY,m.geom_bodyid[i]) or '').lower() or 'SHANK' in (mujoco.mj_id2name(m,mujoco.mjtObj.mjOBJ_BODY,m.geom_bodyid[i]) or ''))]
        assert len(feet)==4,(slug,feet)
        targets0=d.geom_xpos[feet].copy();legj=[]
        for foot in feet:
            b=int(m.geom_bodyid[foot]);js=[]
            while b:
                js += [j for j in hinges if m.jnt_bodyid[j]==b];b=int(m.body_parentid[b])
            legj.append(js)
        def solve(targets):
            jac=np.zeros((3,m.nv));jacr=np.zeros((3,m.nv))
            for foot,target,js in zip(feet,targets,legj):
                cols=[m.jnt_dofadr[j] for j in js];adr=[m.jnt_qposadr[j] for j in js]
                for _ in range(18):
                    mujoco.mj_forward(m,d);err=target-d.geom_xpos[foot]
                    if np.linalg.norm(err)<1e-5:break
                    mujoco.mj_jacGeom(m,d,jac,jacr,foot);J=jac[:,cols]
                    dq=J.T@np.linalg.solve(J@J.T+np.eye(3)*1e-5,err)
                    d.qpos[adr]+=np.clip(dq,-.2,.2)
                    for j in js:
                        if m.jnt_limited[j]:d.qpos[m.jnt_qposadr[j]]=np.clip(d.qpos[m.jnt_qposadr[j]],*m.jnt_range[j])
    clipnames=['原地步态示意','屈腿起伏'] if quadruped else ['协同关节活动','逐关节巡游']
    if slug in ('leap','shadow'):clipnames=['手指开合','手指依次活动']
    if slug in ('g1','op3'):clipnames=['挥手示意','上肢关节活动']
    if slug=='cassie':clipnames=['髋部转向','整体平衡示意']
    if slug=='stretch':clipnames=['升降与伸缩','腕部与夹爪']
    if slug=='crazyflie':clipnames=['悬停起伏示意','机身姿态示意']
    clips=[]
    for ci,clipname in enumerate(clipnames):
        frames=[];qp=[]
        for u in np.linspace(0,1,N):
            d.qpos[:]=home;wave=(1-np.cos(2*np.pi*u))/2
            if quadruped:
                target=targets0.copy()
                if ci==0:
                    for k in range(4):
                        ph=2*np.pi*(2*u+([0,.5,.5,0][k]))
                        target[k,0]+=(.055 if slug=='go2' else .075)*np.sin(ph)
                        target[k,2]+=(.045 if slug=='go2' else .06)*max(0,np.cos(ph))**2
                else:
                    # Keep the feet fixed while lowering the floating base.
                    d.qpos[2]-=(.05 if slug=='go2' else .07)*wave
                solve(target)
            elif slug in ('g1','op3'):
                if slug=='g1':
                    setj('right_shoulder_roll_joint',-.75*wave,True);setj('right_shoulder_pitch_joint',-.6*wave,True);setj('right_elbow_joint',.65*wave,True);setj('right_wrist_yaw_joint',.35*np.sin(6*np.pi*u)*wave,True)
                    if ci:setj('left_elbow_joint',.55*wave,True);setj('waist_yaw_joint',.18*np.sin(2*np.pi*u),True)
                else:
                    setj('r_sho_roll',-.8*wave,True);setj('r_el',-.8*wave,True);setj('r_sho_pitch',.3*np.sin(4*np.pi*u)*wave,True);setj('head_pan',.2*np.sin(2*np.pi*u),True)
                    if ci:setj('l_sho_roll',.6*wave,True);setj('l_el',.5*wave,True)
            elif slug=='cassie':
                if ci==0:
                    setj('left-hip-yaw',.17*np.sin(2*np.pi*u),True);setj('right-hip-yaw',-.17*np.sin(2*np.pi*u),True)
                else:
                    angle=.07*np.sin(2*np.pi*u);d.qpos[3:7]=[np.cos(angle/2),np.sin(angle/2),0,0]
            elif slug=='stretch':
                if ci==0:
                    setj('joint_lift',.55*wave)
                    for name in jnames:
                        if name.startswith('joint_arm_l'):setj(name,.10*wave)
                    setj('joint_head_pan',.35*np.sin(2*np.pi*u))
                else:
                    setj('joint_lift',.3);setj('joint_wrist_yaw',.6*np.sin(2*np.pi*u));setj('joint_wrist_pitch',-.5*wave);setj('joint_gripper_slide',.035*wave)
                    setj('joint_gripper_finger_left_open',.3*wave);setj('joint_gripper_finger_right_open',.3*wave)
            elif slug in ('leap','shadow'):
                for k,j in enumerate(hinges):
                    name=jnames[j]
                    groups=['if','mf','rf','th'] if slug=='leap' else ['FF','MF','RF','LF','TH','WR']
                    group=next((z for z,g in enumerate(groups) if g.lower() in name.lower()),0)
                    ft=u*len(groups)-group
                    w=wave if ci==0 else (np.sin(np.pi*ft)**2 if 0<=ft<=1 else 0)
                    if slug=='leap':v=.08*np.sin(2*np.pi*u) if 'rot' in name else .85*w
                    else:v=.08*np.sin(2*np.pi*u) if name.endswith(('J4','J5','J0')) else .65*w
                    setj(name,v,True)
            elif slug=='crazyflie':
                d.qpos[2]+=.025*wave
                angle=.18*np.sin(2*np.pi*u) if ci else .04*np.sin(4*np.pi*u)
                d.qpos[3:7]=[np.cos(angle/2),np.sin(angle/2),0,0]
            else:
                candidates=[j for j in hinges if not any(s in jnames[j].lower() for s in ('finger','gripper'))]
                for k,j in enumerate(candidates):
                    name=jnames[j];a=m.jnt_qposadr[j];amp=.28 if m.jnt_type[j]==mujoco.mjtJoint.mjJNT_HINGE else .035
                    if ci:
                        # One active joint at a time, each returns to its start pose.
                        t=u*len(candidates)-k
                        delta=amp*np.sin(np.pi*t)**2 if 0<=t<=1 else 0
                    else:delta=amp*np.sin(2*np.pi*u*(1+k%2))
                    if m.jnt_limited[j]:
                        lo,hi=m.jnt_range[j]
                        if home[a]-amp<lo or home[a]+amp>hi:delta=(1 if hi-home[a]>=home[a]-lo else -1)*abs(delta)
                    setj(name,delta,True)
                for j in hinges:
                    name=jnames[j]
                    if any(s in name.lower() for s in ('finger','gripper')) and m.jnt_type[j]==mujoco.mjtJoint.mjJNT_SLIDE:setj(name,.018*wave,True)
            mujoco.mj_forward(m,d)
            frames.append((d.geom_xpos.copy(),d.geom_xmat.copy()));qp.append(d.qpos.copy())
        clips.append((clipname,frames,np.array(qp)))
    d.qpos[:]=home;mujoco.mj_forward(m,d)
    rest=(d.geom_xpos.copy(),d.geom_xmat.copy())
    clips.append(('初始姿态',[rest,rest],np.array([home,home])))
    return clips

def add_animations(blob,clips,ids,C,initial):
    size=struct.unpack_from('<I',blob,12)[0];g=json.loads(blob[20:20+size]);off=20+size;binlen=struct.unpack_from('<I',blob,off)[0];binary=bytearray(blob[off+8:off+8+binlen]);g.setdefault('bufferViews',[]);g.setdefault('accessors',[]);g['animations']=[]
    def acc(array,typ):
        a=np.asarray(array,dtype='<f4');binary.extend(b'\0'*((-len(binary))%4));offset=len(binary);binary.extend(a.tobytes());vi=len(g['bufferViews']);g['bufferViews'].append(dict(buffer=0,byteOffset=offset,byteLength=a.nbytes));idx=len(g['accessors']);entry=dict(bufferView=vi,componentType=5126,count=len(a),type=typ)
        if typ=='SCALAR':entry.update(min=[float(a.min())],max=[float(a.max())])
        g['accessors'].append(entry);return idx
    ti=acc(TIMES,'SCALAR')
    for node in g['nodes']:
        if not node.get('name','').startswith('geom_'):continue
        i=int(node['name'][5:]);M=C@initial[i];q=np.empty(4);mujoco.mju_mat2Quat(q,np.ascontiguousarray(M[:3,:3]).flatten());node.pop('matrix',None);node['translation']=M[:3,3].tolist();node['rotation']=q[[1,2,3,0]].tolist()
    for name,frames,qp in clips:
        animation=dict(name=name,samplers=[],channels=[])
        input_time=ti if len(frames)==N else acc([0,DURATION],'SCALAR')
        for ni,node in enumerate(g['nodes']):
            if not node.get('name','').startswith('geom_'):continue
            i=int(node['name'][5:]);translations=[];rotations=[]
            for pos,mat in frames:
                translations.append((C[:3,:3]@pos[i])+C[:3,3]);q=np.empty(4);rot=C[:3,:3]@mat[i].reshape(3,3);mujoco.mju_mat2Quat(q,np.ascontiguousarray(rot).flatten());q=q[[1,2,3,0]]
                if rotations and np.dot(q,rotations[-1])<0:q=-q
                rotations.append(q.copy())
            for path,values,typ in [('translation',translations,'VEC3'),('rotation',rotations,'VEC4')]:
                v=np.asarray(values)
                if np.max(np.abs(v-v[0]))<1e-7 and name!='初始姿态':continue
                ai=acc(v,typ);si=len(animation['samplers']);animation['samplers'].append(dict(input=input_time,output=ai,interpolation='LINEAR'));animation['channels'].append(dict(sampler=si,target=dict(node=ni,path=path)))
        assert animation['channels'],name
        g['animations'].append(animation)
    g['buffers'][0]['byteLength']=len(binary);binary.extend(b'\0'*((-len(binary))%4));j=json.dumps(g,separators=(',',':'),ensure_ascii=True).encode();j+=b' '*((-len(j))%4)
    return struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(binary),0x004E4942)+binary

results=[]
for slug,folder,xml in MODELS:
    m=mujoco.MjModel.from_xml_path(str(SRC/folder/xml));d=mujoco.MjData(m)
    if m.nkey:mujoco.mj_resetDataKeyframe(m,d,0)
    mujoco.mj_forward(m,d);home=d.qpos.copy();initial={i:transform(d,i) for i in range(m.ngeom)}
    C=trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0])
    if slug=='leap':C=np.eye(4)
    scene=trimesh.Scene();has_visual=bool(np.any(m.geom_group==2));ids=[];meshes={}
    for i in range(m.ngeom):
        if (has_visual and m.geom_group[i]!=2) or m.geom_rgba[i,3]==0:continue
        mesh=make_mesh(m,i)
        if mesh is not None:meshes[i]=mesh;ids.append(i);scene.add_geometry(mesh,node_name=f'geom_{i}',transform=C@initial[i])
    bounds=scene.bounds;offset=np.array([-(bounds[0,0]+bounds[1,0])/2,-bounds[0,1],-(bounds[0,2]+bounds[1,2])/2]);C[:3,3]+=offset
    scene=trimesh.Scene()
    for i,mesh in meshes.items():scene.add_geometry(mesh,node_name=f'geom_{i}',transform=C@initial[i])
    clips=bake_poses(m,d,slug,home);blob=add_animations(scene.export(file_type='glb'),clips,ids,C,initial)
    target=OUT/'models'/f'{slug}.glb';target.write_bytes(blob);shutil.copyfile(SRC/folder/'LICENSE',OUT/'licenses'/f'{slug}.txt')
    pngs=list((SRC/folder).glob('*.png'))
    if pngs:shutil.copyfile(pngs[0],OUT/'images'/f'{slug}.png')
    # Numeric evidence that joint configurations actually change across the clip.
    motions=[dict(name=n,seconds=DURATION,frames=len(fr),max_qpos_delta=float(np.max(np.abs(q-q[0])))) for n,fr,q in clips]
    item=dict(id=slug,folder=folder,bytes=len(blob),triangles=sum(len(x.faces) for x in meshes.values()),animations=motions,method='Forward kinematics; hand-authored demonstration; not a physics simulation')
    results.append(item);print(json.dumps(item,ensure_ascii=True),flush=True)
(OUT/'models/manifest.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
