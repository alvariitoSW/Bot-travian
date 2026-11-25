#!/usr/bin/env python3
"""AQVILA · AM1 — genera rutas.js: rutas de barcos por mar abierto entre los puertos de las polis.
Lee grecia-alturas.png, busca el camino más corto por el mar (A*; las casillas pegadas a la costa cuestan más) y lo simplifica.
Uso: python3 -I gobierno/maquetas/mapa-comun/generar-rutas.py"""
import heapq, json, math, os
import numpy as np
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__))
X0, X1, Y0, Y1 = 19.3, 28.3, 34.7, 41.0
a = np.asarray(Image.open(os.path.join(AQUI, 'grecia-alturas.png')).convert('RGB')).astype(np.int32)
alt = (a[..., 0] * 256 + a[..., 1]) / 6.0 - 5000
NZ, NX = alt.shape
mar = alt < -1
# distancia a tierra (en casillas, hasta 6) por ensanchado sucesivo
d = np.where(mar, 99, 0)
for k in range(1, 7):
    t = d.copy()
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        t = np.minimum(t, np.roll(d, (dy, dx), (0, 1)) + 1)
    d = t
coste = np.where(mar, 1 + np.clip(4 - d, 0, 4) * 2.5, 1e9)
def celda(lon, lat): return (min(NZ - 1, max(0, int((Y1 - lat) / (Y1 - Y0) * NZ))), min(NX - 1, max(0, int((lon - X0) / (X1 - X0) * NX))))
def lonlat(j, i): return [round(X0 + (i + .5) * (X1 - X0) / NX, 3), round(Y1 - (j + .5) * (Y1 - Y0) / NZ, 3)]
def al_mar(c):
    j0, i0 = c; mejor = None
    for r in range(0, 30):
        for j in range(max(0, j0 - r), min(NZ, j0 + r + 1)):
            for i in range(max(0, i0 - r), min(NX, i0 + r + 1)):
                if mar[j, i] and d[j, i] >= 1:
                    q = (j - j0) ** 2 + (i - i0) ** 2
                    if mejor is None or q < mejor[0]: mejor = (q, (j, i))
        if mejor: return mejor[1]
def camino(p, q):
    s, g = al_mar(celda(*p)), al_mar(celda(*q)); abiertos = [(0, s)]; costo = {s: 0}; viene = {}
    while abiertos:
        _, c = heapq.heappop(abiertos)
        if c == g: break
        for dj in (-1, 0, 1):
            for di in (-1, 0, 1):
                n = (c[0] + dj, c[1] + di)
                if (dj or di) and 0 <= n[0] < NZ and 0 <= n[1] < NX and mar[n]:
                    if dj and di and not (mar[c[0] + dj, c[1]] and mar[c[0], c[1] + di]): continue
                    v = costo[c] + coste[n] * math.hypot(dj, di)
                    if v < costo.get(n, 1e18):
                        costo[n] = v; viene[n] = c; heapq.heappush(abiertos, (v + math.hypot(n[0] - g[0], n[1] - g[1]), n))
    r = [g]
    while r[-1] != s: r.append(viene[r[-1]])
    r.reverse()
    # simplificar: quitar puntos mientras el tramo recto siga en mar con holgura
    def libre(u, v):
        m = int(max(abs(u[0] - v[0]), abs(u[1] - v[1]))) + 1
        return all(d[round(u[0] + (v[0] - u[0]) * t / m), round(u[1] + (v[1] - u[1]) * t / m)] >= 2 for t in range(1, m))
    out = [r[0]]; k = 0
    while k < len(r) - 1:
        m = min(len(r) - 1, k + 60)
        while m > k + 1 and not libre(r[k], r[m]): m -= 1
        out.append(r[m]); k = m
    return [lonlat(*c) for c in out]
P = {'pireo': (23.60, 37.92), 'lequeo': (22.88, 37.96), 'cencreas': (23.01, 37.87), 'nisea': (23.37, 37.96), 'calcis': (23.63, 38.43), 'mileto': (27.20, 37.50),
     'giteo': (22.58, 36.74), 'nauplia': (22.81, 37.54), 'occidente': (19.5, 38.3), 'creta': (23.4, 34.8), 'helesponto': (26.15, 40.0), 'chipre': (28.2, 35.2), 'tasos': (24.6, 40.55)}
R = [('pireo', 'mileto', 'Atenas–Mileto'), ('pireo', 'calcis', 'Atenas–Calcis'), ('cencreas', 'pireo', 'Corinto–Atenas'), ('lequeo', 'occidente', 'Corinto–Occidente (Corcira, Siracusa)'),
     ('giteo', 'creta', 'Esparta–Creta'), ('nauplia', 'pireo', 'Argos–Atenas'), ('nisea', 'helesponto', 'Mégara–Helesponto (Bizancio)'), ('mileto', 'chipre', 'Mileto–Levante'),
     ('calcis', 'tasos', 'Calcis–Tracia'), ('giteo', 'occidente', 'Esparta–Tarento')]
rutas = [{'n': n, 'de': u, 'a': v, 'l': camino(P[u], P[v])} for u, v, n in R]
open(os.path.join(AQUI, 'rutas.js'), 'w').write('/* AQVILA · AM1 — rutas de barcos por el mar (lon, lat). Generado con generar-rutas.py a partir de grecia-alturas.png. */\nexport default ' + json.dumps(rutas, ensure_ascii=False, separators=(',', ':')) + ';\n')
for r in rutas: print(r['n'], len(r['l']))
