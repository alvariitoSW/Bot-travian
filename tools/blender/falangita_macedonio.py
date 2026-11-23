"""FA2: falangita macedonio y su oficial, para las batallas de AQVILA.

Uso (con el entorno del taller cargado: source /opt/aqvila-taller/entorno.sh):
  blender-py tools/blender/falangita_macedonio.py falangita|oficial-falange [--lod|--lod2|--lod3] --salida=assets/soldados

Origen y licencias:
- Cuerpo, esqueleto y pesos: MakeHuman 1.3.2 (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library 1 y 2 (CC0 1.0); juego «sarisa» compartido (mov_sarisa, sin cambios).
- Equipo (casco frigio, escudo macedonio, correa, sarisa con manguito, coraza, penacho, plumas, faja) y texturas:
  hechos aquí por código, arte propio del proyecto AQVILA. Nada copiado de otros juegos.
Fuentes de época (cotejo de FA2, 23/11/2026; lo que dice «de memoria» no se pudo abrir en el texto):
- Sarisa: Polibio 18.29 (16 codos de diseño, 14 en la práctica; cinco puntas por delante), de memoria. Teofrasto,
  Hist. Plant. 3.12.2, da 12 codos: las fuentes discrepan. Aquí 6,0 m.
- Escudo: Asclepiódoto, Táctica 5.1 (macedonio, de bronce, ocho palmos, no muy cóncavo): confirmado.
- Escudo colgado del cuello con correa: probable (lo pide el agarre a dos manos); pasaje exacto no hallado.
- Casco frigio: probable (sarcófago de Alejandro); el reglamento de Anfípolis parece pedir el konos (sin cotejar).
- Coraza del oficial: el reglamento de Anfípolis multa al oficial sin thorax o hemithorakion (Hatzopoulos 2001).
- Estrella en el escudo (8 rayos la tropa, 16 el oficial), manguito de la sarisa y penacho blanco del oficial:
  licencia de juego (el penacho, para que el jugador se distinga por la espalda).
"""
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
CONS = os.path.normpath(os.path.join(AQUI, '..', '..', 'gobierno', 'maquetas', 'soldado-rome2', 'construir'))
sys.path.insert(0, CONS)
import numpy as np, mh, anim, poses, geo, exportar as X, piezas as Z, ropa
import construir as K                     # lee --salida= y --mov= de sys.argv al importarse
import piezas_b as ZB, equipos_b as EB, texturas as TX
from piezas import MAT, TAU, pieza, rej, torno

MAT.update(crin_blanca=40, bronce_m=41, faja=42, escudo_mac=43)   # FA2: materiales nuevos
MOTIVO = {}                               # qué escudo pinta _escudo_mac: 'estrella8' (tropa) o 'sol16' (oficial)
sst, mez, fbm, r2 = TX.sst, TX.mez, TX.fbm, TX.r2

# ---------------------------------------------------------------- casco frigio
def _cuenco_frigio(h_, t, ax, az, cz, ytop, yr):
    """Punto del cuenco: h_ de 0 (borde) a 1 (punta). La punta redondeada vuelca hacia delante."""
    L = 0.12; hs = np.linspace(0, h_, 24); th = 2.3 * np.clip((hs - 0.40) / 0.60, 0, 1) ** 1.2                # el eje sube ceñido y luego se dobla al frente
    dh = h_ / 23 if h_ > 0 else 0.0; c = np.array([0.0, (np.cos(th).sum() - 0.5 * (1 + np.cos(th[-1]))) * dh * L, (np.sin(th).sum() - 0.5 * np.sin(th[-1])) * dh * L]); a = th[-1]
    r = 1.03 * np.cos(h_ * np.pi / 2) ** 0.40; xl, zl = np.sin(t) * ax * r, np.cos(t) * az * r
    borde = (yr(t) + 0.016 - (yr(0) + yr(np.pi)) / 2 - 0.016) * (1 - np.clip(h_ / 0.3, 0, 1)) ** 2
    return np.array([xl, (yr(0) + yr(np.pi)) / 2 + 0.016 + c[1] - zl * np.sin(a) + borde, cz + c[2] + zl * np.cos(a)])

