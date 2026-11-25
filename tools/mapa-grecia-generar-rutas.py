#!/usr/bin/env python3
"""AQVILA · AM2 — genera assets/mapa-grecia/rutas.js: rutas de barcos por mar abierto entre puertos (lon, lat).
Lee assets/mapa-grecia/alturas.png (canal B = distancia a la costa con signo; <0 es mar). Camino más corto por A* sobre la rejilla
reducida x3 (720x640; una casilla es mar si sus 9 celdas lo son; las pegadas a la costa cuestan más), unido al punto de mar más
cercano de cada extremo; se simplifica con Douglas-Peucker aceptando un tramo solo si pasa entero por mar en la rejilla fina.
Uso: python3 -I tools/mapa-grecia-generar-rutas.py   (mismo formato que gobierno/maquetas/mapa-comun/rutas.js)"""
import heapq, json, math, os
import numpy as np
from PIL import Image
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAL = os.path.join(RAIZ, 'assets', 'mapa-grecia')
X0, X1, Y0, Y1 = 19.3, 28.3, 34.7, 41.0
a = np.asarray(Image.open(os.path.join(SAL, 'alturas.png')).convert('RGB')).astype(np.int32)
D = (a[..., 2] - 128) / 8.0            # distancia con signo en celdas finas (<0 mar)
mar = D < 0
NZ, NX = mar.shape; K = 3
def celda(lon, lat): return (min(NZ - 1, max(0, int((Y1 - lat) / (Y1 - Y0) * NZ))), min(NX - 1, max(0, int((lon - X0) / (X1 - X0) * NX))))
def lonlat(j, i): return [round(X0 + (i + .5) * (X1 - X0) / NX, 3), round(Y1 - (j + .5) * (Y1 - Y0) / NZ, 3)]
def centro(j, i): return (j + .5, i + .5)   # posición en celdas finas (fraccionaria)
# rejilla gruesa
blo = lambda m, f: f(m.reshape(NZ // K, K, NX // K, K), axis=(1, 3))
marg = blo(mar, np.all); dg = blo(D, np.max) / K        # distancia a tierra de la casilla gruesa (la menos mala), en casillas gruesas
gj, gi = marg.shape
from scipy import ndimage as ndi
_lab, _k = ndi.label(marg); principal = _lab == np.argmax(np.bincount(_lab.ravel())[1:]) + 1   # solo el mar grande: sin bolsas aisladas
coste = np.where(marg, 1 + np.clip(4 + dg, 0, 4) * 2.5, 1e9)    # dg<0 en mar: cuanto más cerca de 0, más caro
def libre_fino(p, q, margen=1.0):
    """Tramo p->q (celdas finas fraccionarias): todas las celdas por las que pasa son mar con 'margen' celdas de holgura."""
    m = int(max(abs(p[0] - q[0]), abs(p[1] - q[1])) * 2) + 2
    for t in range(m + 1):
        j = int(p[0] + (q[0] - p[0]) * t / m); i = int(p[1] + (q[1] - p[1]) * t / m)
        if not (0 <= j < NZ and 0 <= i < NX) or D[j, i] > -margen: return False
    return True
def al_mar_fino(lon, lat, margen=1.5):
    j0, i0 = celda(lon, lat); mejor = None
    for r in range(0, 40):
        for j in range(max(0, j0 - r), min(NZ, j0 + r + 1)):
            for i in range(max(0, i0 - r), min(NX, i0 + r + 1)):
                if D[j, i] <= -margen:
                    q = (j - j0) ** 2 + (i - i0) ** 2
                    if mejor is None or q < mejor[0]: mejor = (q, (j, i))
        if mejor: return mejor[1]
def al_mar_grueso(f):
    j0, i0 = int(f[0]) // K, int(f[1]) // K; mejor = None
    for r in range(0, 40):
        for j in range(max(0, j0 - r), min(gj, j0 + r + 1)):
            for i in range(max(0, i0 - r), min(gi, i0 + r + 1)):
                if principal[j, i] and libre_fino(f, centro(j * K + 1, i * K + 1), 1.0):
                    q = (j - j0) ** 2 + (i - i0) ** 2
                    if mejor is None or q < mejor[0]: mejor = (q, (j, i))
        if mejor: return mejor[1]
def astar(s, g):
    ab = [(0, s)]; costo = {s: 0}; viene = {}
    while ab:
        _, c = heapq.heappop(ab)
        if c == g: break
        for dj in (-1, 0, 1):
            for di in (-1, 0, 1):
                n = (c[0] + dj, c[1] + di)
                if (dj or di) and 0 <= n[0] < gj and 0 <= n[1] < gi and marg[n]:
                    if dj and di and not (marg[c[0] + dj, c[1]] and marg[c[0], c[1] + di]): continue
                    v = costo[c] + coste[n] * math.hypot(dj, di)
                    if v < costo.get(n, 1e18):
                        costo[n] = v; viene[n] = c; heapq.heappush(ab, (v + math.hypot(n[0] - g[0], n[1] - g[1]), n))
    assert g in viene or s == g, 'sin camino por mar'
    r = [g]
    while r[-1] != s: r.append(viene[r[-1]])
    return r[::-1]
def dp(pts, tol=2.5):
    """Douglas-Peucker: acepta la cuerda solo si desvía < tol celdas finas Y va entera por mar en la rejilla fina."""
    p, q = pts[0], pts[-1]; dmax, k = -1, 0
    L = math.hypot(q[0] - p[0], q[1] - p[1]) or 1
    for t in range(1, len(pts) - 1):
        x = abs((q[1] - p[1]) * (p[0] - pts[t][0]) - (p[1] - pts[t][1]) * (q[0] - p[0])) / L
        if x > dmax: dmax, k = x, t
    if len(pts) == 2 or (dmax < tol and libre_fino(p, q)): return [p, q]
    if len(pts) == 2: return [p, q]
    return dp(pts[:k + 1], tol)[:-1] + dp(pts[k:], tol)
def camino(p, q):
    fp, fq = al_mar_fino(*p), al_mar_fino(*q)
    s, g = al_mar_grueso(centro(*fp)), al_mar_grueso(centro(*fq))
    r = [centro(*fp)] + [centro(c[0] * K + 1, c[1] * K + 1) for c in astar(s, g)] + [centro(*fq)]
    # la salida del puerto: si el primer tramo cruza tierra, no hay forma de seguir (se avisa con assert)
    out = dp(r)
    return [lonlat(int(c[0]), int(c[1])) for c in out]
# Puertos y puntos de mar (lon, lat). Los de la maqueta AM1 se conservan; los nuevos llevan su lugar.
P = {'pireo': (23.60, 37.92), 'lequeo': (22.88, 37.96), 'cencreas': (23.01, 37.87), 'nisea': (23.37, 37.96), 'calcis': (23.63, 38.43), 'mileto': (27.20, 37.50),
     'giteo': (22.58, 36.74), 'nauplia': (22.81, 37.54), 'occidente': (19.5, 38.3), 'creta': (23.4, 34.8), 'helesponto': (26.15, 40.0), 'chipre': (28.2, 35.2), 'tasos': (24.6, 40.55),
     'paros': (25.13, 37.12), 'cnosos': (25.14, 35.36), 'tasos2': (24.68, 40.60), 'golfo_corinto': (22.88, 37.94), 'corcira': (19.93, 39.60),
     'rodas': (28.23, 36.45), 'gitio': (22.57, 36.76), 'creta_oeste': (24.02, 35.53), 'lesbos': (26.55, 39.08), 'pagasas': (22.95, 39.33)}
R = [('pireo', 'mileto', 'Atenas–Mileto'), ('pireo', 'calcis', 'Atenas–Calcis'), ('cencreas', 'pireo', 'Corinto–Atenas'), ('lequeo', 'occidente', 'Corinto–Occidente (Corcira, Siracusa)'),
     ('giteo', 'creta', 'Esparta–Creta'), ('nauplia', 'pireo', 'Argos–Atenas'), ('nisea', 'helesponto', 'Mégara–Helesponto (Bizancio)'), ('mileto', 'chipre', 'Mileto–Levante'),
     ('calcis', 'tasos', 'Calcis–Tracia'), ('giteo', 'occidente', 'Esparta–Tarento'),
     ('pireo', 'paros', 'Atenas–Paros'), ('pireo', 'cnosos', 'Atenas–Creta (Cnosos)'), ('calcis', 'tasos2', 'Calcis–Tasos'), ('golfo_corinto', 'corcira', 'Corinto (golfo)–Corcira'),
     ('mileto', 'rodas', 'Mileto–Rodas'), ('gitio', 'creta_oeste', 'Esparta (Gitio)–Creta'), ('mileto', 'lesbos', 'Mileto–Lesbos'), ('calcis', 'pagasas', 'Calcis–Tesalia (Págasas)')]
def en_mar(lon, lat): j, i = celda(lon, lat); return bool(mar[j, i])
def comprobar(rutas):
    nv = 0
    for r in rutas:
        l = r['l']
        for k, (lon, lat) in enumerate(l):
            assert en_mar(lon, lat), f"{r['n']}: vértice {k} {lon},{lat} en tierra"; nv += 1
            if k:
                for t in (.25, .5, .75):
                    m = (l[k - 1][0] + (lon - l[k - 1][0]) * t, l[k - 1][1] + (lat - l[k - 1][1]) * t)
                    assert en_mar(*m), f"{r['n']}: tramo {k - 1}-{k} pisa tierra en {m}"
    print('ok: %d rutas, %d vértices; vértices y puntos medios de todos los tramos en mar' % (len(rutas), nv))
if __name__ == '__main__':
    rutas = [{'n': n, 'de': u, 'a': v, 'l': camino(P[u], P[v])} for u, v, n in R]
    for r in rutas: print(r['n'], len(r['l']))
    comprobar(rutas); assert len(rutas) >= 16
    open(os.path.join(SAL, 'rutas.js'), 'w', encoding='utf-8').write('/* AQVILA · AM2 — rutas de barcos por el mar (lon, lat). Generado con tools/mapa-grecia-generar-rutas.py a partir de alturas.png. */\nexport default ' + json.dumps(rutas, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('rutas.js', os.path.getsize(os.path.join(SAL, 'rutas.js')) // 1024, 'KB')
