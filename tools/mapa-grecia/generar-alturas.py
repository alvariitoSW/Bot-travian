#!/usr/bin/env python3
"""AQVILA · AM2 — genera assets/mapa-grecia/alturas.png: relieve, fondo del mar y distancia a la costa de Grecia y el Egeo.
Datos: Terrain Tiles (Terrarium, nivel 10) de Mapzen/Tilezen en AWS Open Data (https://registry.opendata.aws/terrain-tiles/).
Fuentes que declaran las cabeceras x-amz-meta-x-imagery-sources de las teselas usadas (se imprimen al final y van a LICENSE.txt):
  SRTM, GMTED2010, ETOPO1 y las que salgan (dominio público; ver assets/mapa-grecia/LICENSE.txt). No se guarda fuentes.txt en el repo.
Uso: python3 -I tools/mapa-grecia/generar-alturas.py <carpeta de caché FUERA del repo>
Marco (igual que la maqueta AM1): lon 19,3..28,3 y lat 34,7..41,0; 2160x1920 celdas; fila 0 = norte.
  Espaciado uniforme en lon y en lat (la maqueta también lo es), no en Mercator: se promedia por área sobre el mosaico.
PNG RGB de 8 bits:
  R,G: v = (metros + 5000) * 6 -> R = v >> 8, G = v & 255. Tierra (>0) redondeada a 2 m; mar (<=0) a 20 m y recortado a -3000
       (para que comprima).
  B:   distancia a la costa con signo en celdas: B = clip(128 + d*8, 0, 255); d > 0 en tierra, d < 0 en mar (±16 celdas).
Retoques a mano (ver RETOQUES más abajo): estrecho del Euripo (mar continuo), istmo de Corinto (tierra continua).
"""
import math, os, sys, re, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

X0, X1, Y0, Y1 = 19.3, 28.3, 34.7, 41.0
NX, NZ, Z = 2160, 1920, 10
n = 2 ** Z
tx = lambda lon: (lon + 180) / 360 * n
def ty(lat):
    r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SALIDA = os.path.join(RAIZ, 'assets', 'mapa-grecia', 'alturas.png')
def celda(lon, lat):   # (fila, columna) de un punto; mismo criterio que usa el test
    return (min(NZ - 1, max(0, int((Y1 - lat) / (Y1 - Y0) * NZ))), min(NX - 1, max(0, int((lon - X0) / (X1 - X0) * NX))))

