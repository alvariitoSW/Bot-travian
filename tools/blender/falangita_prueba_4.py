"""FA2 · PRUEBA 4 «Esculpido + piel y materiales de foto»: falangita macedonio, en la postura «quieto» del juego.

Une la prueba 1 (cuerpo y equipo esculpidos por código, calcados a un modelo ligero) y la prueba 3 (materiales de foto),
con material libre nuevo:
- Piel: textura de foto de MakeHuman (piel clara de varón joven), sacada del GLB de Patch y llevada a moreno mediterráneo.
  Usa el desplegado UV del cuerpo base de MakeHuman, el mismo que nuestro cuerpo: se aplica directa. Barba corta, cejas,
  pelo bajo el casco, rojeces y polvo de las piernas se pintan encima por vértice.
- Bronce (casco, escudo, grebas): fotos de metal envejecido de ambientCG, teñidas a bronce.
- Lino (coraza, hombreras, pteruges) y túnica (teñida de rojo apagado): lino basto de Poly Haven.
- Cuero (correas, cordones, zapatos): cuero de Poly Haven. Madera de la sarisa: veta hecha por código.
Se calca en reposo (como la prueba 1) y luego se dobla SOLO el modelo ligero con el primer cuadro del movimiento «quieto»
del juego (assets/soldados/movimientos_sarisa_74.bin; su esqueleto es el de MakeHuman). Sarisa y escudo se colocan sobre el
eje y el plano de los del juego en esa postura, para que los dedos cierren sobre el asta y el escudo quede pegado al cuerpo.

Uso (entorno del taller cargado: source /opt/aqvila-taller/entorno.sh):
  blender-py tools/blender/falangita_prueba_4.py -- material=/ruta/bajado trabajo=/ruta/scratch fotos=gobierno/capturas-tarea [res=2048] [muestras=64] [rapido=1]
«material» es la carpeta con el material de Patch (human-0350.glb, metal008/, metal017/, roughLinen/, brownLeather/, CREDITS.md).

Obras de terceros usadas (todas CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/; créditos copiados de CREDITS.md):
| Obra | Autor | Licencia | URL |
| Man in a white t-shirt and jeans (human-0350.glb; solo su textura de piel) | Patch, con MPFB y piezas CC0 de MakeHuman team | CC0 1.0 | https://github.com/makehumancommunity/mpfb2/tree/d0a32e57a7f915cb2f2b95410e2117648c7bbb7e |
| "Metal 008" | ambientCG | CC0 1.0 | https://ambientcg.com/a/Metal008 |
| "Metal 017" | ambientCG | CC0 1.0 | https://ambientcg.com/a/Metal017 |
| "Rough Linen" | colormass y Rico Cilliers (Poly Haven) | CC0 1.0 | https://polyhaven.com/a/rough_linen |
| "Brown Leather" | Rob Tuytel (Poly Haven) | CC0 1.0 | https://polyhaven.com/a/brown_leather |
Patch cambió: quitó la piel bajo la ropa, esqueleto de motor de juego, GLB reempaquetado; mapas 1K en JPEG.
Cuerpo: malla base y deformadores de MakeHuman (CC0 1.0), leídos con gobierno/maquetas/soldado-rome2/construir/mh.py.
Equipo y su forma: hecho aquí por código, arte propio de AQVILA. Nada copiado de otros juegos (Total War: solo ideas).
Historia: mismas fuentes que tools/blender/falangita_macedonio.py (escudo de 8 palmos, casco frigio, linotórax).
La estrella de 8 puntas y las lúnulas repujadas del escudo son licencia de juego.
"""
import bpy, numpy as np, math, os, sys, time, json
from mathutils import Vector
T0 = time.time()
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
sys.path.insert(0, os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'))
import mh
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
TRAB = ARG.get('trabajo', '/tmp/falangita_p4'); MATDIR = ARG.get('material', ''); FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea'))
RAPIDO = ARG.get('rapido') == '1'; RES = int(ARG.get('res', 1024 if RAPIDO else 2048)); MUESTRAS = int(ARG.get('muestras', 16 if RAPIDO else 64))
os.makedirs(TRAB, exist_ok=True)
assert os.path.isdir(MATDIR), 'falta material=/carpeta/del/material/de/Patch'
RNG = np.random.default_rng(7)
def nota(*a): print('[P4 %5.0fs]' % (time.time() - T0), *a, flush=True)

# ================================================================ geometría en numpy (coordenadas MakeHuman: Y arriba, mira a +Z)
def nrm(v): v = np.asarray(v, float); return v / (np.linalg.norm(v, axis=-1, keepdims=True) + 1e-12)
def smooth(x, a=0.0, b=1.0): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def rejilla(fn, nu, nv, cerrado=True, polo=False):
    """Superficie (u, v) en [0,1]^2. cerrado: u da la vuelta. polo: la última fila se cierra en un punto."""
    us = np.arange(nu) / nu if cerrado else np.linspace(0, 1, nu + 1); cu = len(us)
    filas = nv if polo else nv + 1
    P = [fn(u, v) for v in np.linspace(0, 1, nv + 1)[:filas] for u in us]
    F = []
    for j in range(nv):
        for i in range(nu):
            a = j * cu + i; b = j * cu + (i + 1) % cu
            if polo and j == nv - 1: F.append([a, b, filas * cu])
            else: F.append([a, b, b + cu, a + cu])
    if polo: P.append(fn(0.0, 1.0))
    return np.array(P, float), F

def normal_cara(P, f):
    if len(f) == 4: return np.cross(P[f[2]] - P[f[0]], P[f[3]] - P[f[1]])
    return np.cross(P[f[1]] - P[f[0]], P[f[2]] - P[f[0]])

def orientar(P, F, fuera):
    """Da la vuelta a las caras cuya normal no apunta hacia fuera(c)."""
    out = []
    for f in F:
        c = P[f].mean(0)
        out.append(f[::-1] if normal_cara(P, f) @ fuera(c) < 0 else f)
    return out

def normales_v(P, F):
    N = np.zeros_like(P)
    for f in F:
        n = normal_cara(P, f)
        for i in f: N[i] += n
    return nrm(N)

def engrosar(P, F, g):
    """Solidifica hacia dentro con canto (borde) de grosor g."""
    n = len(P); N = normales_v(P, F); Q = np.vstack([P, P - N * g])
    G = [list(f) for f in F] + [[i + n for i in f[::-1]] for f in F]
    cnt, dirE = {}, {}
    for f in F:
        for i in range(len(f)):
            a, b = f[i], f[(i + 1) % len(f)]; k = (min(a, b), max(a, b)); cnt[k] = cnt.get(k, 0) + 1; dirE[k] = (a, b)
    for k, c in cnt.items():
        if c == 1: a, b = dirE[k]; G.append([b, a, a + n, b + n])
    return Q, G

def unir(partes):
    P, F, C, o = [], [], [], 0
    for p in partes:
        P.append(p[0]); F += [[i + o for i in f] for f in p[1]]
        C.append(p[2] if len(p) > 2 and p[2] is not None else np.ones((len(p[0]), 3)))
        o += len(p[0])
    return np.vstack(P), F, np.vstack(C)

def torno(perfil, lados, base, eje, ref, aplast=1.0):
    """Sólido de revolución. perfil: [(radio, altura)] de abajo arriba; los extremos de radio 0 cierran."""
    eje = nrm(eje); e1 = nrm(ref - eje * (ref @ eje)); e2 = np.cross(eje, e1); P, F = [], []
    for r, z in perfil:
        for k in range(lados):
            a = 2 * np.pi * k / lados; P.append(base + eje * z + (e1 * np.cos(a) + e2 * np.sin(a) * aplast) * r)
    for j in range(len(perfil) - 1):
        for k in range(lados):
            a = j * lados + k; b = j * lados + (k + 1) % lados; F.append([a, b, b + lados, a + lados])
    P = np.array(P); F = orientar(P, F, lambda c: c - (base + eje * ((c - base) @ eje)))
    return P, F

def caja(c, X, Y, Z, h):
    s = np.array([[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], float) * h
    P = c + s[:, :1] * X + s[:, 1:2] * Y + s[:, 2:] * Z
    F = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [3, 0, 4, 7]]
    return P, orientar(P, F, lambda q: q - c)

def esfera(c, r, nu, nv):
    P, F = rejilla(lambda u, v: c + r * np.array([np.sin(np.pi * v) * np.sin(2 * np.pi * u), np.cos(np.pi * v), np.sin(np.pi * v) * np.cos(2 * np.pi * u)]), nu, nv)
    return P, orientar(P, F, lambda q: q - c)

class Radial:
    """Radio del cuerpo alrededor de un eje, por altura t (0..1 del eje) y ángulo a (0 = ref)."""
    def __init__(s, P, e0, e1, ref, t0, t1, nt=36, na=72, banda=0.012):
        e0 = np.asarray(e0, float); d = np.asarray(e1, float) - e0; s.L = np.linalg.norm(d); s.d = d / s.L
        s.e1 = nrm(ref - s.d * (ref @ s.d)); s.e2 = np.cross(s.d, s.e1); s.e0 = e0; s.na = na
        Q = P - e0; t = Q @ s.d / s.L; x = Q @ s.e1; y = Q @ s.e2; a = np.arctan2(y, x); r = np.hypot(x, y)
        s.ts = np.linspace(t0, t1, nt); R = np.zeros((nt, na)); idx = np.arange(na)
        for i, tt in enumerate(s.ts):
            k = np.abs(t - tt) * s.L < banda; b = ((a[k] + np.pi) / (2 * np.pi) * na).astype(int) % na
            row = np.full(na, -1.0); np.maximum.at(row, b, r[k]); ok = row > 0
            row = np.interp(idx, idx[ok], row[ok], period=na) if ok.sum() > 2 else np.full(na, 0.05)
            for _ in range(3): row = (np.roll(row, 1) + 2 * row + np.roll(row, -1)) / 4
            R[i] = row
        for _ in range(2): R[1:-1] = (R[:-2] + 2 * R[1:-1] + R[2:]) / 4
        s.R = R
    def r(s, t, a):
        fi = np.interp(t, s.ts, np.arange(len(s.ts))); i0 = int(min(np.floor(fi), len(s.ts) - 2)); w = fi - i0
        fa = ((a + np.pi) / (2 * np.pi) * s.na - 0.5) % s.na; j0 = int(np.floor(fa)) % s.na; j1 = (j0 + 1) % s.na; u = fa - np.floor(fa); R = s.R
        return (1 - w) * ((1 - u) * R[i0, j0] + u * R[i0, j1]) + w * ((1 - u) * R[i0 + 1, j0] + u * R[i0 + 1, j1])
    def p(s, t, a, rr): return s.e0 + s.d * s.L * t + (s.e1 * np.cos(a) + s.e2 * np.sin(a)) * rr
    def fuera(s, c): q = c - s.e0; return q - s.d * (q @ s.d)

def tubo(rad, t0, t1, nu, nv, off, a0=-np.pi, a1=np.pi, extra=None):
    cerrado = (a1 - a0) > 6.2
    def fn(u, v):
        a = a0 + (a1 - a0) * u; t = t0 + (t1 - t0) * v; q = rad.p(t, a, rad.r(t, a) + off(t, a, v))
        return q + (extra(t, a, v) if extra else 0)
    P, F = rejilla(fn, nu, nv, cerrado=cerrado)
    return P, orientar(P, F, rad.fuera)

# ================================================================ cuerpo (MakeHuman, CC0)
REC = {'macrodetails/universal-male-young-maxmuscle-averageweight': 0.55, 'macrodetails/universal-male-young-maxmuscle-minweight': 0.45,
       'macrodetails/caucasian-male-young': 1.0}
m = mh.construir(REC); V = m['V']; W = m['W']; J = m['cab']
caras = [f for f, g in zip(m['F'], m['G']) if g == 'body']
vids = sorted({p[0] for f in caras for p in f}); remap = {v: i for i, v in enumerate(vids)}
Vb = V[vids]; Fb = [[remap[p[0]] for p in f] for f in caras]; Nb = normales_v(Vb, Fb)
Fb_uv = [[p[1] for p in f] for f in caras]; VT = m['VT']
def pw(*pat): return sum(W[k][vids] for k in W if any(s in k for s in pat))
brazo = pw('upperarm', 'lowerarm', 'wrist', 'finger', 'metacarpal')
torso_m = brazo < 0.25
ojo = {}
for L in 'lr':
    ii = sorted({p[0] for f, g in zip(m['F'], m['G']) if g == 'helper-%s-eye' % L for p in f}); c = V[ii].mean(0)
    ojo[L] = (c, np.linalg.norm(V[ii] - c, axis=1).mean() * 0.98)
EY = ojo['l'][0][1]; EZ = ojo['l'][0][2]
nota('cuerpo', len(Vb), 'vértices', len(Fb), 'caras')

# color de piel por vértice: tono, rojez en codos, rodillas, nudillos y cara; polvo en las piernas; cejas, barba de días, labios
piel = np.tile([0.47, 0.25, 0.15], (len(Vb), 1))
roj = np.zeros(len(Vb))
for k, rr in (('lowerarm01.L', 0.045), ('lowerarm01.R', 0.045), ('lowerleg01.L', 0.06), ('lowerleg01.R', 0.06)):
    roj += np.exp(-np.sum((Vb - J[k]) ** 2, 1) / rr ** 2)
roj += 0.6 * pw('finger', 'metacarpal'); roj += 0.5 * np.exp(-((Vb[:, 0] ** 2) / 0.03 ** 2 + (Vb[:, 1] - (EY - 0.02)) ** 2 / 0.025 ** 2)) * (Vb[:, 2] > EZ - 0.03)
mejilla = np.exp(-((np.abs(Vb[:, 0]) - 0.045) ** 2 + (Vb[:, 1] - (EY - 0.03)) ** 2) / 0.018 ** 2) * (Vb[:, 2] > EZ - 0.04); roj += 0.5 * mejilla
piel = piel * (1 - 0.45 * np.clip(roj, 0, 1)[:, None]) + np.array([0.52, 0.17, 0.11]) * 0.45 * np.clip(roj, 0, 1)[:, None]
polvo = smooth(0.62 - Vb[:, 1], 0, 0.55) * 0.6; piel = piel * (1 - polvo[:, None]) + np.array([0.40, 0.31, 0.21]) * polvo[:, None]
PIEL_MUL = piel / np.array([0.47, 0.25, 0.15])                       # rojeces y polvo, como factor sobre la piel de foto
ceja = np.exp(-((Vb[:, 1] - (EY + 0.020 + 0.004 * np.abs(Vb[:, 0]) / 0.05)) ** 2 / 0.0055 ** 2)) * smooth(np.abs(Vb[:, 0]), 0.008, 0.016) * (1 - smooth(np.abs(Vb[:, 0]), 0.050, 0.060)) * (Vb[:, 2] > EZ - 0.012)
piel = piel * (1 - 0.8 * ceja[:, None]) + np.array([0.04, 0.025, 0.015]) * 0.8 * ceja[:, None]
cara_front = Vb[:, 2] > EZ - 0.06
barba = smooth(EY - 0.035 - Vb[:, 1], 0, 0.02) * smooth(Vb[:, 1] - (EY - 0.13), 0, 0.02) * cara_front * (np.abs(Vb[:, 0]) < 0.07)
piel = piel * (1 - 0.28 * barba[:, None]) + np.array([0.10, 0.08, 0.07]) * 0.28 * barba[:, None]
_zb = Vb[(np.abs(Vb[:, 0]) < 0.01) & (np.abs(Vb[:, 1] - (EY - 0.068)) < 0.01), 2]; zboca = _zb.max() if len(_zb) else EZ
labio = np.exp(-((Vb[:, 0] / 0.024) ** 2 + ((Vb[:, 1] - (EY - 0.068)) / 0.009) ** 2)) * (Vb[:, 2] > zboca - 0.015)
piel = piel * (1 - 0.45 * labio[:, None]) + np.array([0.40, 0.13, 0.10]) * 0.45 * labio[:, None]

# el casco tapa el cráneo: fuera las caras de cabeza por encima del borde del casco
_cab = (Vb[:, 1] > EY + 0.005) & (pw('head') > 0.5)
_AX = np.abs(Vb[_cab, 0]).max(); _z0, _z1 = Vb[_cab, 2].min(), Vb[_cab, 2].max(); _CZ = (_z0 + _z1) / 2
_yf, _ys, _yk = EY + 0.034, EY + 0.012, EY - 0.030
_t = np.arctan2(Vb[:, 0], Vb[:, 2] - _CZ); _yr = (((_yf + _yk) / 2 + _ys) / 2) + (_yf - _yk) / 2 * np.cos(_t) + (((_yf + _yk) / 2 - _ys) / 2) * np.cos(2 * _t)
tapado = (Vb[:, 1] > _yr + 0.012) & (pw('head', 'neck') > 0.5)
Fb_casco = [f for f in Fb if not tapado[f].all()]; Fb_casco_uv = [u for f, u in zip(Fb, Fb_uv) if not tapado[f].all()]
nuca = (pw('head', 'neck') > 0.4) & (Vb[:, 2] < EZ - 0.100) & (Vb[:, 1] > EY - 0.080) & (np.abs(Vb[:, 0]) < 0.075)
patilla = (pw('head') > 0.5) & (np.abs(Vb[:, 0]) > 0.052) & (Vb[:, 2] > EZ - 0.075) & (Vb[:, 2] < EZ - 0.035) & (Vb[:, 1] > EY - 0.045) & (Vb[:, 1] < EY + 0.03)
PELO = np.clip(np.maximum.reduce([0.85 * ceja, 0.75 * barba, 0.9 * nuca, 0.8 * patilla]), 0, 1)   # cejas, barba corta y pelo bajo el casco

# ================================================================ piezas
ALTOS = []      # (grupo, nombre, P, F, color, material, subdividir)
BAJOS = {}      # grupo -> lista de (P, F)
def alto(g, nombre, P, F, mat, col=None, sub=0): ALTOS.append((g, nombre, P, F, col, mat, sub))
def bajo(g, P, F): BAJOS.setdefault(g, []).append((P, F))

# --- ojos
for L in 'lr':
    c, r = ojo[L]; P, F = esfera(c, r, 48, 24); d = nrm(P - c) @ np.array([0, 0, 1.0])
    col = np.where((d > 0.97)[:, None], [0.01, 0.008, 0.006], np.where((d > 0.86)[:, None], [0.09, 0.05, 0.022], [0.62, 0.57, 0.52]))
    alto('cuerpo', 'ojo_' + L, P, F, 'ojo', col); bajo('ojos', *esfera(c, r, 8, 6))
alto('cuerpo', 'cuerpo', Vb, Fb_casco, 'piel', PIEL_MUL, sub=2); CUERPO_EXTRA = dict(uv=Fb_casco_uv, extra={'pelo': PELO})

# --- túnica (lana teñida de rojo): parte alta del pecho, mangas cortas, falda
TELA = np.array([0.36, 0.075, 0.05])
rad_t = Radial(Vb[torso_m], (0, 0.95, -0.01), (0, 1.50, 0.0), np.array([0, 0, 1.0]), 0.0, 1.0)
yt = lambda y: (y - 0.95) / 0.55
def falda(nu, nv, pliegues):
    def off(t, a, v): return 0.012 + 0.07 * v ** 1.6 + (0.008 * np.sin(23 * a + 1.7 * np.sin(3 * a)) * (0.3 + v) if pliegues else 0)
    return tubo(rad_t, yt(0.995), yt(0.725), nu, nv, off)
def alto_tunica_torso(nu, nv): return tubo(rad_t, yt(1.31), yt(1.468), nu, nv, lambda t, a, v: 0.006 + 0.004 * v)
P, F = falda(220, 60, True); col = np.tile(TELA, (len(P), 1)); col[P[:, 1] < 0.745] *= 0.55; alto('tunica', 'falda', P, F, 'tela', col); bajo('tunica', *falda(28, 5, False))
P, F = alto_tunica_torso(140, 24); alto('tunica', 'pecho', P, F, 'tela', np.tile(TELA, (len(P), 1))); bajo('tunica', *alto_tunica_torso(24, 6))
for s_, L in ((1, 'L'), (-1, 'R')):
    mk = (brazo + pw('shoulder01') > 0.35) & (Vb[:, 0] * s_ > 0.12)
    ra = Radial(Vb[mk], J['upperarm01.' + L], J['lowerarm01.' + L], np.array([0, 1.0, 0]), -0.2, 0.7, nt=30, na=48, banda=0.015)
    def manga(nu, nv, pl):
        return tubo(ra, -0.12, 0.42, nu, nv, lambda t, a, v: 0.010 + 0.012 * v + (0.003 * np.sin(9 * a) * v if pl else 0))
    P, F = manga(90, 36, True); col = np.tile(TELA, (len(P), 1)); alto('tunica', 'manga' + L, P, F, 'tela', col); bajo('tunica', *manga(12, 3, False))

# --- linotórax: placas de lino encolado con canto grueso, bandas de color, hombreras atadas
BORDE = np.array([0.30, 0.05, 0.035]); AZUL = np.array([0.04, 0.07, 0.16]); LINO = np.array([0.74, 0.68, 0.53])
def coraza(nu, nv):
    return tubo(rad_t, yt(0.975), yt(1.372), nu, nv, lambda t, a, v: 0.027 + 0.012 * (1 - v) ** 3 + 0.002 * v)
P, F = coraza(200, 90); y = P[:, 1]
col = np.tile(LINO, (len(P), 1)); band = (y < 0.997) | (y > 1.352); col[band] = BORDE; col[((y > 0.999) & (y < 1.006)) | ((y > 1.343) & (y < 1.350))] = AZUL
col[(np.abs(y - 1.17) < 0.012)] = BORDE * 1.2                               # banda media (cinturón de la coraza)
Pq, Fq = engrosar(P, F, 0.008); alto('coraza', 'coraza', Pq, Fq, 'lino', np.vstack([col, col]))
bajo('coraza', *engrosar(*coraza(30, 8), 0.008))
cand = np.where(torso_m & (Vb[:, 1] > 1.2) & (Vb[:, 1] < 1.53))[0]
def camino(ctl, nseg, desp):
    ctl = np.array(ctl, float); t = np.linspace(0, len(ctl) - 1, nseg + 1)
    c = np.stack([np.interp(t, np.arange(len(ctl)), ctl[:, k]) for k in range(3)], 1)
    for _ in range(3): c[1:-1] = 0.5 * c[1:-1] + 0.25 * (c[:-2] + c[2:])
    idx = np.array([cand[np.argmin(np.linalg.norm(Vb[cand] - p, axis=1))] for p in c]); n = Nb[idx].copy()
    for _ in range(4): n[1:-1] = nrm(0.5 * n[1:-1] + 0.25 * (n[:-2] + n[2:]))
    q = Vb[idx] + n * np.array([desp(i / nseg, Vb[j]) for i, j in enumerate(idx)])[:, None]
    for _ in range(4): q[1:-1] = 0.5 * q[1:-1] + 0.25 * (q[:-2] + q[2:])
    tg = nrm(np.gradient(q, axis=0)); w = nrm(np.cross(tg, n)); nn = nrm(np.cross(w, tg))
    return q, w, nn
def banda(q, w, nn, ancho, nu, curva=0.006, recorte=None):
    nv = len(q) - 1
    def fn(u, v):
        i = min(int(round(v * nv)), nv); x = (u - 0.5) * 2
        an = ancho * (recorte(v) if recorte else 1)
        return q[i] + w[i] * x * an / 2 - nn[i] * curva * x * x
    P, F = rejilla(fn, nu, nv, cerrado=False)
    return P, orientar(P, F, lambda c: nn[np.argmin(np.linalg.norm(q - c, axis=1))])
for s_, L in ((1, 'L'), (-1, 'R')):
    ctl = [[0.10 * s_, 1.30, -0.12], [0.12 * s_, 1.40, -0.10], [0.15 * s_, 1.47, -0.03], [0.15 * s_, 1.45, 0.05], [0.12 * s_, 1.38, 0.10]]
    q0, w0, nn0 = camino(ctl, 64, lambda v, p: 0.034)
    for res, nu in ((60, 24), (12, 4)):
        q, w, nn = (q0, w0, nn0) if res == 60 else (q0[::5], w0[::5], nn0[::5])
        P, F = banda(q, w, nn, 0.115, nu, 0.010, recorte=lambda v: 1 - 0.35 * smooth(v, 0.8, 1.0))
        if res == 60:
            res = 64; v_ = np.repeat(np.linspace(0, 1, res + 1), nu + 1); x_ = np.tile(np.linspace(-1, 1, nu + 1), res + 1)
            col = np.tile(LINO, (len(P), 1)); col[(np.abs(x_) > 0.86) | (v_ > 0.965)] = BORDE
            Pq, Fq = engrosar(P, F, 0.007); alto('coraza', 'hombrera' + L, Pq, Fq, 'lino', np.vstack([col, col]))
            # cordón de cuero que ata la hombrera al pecho
            a0 = q[-1] - nn[-1] * 0.002; b0 = np.array([0.105 * s_, 1.33, 0.0]); b0[2] = rad_t.r(yt(1.33), math.atan2(b0[0], 1.0)) * 0.0
            tgt = rad_t.p(yt(1.30), 0.55 * s_, rad_t.r(yt(1.30), 0.55 * s_) + 0.036)
            Pc, Fc = torno([(0, 0), (0.0032, 0.003), (0.0032, np.linalg.norm(tgt - a0) - 0.003), (0, np.linalg.norm(tgt - a0))], 8, a0, tgt - a0, np.array([0, 0, 1.0]))
            alto('coraza', 'cordon' + L, Pc, Fc, 'cuero')
            Pr, Fr = torno([(0, -0.002), (0.0075, 0.0), (0.0075, 0.003), (0, 0.005)], 12, tgt - nrm(rad_t.fuera(tgt)) * 0.002, rad_t.fuera(tgt), np.array([0, 1.0, 0]))
            alto('coraza', 'anilla' + L, Pr, Fr, 'bronce')
        else: bajo('coraza', *engrosar(P, F, 0.007))

# --- pteruges: dos filas de tiras sueltas con peso y borde de color
def pteruges(nu, nv, alta):
    partes = []; N = 22
    for fila, (ytop, largo, extra, desfase) in enumerate(((0.992, 0.175, 0.020, 0.5), (1.000, 0.125, 0.034, 0.0))):
        for k in range(N):
            ak = -np.pi + 2 * np.pi * (k + desfase) / N; da = 2 * np.pi / N * 0.47; tilt = RNG.normal(0, 0.03); sw = RNG.normal(0, 0.006)
            def fn(u, v, ak=ak, tilt=tilt, sw=sw):
                a = ak + (u - 0.5) * 2 * da + tilt * v; yy = ytop - largo * v
                rr = max(rad_t.r(yt(min(yy, 1.0)), a) + extra, rad_t.r(yt(0.99), a) + extra) + 0.030 * v ** 1.3 + sw * v
                return rad_t.p(yt(yy), a, rr)
            P, F = rejilla(fn, nu, nv, cerrado=False); F = orientar(P, F, rad_t.fuera); Pq, Fq = engrosar(P, F, 0.0045)
            if alta:
                uu = np.tile(np.linspace(0, 1, nu + 1), nv + 1); vv = np.repeat(np.linspace(0, 1, nv + 1), nu + 1)
                col = np.tile(LINO * (0.96 + 0.08 * RNG.random()), (len(P), 1)); col[vv > 0.86] = BORDE; col[(vv > 0.80) & (vv <= 0.86)] = AZUL
                col[(uu < 0.07) | (uu > 0.93)] = BORDE * 1.15; partes.append((Pq, Fq, np.vstack([col, col])))
            else: partes.append((Pq, Fq))
    return unir(partes)
P, F, C = pteruges(12, 24, True); alto('pteruges', 'pteruges', P, F, 'lino', C)
P, F, _ = pteruges(1, 2, False); bajo('pteruges', P, F)

# --- casco frigio de bronce batido
cab = (Vb[:, 1] > EY + 0.005) & (pw('head') > 0.5)
AX = np.abs(Vb[cab, 0]).max(); zmin, zmax = Vb[cab, 2].min(), Vb[cab, 2].max(); CZ = (zmin + zmax) / 2; AZ = (zmax - zmin) / 2; YTOP = Vb[:, 1].max()
yf, ys, yk = EY + 0.034, EY + 0.012, EY - 0.030; b_ = (yf - yk) / 2; a_ = ((yf + yk) / 2 + ys) / 2; c_ = ((yf + yk) / 2 - ys) / 2
yr = lambda t: a_ + b_ * np.cos(t) + c_ * np.cos(2 * t); YM = (yr(0) + yr(np.pi)) / 2
LS = (YTOP - YM) * 1.60
def cuenco(h, t):
    hs = np.linspace(0, h, 24); th = 1.55 * np.clip((hs - 0.38) / 0.62, 0, 1) ** 1.2; dh = h / 23
    cy = (np.cos(th).sum() - 0.5 * (1 + np.cos(th[-1]))) * dh * LS; cz = (np.sin(th).sum() - 0.5 * np.sin(th[-1])) * dh * LS; a = th[-1]
    nuca = 1 + 0.10 * max(0.0, -np.cos(t)) ** 2 * (1 - min(h / 0.2, 1.0))
    r = 1.13 * nuca * max(np.cos(h * np.pi / 2), 0) ** 0.55; xl = np.sin(t) * AX * r; zl = np.cos(t) * AZ * r
    borde = (yr(t) - YM) * (1 - min(h / 0.35, 1.0)) ** 2
    return np.array([xl, YM + cy - zl * np.sin(a) + borde, CZ + cz + zl * np.cos(a)])
CEN = np.array([0, YM + 0.05, CZ])
P, F = rejilla(lambda u, v: cuenco(v, u * 2 * np.pi), 220, 120, polo=True); F = orientar(P, F, lambda c: c - CEN)
Nh = normales_v(P, F); abol = np.zeros(len(P))
for _ in range(9):                                            # abolladuras leves
    c = P[RNG.integers(len(P))]; abol -= RNG.uniform(0.0012, 0.0028) * np.exp(-np.sum((P - c) ** 2, 1) / RNG.uniform(0.012, 0.025) ** 2)
Pa = P + Nh * abol[:, None]; Pq, Fq = engrosar(Pa, F, 0.0022); alto('casco', 'cuenco', Pq, Fq, 'bronce')
P, F = rejilla(lambda u, v: cuenco(v, u * 2 * np.pi), 56, 8, polo=True); bajo('casco', *engrosar(P, orientar(P, F, lambda c: c - CEN), 0.0022))
def reborde(nu, nl, r0):
    def fn(u, v):
        t = 2 * np.pi * u; p = cuenco(0.0, t); fo = nrm(np.array([p[0], 0, p[2] - CZ])); tg = nrm(cuenco(0.0, t + 0.01) - cuenco(0.0, t - 0.01))
        up = np.cross(fo, tg); up = up * np.sign(up[1] + 1e-9); ph = 2 * np.pi * v
        return p + fo * 0.0035 + (fo * np.cos(ph) + up * np.sin(ph)) * r0
    P, F = rejilla(fn, nu, nl); return P, orientar(P, F, lambda c: c - (cuenco(0.0, math.atan2(c[0], c[2] - CZ)) + nrm(np.array([c[0], 0, c[2] - CZ])) * 0.0035))
P, F = reborde(260, 14, 0.0052); alto('casco', 'reborde', P, F, 'bronce'); bajo('casco', *reborde(56, 4, 0.0052))
for s_, L in ((1, 'L'), (-1, 'R')):
    def carr(u, v, s_=s_):
        t = s_ * (0.30 + 0.30 * u) * np.pi; lar = 0.095 * (1 - 0.35 * u) * (1 - 0.25 * (2 * u - 1) ** 4); f = 1.11 - 0.13 * v
        return np.array([np.sin(t) * AX * f, yr(t) - 0.002 - lar * v, CZ + np.cos(t) * AZ * f + 0.012 * v * (1 - u)])
    Pc, Fc = rejilla(carr, 40, 34, cerrado=False); Fc = orientar(Pc, Fc, lambda c: np.array([c[0], 0, c[2] - CZ]))
    Pq, Fq = engrosar(Pc, Fc, 0.0028); alto('casco', 'carrillera' + L, Pq, Fq, 'bronce')
    Pl, Fl = rejilla(carr, 7, 5, cerrado=False); bajo('casco', *engrosar(Pl, orientar(Pl, Fl, lambda c: np.array([c[0], 0, c[2] - CZ])), 0.0028))
    Nc = normales_v(Pc, Fc)
    for uu, vv in ((0.22, 0.16), (0.78, 0.16), (0.40, 0.72)):        # remaches: solo en el modelo denso; se calcan al ligero
        i = int(round(vv * 34)) * 41 + int(round(uu * 40)); rp = Pc[i] + Nc[i] * 0.0006
        Pr, Fr = torno([(0, -0.001), (0.0038, 0.0), (0.0030, 0.0018), (0.0014, 0.0028), (0, 0.0031)], 14, rp, Nc[i], np.array([0, 1.0, 0]))
        alto('casco', 'remache', Pr, Fr, 'bronce')

# --- escudo macedonio: bronce, 65 cm, repujado con estrella de 8 puntas y lúnulas
E, Wr = J['lowerarm01.L'], J['wrist.L']; fa = nrm(Wr - E); n0 = nrm([0.40, 0.10, 1.0]); NS = nrm(n0 - fa * (n0 @ fa))
UPS = nrm(np.array([0, 1.0, 0]) - NS * NS[1]); RTS = np.cross(UPS, NS); CS = (E + Wr) / 2 + NS * 0.08 + UPS * 0.02
R0 = 0.325
def relieve(x, y):
    r = np.hypot(x, y); th = np.arctan2(y, x); h = 0.0
    h += 0.0022 * np.exp(-((r - 0.300) / 0.0028) ** 2) + 0.0018 * np.exp(-((r - 0.196) / 0.0025) ** 2)
    for k in range(8):                                                       # lúnulas: semicírculos hacia dentro
        ck = 0.300 * np.array([np.cos(2 * np.pi * (k + 0.5) / 8), np.sin(2 * np.pi * (k + 0.5) / 8)]); d = np.hypot(x - ck[0], y - ck[1])
        h += 0.0020 * np.exp(-((d - 0.072) / 0.0028) ** 2) * (r < 0.297)
    ph = np.abs(((th + np.pi / 8) % (np.pi / 4)) - np.pi / 8); Ro, Ri = 0.175, 0.062
    p1 = np.array([Ro, 0]); p2 = np.array([Ri * np.cos(np.pi / 8), Ri * np.sin(np.pi / 8)]); e = nrm(p2 - p1); nn = np.array([-e[1], e[0]])
    if nn @ (-p1) < 0: nn = -nn
    lx, ly = r * np.cos(ph), r * np.sin(ph); dentro = (lx - p1[0]) * nn[0] + (ly - p1[1]) * nn[1]
    h += 0.0030 * smooth(dentro, -0.0015, 0.0025)
    h += 0.0012 * np.exp(-(ly / 0.0016) ** 2) * (r < Ro) * smooth(dentro, -0.002, 0.004)    # arista de cada punta
    h += 0.0045 * smooth(0.034 - r, -0.002, 0.004) + 0.0016 * np.exp(-((r - 0.040) / 0.0022) ** 2)
    return h
def escudo(na, nr, denso):
    rs = np.concatenate([np.linspace(0, 0.30, nr), [0.305, 0.312, 0.320, 0.325]]) if denso else np.array([0.0, 0.08, 0.16, 0.24, 0.29, 0.305, 0.325])
    P = []
    for r in rs:
        for k in range(na):
            th = 2 * np.pi * k / na; x, y = r * np.cos(th), r * np.sin(th)
            z = 0.038 * (1 - (min(r, 0.305) / 0.305) ** 2) - 0.010 * smooth(r, 0.305, 0.325)
            if denso: z += relieve(x, y)
            P.append(CS + RTS * x + UPS * y + NS * z)
    F = [[j * na + k, j * na + (k + 1) % na, (j + 1) * na + (k + 1) % na, (j + 1) * na + k] for j in range(len(rs) - 1) for k in range(na)]
    P = np.array(P); F = orientar(P, F, lambda c: NS)
    return engrosar(P, F, 0.010)
P, F = escudo(420, 170, True); _h = relieve((P - CS) @ RTS, (P - CS) @ UPS); _c = np.clip(_h / 0.0025, 0, 1)
alto('escudo', 'escudo', P, F, 'escudo', np.tile(_c[:, None], 3)); bajo('escudo', *escudo(48, 0, False))   # lo repujado, más claro y pulido por el roce

# --- grebas de bronce con la forma de la espinilla
for s_, L in ((1, 'L'), (-1, 'R')):
    mk = (Vb[:, 0] * s_ > 0.03) & (Vb[:, 1] < 0.64)
    rl = Radial(Vb[mk], J['lowerleg01.' + L], J['foot.' + L], np.array([0, 0, 1.0]), -0.25, 1.0, nt=40, na=64, banda=0.012)
    def greba(nu, nv, rl=rl):
        return tubo(rl, -0.10, 0.83, nu, nv, lambda t, a, v: 0.0085 + 0.004 * smooth(abs(t - 0.0), 0.12, 0.0), a0=-0.70 * np.pi, a1=0.70 * np.pi)
    P, F = greba(110, 120); alto('grebas', 'greba' + L, *engrosar(P, F, 0.0020), 'bronce'); bajo('grebas', *engrosar(*greba(12, 9), 0.0020))

# --- zapatos cerrados de cuero (nuevo en la prueba 4)
for s_, L in ((1, 'L'), (-1, 'R')):
    mk = (Vb[:, 0] * s_ > 0.02) & (Vb[:, 1] < 0.13); pie = Vb[mk]
    punta = pie[np.argmax(pie[:, 2])]; talon = pie[np.argmin(pie[:, 2])]
    e0 = np.array([talon[0], 0.045, talon[2] - 0.004]); e1 = np.array([punta[0], 0.028, punta[2] + 0.004])
    rz = Radial(pie, e0, e1, np.array([0, 1.0, 0]), -0.02, 1.02, nt=40, na=48, banda=0.008)
    def zapato(nu, nv, rz=rz): return tubo(rz, -0.04, 1.04, nu, nv, lambda t, a, v: 0.006 - (rz.r(t, a) + 0.006) * smooth(abs(t - 0.5), 0.47, 0.54) ** 0.7)
    P, F = zapato(72, 56); alto('zapatos', 'zapato' + L, P, F, 'cuero'); bajo('zapatos', *zapato(12, 9))

# --- correa de cuero al cuello, con hebilla de bronce
CTL = [[0.14, 1.27, 0.12], [0.14, 1.40, 0.09], [0.13, 1.47, 0.0], [0.06, 1.48, -0.07], [-0.03, 1.48, -0.075], [-0.10, 1.46, -0.01], [-0.08, 1.40, 0.09], [0.01, 1.30, 0.13]]
def desp_correa(v, p): return 0.040 + 0.018 * smooth(p[1], 1.40, 1.46) * (abs(p[0]) > 0.07)
q0, w0, nn0 = camino(CTL, 88, desp_correa)
for res, nu in ((90, 8), (22, 1)):
    q, w, nn = (q0, w0, nn0) if res == 90 else (q0[::4], w0[::4], nn0[::4]); P, F = banda(q, w, nn, 0.030, nu, 0.0015); Pq, Fq = engrosar(P, F, 0.0035)
    if res == 90:
        alto('correa', 'correa', Pq, Fq, 'cuero'); i = 16; hc = q[i] + nn[i] * 0.003
        partes = [caja(hc + w[i] * dx * 0.019 + nrm(np.gradient(q, axis=0)[i]) * dy * 0.022, w[i], nrm(np.gradient(q, axis=0)[i]), nn[i], hh)
                  for dx, dy, hh in ((-1, 0, [0.003, 0.025, 0.002]), (1, 0, [0.003, 0.025, 0.002]), (0, -1, [0.022, 0.003, 0.002]), (0, 1, [0.022, 0.003, 0.002]))]
        partes.append(caja(hc, w[i], nrm(np.gradient(q, axis=0)[i]), nn[i], [0.0016, 0.02, 0.0018]))
        P2, F2, _ = unir(partes); alto('correa', 'hebilla', P2, F2, 'bronce')
    else: bajo('correa', Pq, Fq)

# --- sarisa de fresno (se ven ~3,3 m), regatón y punta de hierro
dedos = pw('finger', 'metacarpal') * (Vb[:, 0] < 0) > 0.5; PALMA = Vb[dedos].mean(0) + np.array([-0.012, 0, 0.012]); BASE = np.array([PALMA[0], 0.03, PALMA[2]])
def sarisa(lados, filas, alta):
    zs = np.linspace(0.20, 3.05, filas); asta = [(0, 0), (0.008, 0.02), (0.0155, 0.20)] + [(0.0165 - 0.0012 * z / 3, z) for z in zs[1:]] + [(0.0, 3.07)]
    P1, F1 = torno(asta[:3] + [(0.0165, 0.215), (0.0, 0.22)], lados, BASE, np.array([0, 1.0, 0]), np.array([0, 0, 1.0]))   # regatón de hierro
    P2, F2 = torno([(0.0, 0.20)] + asta[2:-1] + [(0.0, 3.07)], lados, BASE, np.array([0, 1.0, 0]), np.array([0, 0, 1.0]))
    P3, F3 = torno([(0, 3.03), (0.0135, 3.04), (0.0125, 3.10), (0.030, 3.20), (0.024, 3.30), (0.0, 3.42)], lados, BASE, np.array([0, 1.0, 0]), np.array([0, 0, 1.0]), aplast=0.30)
    return (P1, F1), (P2, F2), (P3, F3)
(a1, b1), (a2, b2), (a3, b3) = sarisa(32, 60, True)
alto('sarisa', 'regaton', a1, b1, 'hierro'); alto('sarisa', 'asta', a2, b2, 'madera'); alto('sarisa', 'punta', a3, b3, 'hierro')
for p in sarisa(12, 3, False): bajo('sarisa', *p)
nota('piezas montadas:', len(ALTOS), 'densas')

# ================================================================ Blender
bpy.ops.import_scene.gltf(filepath=os.path.join(MATDIR, 'human-0350.glb'))
PIEL_IM = next(im for im in bpy.data.images if im.name.startswith('young_lightskinned_male_diffuse'))
_uvglb = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith('male_generic')][0].data.uv_layers.active.data
_u = np.zeros(len(_uvglb) * 2); _uvglb.foreach_get('uv', _u); _u = _u.reshape(-1, 2)
nota('UV del GLB', _u.min(0), _u.max(0), '| UV de nuestro cuerpo', VT.min(0), VT.max(0))
for ob in list(bpy.data.objects): bpy.data.objects.remove(ob)
sc = bpy.context.scene
def BL(P): P = np.asarray(P, float); return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)
def malla(nombre, P, F, col=None, uv=None, extra=None):
    me = bpy.data.meshes.new(nombre); me.from_pydata(BL(P).tolist(), [], [list(map(int, f)) for f in F]); me.update()
    me.shade_smooth()
    if col is not None:
        a = me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT'); a.data.foreach_set('color', np.c_[col, np.ones(len(col))].astype(np.float32).ravel())
    if uv is not None: me.uv_layers.new(name='UVMap').data.foreach_set('uv', np.array([VT[i] for f in uv for i in f], np.float32).ravel())
    for k, val in (extra or {}).items(): me.attributes.new(k, 'FLOAT', 'POINT').data.foreach_set('value', np.asarray(val, np.float32))
    ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); return ob