def casco_frigio(m, nu=24, nv=14, extras=True):
    ax, az, cz, ytop, yr = ZB.medir_cabeza(m)
    def cuenco(u, v):
        t = u * TAU
        if v < 0.08:                                           # borde engrosado
            k = v / 0.08; y0 = yr(t); r = 1.075 - 0.04 * k; return np.array([np.sin(t) * ax * r, y0 - 0.004 + 0.020 * k, cz + np.cos(t) * az * r])
        return _cuenco_frigio((v - 0.08) / 0.92, t, ax, az, cz, ytop, yr)
    P, UV, T = rej(cuenco, nu, nv); T = ZB.orienta(P, T, lambda g: g - [0, 1.62, cz])
    out = [pieza('yelmo_cuenco', P, T, UV, MAT['bronce'], (0.66, 0.34), 'head', prm=UV * [0.66, 0.34], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=1.5)]
    def visera(u, v):                                          # visera corta sobre la frente
        t = (u - 0.5) * np.radians(130); tp = np.cos((u - 0.5) * np.pi) ** 0.6; r = 1.075 + 0.30 * v * tp
        return np.array([np.sin(t) * ax * r, yr(t) + 0.002 - 0.012 * v * tp, cz + np.cos(t) * az * r])
    P, UV, T = rej(visera, 10 if extras else 4, 2 if extras else 1); out.append(pieza('yelmo_visera', P, T, UV, MAT['bronce'], (0.25, 0.05), 'head', prm=UV * [0.25, 0.05], prio=1.1))
    if extras: out += [q for q in Z.yelmo(m, plumas=False) if not q['nombre'].startswith('yelmo_cuenco')]   # cubrenuca y carrilleras
    return out

def penacho(m, ns=16, nf=8, ancho=0.048, alto=0.26, cola=0.27):
    """Cimera de crin blanca sobre la cresta del casco frigio, de delante atrás, con cola sobre la nuca."""
    ax, az, cz, ytop, yr = ZB.medir_cabeza(m)
    cr = np.array([_cuenco_frigio(h_, t, ax, az, cz, ytop, yr) for t in (0.0, np.pi) for h_ in np.linspace(0, 1, 40)])
    cr = cr[np.argsort(cr[:, 2])]; zs = cr[:, 2]                                 # perfil del casco por el centro
    zf = cr[np.argmax(cr[:, 1]), 2] + 0.02; zb = cz - az * 1.45
    alto_cap = lambda z: max(cr[np.abs(cr[:, 2] - z) < 0.02][:, 1].max() if (np.abs(cr[:, 2] - z) < 0.02).any() else yr(np.pi), yr(np.pi))
    def fn(u, v):
        s = v; zc = zf + (zb - zf) * s; yb = alto_cap(min(max(zc, zs.min()), zs.max())) - 0.012 - cola * max(0.0, s - 0.72) ** 1.4 / 0.28 ** 1.4
        h = alto * (0.55 + 0.45 * np.sin(np.pi * min(s * 1.25, 1.0))) * (1 - 0.5 * max(0.0, s - 0.75) / 0.25); w = ancho * (1 - 0.35 * max(0.0, s - 0.6) / 0.4); ph = u * TAU
        return np.array([w * np.sin(ph), yb + h * (0.5 - 0.5 * np.cos(ph)), zc - 0.03 * h / alto * (0.5 - 0.5 * np.cos(ph)) * s])
    P, UV, T = rej(fn, nf, ns); T = ZB.orienta(P, T, lambda g: np.sign(g[:, :1] + 1e-9) * [1.0, 0, 0])
    return [pieza('yelmo_cresta', P, T, UV, MAT['crin_blanca'], (0.12, 0.40), 'head', prm=UV * [0.12, 0.40], aux=np.stack([UV[:, 1], np.abs(UV[:, 0] - 0.5) * 2], 1), prio=1.3)]

