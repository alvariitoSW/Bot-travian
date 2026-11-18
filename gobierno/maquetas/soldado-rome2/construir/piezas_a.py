"""GM44d (mitad A): piezas nuevas para triario, vélite, hondero y peltasta. Arte propio del proyecto, hecho por código
sobre el cuerpo de MakeHuman (CC0). Mismas reglas que piezas.py: metros, x a la izquierda, y arriba, z al frente.
Materiales nuevos con ids 18 a 24 y sus pintores (se registran en texturas.PINTORES al importar este módulo)."""
import numpy as np, texturas as TX
from piezas import MAT, pieza, rej, torno, TAU

MAT.update(piel_lobo=18, piel_zorro=19, mimbre=20, parma=21, cuerda=22, zeira=23, piedra=24)

# ---------- ayudas ----------
def tubo(pts, radio, lados=5, cerrado=False):
    """Tubo a lo largo de una polilínea (n,3). radio: número o lista por punto. Devuelve P, UV, T y tam (perímetro, largo)."""
    pts = np.asarray(pts, float); n = len(pts); r = np.full(n, radio, float) if np.isscalar(radio) else np.asarray(radio, float)
    tg = np.gradient(pts, axis=0) if not cerrado else np.roll(pts, -1, 0) - np.roll(pts, 1, 0); tg /= np.maximum(np.linalg.norm(tg, axis=1, keepdims=True), 1e-9)
    ref = np.array([0, 1.0, 0]) if abs(tg[0] @ [0, 1, 0]) < 0.9 else np.array([1.0, 0, 0]); a = np.cross(tg[0], ref); a /= np.linalg.norm(a); A = []
    for t in tg:                                               # transporte paralelo: el tubo no se retuerce
        a = a - t * (a @ t); a /= max(np.linalg.norm(a), 1e-9); A.append(a)
    A = np.array(A); Bv = np.cross(tg, A); m = n + 1 if cerrado else n; P, UV = [], []
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(np.vstack([pts, pts[:1]]) if cerrado else pts, axis=0), axis=1))])
    for j in range(m):
        i = j % n
        for k in range(lados + 1):
            g = TAU * k / lados; P.append(pts[i] + (A[i] * np.cos(g) + Bv[i] * np.sin(g)) * r[i]); UV.append([k / lados, L[j] / max(L[-1], 1e-9)])
    T = []
    for j in range(m - 1):
        for k in range(lados):
            p = j * (lados + 1) + k; q = p + lados + 1; T += [[p, p + 1, q + 1], [p, q + 1, q]]
    return np.array(P), np.array(UV), np.array(T), (TAU * r.max(), L[-1])

def cabeza(mh):
    """Medidas de la cabeza como en piezas.yelmo: semiejes, centro, cima y altura del borde por ángulo."""
    V = mh['V']; cu = np.array(sorted({p[0] for f, g in zip(mh['F'], mh['G']) if g == 'body' for p in f})); H = V[cu][mh['W']['head'][cu] > 0.9]
    arr = H[H[:, 1] > 1.655]; cz = (arr[:, 2].min() + arr[:, 2].max()) / 2; ax = np.abs(arr[:, 0]).max() + 0.011; az = (arr[:, 2].max() - arr[:, 2].min()) / 2 + 0.012; ytop = H[:, 1].max() + 0.016
    yf, yb = 1.664, 1.612; return dict(ax=ax, az=az, cz=cz, ytop=ytop, yr=lambda t: (yf + yb) / 2 + (yf - yb) / 2 * np.cos(t), H=H)

