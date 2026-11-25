#!/usr/bin/env python3
"""AQVILA · AM1 — genera gobierno/maquetas/mapa-comun/grecia-alturas.png: relieve y fondo del mar de Grecia y el Egeo.
Datos: Terrain Tiles (Terrarium, nivel 8) de Mapzen/Tilezen en AWS Open Data (SRTM, GMTED2010, ETOPO1; dominio público, ver LICENSE.txt).
Uso: python3 -I gobierno/maquetas/mapa-comun/generar-grecia.py <carpeta temporal FUERA del repo>
Marco: lon 19,3..28,3 y lat 34,7..41,0. Malla de 720x640 celdas (~1,1 km). Cada píxel guarda la altura en dos bytes:
v = (metros + 5000) * 6 -> R = v // 256, G = v % 256 (de -5000 a 5922 m, pasos de 17 cm). Deja también fuentes.txt con las cabeceras."""
import math, os, sys, urllib.request
import numpy as np
from PIL import Image
X0, X1, Y0, Y1 = 19.3, 28.3, 34.7, 41.0
NX, NZ, Z = 720, 640, 8
n = 2 ** Z
tx = lambda lon: (lon + 180) / 360 * n
def ty(lat):
    r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n
TX = range(int(tx(X0)), int(tx(X1)) + 1); TY = range(int(ty(Y1)), int(ty(Y0)) + 1)
dest = sys.argv[1]; os.makedirs(dest, exist_ok=True); fuentes = set()
mos = np.zeros((len(TY) * 256, len(TX) * 256), np.float32)
for x in TX:
    for y in TY:
        f = os.path.join(dest, f'{Z}_{x}_{y}.png')
        if not os.path.exists(f):
            with urllib.request.urlopen(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png', timeout=60) as r:
                open(f, 'wb').write(r.read()); open(f + '.txt', 'w').write(r.headers.get('x-amz-meta-x-imagery-sources', ''))
        for s in open(f + '.txt').read().split(','): fuentes.add(s.strip().split('/')[0])
        a = np.asarray(Image.open(f).convert('RGB'), np.float32)
        mos[(y - TY[0]) * 256:(y - TY[0] + 1) * 256, (x - TX[0]) * 256:(x - TX[0] + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
open(os.path.join(dest, 'fuentes.txt'), 'w').write('\n'.join(sorted(fuentes)))
out = np.zeros((NZ, NX), np.float32)
for j in range(NZ):
    lat1, lat0 = Y1 - j * (Y1 - Y0) / NZ, Y1 - (j + 1) * (Y1 - Y0) / NZ
    ya, yb = int((ty(lat1) - TY[0]) * 256), int(math.ceil((ty(lat0) - TY[0]) * 256))
    for i in range(NX):
        xa, xb = int((tx(X0 + i * (X1 - X0) / NX) - TX[0]) * 256), int(math.ceil((tx(X0 + (i + 1) * (X1 - X0) / NX) - TX[0]) * 256))
        out[j, i] = mos[ya:max(yb, ya + 1), xa:max(xb, xa + 1)].mean()
v = np.clip((out + 5000) * 6, 0, 65535).astype(np.uint16)
img = np.zeros((NZ, NX, 3), np.uint8); img[..., 0] = v >> 8; img[..., 1] = v & 255
Image.fromarray(img).save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'grecia-alturas.png'), optimize=True)
print('hecho', out.min(), out.max(), 'fuentes', sorted(fuentes))