# ---- materiales del modelo denso (procedurales; luego se calcan)
MATS = {}
class Nd:
    def __init__(s, mat): s.t = mat.node_tree; s.n = s.t.nodes; s.l = s.t.links; s.n.clear(); s.co = s.node('ShaderNodeTexCoord').outputs['Object']
    def node(s, tipo, **kw):
        nd = s.n.new(tipo)
        for k, v in kw.items(): setattr(nd, k, v)
        return nd
    def put(s, sock, v):
        if isinstance(v, bpy.types.NodeSocket): s.l.new(v, sock)
        else: sock.default_value = (v, v, v) if (isinstance(v, (int, float)) and sock.type == 'VECTOR') else (tuple(v) + (1.0,) if (sock.type == 'RGBA' and len(v) == 3) else v)
    def f(s, op, a, b=0.0, c=0.0, clamp=False):
        nd = s.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        for i, x in enumerate((a, b, c)): s.put(nd.inputs[i], x)
        return nd.outputs[0]
    def v(s, op, a, b=0.0, c=0.0):
        nd = s.node('ShaderNodeVectorMath', operation=op)
        for i, x in enumerate((a, b, c)): s.put(nd.inputs[i], x if not isinstance(x, tuple) else x)
        return nd.outputs[0]
    def mix(s, a, b, t): return s.v('MULTIPLY_ADD', s.v('SUBTRACT', b, a), t, a)
    def ruido(s, esc, det=2.0, rug=0.5, vec=None, sal='Fac'):
        nd = s.node('ShaderNodeTexNoise'); s.put(nd.inputs['Vector'], vec if vec is not None else s.co); nd.inputs['Scale'].default_value = esc
        nd.inputs['Detail'].default_value = det; nd.inputs['Roughness'].default_value = rug; return nd.outputs[sal]
    def voronoi(s, esc, feat='F1', vec=None, sal='Distance'):
        nd = s.node('ShaderNodeTexVoronoi', feature=feat); s.put(nd.inputs['Vector'], vec if vec is not None else s.co); nd.inputs['Scale'].default_value = esc; return nd.outputs[sal]
    def onda(s, esc, dirn='X', dist=0.0, det=0.0, vec=None, perfil='SIN'):
        nd = s.node('ShaderNodeTexWave', wave_type='BANDS', bands_direction=dirn, wave_profile=perfil); s.put(nd.inputs['Vector'], vec if vec is not None else s.co)
        nd.inputs['Scale'].default_value = esc; nd.inputs['Distortion'].default_value = dist; nd.inputs['Detail'].default_value = det; return nd.outputs['Fac']
    def foto(s, nombre, metros, color=True):
        """Foto proyectada en caja sobre coordenadas del objeto (metros): una repetición mide «metros»."""
        im = bpy.data.images.load(os.path.join(MATDIR, nombre), check_existing=True)
        if not color: im.colorspace_settings.name = 'Non-Color'
        mp = s.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / metros,) * 3; s.l.new(s.co, mp.inputs['Vector'])
        t = s.node('ShaderNodeTexImage', projection='BOX', projection_blend=0.3); t.image = im; s.l.new(mp.outputs[0], t.inputs['Vector']); s.ult = im
        return t.outputs['Color']
    def fn(s, nombre, metros):
        """Luminancia de una foto, normalizada: media 0,5 y ±2 desviaciones a 0..1."""
        c = s.foto(nombre, metros, False); im = s.ult; a = np.empty(im.size[0] * im.size[1] * 4, np.float32); im.pixels.foreach_get(a)
        a = a.reshape(-1, 4)[:, :3] @ np.array([0.3, 0.59, 0.11]); mu, sd = float(a.mean()), float(a.std()) + 1e-4
        bw = s.node('ShaderNodeRGBToBW'); s.l.new(c, bw.inputs[0]); return s.f('ADD', s.f('MULTIPLY', s.f('SUBTRACT', bw.outputs[0], mu), 1 / (4 * sd)), 0.5, clamp=True)
    def attr(s): return s.node('ShaderNodeAttribute', attribute_name='col').outputs['Color']