# ---------- armas ----------
def jabalina(agarre, eje, lado, hueso, conj, largo=1.25, bajo=0.55, punta=0.24, grueso=0.0085, nombre='jabalina', simple=False):
    """Jabalina fina (hasta velitaris, Polibio 6.22: asta de dos codos, punta larga y fina que se dobla al clavarse)."""
    eje = np.asarray(eje, float); eje /= np.linalg.norm(eje); base = np.asarray(agarre) - eje * bajo; out = []; ls = 3 if simple else 6
    g = grueso * (1.5 if simple else 1.0)
    P, UV, T, tam = torno([(0.0, -0.02), (g * 0.8, 0.0), (g, largo * 0.5), (g * 0.9, largo - punta)], ls, base, eje, lado); out.append(pieza(nombre + '_asta', P, T, UV, MAT['madera'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1] * largo, UV[:, 0]], 1)))
    perf = [(g * 0.9, largo - punta), (g * 0.75, largo - punta * 0.4), (g * 1.7 if not simple else g * 1.3, largo - punta * 0.14), (0.0, largo)]
    P, UV, T, tam = torno(perf, 3 if simple else 4, base, eje, lado, 0.5); out.append(pieza(nombre + '_punta', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1), suave=False))
    return out

def haz_jabalinas(h, n=2, conj=0, hueso='wrist.L', largo=1.25, simple=False, atras=0.030, nombre='jabalina_rep'):
    """Jabalinas de repuesto sujetas con el escudo en la mano izquierda, por detrás del escudo, algo abiertas en abanico."""
    out = []; o = h['c'] - h['N'] * atras
    for k in range(n):
        a = -0.30 + 0.16 * k; e = h['Y'] * np.cos(a) + h['X'] * np.sin(a); out += jabalina(o + h['X'] * (0.012 * k), e, h['N'], hueso, conj, largo=largo, bajo=largo * 0.42, simple=simple, nombre='%s%d' % (nombre, k))
    return out

# ---------- escudos ----------
def parma(h, diam=0.90, Rd=2.6, nombre='escudo', nr=7, na=28, canto=True, umbo=True, Z0=0.045):
    """Parma de vélite: redonda (3 pies, Polibio 6.22), poco abombada, con umbo de hierro. Frente hacia h['N']."""
    o, Xa, Ya, Na = h['c'], h['X'], h['Y'], h['N']; Rm = diam / 2
    def M(p): return o + Xa * p[0] + Ya * p[1] + Na * (p[2] + Z0)
    def sup(u, v, dz=0.0):
        a = u * TAU; r = v * Rm; return np.array([np.cos(a) * r, np.sin(a) * r, -r * r / (2 * Rd) + dz])
    out = []
    P, UV, T = rej(lambda u, v: M(sup(u, v)), na, nr); loc = np.array([sup(u, v)[:2] for u, v in UV]); T = T[:, ::-1]
    out.append(pieza(nombre + '_frente', P, T, UV, MAT['parma'], (diam, diam), 'wrist.L', prm=loc, aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.0 if nr >= 6 else 1.5))
    P, UV, T = rej(lambda u, v: M(sup(u, v, -0.012)), min(na, 16), min(nr, 4)); loc = np.array([sup(u, v)[:2] for u, v in UV])
    out.append(pieza(nombre + '_dorso', P, T, UV, MAT['tablas'], (diam, diam), 'wrist.L', prm=loc, prio=0.5))
    if canto:
        pts = [M(sup(k / 40, 1.0, -0.004)) for k in range(40)]; P, UV, T, tam = tubo(pts, 0.010, 4, True)
        out.append(pieza(nombre + '_canto', P, T, UV, MAT['cuero'], tam, 'wrist.L', prm=UV * tam, aux=np.stack([np.full(len(UV), 0.5), UV[:, 1]], 1), prio=0.7))
    if umbo:
        perf = [(0.085, 0.0), (0.083, 0.008), (0.062, 0.03), (0.035, 0.048), (0.0, 0.054)]; base = M(np.array([0, 0, 0.0]))
        P, UV, T, tam = torno(perf, 12, base, Na, Xa); out.append(pieza(nombre + '_umbo', P, T, UV, MAT['hierro'], tam, 'wrist.L', prm=UV * tam, prio=1.2))
    P, UV, T, tam = torno([(0.0, -0.07), (0.016, -0.07), (0.016, 0.07), (0.0, 0.07)], 8, o, Xa, Na); out.append(pieza(nombre + '_asa', P, T, UV, MAT['madera'], tam, 'wrist.L', prm=UV * tam, prio=0.5))
    return out

