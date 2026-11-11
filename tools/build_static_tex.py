#!/usr/bin/env python3
"""Copia las texturas de los modelos estáticos (color, sombreado AO, relieve y brillo), las de terreno y las del agua,
reducidas a 1024 px y en WebP. El alfa del color se conserva intacto (marca el color del bando).

Uso: python3 -I tools/build_static_tex.py <art de 0 A.D.> <carpeta con static.json>
"""
import json
import os
import re
import sys
from PIL import Image

art, out = sys.argv[1], sys.argv[2]
idx = json.load(open(os.path.join(out, 'static.json')))
done = {}


def conv(rel, base='textures/skins', alpha=True, size=1024, q=86):
    if not rel:
        return None
    key = base + '/' + rel
    if key in done:
        return done[key]
    p0 = os.path.join(art, base, rel)
    src = next((p for p in (p0, os.path.splitext(p0)[0] + '.png') if os.path.exists(p) and not p.endswith('.dds')), None)
    name = None
    if src:
        name = re.sub(r'[^a-z0-9]+', '_', os.path.splitext(rel)[0].lower()) + '.webp'
        im = Image.open(src).convert('RGBA' if alpha else 'RGB')
        if max(im.size) > size:
            k = size / max(im.size)
            im = im.resize((max(1, round(im.size[0] * k)), max(1, round(im.size[1] * k))), Image.LANCZOS)
        im.save(os.path.join(out, name), 'WEBP', quality=q, exact=True, method=6)
    done[key] = name
    return name


extra = idx.pop('__extra', {})
for u in idx.values():
    for g in u['groups']:
        g['file'] = conv(g.get('tex'))
        g['aoFile'] = conv(g.get('ao'), alpha=False, size=512, q=80)
        g['normFile'] = conv(g.get('norm'), alpha=False, q=88)
        g['specFile'] = conv(g.get('spec'), alpha=False, size=512, q=78)
idx['__extra'] = {}
for name, rel in extra.items():
    f = conv(rel, base='', alpha=False, size=512 if name.startswith('terr') else 256, q=88)
    if f:
        os.replace(os.path.join(out, f), os.path.join(out, name + '.webp'))
        idx['__extra'][name] = name + '.webp'
json.dump(idx, open(os.path.join(out, 'static.json'), 'w'))
print('texturas:', len([v for v in done.values() if v]), 'no encontradas:', [k for k, v in done.items() if not v])
