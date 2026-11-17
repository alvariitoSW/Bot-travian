"""Piezas del equipo, hechas por código (arte propio del proyecto). Cada pieza es una isla del atlas.
Unidades: metros. x a la izquierda del soldado, y arriba, z al frente. Materiales: ver MAT."""
import numpy as np, exportar as X, poses
MAT = dict(piel=1, ojo=2, tela=3, malla=4, bronce=5, hierro=6, madera=7, cuero=8, escudo=9, pluma=10, tablas=11, pelo=12, cuadros=13, escudo_galo=14, oro=15, suela=16, hueso=17)
TAU = 2 * np.pi

def pieza(nombre, P, T, UV, mat, tam, hueso=None, W=None, conj=0, prio=1.0, prm=None, aux=None, N=None, suave=True, tinte=0):
    P = np.asarray(P, float); T = np.asarray(T, int); UV = np.asarray(UV, float); n = len(P)
    if not suave:                                              # caras planas: un vértice por esquina
        k = T.ravel(); P, UV = P[k], UV[k]; prm = None if prm is None else np.asarray(prm)[k]; aux = None if aux is None else np.asarray(aux)[k]; W = None if W is None else W[k]; T = np.arange(len(k)).reshape(-1, 3); n = len(P); N = None
    mn, mx = UV.min(0), UV.max(0); UV = (UV - mn) / np.maximum(mx - mn, 1e-9)
    return dict(nombre=nombre, P=P, T=T, UV=UV, mat=np.full(n, mat) if np.isscalar(mat) else np.asarray(mat), tam=tam, hueso=hueso, W=W, conj=conj, prio=prio,
                prm=np.zeros((n, 2)) if prm is None else np.asarray(prm, float), aux=np.zeros((n, 2)) if aux is None else np.asarray(aux, float), N=X.normales(P, T, True) if N is None else N, tinte=tinte)

def rej(fn, nu, nv, cierra=False):
    """Rejilla (nu+1)x(nv+1). fn(u, v) -> punto. Devuelve P, UV, T."""
    us = np.linspace(0, 1, nu + 1); vs = np.linspace(0, 1, nv + 1); P = np.array([fn(u, v) for v in vs for u in us]); UV = np.array([[u, v] for v in vs for u in us]); T = []
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i; b = a + 1; c = a + nu + 1; d = c + 1; T += [[a, b, d], [a, d, c]]
    return P, UV, np.array(T)

def torno(perfil, lados, base, eje, lado1, eliptico=1.0, tapa=False):
    """Perfil [(radio, altura)] girado alrededor de «eje» desde «base». Devuelve P, UV, T y tam (perímetro, largo)."""
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); a = np.asarray(lado1, float); a = a - eje * (a @ eje); a /= np.linalg.norm(a); b = np.cross(eje, a); perfil = np.asarray(perfil, float)
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(perfil, axis=0), axis=1))])
    def fn(u, v):
        k = v * (len(perfil) - 1); i = min(int(k), len(perfil) - 2); f = k - i; r, h = perfil[i] * (1 - f) + perfil[i + 1] * f; return np.asarray(base) + eje * h + (a * np.cos(u * TAU) + b * np.sin(u * TAU) * eliptico) * r
    P, UV, T = rej(fn, lados, len(perfil) - 1); UV[:, 1] = np.repeat(L / max(L[-1], 1e-9), lados + 1)
    return P, UV, T, (TAU * perfil[:, 0].max(), L[-1])

def desenrollar(P, T, centro, eje, ref):
    """UV cilíndrica (ángulo, altura) con costura donde el ángulo salta. Duplica los vértices de la costura. Devuelve índices, UV, T."""
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); a = np.asarray(ref, float); a -= eje * (a @ eje); a /= np.linalg.norm(a); b = np.cross(eje, a); q = P - centro
    ang = np.arctan2(q @ b, q @ a); alt = q @ eje; idx = list(range(len(P))); U = list(ang); extra = {}; T2 = []
    for t in T:
        an = ang[t]
        if an.max() - an.min() > np.pi:
            tt = []
            for v in t:
                if ang[v] < 0:
                    if v not in extra: extra[v] = len(idx); idx.append(v); U.append(ang[v] + TAU)
                    tt.append(extra[v])
                else: tt.append(v)
            T2.append(tt)
        else: T2.append(list(t))
    idx = np.array(idx); return idx, np.stack([np.array(U), alt[idx]], 1), np.array(T2)

