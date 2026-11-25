#!/usr/bin/env python3
"""AQVILA · AM2 — genera assets/mapa-grecia/rios.js: los ríos de Grecia sacados del propio relieve (alturas.png).
Natural Earth solo trae 4 ríos en este marco; aquí los ríos bajan por el terreno: se rellenan los hoyos (priority-flood desde el
mar, cada celda drena a la vecina que la alcanzó primero), se acumula el área drenada y se vectorizan las celdas con >= UMBRAL km².
Uso: python3 -I tools/mapa-grecia/generar-rios.py [umbral km2 (250)] [tolerancia m (120)]
Marco igual que alturas.png: lon 19,3..28,3 y lat 34,7..41,0; 2160x1920 celdas; fila 0 = norte. Derivado propio del relieve (dominio público).
"""
import heapq, math, os, sys, json
import numpy as np
from PIL import Image

X0, X1, Y0, Y1 = 19.3, 28.3, 34.7, 41.0
NX, NZ = 2160, 1920
UMBRAL = float(sys.argv[1]) if len(sys.argv) > 1 else 250.0
TOL_KM = (float(sys.argv[2]) if len(sys.argv) > 2 else 120.0) / 1000
CELDA_KM2 = 0.134
KMLON, KMLAT = 111.32 * math.cos(math.radians(38)), 110.57
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENT = os.path.join(RAIZ, 'assets', 'mapa-grecia', 'alturas.png')
SAL = os.path.join(RAIZ, 'assets', 'mapa-grecia', 'rios.js')

a = np.asarray(Image.open(ENT).convert('RGB'), np.int32)
m = ((a[..., 0] * 256 + a[..., 1]) / 6.0 - 5000).astype(np.float32)
land = m > 0
N = NX * NZ
mf = m.ravel().tolist(); lf = land.ravel().tolist()
DJ = (-1, -1, -1, 0, 0, 1, 1, 1); DI = (-1, 0, 1, -1, 1, -1, 0, 1)

# --- priority-flood: parent[c] = celda a la que drena (-1: sale del marco; -2: mar o sin definir) ---
parent = [-2] * N; visto = [False] * N; orden = []
h = []; cnt = 0; EPS = 1e-3
elev = list(mf)
for c in range(N):
    if not lf[c]: visto[c] = True
for j in range(NZ):
    for i in range(NX):
        c = j * NX + i
        if not lf[c]: continue
        borde = j == 0 or i == 0 or j == NZ - 1 or i == NX - 1
        mar = None
        if not borde:
            for k in range(8):
                d = (j + DJ[k]) * NX + i + DI[k]
                if not lf[d]: mar = d; break
        if borde or mar is not None:
            parent[c] = -1 if mar is None else mar; visto[c] = True; heapq.heappush(h, (elev[c], cnt, c)); cnt += 1
while h:
    e, _, c = heapq.heappop(h); orden.append(c)
    j, i = divmod(c, NX)
    for k in range(8):
        jj = j + DJ[k]; ii = i + DI[k]
        if jj < 0 or ii < 0 or jj >= NZ or ii >= NX: continue
        d = jj * NX + ii
        if visto[d]: continue
        visto[d] = True; parent[d] = c
        if elev[d] <= e: elev[d] = e + EPS
        heapq.heappush(h, (elev[d], cnt, d)); cnt += 1
acc = [1] * N
for c in reversed(orden):
    p = parent[c]
    if p >= 0 and lf[p]: acc[p] += acc[c]
UM = int(math.ceil(UMBRAL / CELDA_KM2))
cauce = [lf[c] and acc[c] >= UM for c in range(N)]
entra = {}
for c in orden:
    if cauce[c]:
        p = parent[c]
        if p >= 0 and lf[p]: entra[p] = entra.get(p, 0) + 1
nodo = lambda c: entra.get(c, 0) != 1   # cabecera (0) o confluencia (>=2)

def xy(c):
    j, i = divmod(c, NX); return (X0 + (i + 0.5) * (X1 - X0) / NX, Y1 - (j + 0.5) * (Y1 - Y0) / NZ)
def km(p, q): return math.hypot((q[0] - p[0]) * KMLON, (q[1] - p[1]) * KMLAT)

# --- tramos: de un nodo hasta el siguiente nodo (inclusive, así el afluente acaba EN el río) o el mar ---
tramos = []; celda_tramo = {}; inicio_tramo = {}
for c0 in orden:
    if not cauce[c0] or not nodo(c0): continue
    cells = [c0]; c = c0; fin = None
    while True:
        p = parent[c]
        if p < 0: fin = ('marco', None); break
        if not lf[p]: fin = ('mar', p); break
        cells.append(p); c = p
        if nodo(c): fin = ('nodo', c); break
    t = dict(cells=cells, fin=fin, cab=entra.get(c0, 0) == 0)
    idx = len(tramos); tramos.append(t); inicio_tramo[c0] = idx
    for q in cells[:-1] if fin[0] == 'nodo' else cells: celda_tramo.setdefault(q, idx)

def suavizar(P):
    if len(P) < 5: return P
    Q = [P[0]]
    for k in range(1, len(P) - 1):
        w = P[max(0, k - 2):k + 3]; Q.append((sum(x for x, _ in w) / len(w), sum(y for _, y in w) / len(w)))
    Q.append(P[-1]); return Q