def material(nombre, construir):
    mat = bpy.data.materials.new(nombre); mat.use_nodes = True; g = Nd(mat)
    col, rug, met, alt, fuerza, dist = construir(g)
    pb = g.node('ShaderNodeBsdfPrincipled'); g.put(pb.inputs['Base Color'], col); g.put(pb.inputs['Roughness'], rug); g.put(pb.inputs['Metallic'], met)
    bump = g.node('ShaderNodeBump'); bump.inputs['Strength'].default_value = fuerza; bump.inputs['Distance'].default_value = dist; g.put(bump.inputs['Height'], alt); g.l.new(bump.outputs['Normal'], pb.inputs['Normal'])
    out = g.node('ShaderNodeOutputMaterial'); em = {}
    for k, x in (('color', col), ('rough', rug), ('metal', met)):
        e = g.node('ShaderNodeEmission'); g.put(e.inputs['Color'], x if not isinstance(x, (int, float)) else (x, x, x)); e.inputs['Strength'].default_value = 1.0; em[k] = e
    MATS[nombre] = (mat, g, out, pb, em); g.l.new(pb.outputs[0], out.inputs['Surface']); return mat

def cavidades(g):
    pt = g.node('ShaderNodeNewGeometry').outputs['Pointiness']
    return g.f('MULTIPLY', g.f('SUBTRACT', 0.505, pt), 14.0, clamp=True), g.f('MULTIPLY', g.f('SUBTRACT', pt, 0.51), 12.0, clamp=True)