def suavizar(P, T, veces=2, k=0.5, fijo=None):
    n = len(P); V = [set() for _ in range(n)]
    for a, b, c in T: V[a] |= {b, c}; V[b] |= {a, c}; V[c] |= {a, b}
    for _ in range(veces):
        Q = P.copy()
        for i in range(n):
            if V[i] and not (fijo is not None and fijo[i]): Q[i] = P[i] * (1 - k) + P[list(V[i])].mean(0) * k
        P = Q
    return P

# ---------- piezas rígidas ----------
def escudo_oval(h, alto=1.16, ancho=0.66, R=0.46, n=3.0, mat='escudo', espina=True, cantos=True, nombre='escudo', hueso='wrist.L', umbo_hierro=True):
    """Escudo oval curvo, de agarre horizontal central. h = marco de la mano. Frente hacia N."""
    o = h['c']; Xa, Ya, Na = h['X'], h['Y'], h['N']; Z0 = 0.045
    def sup(u, v, dz=0.0):
        vv = (v * 2 - 1) * 0.992; w = ancho / 2 * (1 - abs(vv) ** n) ** (1 / n); x = (u * 2 - 1) * w; al = x / R
        return np.array([R * np.sin(al), vv * alto / 2, R * np.cos(al) - R + dz]), np.array([np.sin(al), 0, np.cos(al)])
    def M(p): return o + Xa * p[0] + Ya * p[1] + Na * (p[2] + Z0)
    out = []
    P, UV, T = rej(lambda u, v: M(sup(u, v)[0]), 12, 18); loc = np.array([sup(u, v)[0][:2] for u, v in UV])
    out.append(pieza(nombre + '_frente', P, T, UV, MAT[mat], (ancho, alto), hueso, prm=loc, aux=np.stack([UV[:, 1] * 2 - 1, UV[:, 0] * 2 - 1], 1), tinte=3))
    P, UV, T = rej(lambda u, v: M(sup(u, v)[0] - sup(u, v)[1] * 0.012), 8, 12); loc = np.array([sup(u, v)[0][:2] for u, v in UV])
    out.append(pieza(nombre + '_dorso', P, T[:, ::-1], UV, MAT['tablas'], (ancho, alto), hueso, prm=loc, prio=0.55))
    # canto: tira alrededor del borde
    K = 44; ang = np.linspace(0, TAU, K + 1)
    def borde(u, v):
        a = u * TAU; c, s = np.cos(a), np.sin(a); vv = np.clip(s, -1, 1) * 0.992; w = ancho / 2 * (1 - abs(vv) ** n) ** (1 / n); x = np.sign(c) * w * min(1.0, abs(c) * 3.0 + 0.0) if abs(vv) > 0.9 else np.sign(c) * w
        al = x / R; p = np.array([R * np.sin(al), vv * alto / 2, R * np.cos(al) - R]); nn = np.array([np.sin(al), 0, np.cos(al)]); return M(p + nn * (0.004 - 0.02 * v))
    P, UV, T = rej(borde, K, 1); out.append(pieza(nombre + '_canto', P, T, UV, MAT['hierro'] if cantos else MAT['madera'], (2.9, 0.03), hueso, prm=UV * [2.9, 0.02], prio=0.7))
    if espina:                                                 # nervio de madera con el huso del umbo
        def esp(u, v):
            y = (v * 2 - 1) * alto * 0.46; g = np.exp(-(y / 0.105) ** 2); fin = np.clip((1 - abs(v * 2 - 1)) * 9, 0, 1); w = (0.012 + 0.043 * g) * (0.35 + 0.65 * fin); hh = (0.011 + 0.040 * g) * (0.3 + 0.7 * fin); a = (u - 0.5) * np.pi
            return M(np.array([np.sin(a) * w, y, np.cos(a) * hh - 0.002]))
        P, UV, T = rej(esp, 6, 26); yy = (UV[:, 1] * 2 - 1) * alto * 0.46; m = np.where(np.abs(yy) < 0.075, MAT['hierro'], MAT[mat]) if umbo_hierro else MAT['madera']
        out.append(pieza(nombre + '_espina', P, T, UV, m, (0.14, alto * 0.92), hueso, prm=np.stack([(UV[:, 0] - 0.5) * 0.14, yy], 1), aux=np.stack([np.abs(yy), UV[:, 0]], 1), tinte=3))
    # asa: barra horizontal en el hueco del umbo
    P, UV, T, tam = torno([(0.0, -0.07), (0.016, -0.07), (0.016, 0.07), (0.0, 0.07)], 8, o, Xa, Na); out.append(pieza(nombre + '_asa', P, T, UV, MAT['madera'], tam, hueso, prm=UV * tam, prio=0.5))
    return out

