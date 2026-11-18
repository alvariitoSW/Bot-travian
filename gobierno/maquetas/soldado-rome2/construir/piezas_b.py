"""GM44d (mitad B): piezas del hoplita, el falangita y el ibero, hechas por código (arte propio del proyecto).
Mismas reglas que piezas.py: metros; x a la izquierda del soldado, y arriba, z al frente. Materiales nuevos 25-27 (ver abajo)."""
import numpy as np, exportar as X
from piezas import MAT, TAU, pieza, rej, torno

MAT.update(lino=25, aspis=26, crin=27)      # GM44d-B: lino (linotórax, pteruges, túnica ibera), escudo pintado redondo, crin de la cimera

def _u(v):
    v = np.asarray(v, float); return v / np.linalg.norm(v)

def orienta(P, T, d):
    """Da la vuelta a los triángulos si sus normales no miran, de media, hacia d (vector o función del centro del triángulo)."""
    a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]; n = np.cross(b - a, c - a); g = (a + b + c) / 3; dd = d(g) if callable(d) else np.broadcast_to(np.asarray(d, float), n.shape)
    return T if (n * dd).sum() >= 0 else T[:, ::-1]

def _plato(o, Xa, Ya, Na, perfil, lados, nombre, mat, hueso, frente=True, prio=1.0, tinte=0, R=None):
    """Superficie de revolución de un escudo redondo: perfil [(radio, altura sobre el frente)] alrededor del eje Na desde o.
    prm = coordenadas locales (m) en el plano del escudo; aux = (radio relativo, ángulo relativo)."""
    P, UV, T, tam = torno(perfil, lados, o, Na, Ya); T = orienta(P, T, Na if frente else -Na); q = P - o; loc = np.stack([q @ Xa, q @ Ya], 1); R = R or max(p[0] for p in perfil)
    aux = np.stack([np.hypot(loc[:, 0], loc[:, 1]) / R, (np.arctan2(loc[:, 1], loc[:, 0]) / TAU) % 1.0], 1)
    return pieza(nombre, P, T, UV, MAT[mat] if isinstance(mat, str) else mat, tam, hueso, prm=loc, aux=aux, prio=prio, tinte=tinte)

def aspis(h, radio=0.45, prof=0.10, off=0.12, Z0=0.055, hueso='wrist.L', nombre='escudo', lados=28, anillos=7):
    """Aspis (hoplon): escudo redondo de unos 90 cm, cóncavo, con borde ancho de bronce. El brazo entra en el porpax del centro
    y la mano agarra la antilabe; aquí el centro queda a «off» de la mano, hacia el codo (licencia de juego: los movimientos
    compartidos llevan el antebrazo vertical, como con el scutum)."""
    Xa, Ya, Na = h['X'], h['Y'], h['N']; o = h['c'] + Ya * off; Rb = radio - 0.055; out = []
    zb = lambda r: Z0 - prof * (r / Rb) ** 2
    perf = [(Rb * k, zb(Rb * k)) for k in np.linspace(0, 1, anillos + 1)]; perf[0] = (0.0, Z0)
    out.append(_plato(o, Xa, Ya, Na, perf, lados, nombre + '_frente', 'aspis', hueso, prio=1.0 if lados >= 20 else 1.4, R=radio))
    lab = [(Rb - 0.004, zb(Rb) + 0.004), (Rb + 0.012, zb(Rb) - 0.004), (radio - 0.012, zb(Rb) - 0.010), (radio, zb(Rb) - 0.022)]
    out.append(_plato(o, Xa, Ya, Na, lab, lados, nombre + '_frenteb', 'bronce', hueso, prio=0.8, R=radio))
    dor = [(radio - 0.004, zb(Rb) - 0.030)] + [(Rb * k, zb(Rb * k) - 0.014) for k in np.linspace(1, 0, max(3, anillos - 2) + 1)]
    out.append(_plato(o, Xa, Ya, Na, dor, min(lados, 16), nombre + '_dorso', 'tablas', hueso, frente=False, prio=0.45, R=radio))
    # porpax (abrazadera del antebrazo) y antilabe (asa de la mano), por dentro
    pc = h['c'] + Ya * 0.22 + Na * (zb(0.10) - 0.05)
    Pp, UVp, Tp, tam = torno([(0.052, -0.022), (0.056, 0.0), (0.052, 0.022)], 10, pc, Ya, Na, 0.55); out.append(pieza(nombre + '_asa', Pp, Tp, UVp, MAT['bronce'], tam, hueso, prio=0.4))
    return out