def m_bronce(g):
    l8 = g.fn('metal008/metal008_baseColor.jpg', 0.30); pat = g.fn('metal017/metal017_baseColor.jpg', 0.80)
    alt = g.f('ADD', g.fn('metal008/metal008_displacement.jpg', 0.30), g.f('MULTIPLY', g.fn('metal017/metal017_displacement.jpg', 0.80), 0.4))
    r8 = g.fn('metal008/metal008_roughness.jpg', 0.30); cav, conv = cavidades(g)
    base = g.mix((0.36, 0.20, 0.08), (0.76, 0.52, 0.25), l8)                     # foto de metal llevada a bronce
    base = g.v('MULTIPLY', base, g.f('ADD', 0.62, g.f('MULTIPLY', pat, 0.55)))      # pátina desigual, a palmos
    base = g.mix(base, (0.86, 0.63, 0.35), g.f('MULTIPLY', conv, 0.75))            # aristas y repujado frotados
    base = g.mix(base, (0.055, 0.065, 0.04), g.f('MULTIPLY', cav, 0.85))           # suciedad y verdín en los huecos
    rug = g.f('ADD', g.f('ADD', 0.14, g.f('MULTIPLY', r8, 0.30)), g.f('MULTIPLY', cav, 0.45))
    return base, rug, g.f('SUBTRACT', 1.0, g.f('MULTIPLY', cav, 0.7)), alt, 0.15, 0.0015