def plumas(m, nv=8):
    """Dos plumas blancas altas, una a cada lado de la cimera."""
    ax, az, cz, ytop, yr = ZB.medir_cabeza(m); out = []
    for s_, L in ((1, 'L'), (-1, 'R')):
        b = _cuenco_frigio(0.45, s_ * np.pi / 2, ax, az, cz, ytop, yr) + [s_ * 0.004, 0, -0.005]
        def plu(u, v):
            Lg = 0.30; w = 0.030 * np.sin(np.pi * min(v * 1.1 + 0.05, 1.0)) ** 0.55 * (1 - 0.3 * v); x = (u - 0.5) * 2 * w; plie = -abs(u - 0.5) * 0.010
            return b + np.array([s_ * 0.423 * v * Lg + x * 0.906, v * Lg * 0.906 - s_ * x * 0.423, -0.08 * v * v * Lg + plie])
        P, UV, T = rej(plu, 2, nv); out.append(pieza('yelmo_pluma' + L, P, T, UV, MAT['crin_blanca'], (0.06, 0.30), 'head', prm=UV * [0.06, 0.30], aux=np.stack([np.abs(UV[:, 0] - 0.5) * 2, UV[:, 1] + 2], 1)))
    return out

# ---------------------------------------------------------------- correa del escudo
def correa(m, B, nseg=22, lados=4):
    """Correa de cuero (telamón) del escudo: sube por el pecho izquierdo, pasa por encima del hombro izquierdo y por detrás
    del cuello, y vuelve por el hombro derecho al pecho. Va pegada al cuerpo con sus pesos."""
    V = B.V; Nb = K.normales_cuerpo(m); cand = np.array(sorted({p[0] for f, g in zip(m['F'], m['G']) if g == 'body' for p in f}))
    zona = B.g('spine', 'clavicle', 'neck', 'shoulder01', 'breast')[cand] > 0.5; cand = cand[zona]
    ctl = np.array([[0.14, 1.27, 0.12], [0.14, 1.40, 0.09], [0.13, 1.47, 0.0], [0.06, 1.48, -0.07], [-0.03, 1.48, -0.075], [-0.10, 1.46, -0.01], [-0.08, 1.40, 0.09], [0.01, 1.30, 0.13]])
    t = np.linspace(0, len(ctl) - 1, nseg + 1); c = np.stack([np.interp(t, np.arange(len(ctl)), ctl[:, k]) for k in range(3)], 1)
    for _ in range(3): c[1:-1] = 0.5 * c[1:-1] + 0.25 * (c[:-2] + c[2:])
    idx = np.array([cand[np.argmin(np.linalg.norm(V[cand] - p, axis=1))] for p in c]); n = Nb[idx]; n /= np.linalg.norm(n, axis=1, keepdims=True)
    hombro = (V[idx, 1] > 1.40) & (np.abs(V[idx, 0]) > 0.06); q = V[idx] + n * (0.034 + 0.012 * hombro)[:, None]
    for _ in range(2): q[1:-1] = 0.5 * q[1:-1] + 0.25 * (q[:-2] + q[2:])
    tg = np.gradient(q, axis=0); tg /= np.linalg.norm(tg, axis=1, keepdims=True); w = np.cross(tg, n); w /= np.linalg.norm(w, axis=1, keepdims=True); nn = np.cross(w, tg)
    sec = [(0.015, 0.002), (-0.015, 0.002), (-0.015, -0.002), (0.015, -0.002)]
    P, UV, Ws = [], [], []
    for i in range(nseg + 1):
        for k in range(lados + 1):
            a, b = sec[k % lados]; P.append(q[i] + w[i] * a + nn[i] * b); UV.append([k / lados, i / nseg])
    T = []
    for i in range(nseg):
        for k in range(lados):
            a_ = i * (lados + 1) + k; T += [[a_, a_ + 1, a_ + lados + 2], [a_, a_ + lados + 2, a_ + lados + 1]]
    vi = np.repeat(idx, lados + 1); si, sw = B.w4(B.Wd[vi]); UV = np.array(UV); L = np.linalg.norm(np.diff(q, axis=0), axis=1).sum()
    return [pieza('correa', np.array(P), np.array(T), UV, MAT['cuero'], (0.034, L), W=(si, sw), prm=UV * [0.034, L], aux=np.stack([UV[:, 1], UV[:, 0]], 1), prio=0.7)]

