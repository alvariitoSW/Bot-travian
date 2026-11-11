#!/usr/bin/env python3
"""Compone el atlas de texturas de cada unidad (cuerpo 512 px + piezas 256 px) a partir de units.json.

Uso: python3 -I tools/build_atlas.py <art de 0 A.D.> <carpeta con units.json>
Conserva el canal alfa tal cual: en 0 A.D. marca dónde va el color del bando.
"""
import json
import os
import sys
from PIL import Image

art, out = sys.argv[1], sys.argv[2]
W = H = 1024
idx = json.load(open(os.path.join(out, 'units.json')))
for key, u in idx.items():
    atlas = Image.new('RGBA', (W, H), (128, 128, 128, 255))
    bigs = [c for c in u['cells'] if c['big']][:2]
    smalls = [c for c in u['cells'] if c not in bigs]
    # columna izquierda: cuerpos a 512 px; el resto, piezas a 256 px (o 128 si no caben)
    free = [(512, y, 512) for y in (0, 512)] + ([(0, 512, 512)] if len(bigs) < 2 else [])
    size = 256 if len(smalls) <= len(free) * 4 else 128
    slots = [(bx + dx, by + dy, size) for bx, by, bs in free for dy in range(0, bs, size) for dx in range(0, bs, size)]
    place = {id(c): (0, 512 * i, 512) for i, c in enumerate(bigs)}
    for c, sl in zip(smalls, slots):
        place[id(c)] = sl
    for c in u['cells']:
        x, y, s = place.get(id(c), (0, 0, 16))
        c['rect'] = [x / W, y / H, s / W, s / H]
        src = None
        if c['tex']:
            base = os.path.join(art, 'textures', 'skins', c['tex'])
            for p in (base, os.path.splitext(base)[0] + '.png'):
                if os.path.exists(p) and not p.endswith('.dds'):
                    src = p
                    break
        if src:
            im = Image.open(src).convert('RGBA').resize((s, s), Image.LANCZOS)
            atlas.paste(im, (x, y))
        else:
            c['missing'] = True
    atlas.save(os.path.join(out, key + '.webp'), 'WEBP', quality=88, exact=True, method=6)
json.dump(idx, open(os.path.join(out, 'units.json'), 'w'))
print('atlas:', len(idx))