def pelte(h, Ro=0.31, ci=0.30, ri=0.25, R=0.85, nombre='escudo', nu=16, nv=10, canto=True, Z0=0.045, alza=0.04):
    """Pelte tracia: escudo ligero de mimbre forrado de piel, en media luna (cuernos arriba). Frente hacia h['N']."""
    o, Xa, Ya, Na = h['c'], h['X'], h['Y'], h['N']; xc = np.sqrt(max(Ro ** 2 - ((Ro ** 2 - ri ** 2 + ci ** 2) / (2 * ci)) ** 2, 0))
    def top(x): return np.sqrt(max(Ro ** 2 - x * x, 0)) if abs(x) >= xc else ci - np.sqrt(max(ri ** 2 - x * x, 0))
    def sup(u, v, dz=0.0):
        x = (u * 2 - 1) * Ro * 0.995; yb = -np.sqrt(max(Ro ** 2 - x * x, 0)); y = yb + (top(x) - yb) * v; al = x / R
        return np.array([R * np.sin(al), y + alza, R * np.cos(al) - R + dz]), np.array([np.sin(al), 0, np.cos(al)])
    def M(p): return o + Xa * p[0] + Ya * p[1] + Na * (p[2] + Z0)
    out = []
    P, UV, T = rej(lambda u, v: M(sup(u, v)[0]), nu, nv); loc = np.array([sup(u, v)[0][:2] for u, v in UV])
    out.append(pieza(nombre + '_frente', P, T, UV, MAT['mimbre'], (2 * Ro, Ro + 0.21), 'wrist.L', prm=loc, aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.1 if nu >= 12 else 1.5))
    P, UV, T = rej(lambda u, v: M(sup(u, v)[0] - sup(u, v)[1] * 0.014), min(nu, 10), min(nv, 6)); loc = np.array([sup(u, v)[0][:2] for u, v in UV])
    out.append(pieza(nombre + '_dorso', P, T[:, ::-1], UV, MAT['mimbre'], (2 * Ro, Ro + 0.21), 'wrist.L', prm=loc, aux=np.stack([UV[:, 1], UV[:, 0] + 2], 1), prio=0.5))
    if canto:                                                  # ribete de cuero por todo el contorno
        K = 22; xs = np.linspace(-Ro * 0.995, Ro * 0.995, K); bot = [sup(k / (K - 1), 0.0, -0.006)[0] for k in range(K)]; tp = [sup(k / (K - 1), 1.0, -0.006)[0] for k in range(K)][::-1]
        pts = [M(p) for p in bot + tp[1:-1]]; P, UV, T, tam = tubo(pts, 0.009, 4, True)
        out.append(pieza(nombre + '_canto', P, T, UV, MAT['cuero'], tam, 'wrist.L', prm=UV * tam, aux=np.stack([np.full(len(UV), 0.5), UV[:, 1]], 1), prio=0.7))
    P, UV, T, tam = torno([(0.0, -0.07), (0.016, -0.07), (0.016, 0.07), (0.0, 0.07)], 8, o, Xa, Na); out.append(pieza(nombre + '_asa', P, T, UV, MAT['madera'], tam, 'wrist.L', prm=UV * tam, prio=0.5))
    return out