def caetra(h, radio=0.28, Z0=0.05, hueso='wrist.L', nombre='escudo', lados=24):
    """Caetra ibera: escudo redondo pequeño (unos 55 cm) de madera y cuero, con umbo de hierro y asa central."""
    Xa, Ya, Na = h['X'], h['Y'], h['N']; o = h['c']; out = []
    disco = [(0.088, Z0 + 0.016)] + [(0.088 + (radio - 0.1) * k, Z0 + 0.016 - 0.03 * k * k) for k in np.linspace(0.25, 1, 4)] + [(radio - 0.006, Z0 - 0.018), (radio, Z0 - 0.032)]
    if lados <= 12: disco = [disco[0], disco[3], disco[-1]]
    out.append(_plato(o, Xa, Ya, Na, disco, lados, nombre + '_frente', 'aspis', hueso, R=radio, prio=1.2))
    umbo = [(0.0, Z0 + 0.075), (0.035, Z0 + 0.071), (0.062, Z0 + 0.055), (0.080, Z0 + 0.030), (0.094, Z0 + 0.016), (0.100, Z0 + 0.010)]
    out.append(_plato(o, Xa, Ya, Na, umbo if lados > 12 else umbo[::2] + umbo[-1:], max(6, lados // 2), nombre + '_umbo', 'hierro', hueso, R=radio, prio=1.2))
    dor = [(radio - 0.002, Z0 - 0.036), (radio * 0.6, Z0 - 0.002), (0.0, Z0 + 0.004)]
    out.append(_plato(o, Xa, Ya, Na, dor, min(lados, 14), nombre + '_dorso', 'cuero', hueso, frente=False, prio=0.5, R=radio))
    P, UV, T, tam = torno([(0.0, -0.06), (0.014, -0.06), (0.014, 0.06), (0.0, 0.06)], 6, o, Xa, Na); out.append(pieza(nombre + '_asa', P, T, UV, MAT['madera'], tam, hueso, prm=UV * tam, prio=0.4))
    return out

def pelte(o, Na, Ya, hueso, radio=0.33, nombre='escudo', lados=24):
    """Escudo macedonio pequeño (unos 66 cm), algo abombado, que cuelga del antebrazo y del hombro: las dos manos van a la sarisa."""
    Na = _u(Na); Ya = _u(np.asarray(Ya, float) - Na * (np.asarray(Ya, float) @ Na)); Xa = np.cross(Ya, Na); out = []
    perf = [(0.0, 0.045)] + [(radio * 0.93 * k, 0.045 - 0.05 * k * k) for k in np.linspace(0.2, 1, 5 if lados > 12 else 2)]
    out.append(_plato(o, Xa, Ya, Na, perf, lados, nombre + '_frente', 'aspis', hueso, R=radio, prio=1.2))
    lab = [(radio * 0.93 - 0.003, -0.002), (radio * 0.95, -0.008), (radio, -0.018)]
    out.append(_plato(o, Xa, Ya, Na, lab, lados, nombre + '_frenteb', 'bronce', hueso, R=radio, prio=0.7))
    dor = [(radio - 0.002, -0.024), (radio * 0.6, 0.006), (0.0, 0.030)]
    out.append(_plato(o, Xa, Ya, Na, dor, min(lados, 14), nombre + '_dorso', 'cuero', hueso, frente=False, prio=0.4, R=radio))
    return out

def asta(agarre, eje, lado, hueso, conj, largo, bajo, nombre, r0=0.0135, r1=0.0125, punta=0.34, regaton=0.0, simple=False, prio=1.0, ancho_punta=0.030, mat_punta='hierro'):
    """Lanza con asta de madera, punta de hierro en hoja y, si se pide, regatón de bronce (sauroter) atrás. prio baja = poca textura."""
    eje = _u(eje); base = np.asarray(agarre) - eje * bajo; out = []; z0 = regaton
    if simple:
        P, UV, T, tam = torno([(r0 * 1.15, z0), (r1 * 1.15, largo - punta)], 3, base, eje, lado); out.append(pieza(nombre + '_asta', P, T, UV, MAT['madera'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1] * largo, UV[:, 0]], 1), prio=prio))
        P, UV, T, tam = torno([(r1 * 1.15, largo - punta), (ancho_punta * 1.05, largo - punta * 0.5), (0.0, largo)], 3, base, eje, lado, 0.3); out.append(pieza(nombre + '_punta', P, T, UV, MAT[mat_punta], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1)))
        return out
    P, UV, T, tam = torno([(0.0, z0 - 0.01), (r0 * 0.85, z0), (r0, z0 + 0.4), (r1, largo - punta + 0.01)], 8 if largo < 4 else 6, base, eje, lado); out.append(pieza(nombre + '_asta', P, T, UV, MAT['madera'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1] * largo, UV[:, 0]], 1), prio=prio))
    L = largo; p_ = punta
    P, UV, T, tam = torno([(r1, L - p_), (r1 * 1.15, L - p_ * 0.76), (r1 * 0.75, L - p_ * 0.72), (ancho_punta, L - p_ * 0.48), (ancho_punta * 0.72, L - p_ * 0.22), (0.0, L)], 4, base, eje, lado, 0.18)
    out.append(pieza(nombre + '_punta', P, T, UV, MAT[mat_punta], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1)))
    if regaton:
        P, UV, T, tam = torno([(0.0, -0.002), (0.006, 0.01), (r0 * 1.05, regaton * 0.8), (r0 * 1.25, regaton), (r0 * 0.9, regaton + 0.012)], 6, base, eje, lado); out.append(pieza(nombre + '_regaton', P, T, UV, MAT['bronce'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1)))
    return out