def m_hierro(g):
    n = g.ruido(40.0, 4.0); base = g.mix((0.20, 0.19, 0.18), (0.11, 0.09, 0.08), n)
    return base, g.f('ADD', 0.35, g.f('MULTIPLY', n, 0.3)), 1.0, g.ruido(300.0, 2.0), 0.3, 0.0008
def m_escudo(g):
    base, rug, met, alt, fu, di = m_bronce(g); rel = g.node('ShaderNodeAttribute', attribute_name='col').outputs['Fac']
    base = g.mix(base, (0.90, 0.68, 0.38), g.f('MULTIPLY', rel, 0.85)); rug = g.f('SUBTRACT', rug, g.f('MULTIPLY', rel, 0.10))
    return base, rug, met, alt, fu, di
def m_lino(g):
    c = g.attr(); t = g.fn('roughLinen/rough_linen_baseColor.jpg', 0.12); man = g.fn('metal017/metal017_baseColor.jpg', 1.6); cav, _ = cavidades(g)
    base = g.v('MULTIPLY', c, g.f('ADD', 0.92, g.f('MULTIPLY', t, 0.12)))
    base = g.mix(base, g.v('MULTIPLY', c, (0.60, 0.50, 0.36)), g.f('MULTIPLY', g.f('SUBTRACT', man, 0.55), 1.2, clamp=True))   # manchas de uso
    base = g.mix(base, (0.16, 0.13, 0.09), g.f('MULTIPLY', cav, 0.35))
    sep = g.node('ShaderNodeSeparateXYZ'); g.l.new(g.co, sep.inputs[0])
    cos_ = g.f('ABSOLUTE', g.f('SUBTRACT', g.f('FRACT', g.f('MULTIPLY', sep.outputs['Z'], 11.0)), 0.5))
    costura = g.f('SUBTRACT', 1.0, g.f('MULTIPLY', g.f('SUBTRACT', 0.5, cos_), 18.0, clamp=True))
    punt = g.f('MULTIPLY', g.onda(420.0, 'X', perfil='SAW'), costura)
    alt = g.f('ADD', g.f('MULTIPLY', g.fn('roughLinen/rough_linen_displacement.jpg', 0.12), 0.6), g.f('SUBTRACT', g.f('MULTIPLY', costura, -0.9), g.f('MULTIPLY', punt, 0.12)))
    return base, g.f('ADD', 0.72, g.f('MULTIPLY', g.fn('roughLinen/rough_linen_roughness.jpg', 0.20), 0.2)), 0.0, alt, 0.35, 0.0015