# ---------- cabeza ----------
def casco_simple(mh, nombre='yelmo', mat='bronce', lados=20):
    """Casco sencillo de vélite: cuenco liso de bronce, sin cresta ni carrilleras (Polibio 6.22)."""
    c = cabeza(mh); ax, az, cz, ytop, yr = c['ax'], c['az'], c['cz'], c['ytop'], c['yr']
    perf = [(1.07, -0.003), (1.08, 0.004), (1.04, 0.012), (1.01, 0.016)] + [((1 - hh ** 2.0) ** (1 / 2.5), hh) for hh in (0.12, 0.3, 0.48, 0.64, 0.78, 0.89, 0.96)] + [(0.0, 1.0)]
    def cu(u, v):
        t = u * TAU; k = v * (len(perf) - 1); i = min(int(k), len(perf) - 2); f = k - i; r, hh = np.array(perf[i]) * (1 - f) + np.array(perf[i + 1]) * f
        y0 = yr(t); y = y0 + hh if i < 3 else y0 + 0.016 + (ytop - y0 - 0.016) * hh; return np.array([np.sin(t) * ax * r, y, cz + np.cos(t) * az * r])
    P, UV, T = rej(cu, lados, len(perf) - 1)
    return [pieza(nombre + '_cuenco', P, T, UV, MAT[mat], (0.66, 0.26), 'head', prm=UV * [0.66, 0.26], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.4)]

def gorro_piel(mh, nombre, mat, k=1.13, sobre=0.03, frente=0.035, lado=0.01, solapa=0.0, nuca=1.47, lean=0.0, hocico=True, orejas=True, nu=28, nv=11, flare=0.10, hz=0.0, hoc_v=0.2, esc=1.0, eje_h=(0, -0.10, 1.0), ore_u=0.075):
    """Piel de animal sobre la cabeza: cuenco de pelo, faldón por detrás (y solapas a los lados si solapa > 0),
    hocico y orejas del animal por delante. Vélite: lobo sobre el casco. Peltasta: alopekis de zorro."""
    c = cabeza(mh); ax, az, cz, ytop, yr = c['ax'], c['az'], c['cz'], c['ytop'] + sobre, c['yr']
    def borde(t):
        a = abs(np.angle(np.exp(1j * t))); yb = yr(t) + frente * np.cos(a / 2) ** 6 + lado
        yb = yb - solapa * np.exp(-((a - np.pi / 2) / 0.42) ** 2); atras = np.clip((a - 1.9) / 0.9, 0, 1); return yb * (1 - atras) + min(nuca, yb) * atras
    def pt(u, v):
        t = u * TAU; y0 = yr(t); yb = borde(t); y = ytop + (yb - ytop) * v ** 0.9
        if y > y0: hn = (y - y0) / (ytop - y0); r = (1 - hn ** 2) ** (1 / 2.5); r = max(r, 0.0)
        else: hn = 0.0; r = 1.0 + flare * (y0 - y) / 0.15
        return np.array([np.sin(t) * ax * k * r, y + hz * hn ** 3, cz + np.cos(t) * az * k * r + lean * hn ** 2])
    P, UV, T = rej(pt, nu, nv); out = [pieza(nombre + '_capa', P, T, UV, MAT[mat], (0.75, 0.30), 'head', prm=UV * [0.75, 0.30], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.3)]
    if hocico:                                                 # el hocico del animal cae sobre la frente
        f = pt(0.0, hoc_v); base = f - np.array([0, 0, 0.04]); eje = np.array(eje_h, float)
        perf = [(r * esc, h * esc) for r, h in ((0.040, 0.0), (0.044, 0.035), (0.036, 0.08), (0.024, 0.12), (0.014, 0.142), (0.0, 0.15))]
        P, UV, T, tam = torno(perf, 8, base, eje, [1.0, 0, 0], 0.62); out.append(pieza(nombre + '_hocico', P, T, UV, MAT[mat], tam, 'head', prm=UV * tam, aux=np.stack([UV[:, 1] + 2, UV[:, 0]], 1), prio=1.4))
    if orejas:
        for s, L in ((1, 'L'), (-1, 'R')):
            b0 = pt(ore_u * s % 1.0, 0.2) - np.array([0, 0.008, 0]); d = np.array([0.30 * s, 1.0, -0.10])
            P, UV, T, tam = torno([(0.026 * esc, 0.0), (0.020 * esc, 0.03 * esc), (0.0, 0.062 * esc)], 4, b0, d, [0, 0, 1.0], 0.40)
            out.append(pieza(nombre + '_oreja' + L, P, T, UV, MAT[mat], tam, 'head', prm=UV * tam, aux=np.stack([UV[:, 1] + 4, UV[:, 0]], 1), prio=1.2))
    return out

