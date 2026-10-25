from PIL import Image
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'web/images'
for f in p.glob('*.png'):
 im=Image.open(f).convert('RGB');im.thumbnail((640,480));im.save(f.with_suffix('.webp'),'WEBP',quality=87)
f=(Path(__file__).resolve().parents[1]/'web/app.js');s=f.read_text(encoding='utf-8');f.write_text(s.replace('images/${r.id}.png','images/${r.id}.webp'),encoding='utf-8')