def m_tela(g):
    c = g.attr(); t = g.fn('roughLinen/rough_linen_baseColor.jpg', 0.10); cav, _ = cavidades(g)
    base = g.v('MULTIPLY', c, g.f('ADD', 0.84, g.f('MULTIPLY', t, 0.30)))
    polvo = g.f('MULTIPLY', g.f('SUBTRACT', g.ruido(4.0, 5.0), 0.5), 3.0, clamp=True); base = g.mix(base, (0.30, 0.22, 0.15), g.f('MULTIPLY', polvo, 0.3))
    base = g.mix(base, (0.05, 0.02, 0.015), g.f('MULTIPLY', cav, 0.6))
    return base, 0.9, 0.0, g.fn('roughLinen/rough_linen_displacement.jpg', 0.10), 0.35, 0.0012
def m_piel(g):
    uvn = g.node('ShaderNodeUVMap', uv_map='UVMap'); tx = g.node('ShaderNodeTexImage'); tx.image = PIEL_IM; g.l.new(uvn.outputs[0], tx.inputs['Vector'])
    base = g.v('MULTIPLY', g.v('MULTIPLY', tx.outputs['Color'], (0.62, 0.50, 0.41)), g.attr())     # piel clara de foto -> moreno mediterráneo
    pel = g.node('ShaderNodeAttribute', attribute_name='pelo').outputs['Fac']; vello = g.ruido(1400.0, 2.0)
    base = g.mix(base, (0.022, 0.016, 0.012), g.f('MULTIPLY', pel, g.f('ADD', 0.55, g.f('MULTIPLY', vello, 0.5)), clamp=True))
    alt = g.f('ADD', g.f('MULTIPLY', g.ruido(420.0, 2.0), 0.5), g.f('ADD', g.f('MULTIPLY', g.voronoi(650.0), 0.35), g.f('MULTIPLY', g.f('MULTIPLY', pel, vello), 0.8)))
    return base, g.f('ADD', 0.46, g.f('MULTIPLY', g.f('ADD', g.ruido(9.0), pel), 0.15)), 0.0, alt, 0.35, 0.0005
def m_cuero(g):
    c = g.foto('brownLeather/brown_leather_baseColor.jpg', 0.30); cav, _ = cavidades(g)
    base = g.mix(g.v('MULTIPLY', c, 0.8), (0.03, 0.018, 0.01), g.f('MULTIPLY', cav, 0.6))
    rug = g.f('ADD', 0.38, g.f('MULTIPLY', g.fn('brownLeather/brown_leather_roughness.jpg', 0.30), 0.35))
    return base, rug, 0.0, g.fn('brownLeather/brown_leather_displacement.jpg', 0.30), 0.5, 0.001