def espada(base, eje, ancho_dir, hueso, conj, largo=0.63, ancho=0.052, nombre='espada', solo_puno=False, gala=False):
    """Gladius hispaniensis: hoja de doble filo algo entallada y punta larga. base = centro del puño; eje = hacia la punta."""
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); a = np.asarray(ancho_dir, float); a -= eje * (a @ eje); a /= np.linalg.norm(a); b = np.cross(eje, a); out = []
    P, UV, T, tam = torno([(0.0, -0.080), (0.019, -0.074), (0.024, -0.060), (0.019, -0.047), (0.013, -0.043), (0.0155, -0.03), (0.0145, 0.0), (0.0155, 0.03), (0.013, 0.043)], 8, base, eje, a, 0.8)
    out.append(pieza(nombre + '_puno', P, T, UV, np.where((UV[:, 1] > 0.36) & (UV[:, 1] < 0.93), MAT['hueso'], MAT['madera']), tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.2))
    P, UV, T, tam = torno([(0.0, 0.041), (0.034, 0.043), (0.036, 0.052), (0.030, 0.058), (0.0, 0.059)], 10, base, eje, a, 0.45); out.append(pieza(nombre + '_guarda', P, T, UV, MAT['madera'] if not gala else MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam))
    if solo_puno: return out
    S = 9; ss = np.linspace(0, 1, S + 1)
    def w(s): return ancho / 2 * ((1 - 0.16 * np.sin(np.pi * min(s / 0.72, 1.0))) if s < 0.72 else (1 - 0.0) * max(0.0, (1 - s) / 0.28) ** 0.85) if not gala else ancho / 2 * (1.0 if s < 0.88 else max(0.0, (1 - s) / 0.12) ** 0.7)
    P, UV, T = [], [], []
    for i, s in enumerate(ss):
        y = 0.058 + s * largo; ww = max(w(s), 0.0008); g = 0.0045 * (1 - 0.5 * s)
        for k, (dx, dz) in enumerate(((-ww, 0), (0, g), (ww, 0), (0, -g), (-ww, 0))): P.append(base + eje * y + a * dx + b * dz); UV.append([k / 4, s])
    for i in range(S):
        for k in range(4):
            p = i * 5 + k; q = p + 5; T += [[p, p + 1, q + 1], [p, q + 1, q]]
    UV = np.array(UV); out.append(pieza(nombre + '_hoja', np.array(P), np.array(T), UV, MAT['hierro'], (ancho * 2.1, largo), hueso, conj=conj, prm=UV * [ancho * 2, largo], aux=np.stack([np.abs(UV[:, 0] * 4 % 2 - 1), UV[:, 1]], 1), suave=False, prio=1.2))
    return out

def vaina(boca, eje, plano_n, hueso, largo=0.66, ancho=0.062, nombre='vaina'):
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); n = np.asarray(plano_n, float); n -= eje * (n @ eje); n /= np.linalg.norm(n); a = np.cross(n, eje)
    perf = [(0.0, 0.0), (ancho / 2, 0.0), (ancho / 2, 0.02), (ancho / 2 * 0.97, largo * 0.5), (ancho / 2 * 0.86, largo * 0.72), (ancho / 2 * 0.42, largo * 0.95), (0.014, largo), (0.0, largo + 0.012)]
    P, UV, T, tam = torno(perf, 10, boca, eje, a, 0.3); return [pieza(nombre, P, T, UV, MAT['cuero'], tam, hueso, prm=UV * tam, aux=np.stack([UV[:, 1], np.abs(np.cos(UV[:, 0] * TAU))], 1))]

