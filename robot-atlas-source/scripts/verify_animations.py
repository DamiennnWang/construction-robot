import json,pathlib,struct,zipfile
import numpy as np
p=pathlib.Path(__file__).resolve().parents[1]/'web';summary=[]
for f in (p/'models').glob('*.glb'):
    b=f.read_bytes();assert b[:4]==b'glTF';n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);binary=b[28+n:]
    def read(a):
        a=g['accessors'][a];v=g['bufferViews'][a['bufferView']];off=v.get('byteOffset',0)+a.get('byteOffset',0);count=a['count'];size={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]
        return np.frombuffer(binary,dtype='<f4',count=count*size,offset=off).reshape(count,size)
    assert len(g['animations'])==3,(f,'clip count')
    motions=[]
    for clip in g['animations']:
        moving=0
        for ch in clip['channels']:
            node=g['nodes'][ch['target']['node']];assert 'matrix' not in node,(f,'animated node matrix')
            s=clip['samplers'][ch['sampler']];t=read(s['input']);v=read(s['output']);assert len(t)==len(v)
            assert np.all(np.diff(t[:,0])>0) and np.isfinite(v).all()
            if ch['target']['path']=='rotation':assert np.max(np.abs(np.linalg.norm(v,axis=1)-1))<1e-4
            if np.max(np.abs(v-v[0]))>1e-5:moving+=1
            assert np.max(np.abs(v[-1]-v[0]))<.001,(f,clip['name'],'loop discontinuity')
        if clip['name']!='初始姿态':assert moving>0,(f,'static demo')
        motions.append(moving)
    ident=f.stem;assert (p/'licenses'/f'{ident}.txt').is_file();assert (p/'images'/f'{ident}.webp').is_file()
    with zipfile.ZipFile(p/'downloads'/f'{ident}-model.zip') as z:
        assert z.testzip() is None;assert any(n.endswith('LICENSE.txt') for n in z.namelist());assert z.read(ident+'/'+ident+'.glb')==b
    summary.append({'id':ident,'clips':3,'moving_tracks':motions})
assert len(summary)==16
print(json.dumps({'models':len(summary),'demonstrations':32,'clips_including_rest':48,'validated':summary},indent=2))