# ---------------------------------------------------------------- escudo, sarisa
def escudo(m, fondo, muy, lod=False):
    Dl, e, w = EB._antebrazo_en_guardia(m); f = (w - e) / np.linalg.norm(w - e); n = np.array([0.40, 0.10, 1.0]); n -= f * (n @ f); n /= np.linalg.norm(n); up = np.array([0, 1.0, 0]); up -= n * (up @ n)
    up /= np.linalg.norm(up); cw = e + f * 0.11 + n * 0.085 - up * 0.09; cr = m['cab']['lowerarm01.L'] + Dl.T @ (cw - e)
    P = ZB.pelte(cr, Dl.T @ n, Dl.T @ up, 'lowerarm01.L', radio=0.325, lados=8 if fondo else 12 if muy else 14 if lod else 28)
    if fondo: P = [q for q in P if q['nombre'] != 'escudo_dorso']
    for q in P:
        if q['nombre'] == 'escudo_frente': q['mat'][:] = MAT['escudo_mac']
    return P

def sarisa(m, muy):
    hR = poses.mano(m, 'R'); a = ZB.asta(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, EB.SARISA, 0.97, 'lanza', r0=0.017, r1=0.014, punta=0.30, regaton=0.24, simple=muy, prio=0.13, ancho_punta=0.026)
    if not muy:                                                # manguito de bronce a media asta (une las dos mitades)
        eje = -hR['X'] / np.linalg.norm(hR['X']); base = hR['c'] - eje * 0.97; zm = EB.SARISA / 2
        Pm, UVm, Tm, tam = torno([(0.0150, zm - 0.090), (0.0205, zm - 0.082), (0.0200, zm), (0.0205, zm + 0.082), (0.0150, zm + 0.090)], 6, base, eje, hR['N'])
        a.append(pieza('lanza_manguito', Pm, Tm, UVm, MAT['bronce'], tam, 'wrist.R', conj=1, prm=UVm * tam, aux=np.stack([UVm[:, 1], UVm[:, 0]], 1), prio=0.5))
    return a