def soliferreum(agarre, eje, lado, hueso, conj, bajo=0.95, largo=1.85, nombre='pilum', simple=False):
    """Soliferreum: jabalina ibera toda de hierro, fina, con punta de aletas. (Nombre de pieza «pilum» para que el juego la trate igual.)"""
    eje = _u(eje); base = np.asarray(agarre) - eje * bajo; out = []
    if simple:
        P, UV, T, tam = torno([(0.011, 0.0), (0.011, largo - 0.12), (0.0, largo)], 3, base, eje, lado); return [pieza(nombre + '_hierro', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1))]
    P, UV, T, tam = torno([(0.0, -0.01), (0.005, 0.0), (0.0075, 0.5), (0.0095, bajo - 0.08), (0.0105, bajo), (0.0095, bajo + 0.08), (0.0065, largo - 0.14)], 6, base, eje, lado); out.append(pieza(nombre + '_hierro', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=0.8))
    P, UV, T, tam = torno([(0.0065, largo - 0.14), (0.018, largo - 0.12), (0.012, largo - 0.10), (0.010, largo - 0.06), (0.0, largo)], 4, base, eje, lado, 0.35); out.append(pieza(nombre + '_punta', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1), suave=False))
    # tiento de cuero donde se agarra
    P, UV, T, tam = torno([(0.0110, bajo - 0.07), (0.0125, bajo - 0.06), (0.0125, bajo + 0.06), (0.0110, bajo + 0.07)], 6, base, eje, lado); out.append(pieza(nombre + '_taco', P, T, UV, MAT['cuero'], tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1)))
    return out

