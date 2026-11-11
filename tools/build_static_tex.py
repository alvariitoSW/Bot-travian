#!/usr/bin/env python3
"""Copia las texturas que usan los modelos estáticos, reducidas a 1024 px y en WebP (alfa intacto).

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
for u in idx.values():
    for g in u['groups']:
        t = g['tex']
        if not t:
            g['file'] = None
            continue
        if t not in done:
            base = os.path.join(art, 'textures', 'skins', t)
            src = next((p for p in (base, os.path.splitext(base)[0] + '.png') if os.path.exists(p) and not p.endswith('.dds')), None)
            if src is None:
                done[t] = None
            else:
                name = re.sub(r'[^a-z0-9]+', '_', os.path.splitext(t)[0].lower()) + '.webp'
                im = Image.open(src).convert('RGBA')
                if max(im.size) > 1024:
                    im = im.resize((1024, 1024), Image.LANCZOS)
                im.save(os.path.join(out, name), 'WEBP', quality=86, exact=True, method=6)
                done[t] = name
        g['file'] = done[t]
json.dump(idx, open(os.path.join(out, 'static.json'), 'w'))
print('texturas:', len([v for v in done.values() if v]), 'sin textura:', [k for k, v in done.items() if not v])