def pilum(agarre, eje, lado, hueso, conj, bajo=1.0, nombre='pilum'):
    """Pilum pesado: asta de madera, taco piramidal con remaches, vástago de hierro y punta. eje = hacia la punta."""
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); base = np.asarray(agarre) - eje * bajo; out = []
    P, UV, T, tam = torno([(0.0, -0.06), (0.006, -0.05), (0.0135, 0.0), (0.0145, 0.6), (0.0155, 1.22), (0.0165, 1.30)], 8, base, eje, lado); out.append(pieza(nombre + '_asta', P, T, UV, MAT['madera'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1] * 1.36, UV[:, 0]], 1)))
    P, UV, T, tam = torno([(0.0165, 1.30), (0.024, 1.305), (0.021, 1.36), (0.011, 1.43), (0.0075, 1.44)], 4, base, eje, lado, 0.62); out.append(pieza(nombre + '_taco', P, T, UV, MAT['madera'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([1.36 + UV[:, 1] * 0.0, UV[:, 0]], 1), suave=False))
    P, UV, T, tam = torno([(0.0075, 1.44), (0.0055, 1.60), (0.0048, 1.96), (0.011, 1.975), (0.0, 2.035)], 4, base, eje, lado); out.append(pieza(nombre + '_hierro', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1), suave=False))
    return out

def lanza(agarre, eje, lado, hueso, conj, largo=2.3, bajo=1.05, nombre='lanza'):
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); base = np.asarray(agarre) - eje * bajo; out = []
    P, UV, T, tam = torno([(0.0, -0.03), (0.011, 0.0), (0.0135, 0.5), (0.0125, largo - 0.33)], 8, base, eje, lado); out.append(pieza(nombre + '_asta', P, T, UV, MAT['madera'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1] * largo, UV[:, 0]], 1)))
    P, UV, T, tam = torno([(0.0125, largo - 0.34), (0.014, largo - 0.26), (0.009, largo - 0.25), (0.030, largo - 0.17), (0.022, largo - 0.08), (0.0, largo)], 4, base, eje, lado, 0.18); out.append(pieza(nombre + '_punta', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1)))
    return out