# ---------------------------------------------------------------- soldados
def falangita(m, B, lod=False, muy=False, fondo=False):
    """Falangita macedonio: casco frigio con carrilleras, escudo de bronce con estrella colgado del cuello y del antebrazo,
    linotórax, grebas, sarisa de 6 m con manguito y espada corta en la vaina."""
    MOTIVO['escudo'] = 'estrella8'; ZB.MOTIVO['escudo'] = 'macedonio'; HEM = 0.70
    P, torso, brazo, sb = EB._base(m, B, lod, muy, fondo, HEM, MAT['tela'], 1, piel_fino=7500)
    P += EB._linotorax(m, B, torso, brazo, sb, muy)
    P.append(B.falda('faldon_tunica', 0.85, HEM, 52 if muy else 78, 5, MAT['tela'], lambda yy, t: 1.0 + 0.02 * (1.04 - yy) + (0.015 + 0.50 * (0.85 - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.5, tinte=1))
    return P + _comun(m, B, lod, muy, fondo)

def oficial(m, B, lod=False, muy=False, fondo=False):
    """Oficial de la falange: lo mismo, con coraza de bronce musculada, faja roja, escudo con sol de 16 rayos y penacho blanco."""
    MOTIVO['escudo'] = 'sol16'; HEM = 0.70
    P, torso, brazo, sb = EB._base(m, B, lod, muy, fondo, HEM, MAT['tela'], 1, piel_fino=7000)
    pt, _, _ = EB._torso(B, torso, brazo, sb, 'cota_bronce', MAT['bronce_m'], 0.013); P.append(pt)
    P.append(B.falda('pteruges', 1.045, 0.80, 32 if muy else 60, 4, MAT['lino'], lambda yy, t: 1.07 + 0.20 * (1.045 - yy), prio=1.1))
    P.append(B.falda('faldon_tunica', 0.85, HEM, 52 if muy else 78, 5, MAT['tela'], lambda yy, t: 1.0 + 0.02 * (1.04 - yy) + (0.015 + 0.50 * (0.85 - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.5, tinte=1))
    P.append(B.falda('faja', 1.075, 1.015, 24 if muy else 40, 1, MAT['faja'], lambda yy, t: 1.10, prio=1.2))
    if not muy: P += _nudo(B)
    P += _comun(m, B, lod, muy, fondo)
    P += penacho(m, *((5, 4) if fondo else (7, 4) if muy else (9, 6) if lod else (16, 8))) + plumas(m, 2 if fondo else 3 if muy else 5 if lod else 8)
    return P

def _nudo(B):
    """Nudo de la faja, delante y a la derecha, con dos cabos colgando."""
    Q = B.V[B.sv]; cz = Q[:, 2].mean(); t0 = -0.45; ang = np.arctan2(Q[:, 0], Q[:, 2] - cz); sel = (np.abs(np.angle(np.exp(1j * (ang - t0)))) < 0.25) & (np.abs(Q[:, 1] - 1.045) < 0.05)
    r = np.hypot(Q[sel, 0], Q[sel, 2] - cz).mean() * 1.12; o = np.array([np.sin(t0) * r, 1.045, cz + np.cos(t0) * r]); fr = np.array([np.sin(t0), 0, np.cos(t0)]); out = []
    Pn, UVn, Tn, tam = torno([(0.0, -0.022), (0.020, -0.012), (0.024, 0.0), (0.020, 0.012), (0.0, 0.022)], 6, o, fr, [0, 1, 0], 0.8); out.append(pieza('faja_nudo', Pn, Tn, UVn, MAT['faja'], tam, 'root', prm=UVn * tam, prio=0.8))
    lado = np.cross([0, 1.0, 0], fr)
    for k, ab in enumerate((-1, 1)):
        def cabo(u, v):
            return o + fr * (0.012 + 0.02 * v) + lado * (ab * (0.008 + 0.03 * v) + (u - 0.5) * 0.032) - np.array([0, 0.19 * v * (1 - 0.15 * k), 0])
        Pc, UVc, Tc = rej(cabo, 1, 3); out.append(pieza('faja_cabo%d' % k, Pc, Tc, UVc, MAT['faja'], (0.032, 0.19), 'root', prm=UVc * [0.032, 0.19], prio=0.6))
    return out

def _comun(m, B, lod, muy, fondo):
    P = []
    if not muy: P += EB._grebas(m, B, MAT['bronce'])
    P += casco_frigio(m, *((8, 4, False) if fondo else (10, 5, False) if muy else (14, 8, True) if lod else (24, 14, True)))
    P += escudo(m, fondo, muy, lod)
    if not muy: P += correa(m, B, 10 if lod else 22)
    P += sarisa(m, muy)
    P += EB._vaina_izq(Z.espada, largo=0.58)
    P += Z.suela(m, 'L') + Z.suela(m, 'R')
    return P

# ---------------------------------------------------------------- pintores
def _crin_blanca(ctx):
    """Crin y plumas blancas, sin tinte de facción (TI = 0)."""
    s = ctx['s']; AX = ctx['AX'][s]; n = int(s.sum()); a, b = AX.T; plu = b >= 1.5; bb = np.where(plu, b - 2, b)
    heb = r2(a * 6 + bb * 0.2, bb * 300 + a * 40, 1.0, 7.0); heb2 = r2(a * 30, bb * 900, 1.0, 17.0); barb = 0.5 + 0.5 * np.sin((bb * 0.22 - a * 0.02) * 5200); raq = np.exp(-(a / 0.08) ** 2)
    c = np.tile([0.92, 0.90, 0.85], (n, 1)) * np.where(plu, 0.86 + 0.12 * barb, 0.80 + 0.12 * heb + 0.08 * heb2)[:, None]; c = mez(c, [0.80, 0.76, 0.66], 0.6 * raq * plu)
    ctx['C'][s] = c; ctx['H'][s] = np.where(plu, 0.0004 * barb + 0.0008 * raq, 0.0015 * heb + 0.0008 * heb2); ctx['R'][s] = 0.75; ctx['ME'][s] = 0; ctx['TI'][s] = 0

def _bronce_m(ctx):
    """Coraza de bronce musculada: pectorales, abdomen y surco de la espalda en relieve; bruñida."""
    s = ctx['s']; P, Nn = ctx['P'][s], ctx['Nn'][s]; x, y, z = P.T; n = int(s.sum()); fr = np.clip(Nn[:, 2] * 2, 0, 1); at = np.clip(-Nn[:, 2] * 2, 0, 1)
    g = lambda cx, cy, sx, sy: np.exp(-((x - cx) / sx) ** 2 - ((y - cy) / sy) ** 2)
    pec = g(0.075, 1.31, 0.065, 0.055) + g(-0.075, 1.31, 0.065, 0.055); ab = sum(g(sx_ * 0.04, cy, 0.030, 0.028) for sx_ in (1, -1) for cy in (1.10, 1.17, 1.235))
    alba = np.exp(-(x / 0.006) ** 2) * (y < 1.27); omb = g(0.0, 1.075, 0.008, 0.008); esp = np.exp(-(x / 0.012) ** 2)
    H = fr * (0.0045 * pec + 0.0025 * ab - 0.0015 * alba - 0.002 * omb) + at * (-0.002 * esp + 0.0015 * (g(0.07, 1.30, 0.07, 0.09) + g(-0.07, 1.30, 0.07, 0.09)))
    borde = (y < 1.0) | (y > 1.43); pat = sst(0.5, 0.85, fbm(P, 30, 3, 2.0))
    c = np.tile([0.80, 0.60, 0.30], (n, 1)) * (0.90 + 0.18 * ctx['mancha'][s] + 25 * H)[:, None]; c = mez(c, [0.40, 0.30, 0.15], 0.25 * pat + 0.4 * (1 - ctx['AO'][s]) ** 1.3)
    ctx['C'][s] = c; ctx['H'][s] = H + 0.0008 * borde; ctx['R'][s] = 0.30 + 0.15 * pat; ctx['ME'][s] = 1.0; ctx['TI'][s] = 0

def _faja(ctx):
    s = ctx['s']; P = ctx['P'][s]; n = int(s.sum()); arr = fbm(P, 40, 3, 7.0); hilo = 0.5 + 0.5 * np.sin(P[:, 1] * 2600)
    ctx['C'][s] = np.tile([0.55, 0.07, 0.06], (n, 1)) * (0.80 + 0.25 * arr + 0.05 * hilo)[:, None]; ctx['H'][s] = 0.0015 * (arr - 0.5) + 0.0002 * hilo; ctx['R'][s] = 0.9; ctx['ME'][s] = 0; ctx['TI'][s] = 0

def _escudo_mac(ctx):
    """Frente del escudo macedonio. Tropa: estrella de 8 puntas y semicírculos de bronce sobre campo con el color de la facción.
    Oficial: sol de 16 rayos dorado sobre campo claro, con un aro fino del color de la facción."""
    s = ctx['s']; P, AX = ctx['P'][s], ctx['AX'][s]; n = int(s.sum()); r = AX[:, 0]; an = AX[:, 1] * TAU; mancha = ctx['mancha'][s]
    ray = sst(0.84, 0.95, r2(P[:, 0] * 300, P[:, 1] * 300, 1.0, 12.0)) * 0.35
    if MOTIVO.get('escudo') == 'sol16':
        k = an * 16 / TAU; f = np.abs(k - np.round(k)); largo = np.where(np.round(k) % 2 == 0, 0.88, 0.70); rayo = (f < 0.30 * np.clip(1 - r / largo, 0, 1)) & (r < largo)
        met = np.clip(rayo + (r < 0.13) + (np.abs(r - 0.13) < 0.012), 0, 1).astype(float); aro = ((r > 0.905) & (r < 0.95)).astype(float)
        c = np.tile([0.86, 0.83, 0.74], (n, 1)) * (0.90 + 0.12 * mancha)[:, None]; tin = aro * (1 - met); c = mez(c, [0.50, 0.50, 0.50], tin)
        c = mez(c, np.array([0.88, 0.66, 0.24]) * (0.9 + 0.15 * mancha)[:, None], met)
    else:
        k = an * 8 / TAU; f = np.abs(k - np.round(k)); estrella = r < 0.40 - (0.40 - 0.17) * f * 2
        ph = np.angle(np.exp(1j * an * 10)) / 10; d = np.hypot(ph * 0.86, r - 0.90); semi = (np.abs(d - 0.085) < 0.016) & (r < 0.90)
        met = np.clip(estrella + semi + (np.abs(r - 0.62) < 0.014), 0, 1).astype(float); tin = (1 - met)
        c = np.full((n, 3), 0.50) * (0.84 + 0.20 * fbm(P, 16, 3, 4.0))[:, None]; c = mez(c, np.array([0.76, 0.56, 0.27]) * (0.9 + 0.15 * mancha)[:, None], met)
    c = mez(c, [0.56, 0.50, 0.42], ray * (1 - met))
    ctx['C'][s] = c; ctx['H'][s] = 0.0012 * met - 0.0005 * ray; ctx['R'][s] = np.where(met > 0.5, 0.38, 0.72); ctx['ME'][s] = met; ctx['TI'][s, 0] = 0; ctx['TI'][s, 2] = tin * (1 - 0.8 * ray)

TX.PINTORES += [([MAT['crin_blanca']], _crin_blanca), ([MAT['bronce_m']], _bronce_m), ([MAT['faja']], _faja), ([MAT['escudo_mac']], _escudo_mac)]

ESTILO = dict(pelo=[0.13, 0.09, 0.065], calzado='zapato')       # calzado griego, no caligae romanas
EQUIPOS = {
    'falangita': dict(fn=falangita, estilo=ESTILO, cfg=EB.CFG_SARISA, muestra=EB.M_SARISA, mov='sarisa', movimientos=EB.mov_sarisa),
    'oficial-falange': dict(fn=oficial, estilo=ESTILO, cfg=EB.CFG_SARISA, muestra=EB.M_SARISA, mov='sarisa', movimientos=EB.mov_sarisa),
}
PROPIAS = ('escudo_frente', 'escudo_dorso', 'yelmo_cuenco', 'yelmo_visera', 'yelmo_cresta', 'yelmo_pluma', 'lanza_manguito', 'correa', 'faja_')   # ya salen con la resolución de cada nivel

if __name__ == '__main__':
    quien = sys.argv[1] if len(sys.argv) > 1 else 'falangita'; fondo = '--lod3' in sys.argv; muy = '--lod2' in sys.argv or fondo; lod = '--lod' in sys.argv or muy
    if quien not in EQUIPOS: sys.exit('Soldado desconocido: %s (falangita u oficial-falange)' % quien)
    m = mh.construir(); util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); e = EQUIPOS[quien]
    TX.RELIEVE_MAX = 1024; TX.ESTILO = dict(TX.ESTILO, **e['estilo']); pz = e['fn'](m, B, lod, muy, fondo); MOV = e['mov'] if K.MOV != 'no' else 'no'
    if lod:                                                    # como construir.py: de lejos el puño va ya cerrado en la malla
        utilF, aF = X.huesos_utiles(m); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib); BF = ropa.Base(m, utilF, aF)
        A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
        for p in pz:
            if p['nombre'].startswith('piel'): p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
        propias = [p for p in pz if p['nombre'].startswith(PROPIAS)]; pz = K.aligerar_piezas([p for p in pz if not p['nombre'].startswith(PROPIAS)], muy=muy, fondo=fondo) + propias
    clips = e['movimientos'](m, util, e['cfg']); nombre = quien + ('_fondo' if fondo else '_muylejos' if muy else '_lejos' if lod else '')
    j = K.montar(nombre, pz, m, util, clips, e['muestra'], lado=512 if muy else 1024 if lod else 2048, juego=None if MOV == 'no' else MOV)
    print(j['verts'], 'vértices', j['tris'], 'triángulos', len(util), 'huesos', j['cuadros'], 'cuadros'); print(j['piezas'])