def bajar(dest):
    TX = list(range(int(tx(X0)), int(tx(X1)) + 1)); TY = list(range(int(ty(Y1)), int(ty(Y0)) + 1))
    def uno(t):
        x, y = t; f = os.path.join(dest, f'{Z}_{x}_{y}.png')
        if not os.path.exists(f + '.txt'):
            for intento in range(5):
                try:
                    with urllib.request.urlopen(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png', timeout=60) as r:
                        open(f, 'wb').write(r.read()); open(f + '.txt', 'w').write(r.headers.get('x-amz-meta-x-imagery-sources', ''))
                    break
                except Exception as e:
                    if intento == 4: raise
        return t
    with ThreadPoolExecutor(16) as ex: list(ex.map(uno, [(x, y) for x in TX for y in TY]))
    mos = np.zeros((len(TY) * 256, len(TX) * 256), np.float32); fuentes = set()
    for x in TX:
        for y in TY:
            f = os.path.join(dest, f'{Z}_{x}_{y}.png')
            for s in open(f + '.txt').read().split(','):
                if s.strip(): fuentes.add(s.strip().split('/')[0])
            a = np.asarray(Image.open(f).convert('RGB'), np.float32)
            mos[(y - TY[0]) * 256:(y - TY[0] + 1) * 256, (x - TX[0]) * 256:(x - TX[0] + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    return mos, TX[0], TY[0], fuentes

def promediar(mos, tx0, ty0):
    """Media por área de cada celda destino con una imagen integral (sin bucles por píxel)."""
    S = np.zeros((mos.shape[0] + 1, mos.shape[1] + 1), np.float64); S[1:, 1:] = mos.cumsum(0).cumsum(1)
    def corte(a):  # coordenada fraccionaria de píxel -> índice entero redondeado
        return np.clip(np.round(a).astype(int), 0, None)
    cx = corte((tx(X0 + np.arange(NX + 1) * (X1 - X0) / NX) - tx0) * 256)
    lats = Y1 - np.arange(NZ + 1) * (Y1 - Y0) / NZ
    cy = corte((np.array([ty(l) for l in lats]) - ty0) * 256)
    cx = np.minimum(cx, mos.shape[1]); cy = np.minimum(cy, mos.shape[0])
    xa, xb = cx[:-1], np.maximum(cx[1:], cx[:-1] + 1); ya, yb = cy[:-1], np.maximum(cy[1:], cy[:-1] + 1)
    xb = np.minimum(xb, mos.shape[1]); yb = np.minimum(yb, mos.shape[0])
    suma = S[np.ix_(yb, xb)] - S[np.ix_(ya, xb)] - S[np.ix_(yb, xa)] + S[np.ix_(ya, xa)]
    area = (yb - ya)[:, None] * (xb - xa)[None, :]
    return (suma / area).astype(np.float32)

# ---- Retoques a mano: rectángulos (lon0, lon1, lat0, lat1, 'mar'|'tierra') en grados; se aplican a toda celda que tocan ----
# Euripo en Calcis: el SRTM/EU-DEM lo da como tierra (el canal real mide ~40 m, menos que una celda de ~400 m). Se abre un canal de
# mar de 3 celdas de ancho (lon 23.585..23.598, ~1,2 km) desde el golfo norte de Eubea hasta el golfo sur; Calcis (23.60, 38.46)
# queda en la orilla de tierra, justo al este del canal. La altura de las celdas nuevas de mar es -20 m.
# Istmo de Corinto: el canal real (1893) no existe en el mundo antiguo; se fuerza una franja de tierra continua en lon 22.97..23.01.
# Mileto: la llanura del Meandro (el antiguo golfo Latmio, hoy aluvión de 0-3 m) sale con media <0 en las teselas y quedaría como mar con la
# polis dentro; se fuerza tierra baja (2 m) en lon 27.25..27.60, lat 37.46..37.58. El puerto (27.22, 37.50) sigue en mar, 8 celdas al oeste.
RETOQUES = [
    (27.25, 27.60, 37.46, 37.58, 'tierra'),
    (23.585, 23.598, 38.395, 38.535, 'mar'),
    (22.97, 23.01, 37.92, 37.94, 'tierra'),
]
def retoques(tierra, alt):
    for lon0, lon1, lat0, lat1, que in RETOQUES:
        j0, i0 = celda(lon0, lat1); j1, i1 = celda(lon1, lat0)
        tierra[j0:j1 + 1, i0:i1 + 1] = (que == 'tierra')
        if que == 'tierra': alt[j0:j1 + 1, i0:i1 + 1] = np.maximum(alt[j0:j1 + 1, i0:i1 + 1], 2)
        else: alt[j0:j1 + 1, i0:i1 + 1] = np.minimum(alt[j0:j1 + 1, i0:i1 + 1], -20)

def limpiar(tierra, alt):
    """Quita islas de 1 celda (8 vecinos) y charcos de mar de <4 celdas (4 vecinos). Devuelve cuántos quitó."""
    quitados = [0, 0]
    lab, k = ndi.label(tierra, np.ones((3, 3)))
    tam = np.bincount(lab.ravel(), minlength=k + 1); peq = (tam[lab] == 1) & tierra
    quitados[0] = int(peq.sum()); tierra[peq] = False; alt[peq] = -20
    lab, k = ndi.label(~tierra)
    tam = np.bincount(lab.ravel(), minlength=k + 1); peq = (tam[lab] < 4) & ~tierra
    quitados[1] = int(peq.sum()); tierra[peq] = True; alt[peq] = 2
    return quitados

def distancia(tierra):
    """Distancia euclídea al borde de la costa en celdas, con signo (+ tierra, - mar)."""
    dt = ndi.distance_transform_edt(tierra) - 0.5; dm = ndi.distance_transform_edt(~tierra) - 0.5
    return np.where(tierra, dt, -dm)

def codificar(alt, tierra, d):
    m = np.where(tierra, np.maximum(np.round(alt / 2) * 2, 2), np.minimum(np.maximum(np.round(alt / 20) * 20, -3000), 0))
    v = np.clip((m + 5000) * 6, 0, 65535).astype(np.uint16)
    img = np.zeros((NZ, NX, 3), np.uint8); img[..., 0] = v >> 8; img[..., 1] = v & 255
    img[..., 2] = np.clip(np.round(128 + d * 8), 0, 255).astype(np.uint8)
    return img

def comprobar(img, tierra, d):
    """Comprobaciones finales (assert con salida impresa)."""
    datos = open(os.path.join(RAIZ, 'gobierno', 'maquetas', 'mapa-comun', 'datos.js'), encoding='utf-8').read()
    polis = [(m[0], float(m[1]), float(m[2])) for m in re.findall(r"id: '(\w+)'.*?lon: ([\d.]+), lat: ([\d.]+)", datos)]
    puertos = [(m[0], float(m[1]), float(m[2])) for m in re.findall(r"id: '(\w+)'.*?puerto: \[([\d.]+), ([\d.]+)\]", datos)]
    lab, k = ndi.label(tierra, np.ones((3, 3)))
    for nombre, lon, lat in polis:
        j, i = celda(lon, lat); assert tierra[j, i], f'polis {nombre} no cae en tierra'
        print('  ok polis en tierra:', nombre, (j, i), 'dist costa', round(float(d[j, i]), 1), 'celdas')
    for nombre, lon, lat in puertos:
        j, i = celda(lon, lat); v = ~tierra[max(0, j - 1):j + 2, max(0, i - 1):i + 2]
        assert v.any(), f'puerto {nombre} a más de 1 celda del mar'
        print('  ok puerto:', nombre, (j, i), 'en mar' if not tierra[j, i] else 'en tierra a <=1 celda del mar')
    # Euripo: celdas de mar en el canal y todas conectadas con el golfo norte y el sur
    labm, km = ndi.label(~tierra)
    jc, ic = celda(23.595, 38.46); assert not tierra[jc, ic], 'Euripo cerrado'
    for lon in (23.59, 23.60):
        j, i = celda(lon, 38.46); print('  Euripo lon', lon, 'celda', (j, i), 'mar' if not tierra[j, i] else 'tierra')
    norte = celda(23.467, 38.555); sur = celda(23.72, 38.375)
    print('  Euripo: celdas norte/sur', norte, sur, 'mar?', not tierra[norte], not tierra[sur])
    assert not tierra[norte] and not tierra[sur] and labm[norte] == labm[sur] == labm[jc, ic], 'el Euripo no une el golfo norte con el sur'
    ancho = int((~tierra[jc, ic - 3:ic + 4]).sum()); assert ancho >= 2, 'canal del Euripo de <2 celdas'
    print('  ok Euripo: canal continuo, ancho en la fila de Calcis =', ancho, 'celdas')
    # Istmo: tierra continua entre Corinto y la Argólida / Mégara
    j, i = celda(22.99, 37.93); assert tierra[j, i]
    for nombre, lon, lat in polis:
        if nombre in ('atenas', 'esparta', 'corinto'): assert lab[celda(lon, lat)] == lab[j, i], f'istmo cortado: {nombre}'
    print('  ok istmo: Atenas, Corinto y Esparta en la misma masa de tierra')
    print('  tierra: %.1f %%' % (100 * tierra.mean()))

def main(dest):
    os.makedirs(dest, exist_ok=True)
    cache = os.path.join(dest, 'alturas_float.npy')
    if os.path.exists(cache) and os.path.exists(os.path.join(dest, 'fuentes.txt')):
        out = np.load(cache); fuentes = open(os.path.join(dest, 'fuentes.txt')).read().split('\n')
    else:
        mos, tx0, ty0, fs = bajar(dest); fuentes = sorted(fs)
        out = promediar(mos, tx0, ty0); np.save(cache, out); open(os.path.join(dest, 'fuentes.txt'), 'w').write('\n'.join(fuentes))
    tierra = out > 0; alt = out.copy()
    print('limpieza (islas 1 celda, charcos <4):', limpiar(tierra, alt))
    retoques(tierra, alt)
    print('limpieza tras retoques:', limpiar(tierra, alt))
    d = distancia(tierra); img = codificar(alt, tierra, d)
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    Image.fromarray(img).save(SALIDA, optimize=True)
    print('guardado', SALIDA, os.path.getsize(SALIDA) // 1024, 'KB; fuentes', fuentes)
    # releer lo guardado y comprobar sobre el PNG real
    r = np.asarray(Image.open(SALIDA).convert('RGB')).astype(np.int32)
    m = (r[..., 0] * 256 + r[..., 1]) / 6.0 - 5000; t2 = m > 0
    assert (t2 == tierra).all(), 'el PNG no conserva la máscara de tierra'
    comprobar(img, t2, (r[..., 2] - 128) / 8.0)
    for z in ('zopflipng', 'oxipng'):
        print(z, 'disponible' if any(os.access(os.path.join(p, z), os.X_OK) for p in os.environ.get('PATH', '').split(':')) else 'no está')

if __name__ == '__main__':
    main(sys.argv[1])