def falcata(base, eje, ancho_dir, hueso, conj, largo=0.50, ancho=0.060, nombre='espada', solo_puno=False):
    """Falcata ibera: hoja de un filo, curva, que se ensancha hacia la punta; puño de gancho."""
    eje = _u(eje); a = np.asarray(ancho_dir, float); a -= eje * (a @ eje); a = _u(a); b = np.cross(eje, a); out = []
    P, UV, T, tam = torno([(0.0, -0.070), (0.012, -0.072), (0.019, -0.064), (0.016, -0.050), (0.0135, -0.040), (0.0150, -0.02), (0.0145, 0.0), (0.0150, 0.03), (0.013, 0.040)], 8, base, eje, a, 0.8)
    out.append(pieza(nombre + '_puno', P, T, UV, np.where((UV[:, 1] > 0.36) & (UV[:, 1] < 0.93), MAT['hueso'], MAT['hierro']), tam, hueso, conj=conj, prm=UV * tam, aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.2))
    def gancho(u, v):                                          # el gancho del pomo, que cierra sobre los dedos
        t = v * np.pi * 0.95; c = base + eje * (-0.066 + 0.035 * (1 - np.cos(t))) + a * (0.035 * np.sin(t)); return c + (b * np.cos(u * TAU) + a * np.sin(u * TAU) * 0.35) * (0.0065 - 0.003 * v)
    P, UV, T = rej(gancho, 6, 5); out.append(pieza(nombre + '_guarda', P, T, UV, MAT['hierro'], (0.04, 0.06), hueso, conj=conj, prm=UV * [0.04, 0.06]))
    P, UV, T, tam = torno([(0.0, 0.040), (0.026, 0.042), (0.028, 0.050), (0.0, 0.052)], 8, base, eje, a, 0.45); out.append(pieza(nombre + '_guarda2', P, T, UV, MAT['hierro'], tam, hueso, conj=conj, prm=UV * tam))
    if solo_puno: return out
    S = 10; P, UV, T = [], [], []
    for i, s in enumerate(np.linspace(0, 1, S + 1)):
        y = 0.052 + s * largo; curva = -0.030 * np.sin(np.pi * s) + 0.022 * s ** 3                   # lomo cóncavo y punta que vuelve
        we = ancho * (0.42 + 0.30 * np.sin(np.pi * min(s / 0.78, 1.0)) ** 1.5) * (1 if s < 0.80 else max(0.0, (1 - s) / 0.2) ** 0.8); wl = ancho * 0.32 * (1 if s < 0.85 else max(0.0, (1 - s) / 0.15))
        g = 0.0045 * (1 - 0.6 * s)
        for k, (dx, dz) in enumerate(((-wl, 0), (0, g), (max(we, 0.0008), 0), (0, -g), (-wl, 0))): P.append(base + eje * y + a * (dx + curva) + b * dz); UV.append([k / 4, s])
    for i in range(S):
        for k in range(4):
            p = i * 5 + k; q = p + 5; T += [[p, p + 1, q + 1], [p, q + 1, q]]
    UV = np.array(UV); out.append(pieza(nombre + '_hoja', np.array(P), np.array(T), UV, MAT['hierro'], (ancho * 2.1, largo), hueso, conj=conj, prm=UV * [ancho * 2, largo], aux=np.stack([np.abs(UV[:, 0] * 4 % 2 - 1), UV[:, 1]], 1), suave=False, prio=1.2))
    return out

# ---------- cascos ----------
def medir_cabeza(mh):
    """Lo mismo que mide piezas.yelmo: semiejes de la cabeza, centro, cima y línea del borde (frente más alta que la nuca)."""
    V = mh['V']; cu = np.array(sorted({p[0] for f, g in zip(mh['F'], mh['G']) if g == 'body' for p in f})); H = V[cu][mh['W']['head'][cu] > 0.9]
    arr = H[H[:, 1] > 1.655]; cz = (arr[:, 2].min() + arr[:, 2].max()) / 2; ax = np.abs(arr[:, 0]).max() + 0.011; az = (arr[:, 2].max() - arr[:, 2].min()) / 2 + 0.012; ytop = H[:, 1].max() + 0.016
    yf, yb = 1.664, 1.612; return ax, az, cz, ytop, (lambda t: (yf + yb) / 2 + (yf - yb) / 2 * np.cos(t))

def pilos(mh, nombre='yelmo', mat='bronce', alto=1.45):
    """Casco cónico (pilos o konos), de bronce, con un ala corta."""
    ax, az, cz, ytop, yr = medir_cabeza(mh)
    perf = [(1.085, -0.004), (1.10, 0.005), (1.06, 0.013), (1.035, 0.018)] + [(1.035, 0.0), (1.02, 0.25), (0.98, 0.45), (0.91, 0.62), (0.79, 0.78), (0.63, 0.92), (0.46, 1.05), (0.28, 1.20), (0.12, 1.34), (0.0, alto)][1:]
    def cuenco(u, v):
        t = u * TAU; k = v * (len(perf) - 1); i = min(int(k), len(perf) - 2); f = k - i; r, hh = np.array(perf[i]) * (1 - f) + np.array(perf[i + 1]) * f
        y0 = yr(t); y = y0 + hh if i < 3 or (i == 3 and f == 0) else y0 + 0.018 + (ytop - y0 - 0.018) * hh
        return np.array([np.sin(t) * ax * r, y, cz + np.cos(t) * az * r])
    P, UV, T = rej(cuenco, 24, len(perf) - 1); T = orienta(P, T, lambda g: g - [0, 1.62, cz])
    return [pieza(nombre + '_cuenco', P, T, UV, MAT[mat], (0.66, 0.30), 'head', prm=UV * [0.66, 0.30], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.5)]