def dp(P, tol):
    if len(P) < 3: return P
    (x0, y0), (x1, y1) = P[0], P[-1]; ax, ay = (x1 - x0) * KMLON, (y1 - y0) * KMLAT; L = math.hypot(ax, ay); mx, mk = -1, 0
    for k in range(1, len(P) - 1):
        bx, by = (P[k][0] - x0) * KMLON, (P[k][1] - y0) * KMLAT
        d = abs(ax * by - ay * bx) / L if L else math.hypot(bx, by)
        if d > mx: mx, mk = d, k
    if mx <= tol: return [P[0], P[-1]]
    return dp(P[:mk + 1], tol)[:-1] + dp(P[mk:], tol)

salida = []
for ix, t in enumerate(tramos):
    P = [xy(c) for c in t['cells']]
    if t['fin'][0] == 'mar':   # termina en la costa (a 0,35 celdas, aún dentro de la celda de tierra)
        q = xy(t['fin'][1]); p = P[-1]; P.append((p[0] + 0.35 * (q[0] - p[0]), p[1] + 0.35 * (q[1] - p[1])))
    t['largo'] = sum(km(P[k], P[k + 1]) for k in range(len(P) - 1))
    if t['cab'] and t['largo'] < 6: t['quitar'] = True; continue
    ac = t['cells'][-2] if len(t['cells']) > 1 else t['cells'][-1]
    t['km2'] = acc[ac] * CELDA_KM2
    t['w'] = 1 if t['km2'] < 800 else 2 if t['km2'] < 3000 else 3
    t['P'] = dp(suavizar(P), TOL_KM)
    t['nombre'] = None

# --- nombres ---
NOMBRES = [('Peneo', 22.4, 39.64), ('Aqueloo', 21.3, 38.6), ('Alfeo', 21.63, 37.64), ('Eurotas', 22.45, 37.05), ('Cefiso', 22.9, 38.5),
  ('Axio', 22.6, 40.75), ('Haliacmón', 22.3, 40.45), ('Estrimón', 23.6, 40.95), ('Nesto', 24.7, 41.0), ('Hebro', 26.2, 40.95),
  ('Meandro', 27.6, 37.82), ('Caístro', 27.4, 37.98), ('Hermo', 27.3, 38.6), ('Esperqueo', 22.4, 38.87), ('Pamiso', 22.0, 37.1),
  ('Ínaco', 22.7, 37.66), ('Asopo', 23.4, 38.3), ('Ladón', 21.95, 37.75), ('Aóos', 20.3, 40.2), ('Aracto', 21.05, 39.3)]
encontrados = []; no = []
for n, lon, lat in NOMBRES:
    j0 = int((Y1 - lat) / (Y1 - Y0) * NZ); i0 = int((lon - X0) / (X1 - X0) * NX); r = 20; mejor = None; dmin = 1e9
    for j in range(max(0, j0 - r), min(NZ, j0 + r + 1)):
        for i in range(max(0, i0 - r), min(NX, i0 + r + 1)):
            c = j * NX + i
            if not cauce[c] or c not in celda_tramo: continue
            d = km(xy(c), (lon, lat))
            if d < 6 and (mejor is None or acc[c] > acc[mejor]): mejor = c
            dmin = min(dmin, d)
    if mejor is None:
        no.append(f'{n} (cauce más cercano a {dmin:.1f} km: el dato no pone río ≥ {UMBRAL:.0f} km² a < 6 km)' if dmin < 1e8 else f'{n} (sin cauce en 7 km)'); continue
    k = celda_tramo[mejor]; marcados = 0
    while k is not None and not tramos[k].get('quitar'):
        if tramos[k]['nombre'] is None: tramos[k]['nombre'] = n; marcados += 1
        else: break
        f = tramos[k]['fin']; k = inicio_tramo.get(f[1]) if f[0] == 'nodo' else None
    if marcados == 0:
        no.append(f'{n} (el tramo cercano es una cabecera < 6 km: el río real nace fuera del marco y aquí solo entran {acc[mejor] * CELDA_KM2:.0f} km²)'); continue
    encontrados.append(f'{n} ({acc[mejor] * CELDA_KM2:.0f} km², {marcados} tramos)')

fin = [t for t in tramos if 'P' in t]
fin.sort(key=lambda t: -t['km2'])
trozos = []
for t in fin:
    o = {'n': t['nombre']} if t['nombre'] else {}
    o['w'] = t['w']; o['l'] = [[round(x, 3), round(y, 3)] for x, y in t['P']]
    trozos.append(json.dumps(o, ensure_ascii=False, separators=(',', ':')))
cab = ('// AQVILA · AM2 — ríos de Grecia. Generado por tools/mapa-grecia/generar-rios.py a partir de alturas.png (no editar a mano).\n'
       f'// Cada tramo: n = nombre antiguo (si lo tiene), w = ancho 1..3 (área drenada 250-800 / 800-3000 / >3000 km²), l = [[lon,lat],…] aguas abajo.\n'
       f'// Los afluentes acaban en un punto del río principal. Umbral {UMBRAL:.0f} km². Derivado propio del relieve (dominio público); ver LICENSE.txt.\n')
open(SAL, 'w', encoding='utf-8').write(cab + 'export default [\n' + ',\n'.join(trozos) + '\n];\n')
print('tramos por clase:', {w: sum(1 for t in fin if t['w'] == w) for w in (1, 2, 3)}, 'total', len(fin))
print('km totales: %.0f' % sum(t['largo'] for t in fin))
print('tamaño: %.1f KB' % (os.path.getsize(SAL) / 1024))
print('nombres encontrados:', '; '.join(encontrados))
print('NO encontrados:', '; '.join(no) or 'ninguno')