def yelmo(mh, plumas=True, carrilleras=True, nombre='yelmo', mat='bronce'):
    """Montefortino: cuenco algo cónico con botón, cubrenuca corto, borde grueso y carrilleras. Medido sobre la cabeza."""
    V = mh['V']; cu = np.array(sorted({p[0] for f, g in zip(mh['F'], mh['G']) if g == 'body' for p in f})); H = V[cu][mh['W']['head'][cu] > 0.9]
    arr = H[H[:, 1] > 1.655]; cz = (arr[:, 2].min() + arr[:, 2].max()) / 2; ax = np.abs(arr[:, 0]).max() + 0.011; az = (arr[:, 2].max() - arr[:, 2].min()) / 2 + 0.012; ytop = H[:, 1].max() + 0.016
    yf, yb = 1.664, 1.612
    def yr(t): return (yf + yb) / 2 + (yf - yb) / 2 * np.cos(t)
    perf = [(1.075, -0.004), (1.085, 0.004), (1.05, 0.012), (1.012, 0.016)] + [((1 - h ** 2.0) ** (1 / 2.5), h) for h in (0.1, 0.24, 0.38, 0.52, 0.65, 0.76, 0.85, 0.915, 0.955)] + [(0.115, 0.985), (0.105, 1.03), (0.17, 1.08), (0.20, 1.14), (0.15, 1.21), (0.06, 1.24)]
    def cuenco(u, v):
        t = u * TAU; k = v * (len(perf) - 1); i = min(int(k), len(perf) - 2); f = k - i; r, hh = np.array(perf[i]) * (1 - f) + np.array(perf[i + 1]) * f
        y0 = yr(t); y = y0 + hh if i < 3 or (i == 3 and f == 0) else y0 + 0.016 + (ytop - y0 - 0.016) * hh if hh <= 0.985 else ytop + (hh - 0.985) * 0.2
        return np.array([np.sin(t) * ax * r, y, cz + np.cos(t) * az * r])
    P, UV, T = rej(cuenco, 24, len(perf) - 1); out = [pieza(nombre + '_cuenco', P, T, UV, MAT[mat], (0.66, 0.26), 'head', prm=UV * [0.66, 0.26], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.5)]
    def nuca(u, v):
        t = np.pi + (u - 0.5) * np.radians(150); tp = np.cos((u - 0.5) * np.pi) ** 0.6; r = 1.075 + 0.42 * v * tp; return np.array([np.sin(t) * ax * r, yr(t) - 0.004 - 0.016 * v * tp, cz + np.cos(t) * az * r])
    P, UV, T = rej(nuca, 10, 2); out.append(pieza(nombre + '_nuca', P, T, UV, MAT[mat], (0.25, 0.05), 'head', prm=UV * [0.25, 0.05], prio=1.2))
    if carrilleras:
        for s, L in ((1, 'L'), (-1, 'R')):
            def car(u, v):
                fr = 0.06 + 0.16 * np.sin(np.pi * min(v / 0.62, 1.0)) ** 2 * (v < 0.62) + 0.34 * max(0.0, v - 0.62) ** 1.3; tr = 1.0 - 0.10 * v - 0.5 * max(0.0, v - 0.45) ** 1.6; uu = fr + (tr - fr) * u
                t = np.radians(44 + 50 * uu); k = 1.03 - 0.10 * v ** 1.5; y = yr(t) - 0.002 - 0.108 * v
                return np.array([s * np.sin(t) * ax * k, y, cz + np.cos(t) * az * k + 0.010 * v])
            P, UV, T = rej(car, 6, 9); out.append(pieza(nombre + '_carrillera' + L, P, T[:, ::-1] if s > 0 else T, UV, MAT[mat], (0.08, 0.12), 'head', prm=UV * [0.08, 0.12], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.4))
    if plumas:
        top = np.array([0, ytop + 0.045, cz])
        for k, (ang, lean) in enumerate(((0, 0.0), (-0.42, 0.10), (0.42, 0.10))):
            def plu(u, v):
                Lg = 0.33 * (1.0 if k == 0 else 0.9); w = 0.030 * np.sin(np.pi * min(v * 1.1 + 0.05, 1.0)) ** 0.55 * (1 - 0.35 * v); x = (u - 0.5) * 2 * w; fold = -abs(u - 0.5) * 0.012; curva = -0.11 * v * v * Lg
                p = np.array([x, v * Lg, curva + fold]); c, s = np.cos(ang), np.sin(ang); return top + np.array([p[0] * 1.0 + s * p[1] * 0.0, p[1] * np.cos(lean) , p[2] - 0.0 * k]) + np.array([np.sin(ang) * v * Lg * 0.45, -0.01 * abs(ang) * v, 0])
            P, UV, T = rej(plu, 2, 8); out.append(pieza(nombre + '_pluma%d' % k, P, T, UV, MAT['pluma'], (0.07, 0.33), 'head', prm=UV * [0.07, 0.33], aux=np.stack([np.abs(UV[:, 0] - 0.5) * 2, UV[:, 1]], 1)))
    return out

def suela(mh, L):
    V = mh['V']; cu = np.array(sorted({p[0] for f, g in zip(mh['F'], mh['G']) if g == 'body' for p in f})); s = 1 if L == 'L' else -1
    pie = V[cu][(V[cu, 1] < 0.045) & (V[cu, 0] * s > 0)]; pts = pie[:, [0, 2]]
    # envolvente convexa (cadena monótona)
    q = sorted(map(tuple, np.round(pts, 4))); cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); lo, up = [], []
    for p in q:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(q):
        while len(up) >= 2 and cr(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    hull = np.array(lo[:-1] + up[:-1]); c = hull.mean(0); hull = c + (hull - c) * 1.03; n = len(hull); P, UV, T = [], [], []
    for i, (x, z) in enumerate(hull): P += [[x, 0.012, z], [x, -0.004, z]]; UV += [[i / n, 0], [i / n, 1]]
    for i in range(n):
        a, b = 2 * i, 2 * ((i + 1) % n); T += [[a, b, b + 1], [a, b + 1, a + 1]]
    k = len(P); P.append([c[0], 0.012, c[1]]); UV.append([0.5, 0.5])
    for i in range(n): T.append([2 * i, k, 2 * ((i + 1) % n)])
    return [pieza('suela' + L, np.array(P), np.array(T)[:, ::-1], np.array(UV), MAT['suela'], (0.3, 0.03), 'foot.' + L, prio=0.5)]
