"""Utilidades de malla y de textura con numpy: aligerar (colapso de aristas con cuádricas), islas de UV,
empaquetado, rasterizado de triángulos en el atlas, vecino más cercano y desenfoque."""
import heapq, numpy as np

def cercano(A, B, trozo=2000):
    """Índice en B del punto más cercano a cada punto de A."""
    out = np.zeros(len(A), int)
    for i in range(0, len(A), trozo):
        d = ((A[i:i+trozo, None, :] - B[None]) ** 2).sum(-1); out[i:i+trozo] = d.argmin(1)
    return out

def islas(T, n):
    """Componentes conexas por vértices compartidos. Devuelve etiqueta por triángulo."""
    p = np.arange(n)
    def raiz(x):
        while p[x] != x: p[x] = p[p[x]]; x = p[x]
        return x
    for a, b, c in T:
        ra, rb, rc = raiz(a), raiz(b), raiz(c); p[rb] = ra; p[rc] = ra
    r = np.array([raiz(x) for x in T[:, 0]]); _, e = np.unique(r, return_inverse=True); return e

def aligerar(P, T, objetivo, peso=None, fijo=None, borde_fijo=False, costuras=True):
    """Colapsa aristas (u -> v, v se queda donde está, así los UV y los pesos no se inventan).
    Los vértices repetidos en la misma posición (costuras de UV) no se quitan. Devuelve (T nuevo, vértices usados)."""
    n = len(P); T = T.copy(); viva = np.ones(len(T), bool); peso = np.ones(n) if peso is None else peso
    _, inv, cnt = np.unique(np.round(P, 5), axis=0, return_inverse=True, return_counts=True); inv = inv.ravel(); bloqueado = (cnt[inv] > 1) if costuras else np.zeros(n, bool)
    if fijo is not None: bloqueado |= fijo
    caras = [set() for _ in range(n)]
    for i, t in enumerate(T):
        for v in t: caras[v].add(i)
    # borde: aristas con una sola cara
    ar = {}
    for i, t in enumerate(T):
        for k in range(3):
            e = (min(t[k], t[(k+1) % 3]), max(t[k], t[(k+1) % 3])); ar.setdefault(e, []).append(i)
    enborde = np.zeros(n, bool); aristaborde = set()
    for e, l in ar.items():
        if len(l) == 1: enborde[list(e)] = True; aristaborde.add(e)
    if borde_fijo: bloqueado |= enborde
    Q = np.zeros((n, 4, 4))
    def plano(t):
        a, b, c = P[t[0]], P[t[1]], P[t[2]]; nn = np.cross(b - a, c - a); ar2 = np.linalg.norm(nn)
        if ar2 < 1e-14: return None, 0
        nn /= ar2; return np.append(nn, -nn @ a), ar2 / 2
    for i, t in enumerate(T):
        pl, ar2 = plano(t)
        if pl is None: continue
        K = np.outer(pl, pl) * ar2 * peso[t].mean()
        for v in t: Q[v] += K
    for (a, b) in aristaborde:                             # plano perpendicular en los bordes: que no se encojan
        f = ar[(a, b)][0]; pl, _ = plano(T[f])
        if pl is None: continue
        d = P[b] - P[a]; l = np.linalg.norm(d); nn = np.cross(d, pl[:3]); nn /= max(np.linalg.norm(nn), 1e-12); K = np.outer(np.append(nn, -nn @ P[a]), np.append(nn, -nn @ P[a])) * l * l * 4
        Q[a] += K; Q[b] += K
    ver = np.zeros(n, int); vivo = np.ones(n, bool)
    def coste(u, v):
        if bloqueado[u]: return None
        if enborde[u] and not ((min(u, v), max(u, v)) in aristaborde): return None
        h = np.append(P[v], 1.0); return float(h @ (Q[u] + Q[v]) @ h)
    def vecinos(u):
        s = set()
        for f in caras[u]: s.update(T[f])
        s.discard(u); return s
    H = []
    def mete(u):
        for v in vecinos(u):
            c = coste(u, v)
            if c is not None: heapq.heappush(H, (c, u, v, ver[u], ver[v]))
    for u in range(n):
        if caras[u]: mete(u)
    nt = int(viva.sum())
    while nt > objetivo and H:
        c, u, v, vu, vv = heapq.heappop(H)
        if not vivo[u] or not vivo[v] or ver[u] != vu or ver[v] != vv: continue
        comunes = caras[u] & caras[v]
        if not (1 <= len(comunes) <= 2): continue
        # que no se vuelva ninguna cara y no se pellizque la malla
        nu, nv = vecinos(u), vecinos(v)
        if len(nu & nv) != len(comunes): continue
        ok = True
        for f in caras[u] - comunes:
            t = T[f]; a, b, c2 = P[t[0]], P[t[1]], P[t[2]]; n0 = np.cross(b - a, c2 - a); t2 = [v if x == u else x for x in t]; a, b, c2 = P[t2[0]], P[t2[1]], P[t2[2]]; n1 = np.cross(b - a, c2 - a)
            l0, l1 = np.linalg.norm(n0), np.linalg.norm(n1)
            if l1 < 1e-12 or (n0 @ n1) < 0.25 * l0 * l1: ok = False; break
        if not ok: continue
        for f in comunes:
            viva[f] = False; nt -= 1
            for x in T[f]: caras[x].discard(f)
        for f in list(caras[u]):
            T[f] = [v if x == u else x for x in T[f]]; caras[v].add(f)
        if enborde[u]:
            for w in nu:
                e = (min(u, w), max(u, w))
                if e in aristaborde: aristaborde.discard(e); aristaborde.add((min(v, w), max(v, w)))
        caras[u] = set(); vivo[u] = False; Q[v] += Q[u]; ver[v] += 1; mete(v)
        for w in vecinos(v): ver[w] += 1; mete(w)
    T2 = T[viva]; return T2