def cresta(mh, nombre='yelmo_cresta', alto=0.11, ancho=0.020, delante=0.80, detras=1.10, cola=0.10, sube=0.035, ns=14, nf=6):
    """Cimera de crin a lo largo del casco, de delante atrás, con la cola que cae sobre la nuca."""
    ax, az, cz, ytop, yr = medir_cabeza(mh)
    def fn(u, v):
        s = v; zz = delante - (delante + detras) * s; zc = cz + az * zz; yb = ytop + sube - 0.055 * min(zz * zz, 1.0) - cola * max(0.0, s - 0.72) ** 1.4 / 0.28 ** 1.4
        h = alto * (0.55 + 0.45 * np.sin(np.pi * min(s * 1.25, 1.0))) * (1 - 0.45 * max(0.0, s - 0.75) / 0.25); w = ancho * (1 - 0.4 * s); ph = u * TAU
        return np.array([w * np.sin(ph), yb + h * (0.5 - 0.5 * np.cos(ph)), zc - 0.025 * h / alto * (0.5 - 0.5 * np.cos(ph)) * s])
    P, UV, T = rej(fn, nf, ns); T = orienta(P, T, lambda g: np.sign(g[:, :1]) * [1.0, 0, 0])
    aux = np.stack([UV[:, 1], np.abs(UV[:, 0] - 0.5) * 2], 1); return [pieza(nombre, P, T, UV, MAT['crin'], (0.10, 0.36), 'head', prm=UV * [0.10, 0.36], aux=aux, prio=1.2)]

# ---------- pintores de los materiales nuevos ----------
import texturas as _tx
sst, mez, fbm, r2 = _tx.sst, _tx.mez, _tx.fbm, _tx.r2

def _lino(ctx):
    s = ctx['s']; P, PR, AX, es = ctx['P'][s], ctx['PR'][s], ctx['AX'][s], ctx['es']; n = int(s.sum()); u, v = PR.T; y = P[:, 1]; mancha = ctx['mancha'][s]; grano = ctx['grano'][s]
    hilo = 0.5 + 0.25 * np.sin((u + v) * 2300) + 0.25 * np.sin((u - v) * 2300 * 0.93); arr = fbm(np.stack([u * 0.6, v * 2.2, P[:, 2] * 0.3], 1), 14, 3, 5.0)
    blanco = np.array([0.80, 0.77, 0.68]); c = np.tile(blanco, (n, 1)) * (0.84 + 0.16 * arr + 0.06 * hilo)[:, None] * (0.94 + 0.08 * mancha)[:, None]; H = 0.00025 * hilo + 0.002 * (arr - 0.5); TI0 = np.zeros(n)
    lt = es('cota_lino')[s]; hb = es('hombrera')[s]; pt = es('pteruges')[s]; tu = es('faldon_tunica', 'manga')[s]
    if lt.any():                                               # capas de lino encoladas: costuras y una banda de color abajo
        capa = lt * np.exp(-((((y - 1.0) / 0.075) % 1 - 0.5) / 0.025) ** 2) * (y < 1.30); band = lt * (y > 1.005) * (y < 1.045); fil = lt * ((np.abs(y - 1.008) < 0.0035) | (np.abs(y - 1.042) < 0.0035))
        c = c * (1 - 0.10 * capa)[:, None]; H = H - 0.0008 * capa; c = mez(c, [0.46, 0.46, 0.46], band); TI0 = np.maximum(TI0, band * (1 - fil)); c = mez(c, [0.62, 0.48, 0.25], fil * 0.8); H = H + 0.0006 * fil
    if hb.any():                                               # hombreras: borde cosido y rueda de bronce donde se atan
        e = AX[:, 0]; bor = hb * sst(0.86, 0.92, e); c = mez(c, [0.46, 0.46, 0.46], bor); TI0 = np.maximum(TI0, bor); H = H + 0.0008 * bor
    if pt.any():                                               # pteruges: tiras de lino con flecos y una banda de color
        k = AX[:, 1] * 30; fr = np.abs(k % 1 - 0.5); gap = pt * sst(0.40, 0.48, fr); vv = AX[:, 0]; bnd = pt * (vv > 0.74) * (vv < 0.86); fle = pt * (vv > 0.93) * (0.5 + 0.5 * np.sin(k * 40))
        c = c * (1 - 0.62 * gap)[:, None] * (1 - 0.15 * fle)[:, None]; H = H - 0.0025 * gap + 0.0004 * fle; c = mez(c, [0.46, 0.46, 0.46], bnd * (1 - gap)); TI0 = np.maximum(TI0, bnd * (1 - gap))
    if tu.any():                                               # túnica ibera: blanca con orla púrpura (Polibio 3.114)
        e = AX[:, 0]; orla = tu * sst(0.86, 0.885, e); c = mez(c, np.array([0.36, 0.10, 0.24]) * (0.85 + 0.25 * grano)[:, None], orla * 0.95)
        tt = -np.pi + 2 * np.pi * AX[:, 1]; pli = 0.5 + 0.5 * np.sin(tt * 13 + 2 * np.sin(tt * 3)); fa = es('faldon_tunica')[s] * sst(0.0, 0.55, e); c = c * (1 - 0.35 * fa * (1 - pli) ** 1.5)[:, None]
    ctx['C'][s] = c; ctx['H'][s] = H; ctx['R'][s] = 0.9; ctx['TI'][s, 0] = TI0