# ---------- honda ----------
def honda_cabeza(mh, nombre='honda_cab', cabos=True, trozos=False, sobre=0.0):
    """Honda ceñida a la cabeza como una cinta (Diodoro 5.18: una en la cabeza, otra en la cintura, otra en la mano)."""
    c = cabeza(mh); H = c['H']; cz = c['cz']; ang = np.arctan2(H[:, 0], H[:, 2] - cz); rad = np.hypot(H[:, 0], H[:, 2] - cz); pts = []
    for t in np.linspace(-np.pi, np.pi, 33)[:-1]:
        yy = 1.655 + 0.022 * np.cos(t); sel = (np.abs(np.angle(np.exp(1j * (ang - t)))) < 0.2) & (np.abs(H[:, 1] - yy) < 0.012); r = np.percentile(rad[sel], 85) + 0.004 + sobre * (1 - np.cos(t)) / 2 if sel.any() else 0.09
        pts.append([np.sin(t) * r, yy, cz + np.cos(t) * r])
    if trozos:                                                 # de lejos: ya ligera y en trozos de menos de 24 triángulos, para que aligerar_piezas no la deforme
        pts = pts[::2]; n = len(pts); out = []
        for k in range(0, n, 3):
            q = [pts[(k + j) % n] for j in range(4)]; P, UV, T, tam = tubo(q, 0.0055, 3)
            out.append(pieza('%s%d' % (nombre, k // 3), P, T, UV, MAT['cuerda'], tam, 'head', prm=UV * tam, aux=np.stack([UV[:, 1] * 8, UV[:, 0]], 1), prio=1.0))
        return out
    P, UV, T, tam = tubo(pts, 0.0048, 5, True); out = [pieza(nombre, P, T, UV, MAT['cuerda'], tam, 'head', prm=UV * tam, aux=np.stack([UV[:, 1] * 30, UV[:, 0]], 1), prio=1.3)]
    if cabos:                                                  # el nudo y los dos cabos colgando por detrás
        b = np.array(pts[0]) + [0, 0, -0.004]
        for k, s in enumerate((1, -1)):
            q = [b + [s * 0.006 * j, -0.022 * j, -0.006 * j - 0.002 * j * j] for j in range(6)]; P, UV, T, tam = tubo(q, 0.004, 4)
            out.append(pieza('%s_cabo%d' % (nombre, k), P, T, UV, MAT['cuerda'], tam, 'head', prm=UV * tam, aux=np.stack([UV[:, 1] * 4, UV[:, 0]], 1)))
    return out

def honda_mano(h, conj_piedra=1, nombre='honda', largo=0.40, hueso='wrist.R', simple=False, ligera=False):
    """Honda en la mano derecha: dos cuerdas que cuelgan del puño (h['X'] es «abajo» en la pose de llevar) y la bolsa con su piedra."""
    o = h['c']; d = h['X']; a = h['Y']; n = h['N']; out = []; fin = o + d * largo
    if not simple:
        for k, s in enumerate((1, -1)):
            nj = 3 if ligera else 7; q = [o + d * (largo * j / nj) + a * s * 0.018 * np.sin(np.pi * j / nj) ** 0.5 * (j / nj) + n * 0.004 * s for j in range(nj + 1)]; P, UV, T, tam = tubo(q, 0.0032 if not ligera else 0.004, 3)
            out.append(pieza('%s_cuerda%d' % (nombre, k), P, T, UV, MAT['cuerda'], tam, hueso, prm=UV * tam, aux=np.stack([UV[:, 1] * 25, UV[:, 0]], 1), prio=0.8))
    else:
        P, UV, T, tam = tubo([o, fin], 0.006, 3); out.append(pieza(nombre + '_cuerda0', P, T, UV, MAT['cuerda'], tam, hueso, prm=UV * tam, aux=np.stack([UV[:, 1] * 25, UV[:, 0]], 1)))
    def bol(u, v):
        t = u * TAU; ph = (v - 0.5) * np.pi; return fin + d * (0.035 + np.sin(ph) * 0.035) + a * np.cos(ph) * np.cos(t) * 0.030 + n * np.cos(ph) * np.sin(t) * 0.022
    P, UV, T = rej(bol, 6 if not simple else 4, 4); out.append(pieza(nombre + '_bolsa', P, T, UV, MAT['cuerda'], (0.18, 0.08), hueso, prm=UV * [0.18, 0.08], aux=np.stack([UV[:, 1] * 6, UV[:, 0]], 1)))
    def pie(u, v):
        t = u * TAU; ph = (v - 0.5) * np.pi; return fin + d * 0.035 + n * 0.012 + (a * np.cos(ph) * np.cos(t) + n * np.cos(ph) * np.sin(t) + d * np.sin(ph)) * 0.024
    P, UV, T = rej(pie, 4 if simple else 6, 3 if simple else 4); out.append(pieza(nombre + '_piedra', P, T, UV, MAT['piedra'], (0.15, 0.08), hueso, conj=conj_piedra, prm=UV * [0.15, 0.08]))
    return out

def bolsa_mano(h, nombre='zurron', hueso='wrist.L', lados=10):
    """Zurrón de piedras colgando del puño izquierdo por su cordón (h['Y'] es «arriba» en la pose de escudo)."""
    o = h['c'] + h['N'] * 0.01; e = -h['Y']
    perf = [(0.004, -0.01), (0.005, 0.05), (0.018, 0.065), (0.045, 0.095), (0.062, 0.14), (0.064, 0.18), (0.052, 0.215), (0.025, 0.235), (0.0, 0.24)]
    P, UV, T, tam = torno(perf, lados, o, e, h['N'], 0.78); return [pieza(nombre, P, T, UV, np.where(UV[:, 1] < 0.22, MAT['cuerda'], MAT['cuero']), tam, hueso, prm=UV * tam, aux=np.stack([UV[:, 1], np.abs(np.cos(UV[:, 0] * TAU))], 1), prio=1.1)]

# ---------- pintores ----------
sst, fbm, r2, mez, gau = TX.sst, TX.fbm, TX.r2, TX.mez, TX.gau

def _pelo(ctx):
    s = ctx['s']; P = ctx['P'][s]; AX = ctx['AX'][s]; PR = ctx['PR'][s]; MT = ctx['MT'][s]; n = int(s.sum()); zorro = MT == MAT['piel_zorro']
    u, v = PR.T; parte = AX[:, 0]; heb = r2(u * 700 + 2.0 * np.sin(v * 40), v * 90, 1.0, 9.0); heb2 = r2(u * 1800, v * 260, 1.0, 19.0); mech = fbm(P, 70, 3, 33.0)
    base = np.where(zorro[:, None], np.array([0.60, 0.31, 0.12]), np.array([0.50, 0.46, 0.40])); c = base * (0.62 + 0.30 * heb + 0.22 * heb2)[:, None] * (0.70 + 0.6 * mech)[:, None]
    capa = parte <= 1.0; lomo = capa * np.exp(-(((AX[:, 1] - 0.5) * 2) / 0.35) ** 2) * sst(0.0, 0.5, parte)   # raya oscura del lomo, por detrás
    c = mez(c, np.where(zorro[:, None], [0.30, 0.13, 0.05], [0.17, 0.15, 0.13]), 0.55 * lomo)
    orilla = capa * sst(0.80, 1.0, parte); c = mez(c, np.where(zorro[:, None], [0.85, 0.80, 0.70], [0.62, 0.58, 0.50]), 0.45 * orilla * (heb > 0.45))
    hoc = (parte >= 2) & (parte < 4); vh = parte - 2; nariz = hoc * sst(0.86, 0.95, vh); c = mez(c, np.where(zorro[:, None], [0.88, 0.84, 0.76], [0.55, 0.52, 0.46]), 0.5 * hoc * sst(0.3, 0.8, vh) * (np.abs(np.cos(AX[:, 1] * TAU)) < 0.6)); c = mez(c, [0.05, 0.04, 0.04], nariz)
    ojo = hoc * (np.abs(vh - 0.22) < 0.03) * (np.abs(np.abs(np.cos(AX[:, 1] * TAU)) - 0.6) < 0.12) * (np.sin(AX[:, 1] * TAU) > 0); c = mez(c, [0.06, 0.05, 0.03], 0.8 * ojo)
    ore = parte >= 4; c = mez(c, [0.12, 0.10, 0.08], 0.6 * ore * sst(0.4, 0.9, parte - 4))
    ctx['C'][s] = c; ctx['H'][s] = 0.0024 * heb + 0.0012 * heb2 + 0.002 * mech; ctx['R'][s] = np.where(nariz > 0.5, 0.3, 0.82); ctx['ME'][s] = 0
TX.PINTORES.append(([MAT['piel_lobo'], MAT['piel_zorro']], _pelo))

def _mimbre(ctx):
    s = ctx['s']; PR = ctx['PR'][s]; AX = ctx['AX'][s]; P = ctx['P'][s]; x, y = PR.T; dorso = AX[:, 1] >= 2
    fila = np.floor(y / 0.011); vara = 0.5 + 0.5 * np.cos(TAU * (y / 0.011 - fila - 0.5) * 0.5) ** 2; poste = np.floor(x / 0.045); arriba = ((fila + poste) % 2 == 0)
    bulto = vara * (0.65 + 0.35 * np.where(arriba, np.cos(np.pi * (x / 0.045 - poste - 0.5)), -np.cos(np.pi * (x / 0.045 - poste - 0.5))))
    paja = np.array([0.60, 0.48, 0.28]) * (0.7 + 0.35 * bulto)[:, None] * (0.85 + 0.3 * fbm(P, 30, 3, 51.0))[:, None]
    # frente: forrado de piel pintada (tinte de escudo), que deja ver el tejido; borde y un ojo apotropaico
    r = np.hypot(x, (y + 0.10) * 1.1); orla = sst(0.86, 0.92, AX[:, 0]) + sst(0.06, 0.0, AX[:, 0]); orla = np.clip(orla, 0, 1); ojo = sst(0.075, 0.065, r) - sst(0.040, 0.032, r); pupila = sst(0.030, 0.022, r)
    pint = np.array([0.55, 0.52, 0.46]) * (0.80 + 0.2 * bulto)[:, None] * (0.85 + 0.25 * fbm(P, 16, 3, 4.0))[:, None]; gas = sst(0.55, 0.8, fbm(P, 22, 3, 61.0))
    c = mez(pint, [0.82, 0.76, 0.62], 0.85 * np.clip(orla + ojo, 0, 1)); c = mez(c, [0.10, 0.08, 0.06], 0.9 * pupila); c = mez(c, paja, 0.55 * gas * (1 - orla))
    c = np.where(dorso[:, None], paja, c); ti = (1 - np.clip(orla + ojo + pupila, 0, 1)) * (1 - 0.55 * gas)
    ctx['C'][s] = c; ctx['H'][s] = 0.0022 * bulto * np.where(dorso, 1.0, 0.6); ctx['R'][s] = 0.85; ctx['ME'][s] = 0; ctx['TI'][s, 2] = np.where(dorso, 0, ti)
TX.PINTORES.append(([MAT['mimbre']], _mimbre))

def _parma(ctx):
    s = ctx['s']; PR = ctx['PR'][s]; AX = ctx['AX'][s]; P = ctx['P'][s]; x, y = PR.T; r = AX[:, 0]; a = AX[:, 1]
    cuero = np.array([0.55, 0.53, 0.49]) * (0.80 + 0.25 * fbm(P, 16, 3, 4.0) + 0.05 * (ctx['grano'][s] - 0.5))[:, None]
    anillo = sst(0.30, 0.32, r) * sst(0.38, 0.36, r) + sst(0.86, 0.88, r); rayo = (np.abs(((a * 8) % 1) - 0.5) < 0.05) * sst(0.40, 0.44, r) * sst(0.84, 0.80, r)
    ray = np.clip(sst(0.80, 0.93, r2(x * 55 + y * 16, y * 9, 1.0, 5.0)) * sst(0.35, 0.7, ctx['mancha'][s]) + sst(0.84, 0.95, r2(x * 300, y * 300, 1.0, 12.0)) * 0.7, 0, 1) * 0.6
    gas = np.clip(sst(0.75, 1.0, r) * (0.3 + 0.9 * fbm(P, 34, 3, 21.0)), 0, 1); mot = np.clip(anillo + rayo, 0, 1)
    c = mez(cuero, [0.80, 0.74, 0.58], 0.85 * mot * (1 - ray)); c = mez(c, [0.52, 0.43, 0.33], 0.55 * ray); c = mez(c, [0.40, 0.31, 0.22], 0.45 * gas)
    ctx['C'][s] = c; ctx['H'][s] = 0.0008 * mot - 0.0006 * ray + 0.0002 * (ctx['grano'][s] - 0.5); ctx['R'][s] = 0.78; ctx['ME'][s] = 0; ctx['TI'][s, 2] = (1 - mot) * (1 - 0.8 * ray) * (1 - 0.6 * gas)
TX.PINTORES.append(([MAT['parma']], _parma))

def _cuerda(ctx):
    s = ctx['s']; AX = ctx['AX'][s]; P = ctx['P'][s]; tw = 0.5 + 0.5 * np.sin(AX[:, 0] * TAU * 2 + AX[:, 1] * TAU * 2)
    c = np.array([0.20, 0.17, 0.13]) * (0.6 + 0.6 * tw)[:, None] * (0.85 + 0.3 * fbm(P, 40, 2, 71.0))[:, None]                 # junco negro (melankranis, Estrabón 3.5.1)
    ctx['C'][s] = c; ctx['H'][s] = 0.0008 * tw; ctx['R'][s] = 0.85; ctx['ME'][s] = 0
TX.PINTORES.append(([MAT['cuerda']], _cuerda))

def _zeira(ctx):
    s = ctx['s']; P = ctx['P'][s]; PR = ctx['PR'][s]; x, y, z = P.T; u, v = PR.T
    hilo = 0.5 + 0.25 * np.sin((u + v) * 2100) + 0.25 * np.sin((u - v) * 1950); arr = fbm(np.stack([u * 1.5, v * 1.5, z * 0.3], 1), 14, 3, 5.0)
    zig = np.abs(((u * 18) % 1) - 0.5) * 0.03; b1 = np.abs(y - 1.255 - zig) < 0.010; b2 = np.abs(y - 1.225) < 0.004; b3 = np.abs(y - 1.285) < 0.004; banda = np.clip(b1 + 0.8 * b2 + 0.8 * b3, 0, 1)
    c = np.full((int(s.sum()), 3), 0.46) * (0.80 + 0.22 * arr + 0.08 * hilo)[:, None]; c = mez(c, [0.80, 0.72, 0.52], 0.85 * banda); c = mez(c, [0.15, 0.12, 0.10], 0.6 * (np.abs(y - 1.255 - zig) < 0.003))
    ctx['C'][s] = c; ctx['H'][s] = 0.0003 * hilo + 0.004 * (arr - 0.5); ctx['R'][s] = 0.95; ctx['ME'][s] = 0; ctx['TI'][s, 0] = 1 - banda
TX.PINTORES.append(([MAT['zeira']], _zeira))

def _piedra(ctx):
    s = ctx['s']; P = ctx['P'][s]; f = fbm(P, 90, 3, 81.0); ctx['C'][s] = np.array([0.55, 0.52, 0.47]) * (0.7 + 0.4 * f)[:, None]; ctx['H'][s] = 0.0005 * f; ctx['R'][s] = 0.7; ctx['ME'][s] = 0
TX.PINTORES.append(([MAT['piedra']], _piedra))