def compactar(T, *arr):
    usados = np.unique(T); m = -np.ones(max(len(a) for a in arr), int); m[usados] = np.arange(len(usados)); return m[T], [a[usados] for a in arr]

def empaquetar(tam, lado, margen=6):
    """Estantes: tam = [(ancho, alto)] en píxeles. Devuelve [(x, y)] o None si no cabe."""
    orden = sorted(range(len(tam)), key=lambda i: -tam[i][1]); pos = [None] * len(tam); x = y = margen; alto = 0
    for i in orden:
        w, h = tam[i]
        if x + w + margen > lado: x = margen; y += alto + margen; alto = 0
        if y + h + margen > lado: return None
        pos[i] = (x, y); x += w + margen; alto = max(alto, h)
    return pos

def rasterizar(lado, UV, T, attrs):
    """UV en píxeles. attrs: dict nombre -> (n, k). Devuelve dict nombre -> (lado, lado, k) y máscara."""
    out = {k: np.zeros((lado, lado, a.shape[1]), np.float32) for k, a in attrs.items()}; masc = np.zeros((lado, lado), bool)
    for t in T:
        p = UV[t]; x0, y0 = np.floor(p.min(0) - 1).astype(int); x1, y1 = np.ceil(p.max(0) + 1).astype(int); x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, lado - 1), min(y1, lado - 1)
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5); d = (p[1, 1] - p[2, 1]) * (p[0, 0] - p[2, 0]) + (p[2, 0] - p[1, 0]) * (p[0, 1] - p[2, 1])
        if abs(d) < 1e-9: continue
        a = ((p[1, 1] - p[2, 1]) * (xs - p[2, 0]) + (p[2, 0] - p[1, 0]) * (ys - p[2, 1])) / d; b = ((p[2, 1] - p[0, 1]) * (xs - p[2, 0]) + (p[0, 0] - p[2, 0]) * (ys - p[2, 1])) / d; c = 1 - a - b
        e = -0.6 / max(1.0, np.sqrt(abs(d)))                 # un poco de holgura para tapar costuras
        m = (a >= e) & (b >= e) & (c >= e)
        if not m.any(): continue
        sub = masc[y0:y1+1, x0:x1+1]; nuevo = m & ~sub | (m & (a >= 0) & (b >= 0) & (c >= 0))
        for k, A in attrs.items():
            v = a[..., None] * A[t[0]] + b[..., None] * A[t[1]] + c[..., None] * A[t[2]]; out[k][y0:y1+1, x0:x1+1][nuevo] = v[nuevo]
        sub |= m
    return out, masc

def dilatar(masc, capas, veces=6):
    """Rellena el borde de las islas con el vecino para que no sangre el fondo."""
    m = masc.copy()
    for _ in range(veces):
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            v = np.roll(m, (dy, dx), (0, 1)); n = v & ~m
            if dy == 1: n[0] = False
            if dy == -1: n[-1] = False
            if dx == 1: n[:, 0] = False
            if dx == -1: n[:, -1] = False
            for c in capas: c[n] = np.roll(c, (dy, dx), (0, 1))[n]
            m |= n
    return m

def desenfocar(a, r):
    """Desenfoque de caja repetido (casi gaussiano) en las dos primeras dimensiones."""
    for _ in range(2):
        for ax in (0, 1):
            c = np.cumsum(np.pad(a, [(r + 1, r) if i == ax else (0, 0) for i in range(a.ndim)], mode='edge'), axis=ax)
            a = (np.take(c, np.arange(2 * r + 1, c.shape[ax]), axis=ax) - np.take(c, np.arange(0, c.shape[ax] - 2 * r - 1), axis=ax)) / (2 * r + 1)
    return a

def ruido(forma, escalas, semilla=1, pesos=None):
    """Ruido de valor por octavas en 2D, periódico. escalas = celdas por lado."""
    h, w = forma; r = np.random.default_rng(semilla); out = np.zeros(forma, np.float32); pesos = pesos or [1 / (i + 1) for i in range(len(escalas))]
    ys, xs = np.mgrid[0:h, 0:w]
    for k, p in zip(escalas, pesos):
        g = r.random((k, k)).astype(np.float32); fx = xs * k / w; fy = ys * k / h; i = fx.astype(int) % k; j = fy.astype(int) % k; u = fx - np.floor(fx); v = fy - np.floor(fy); u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v)
        out += p * ((g[j, i] * (1 - u) + g[j, (i + 1) % k] * u) * (1 - v) + (g[(j + 1) % k, i] * (1 - u) + g[(j + 1) % k, (i + 1) % k] * u) * v)
    return out / sum(pesos)