def _aspis(ctx):
    s = ctx['s']; P, PR, AX, es = ctx['P'][s], ctx['PR'][s], ctx['AX'][s], ctx['es']; n = int(s.sum()); u, v = PR.T; r = AX[:, 0]; an = AX[:, 1] * TAU; mancha = ctx['mancha'][s]
    ray = np.clip(sst(0.80, 0.93, r2(u * 55 + v * 16, v * 9, 1.0, 5.0)) * sst(0.35, 0.7, mancha) + sst(0.84, 0.95, r2(u * 300, v * 300, 1.0, 12.0)) * 0.7, 0, 1) * 0.5
    c = np.full((n, 3), 0.50) * (0.82 + 0.22 * fbm(P, 16, 3, 4.0))[:, None]; mot = np.zeros(n); met = np.zeros(n)
    pe = es('escudo_frente')[s]
    # el motivo depende del escudo: anillo (aspis), estrella y semicírculos (macedonio), bandas (caetra)
    if ctx.get('motivo') == 'macedonio':
        ph = np.angle(np.exp(1j * an * 7)) / 7; d = np.hypot(ph * 0.84, r - 0.86); semi = (np.abs(d - 0.075) < 0.013) & (r < 0.95)
        met = pe * np.clip((np.abs(r - 0.66) < 0.017) + semi + (r < 0.17) * (np.abs(np.cos(an * 4)) > 0.55 + 2.2 * r) + (r < 0.035), 0, 1)
    elif ctx.get('motivo') == 'caetra':
        mot = pe * ((np.abs(r - 0.55) < 0.03) | ((np.abs(r - 0.78) < 0.025)) | ((r > 0.58) & (r < 0.76) & (np.abs(np.sin(an * 8 + 6 * r)) < 0.12)))
    else:
        mot = pe * (np.abs(r - 0.80) < 0.016)
    c = mez(c, [0.78, 0.70, 0.52], 0.85 * mot); c = mez(c, [0.72, 0.52, 0.25], met); c = mez(c, [0.56, 0.50, 0.42], ray * (1 - met))
    gas = pe * sst(0.55, 0.8, fbm(P, 13, 3, 31.0)) * 0.35; c = mez(c, [0.40, 0.33, 0.25], gas * (1 - met))
    ctx['C'][s] = c; ctx['H'][s] = -0.0006 * ray + 0.0012 * met + 0.0005 * mot; ctx['R'][s] = np.where(met > 0.5, 0.42, 0.74); ctx['ME'][s] = met; ctx['TI'][s, 2] = (1 - mot) * (1 - met) * (1 - 0.8 * ray) * (1 - 0.6 * gas)

def _crin(ctx):
    s = ctx['s']; AX = ctx['AX'][s]; n = int(s.sum()); a, b = AX.T; heb = r2(a * 6 + b * 0.2, b * 300 + a * 40, 1.0, 7.0); heb2 = r2(a * 30, b * 900, 1.0, 17.0)
    c = np.full((n, 3), 0.50) * (0.55 + 0.35 * heb + 0.25 * heb2)[:, None]; ctx['C'][s] = c; ctx['H'][s] = 0.0015 * heb + 0.0008 * heb2; ctx['R'][s] = 0.7; ctx['TI'][s, 0] = 1

MOTIVO = {}
def _aspis_motivo(ctx): ctx['motivo'] = MOTIVO.get('escudo'); _aspis(ctx)
_tx.PINTORES.append(([MAT['lino']], _lino)); _tx.PINTORES.append(([MAT['aspis']], _aspis_motivo)); _tx.PINTORES.append(([MAT['crin']], _crin))