def m_madera(g):
    vec = g.v('MULTIPLY', g.co, (70.0, 70.0, 1.2)); vet = g.onda(1.0, 'X', 9.0, 3.0, vec=vec); nud = g.ruido(3.0, 5.0)
    base = g.mix((0.36, 0.20, 0.085), (0.17, 0.085, 0.035), g.f('ADD', g.f('MULTIPLY', vet, 0.7), g.f('MULTIPLY', nud, 0.3)))
    return base, g.f('ADD', 0.5, g.f('MULTIPLY', vet, 0.2)), 0.0, vet, 0.4, 0.0008
def m_ojo(g): return g.attr(), 0.08, 0.0, 0.0, 0.0, 0.001
for k, fn in (('bronce', m_bronce), ('escudo', m_escudo), ('hierro', m_hierro), ('lino', m_lino), ('tela', m_tela), ('piel', m_piel), ('cuero', m_cuero), ('madera', m_madera), ('ojo', m_ojo)): material(k, fn)
def modo(m_):
    for mat, g, out, pb, em in MATS.values(): g.l.new((pb.outputs[0] if m_ == 'pbr' else em[m_].outputs[0]), out.inputs['Surface'])

ALTO_OB = {}
for g_, nombre, P, F, col, mat, sub in ALTOS:
    ob = malla('A_' + nombre, P, F, col, **(CUERPO_EXTRA if nombre == 'cuerpo' else {})); ob.data.materials.append(MATS[mat][0]); ALTO_OB.setdefault(g_, []).append(ob)
    if sub: md = ob.modifiers.new('sub', 'SUBSURF'); md.levels = md.render_levels = sub
nota('modelo denso en Blender')

# ---- modelo ligero: un objeto por grupo; el cuerpo, diezmado y partido en cabeza y resto
def evaluado(ob):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); ob.modifiers.clear(); old = ob.data; ob.data = me; bpy.data.meshes.remove(old)
_otros = sum(sum(len(f) - 2 for f in F) for lst in BAJOS.values() for P, F in lst); _cu = sum(len(f) - 2 for f in Fb_casco)
DIEZMO = min(float(ARG.get('diezmo', 0.40)), (13850 - _otros) / _cu); nota('equipo ligero', _otros, 'triángulos; diezmo del cuerpo %.3f' % DIEZMO)
cuerpo_b = malla('tmp_cuerpo', Vb, Fb_casco); dm = cuerpo_b.modifiers.new('dz', 'DECIMATE'); dm.ratio = DIEZMO; evaluado(cuerpo_b)
cv = np.array([v.co[:] for v in cuerpo_b.data.vertices]); cf = [list(p.vertices) for p in cuerpo_b.data.polygons]; bpy.data.objects.remove(cuerpo_b)
cvm = np.stack([cv[:, 0], cv[:, 2], -cv[:, 1]], 1)                     # vuelta a coordenadas MakeHuman
es_cab = [cvm[f, 1].mean() > 1.505 and abs(cvm[f, 0].mean()) < 0.13 for f in cf]
def sub_malla(sel):
    fs = [f for f, s in zip(cf, sel) if s]; us = sorted({i for f in fs for i in f}); rm = {v: i for i, v in enumerate(us)}
    return cvm[us], [[rm[i] for i in f] for f in fs]
BAJO_OB = {}; DENS = {'cabeza': 2.8, 'cuerpo': 1.0, 'tunica': 0.6, 'coraza': 1.1, 'pteruges': 0.9, 'casco': 2.2, 'escudo': 1.5, 'grebas': 1.0, 'correa': 1.0, 'sarisa': 0.35, 'zapatos': 0.8}
HORNEA = {'cabeza': 'cuerpo', 'cuerpo': 'cuerpo'}
Pc_, Fc_ = sub_malla(es_cab); Po, Fo, _ = unir(BAJOS.pop('ojos')); P, F, _ = unir([(Pc_, Fc_), (Po, Fo)]); BAJO_OB['cabeza'] = malla('B_cabeza', P, F)
BAJO_OB['cuerpo'] = malla('B_cuerpo', *sub_malla([not s for s in es_cab]))
for g_, lst in BAJOS.items():
    P, F, _ = unir(lst); BAJO_OB[g_] = malla('B_' + g_, P, F); HORNEA[g_] = g_
tris = {k: sum(len(p.vertices) - 2 for p in ob.data.polygons) for k, ob in BAJO_OB.items()}; TRIS = sum(tris.values())
nota('modelo ligero:', TRIS, 'triángulos', tris)

