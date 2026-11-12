#!/usr/bin/env python3
"""AQVILA — genera assets/mapa/alturas.js a partir de teselas de altura libres (Terrarium, z6).
Datos: Mapzen/Tilezen Terrain Tiles en AWS (SRTM, GMTED2010, ETOPO1...; ver LICENSE.txt).
Uso: python3 -I assets/mapa/generar-alturas.py <carpeta temporal FUERA del repo>
Baja las 28 teselas x 30..36, y 22..25 (si no están ya), guarda la cabecera x-imagery-sources de cada una en
fuentes.txt dentro de esa carpeta y remuestrea a la malla del mapa (421x211, mismo marco que generar-costa.mjs:
lon -7..25, lat 34.5..47; si J4 agranda el mapa, cambiar X0..Y1 y NX/NZ aquí, en map3d.js y en la prueba).
Alturas en metros = R*256 + G + B/256 - 32768. Se guardan como byte con escala de raíz cuadrada con signo
(q = 128 + signo*127*sqrt(|m|/MAX)); así hay detalle fino cerca del nivel del mar y los picos no se aplastan."""
import base64, math, os, sys, urllib.request
import numpy as np
from PIL import Image

X0, X1, Y0, Y1 = -7.0, 25.0, 34.5, 47.0
NX, NZ = 420, 210                 # la malla tiene (NX+1) x (NZ+1) nodos, como map3d.js
MAXM = 4800.0                     # fondo de la escala (m); por encima o por debajo se recorta
Z, TX, TY = 6, range(30, 37), range(22, 26)
dest = sys.argv[1]
os.makedirs(dest, exist_ok=True)
fuentes = {}
for x in TX:
    for y in TY:
        f = os.path.join(dest, f'{x}_{y}.png')
        url = f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png'
        with urllib.request.urlopen(url, timeout=60) as r:
            if not os.path.exists(f):
                open(f, 'wb').write(r.read())
            fuentes[f'{Z}/{x}/{y}'] = r.headers.get('x-amz-meta-x-imagery-sources', '')
with open(os.path.join(dest, 'fuentes.txt'), 'w') as fh:
    for k in sorted(fuentes):
        fh.write(f'{k}\t{fuentes[k]}\n')
# mosaico en metros (Mercator, 256 px por tesela)
mx0, my0 = min(TX), min(TY)
mos = np.zeros((len(TY) * 256, len(TX) * 256), np.float32)
for x in TX:
    for y in TY:
        a = np.asarray(Image.open(os.path.join(dest, f'{x}_{y}.png')).convert('RGB'), np.float32)
        mos[(y - my0) * 256:(y - my0 + 1) * 256, (x - mx0) * 256:(x - mx0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
N = 2 ** Z * 256
px = lambda lon: (lon + 180) / 360 * N - mx0 * 256
def py(lat):
    r = math.radians(lat)
    return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * N - my0 * 256
out = np.zeros((NZ + 1, NX + 1), np.float32)
dlon, dlat = (X1 - X0) / NX, (Y1 - Y0) / NZ
for j in range(NZ + 1):
    lat = Y1 - j * dlat
    ya, yb = py(min(lat + dlat / 2, 85)), py(lat - dlat / 2)
    ya, yb = int(math.floor(ya)), int(math.ceil(yb))
    ya, yb = max(0, ya), min(mos.shape[0], max(yb, ya + 1))
    for i in range(NX + 1):
        lon = X0 + i * dlon
        xa, xb = int(math.floor(px(lon - dlon / 2))), int(math.ceil(px(lon + dlon / 2)))
        xa, xb = max(0, xa), min(mos.shape[1], max(xb, xa + 1))
        w = mos[ya:yb, xa:xb]
        mean, mx = float(w.mean()), float(w.max())
        # media sesgada al máximo en tierra (no aplasta los picos); en el mar, la media
        out[j, i] = mean + 0.6 * (mx - mean) if mean > 0 else mean
q = np.clip(np.round(128 + np.sign(out) * 127 * np.sqrt(np.minimum(np.abs(out), MAXM) / MAXM)), 0, 255).astype(np.uint8)
b64 = base64.b64encode(q.tobytes()).decode()
txt = f"""/* AQVILA — alturas del terreno del mapa de campaña. Datos: Terrain Tiles (Terrarium, z6) de Mapzen/Tilezen en AWS, que reúnen
   SRTM, GMTED2010 y ETOPO1 (dominio público; créditos completos en assets/mapa/LICENSE.txt y README.md).
   Generado con assets/mapa/generar-alturas.py. Malla de {NX + 1}x{NZ + 1} nodos (lon {X0:g}..{X1:g}, lat {Y0:g}..{Y1:g}), un byte por nodo
   con escala de raíz cuadrada con signo: q = 128 + signo*127*sqrt(|m|/max). metros() devuelve un Float32Array de metros. */
export default {{
  w: {NX + 1}, h: {NZ + 1}, x0: {X0:g}, x1: {X1:g}, y0: {Y0:g}, y1: {Y1:g}, max: {MAXM:g},
  metros() {{ const s = atob(this.b64), o = new Float32Array(s.length); for (let k = 0; k < s.length; k++) {{ const t = (s.charCodeAt(k) - 128) / 127; o[k] = Math.sign(t) * t * t * this.max; }} return o; }},
  b64: '{b64}'
}};
"""
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'alturas.js'), 'w').write(txt)
print(len(txt) / 1024, 'KB', 'max', out.max(), 'min', out.min())