# ---- UV: una isla por objeto con smart project, densidad por pieza, un solo atlas
def sel_solo(obs, activo):
    for o in sc.objects: o.select_set(False)
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = activo
sc.tool_settings.use_uv_select_sync = True
for k, ob in BAJO_OB.items():
    sel_solo([ob], ob); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.002); bpy.ops.object.mode_set(mode='OBJECT')
    me = ob.data; uv = np.zeros(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    a3 = sum(p.area for p in me.polygons); a2 = 0.0
    for p in me.polygons:
        q = uv[p.loop_start:p.loop_start + p.loop_total]; a2 += 0.5 * abs(np.dot(q[:, 0], np.roll(q[:, 1], -1)) - np.dot(q[:, 1], np.roll(q[:, 0], -1)))
    uv *= math.sqrt(DENS[k] * a3 / max(a2, 1e-9)); me.uv_layers.active.data.foreach_set('uv', uv.ravel())
obs = list(BAJO_OB.values()); sel_solo(obs, obs[0]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.pack_islands(rotate=True, scale=True, margin=0.006, shape_method='CONVEX'); bpy.ops.object.mode_set(mode='OBJECT')
nota('UV empaquetadas')

# ---- horneado (calco) con Cycles en CPU
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True; sc.world.light_settings.distance = 0.18
IM = {}
for k, cs, fill in (('color', 'sRGB', (0.5, 0.5, 0.5, 1)), ('normal', 'Non-Color', (0.5, 0.5, 1, 1)), ('ao', 'Non-Color', (1, 1, 1, 1)), ('rough', 'Non-Color', (0.8, 0.8, 0.8, 1)), ('metal', 'Non-Color', (0, 0, 0, 1))):
    im = bpy.data.images.new('p4_' + k, RES, RES, alpha=False); im.colorspace_settings.name = cs; im.generated_color = fill; IM[k] = im
mh_ = bpy.data.materials.new('horneo'); mh_.use_nodes = True; tn = mh_.node_tree.nodes; tnodo = tn.new('ShaderNodeTexImage'); tn.active = tnodo
for ob in obs:
    ob.data.materials.clear(); ob.data.materials.append(mh_)
    for a in ('visible_camera', 'visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_volume_scatter', 'visible_shadow'): setattr(ob, a, False)
PASES = [('color', 'EMIT', 'color', 4), ('rough', 'EMIT', 'rough', 2), ('metal', 'EMIT', 'metal', 1), ('normal', 'NORMAL', 'pbr', 1), ('ao', 'AO', 'pbr', 8 if RAPIDO else 32)]
for im_k, tipo, m_, mu in PASES:
    modo(m_); tnodo.image = IM[im_k]; sc.cycles.samples = mu; t1 = time.time()
    for k, ob in BAJO_OB.items():
        sel_solo(ALTO_OB[HORNEA[k]] + [ob], ob)
        bpy.ops.object.bake(type=tipo, use_selected_to_active=True, cage_extrusion=0.02, max_ray_distance=0.05, margin=3, use_clear=False, normal_space='TANGENT', target='IMAGE_TEXTURES')
    nota('horneado', im_k, '%.0f s' % (time.time() - t1))
modo('pbr')

def pix(im): a = np.empty(RES * RES * 4, np.float32); im.pixels.foreach_get(a); return a.reshape(RES, RES, 4)
from PIL import Image
def guardar(arr, nombre, q):
    img = Image.fromarray((np.clip(arr[::-1, :, :3], 0, 1) * 255 + 0.5).astype(np.uint8)); ruta = os.path.join(TRAB, nombre + '.webp'); img.save(ruta, quality=q, method=6)
    img.save(os.path.join(TRAB, nombre + '.png')); return os.path.getsize(ruta)
orm = np.stack([pix(IM['ao'])[..., 0], pix(IM['rough'])[..., 0], pix(IM['metal'])[..., 0], np.ones((RES, RES))], -1)
TAM = {'color': guardar(pix(IM['color']), 'p4_color', 88), 'normal': guardar(pix(IM['normal']), 'p4_normal', 92), 'orm': guardar(orm, 'p4_orm', 88)}
IM['orm'] = bpy.data.images.new('p4_orm_i', RES, RES); IM['orm'].colorspace_settings.name = 'Non-Color'; IM['orm'].pixels.foreach_set(orm.astype(np.float32).ravel())
nota('texturas webp (bytes):', TAM, 'total %.2f MB' % (sum(TAM.values()) / 1e6))

# ---- postura «quieto» del juego: el calco se hizo en reposo; ahora se dobla solo el modelo ligero (las texturas siguen valiendo)
SOLD = os.path.join(RAIZ, 'assets', 'soldados'); JG = json.load(open(os.path.join(SOLD, 'falangita.json'))); BG = open(os.path.join(SOLD, 'falangita.bin'), 'rb').read()
HG = JG['huesos']; NB = len(HG); IH = {h: i for i, h in enumerate(HG)}
AN = np.frombuffer(open(os.path.join(SOLD, JG['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, NB, 3, 4)
MQ = AN[JG['clips']['quieto']['ini']].astype(float)                    # (huesos, 3, 4): [D | t], cuadro 0 de «quieto»
def hueso_juego(k):
    while k is not None and k not in IH: k = m['padre'].get(k)          # huesos finos de MakeHuman -> su padre en el esqueleto del juego
    return IH.get(k, 0)
Wg = np.zeros((len(Vb), NB))
for k, w in W.items(): Wg[:, hueso_juego(k)] += w[vids]
Wg /= Wg.sum(1, keepdims=True) + 1e-9
def doblar(P, Wr): return np.einsum('vb,bij,vj->vi', Wr, MQ, np.c_[P, np.ones(len(P))])
nvg, offg = JG['verts'], JG['off']
PG = np.frombuffer(BG, np.float32, nvg * 3, offg['pos']).reshape(nvg, 3).astype(float)
SIG = np.frombuffer(BG, np.uint8, nvg * 4, offg['si']).reshape(nvg, 4).astype(int); SWG = np.frombuffer(BG, np.uint8, nvg * 4, offg['sw']).reshape(nvg, 4) / 255.0
TG = np.frombuffer(BG, np.uint32 if JG['idx32'] else np.uint16, JG['tris'] * 3, offg['idx']).reshape(-1, 3).astype(int)
PGd = sum(SWG[:, k, None] * np.einsum('vij,vj->vi', MQ[SIG[:, k]], np.c_[PG, np.ones(nvg)]) for k in range(4))
PIEZA = np.array(sum(([nm_] * n_ for nm_, n_ in JG['piezas'].items()), []))
def verts_de(*nombres): return np.unique(TG[np.isin(PIEZA, nombres)])
from mathutils import kdtree
KD = kdtree.KDTree(len(Vb))
for i_, p_ in enumerate(Vb): KD.insert(p_, i_)
KD.balance()
def pesos_cerca(P, k=5):
    out = np.zeros((len(P), NB))
    for i_, p_ in enumerate(P):
        r_ = KD.find_n(p_, k); ws = np.array([1 / (d_ + 1e-3) for _, _, d_ in r_]); out[i_] = (Wg[[j_ for _, j_, _ in r_]] * ws[:, None]).sum(0) / ws.sum()
    return out
# escudo: sobre el plano del escudo del juego (pegado al antebrazo y al cuerpo)
Q = PGd[verts_de('escudo_frente')]; cg = Q.mean(0); ng = np.linalg.svd(Q - cg)[2][2]
_pm = torso_m & (Vb[:, 1] > 1.1) & (Vb[:, 1] < 1.4); pecho = doblar(Vb[_pm], Wg[_pm]).mean(0)
if ng @ (cg - pecho) < 0: ng = -ng
ug = nrm(np.array([0, 1.0, 0]) - ng * ng[1]); rg = np.cross(ug, ng)
R_ESC = np.stack([rg, ug, ng], 1) @ np.stack([RTS, UPS, NS], 0)
# sarisa: sobre el eje del asta del juego, con el regatón en el suelo
Q = PGd[verts_de('lanza_asta')]; g0 = Q.mean(0); ax = np.linalg.svd(Q - g0)[2][0]; ax = ax if ax[1] > 0 else -ax
q0 = g0 + ax * (0.03 - g0[1]) / ax[1]
R_SAR = np.array(Vector((0, 1.0, 0)).rotation_difference(Vector(ax)).to_matrix())
nota('escudo del juego: centro', cg.round(3), 'normal', ng.round(2), '| sarisa: eje', ax.round(3))
for k, ob in BAJO_OB.items():
    co = np.zeros(len(ob.data.vertices) * 3); ob.data.vertices.foreach_get('co', co); co = co.reshape(-1, 3); P = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)
    if k == 'escudo': P2 = cg + ng * 0.012 + (P - CS) @ R_ESC.T
    elif k == 'sarisa': P2 = q0 + (P - BASE) @ R_SAR.T
    elif k == 'casco': Wr = np.zeros((len(P), NB)); Wr[:, IH['head']] = 1; P2 = doblar(P, Wr)
    else: P2 = doblar(P, pesos_cerca(P))
    ob.data.vertices.foreach_set('co', BL(P2).ravel()); ob.data.update()
nota('modelo ligero en postura «quieto»')

# ---- material final del modelo ligero: solo sus tres mapas (como en el juego)
mf = bpy.data.materials.new('final'); mf.use_nodes = True; g = Nd(mf)
def tex(im): t = g.node('ShaderNodeTexImage'); t.image = im; t.interpolation = 'Linear'; return t
tc, tnm, tor = tex(IM['color']), tex(IM['normal']), tex(IM['orm'])
sep = g.node('ShaderNodeSeparateColor'); g.l.new(tor.outputs['Color'], sep.inputs[0])
pb = g.node('ShaderNodeBsdfPrincipled'); g.put(pb.inputs['Base Color'], g.v('MULTIPLY', tc.outputs['Color'], g.f('ADD', 0.35, g.f('MULTIPLY', sep.outputs[0], 0.65))))
g.l.new(sep.outputs[1], pb.inputs['Roughness']); g.l.new(sep.outputs[2], pb.inputs['Metallic'])
nm = g.node('ShaderNodeNormalMap'); g.l.new(tnm.outputs['Color'], nm.inputs['Color']); g.l.new(nm.outputs['Normal'], pb.inputs['Normal'])
out = g.node('ShaderNodeOutputMaterial'); g.l.new(pb.outputs[0], out.inputs['Surface'])
for ob in obs:
    ob.data.materials.clear(); ob.data.materials.append(mf)
    for a in ('visible_camera', 'visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_volume_scatter', 'visible_shadow'): setattr(ob, a, True)
for lst in ALTO_OB.values():
    for ob in lst: ob.hide_render = True
pivote = bpy.data.objects.new('pivote', None); sc.collection.objects.link(pivote)
for ob in obs: ob.parent = pivote

# ---- fotos: condiciones comunes de las tres pruebas
def lin(c): c = c / 255.0; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
wn = sc.world.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld'); cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.35
perg = wn.new('ShaderNodeBackground'); perg.inputs[0].default_value = (lin(0xe9), lin(0xdf), lin(0xc4), 1); perg.inputs[1].default_value = 1.0
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl = sc.world.node_tree.links
wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(perg.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0; sc.view_settings.gamma = 1
sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True; sc.render.film_transparent = False; sc.cycles.max_bounces = 6
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol_d.angle = math.radians(3); sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 70; cam_d.sensor_fit = 'AUTO'; cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
def foto(ruta, w, h, objetivo, dist, azim, elev, giro=0.0):
    pivote.rotation_euler = (0, 0, math.radians(giro)); objetivo = Vector(objetivo)
    d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = objetivo + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    der = (-d).cross(Vector((0, 0, 1))).normalized(); arr = der.cross(-d).normalized()
    hacia_luz = (-der * 0.62 + arr * 0.55 + d * 0.56).normalized()       # sol bajo desde arriba-izquierda-delante
    sol.rotation_euler = (-hacia_luz).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100
    sc.render.filepath = ruta; sc.render.image_settings.file_format = 'PNG'; bpy.ops.render.render(write_still=True)
fz = lambda y: y                                                          # alturas: Z de Blender = Y de MakeHuman
c1 = os.path.join(TRAB, 'cerca.png'); foto(c1, 780, 1688, (0.03, 0.0, 1.36), 2.25, -42, 4)
c2 = os.path.join(TRAB, 'frente.png'); foto(c2, 844, 780, (0.0, 0.0, 1.10), 5.0, -35, 3)
c3 = os.path.join(TRAB, 'espalda.png'); foto(c3, 844, 780, (0.0, 0.0, 1.10), 5.0, -35, 3, giro=180 + 0)
nota('fotos hechas')

from PIL import ImageDraw, ImageFont
def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def rotulo(img, t):
    d = ImageDraw.Draw(img); f = fuente(t); txt = 'Prueba 4 · Esculpido + piel y materiales de foto'; b = d.textbbox((0, 0), txt, font=f)
    d.rounded_rectangle((16, 12, 16 + b[2] + 28, 12 + b[3] + 20), 10, fill=(244, 236, 214)); d.text((30, 20), txt, font=f, fill=(40, 30, 20)); return img
os.makedirs(FOTOS, exist_ok=True)
im1 = rotulo(Image.open(c1).convert('RGB'), 27); im1.save(os.path.join(FOTOS, 'FA2-P4-cerca-v.jpg'), quality=90)
im2 = Image.new('RGB', (1688, 780)); im2.paste(Image.open(c2).convert('RGB'), (0, 0)); im2.paste(Image.open(c3).convert('RGB'), (844, 0))
rotulo(im2, 30).save(os.path.join(FOTOS, 'FA2-P4-cuerpo-h.jpg'), quality=90)
nota('FIN. triángulos', TRIS, 'texturas %.2f MB' % (sum(TAM.values()) / 1e6), 'minutos %.1f' % ((time.time() - T0) / 60))
