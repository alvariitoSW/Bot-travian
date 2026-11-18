"""GM44d (mitad B): hoplita, falangita e ibero. Mismo cuerpo (MakeHuman, CC0) y movimientos (Quaternius UAL, CC0) que el hastatus;
equipo y texturas hechos aquí por código. Lo lee construir.py (EQUIPOS). Fuentes citadas de memoria en cada soldado."""
import os, numpy as np, anim, poses, piezas as Z, piezas_b as ZB
import construir as K
from piezas import MAT

def _base(m, B, lod, muy, fondo, HEM, mat_tunica, tinte_tunica, piel_fino=6900, cubre_cabeza=True):
    """Piel y túnica (mangas cortas y faldón) como el hastatus; HEM = bajo de la túnica."""
    V = m['V']; y = V[:, 1]; P = []
    torso = B.g('spine', 'clavicle', 'shoulder01', 'root', 'pelvis', 'breast'); brazo = {L: B.g('upperarm', 'shoulder01', lado=L) for L in 'LR'}; sb = {L: B.sbrazo(L) for L in 'LR'}
    oc = ((torso >= 0.5) & (y < 1.385)) | (B.g('upperleg', 'pelvis') >= 0.5) & (y > HEM + 0.035)
    for L in 'LR': oc |= ((brazo[L] + torso) >= 0.6) & (sb[L] < 0.36) & (y < 1.385)
    if cubre_cabeza:
        yf, yb = 1.664, 1.612; cab = B.g('head') > 0.5; th = np.arctan2(V[:, 0], V[:, 2] - 0.045); oc |= cab & (y > (yf + yb) / 2 + (yf - yb) / 2 * np.cos(th) + 0.018)
    P += K.piel(m, B, oc, 170 if fondo else 480 if muy else 1500 if lod else piel_fino) + ([] if lod else K.ojos(m, B))
    for L in 'LR':
        o, d = B.brazo[L]; sel = (brazo[L] + B.g('upperarm', lado=L) >= 0.5) & (sb[L] > 0.02) & (sb[L] < 0.60); gr = 0.006 + 0.012 * np.clip(sb[L], 0, 1)
        P.append(B.cascara('manga' + L, sel, gr, mat_tunica, o, d, [0, 0, -1], aux=np.stack([np.clip(sb[L] / 0.6, 0, 1), np.zeros(len(V))], 1), tinte=tinte_tunica))
    return P, torso, brazo, sb

def _torso(B, torso, brazo, sb, nombre, mat, gros):
    V = B.V; y = V[:, 1]; cen = np.array([0, 1.2, V[B.sv, 2].mean()])
    selm = (y > 0.985) & (y < 1.50) & ((torso >= 0.5) | ((brazo['L'] + torso >= 0.5) & (sb['L'] < 0.30)) | ((brazo['R'] + torso >= 0.5) & (sb['R'] < 0.30)))
    def cuello(Pc, vs):
        Pc = Pc.copy(); Pc[:, 1] = np.minimum(Pc[:, 1], 1.456 + 0.02 * np.clip(-Pc[:, 2], -0.05, 0.1)); return Pc
    return B.cascara(nombre, selm, gros, mat, cen, [0, 1, 0], [-1, 0, 0.0], suav=1, prio=1.15, extra=cuello), selm, cen

def _grebas(m, B, mat, gros=0.007, alto=0.515, envuelve=-0.8):
    V = m['V']; c = m['cab']; y = V[:, 1]; out = []
    for L in 'LR':
        gsel = (B.g('lowerleg', lado=L) >= 0.5) & (y > 0.125) & (y < alto) & (B.Nt[:, 2] > envuelve)
        out.append(B.cascara('greba' + L, gsel, gros, mat, c['lowerleg01.' + L], c['foot.' + L] - c['lowerleg01.' + L], [0, 0, -1], aux=np.stack([np.clip((y - 0.125) / (alto - 0.125), 0, 1), np.zeros(len(V))], 1), prio=1.2))
    return out

def _linotorax(m, B, torso, brazo, sb, muy):
    """Linotórax: coraza de capas de lino encoladas, con hombreras atadas al pecho y pteruges (tiras) a la cintura."""
    V = m['V']; y = V[:, 1]; x = V[:, 0]; P = []
    pt, selm, cen = _torso(B, torso, brazo, sb, 'cota_lino', MAT['lino'], 0.017); P.append(pt)
    for L, s_ in (('L', 1), ('R', -1)):
        e = np.minimum(np.minimum((y - 1.355) / 0.06, (s_ * x - 0.045) / 0.05), (B.Nt[:, 1] - 0.15) / 0.25)
        sel = selm & (y > 1.355) & (s_ * x > 0.045) & (B.Nt[:, 1] > 0.15)
        P.append(B.cascara('hombrera' + L, sel, 0.027, MAT['lino'], cen, [0, 1, 0], [-1, 0, 0.0], suav=1, prio=1.0, aux=np.stack([1 - np.clip(e, 0, 1), np.zeros(len(V))], 1)))
    P.append(B.falda('pteruges', 1.045, 0.80, 32 if muy else 60, 4, MAT['lino'], lambda yy, t: 1.07 + 0.20 * (1.045 - yy), prio=1.1))
    return P

def _vaina_izq(espada_fn, largo=0.60, ancho=0.058, **kw):
    boca = np.array([0.222, 1.005, 0.03]); ev = np.array([0.13, -1, -0.20]); pv = Z.vaina(boca, ev, [1, 0, 0], 'root', largo=largo, ancho=ancho)
    return pv + espada_fn(boca - ev / np.linalg.norm(ev) * 0.058, ev, [0, 0, 1], 'root', 3, nombre='espada_env', solo_puno=True, **kw)

# ---------------------------------------------------------------- hoplita
def hoplita(m, B, lod=False, muy=False, fondo=False):
    """Hoplita griego (colonos de Sicilia y Magna Grecia; con otra paleta, el Batallón Sagrado de Cartago, Diodoro 16.80).
    Aspis cóncava de bronce y madera, linotórax con pteruges, casco ático con cimera, grebas, dory y xiphos."""
    ZB.MOTIVO['escudo'] = 'aspis'; HEM = 0.70
    P, torso, brazo, sb = _base(m, B, lod, muy, fondo, HEM, MAT['tela'], 1)
    P += _linotorax(m, B, torso, brazo, sb, muy)
    P.append(B.falda('faldon_tunica', 0.85, HEM, 52 if muy else 78, 5, MAT['tela'], lambda yy, t: 1.0 + 0.02 * (1.04 - yy) + (0.015 + 0.50 * (0.85 - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.5, tinte=1))
    if not muy: P += _grebas(m, B, MAT['bronce'])
    P += Z.yelmo(m, plumas=False) + ZB.cresta(m, alto=0.15, ancho=0.028, sube=0.05, ns=10 if muy else 14, nf=4 if muy else 6)
    hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    P += ZB.aspis(hL, **(dict(lados=8, anillos=2) if fondo else dict(lados=12, anillos=3) if muy else {}))
    P += ZB.asta(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, 2.45, 1.05, 'lanza', regaton=0.16, simple=muy, prio=0.6, ancho_punta=0.026)
    P += _vaina_izq(Z.espada, largo=0.61)
    P += Z.suela(m, 'L') + Z.suela(m, 'R')
    return P

# ---------------------------------------------------------------- ibero
def ibero(m, B, lod=False, muy=False, fondo=False):
    """Infante ibero (scutarius ligero). Polibio 3.114: túnicas de lino blancas con orla púrpura. Estrabón 3.4 y Diodoro 5.33
    (de memoria): gorro de nervios o de cuero, caetra, falcata y soliferreum; espinilleras de cuero."""
    ZB.MOTIVO['escudo'] = 'caetra'; HEM = 0.62
    P, torso, brazo, sb = _base(m, B, lod, muy, fondo, HEM, MAT['lino'], 0, piel_fino=8000)
    pt, _, _ = _torso(B, torso, brazo, sb, 'cota_tunica', MAT['lino'], 0.008); P.append(pt)
    P.append(B.falda('faldon_tunica', 1.0, HEM, 52 if muy else 78, 5, MAT['lino'], lambda yy, t: 1.0 + 0.02 * (1.04 - yy) + (0.015 + 0.50 * (1.0 - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.4))
    P.append(B.falda('cinturon', 1.07, 0.985, 36, 1, MAT['cuero'], lambda yy, t: 1.085, prio=1.3))
    if not muy: P += _grebas(m, B, MAT['cuero'], 0.006, 0.50, -0.6)
    P += [q for q in Z.yelmo(m, plumas=False, carrilleras=False, mat='cuero')] + ZB.cresta(m, alto=0.07, ancho=0.016, delante=0.55, detras=0.9, cola=0.0, sube=0.04, ns=8 if muy else 12, nf=4 if muy else 6)
    hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    P += ZB.caetra(hL, **(dict(lados=8) if fondo else dict(lados=12) if muy else {}))
    P += ZB.soliferreum(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, simple=muy)
    P += ZB.falcata(hR['c'], -hR['X'], hR['d'], 'wrist.R', 2)
    P += _vaina_izq(ZB.falcata, largo=0.54, ancho=0.070)
    P += Z.suela(m, 'L') + Z.suela(m, 'R')
    return P

# ---------------------------------------------------------------- falangita
SARISA = 6.0           # metros (Polibio 18.29: 14 codos de entonces, unos 6,3 m)
CLIPS_S = {'quieto': (1, 'Idle_Loop', 1), 'andar': (1, 'Walk_Loop', 1), 'correr': (1, 'Jog_Fwd_Loop', 1), 'guardia': (1, 'Sword_Idle', 1), 'lanzar': (2, 'Shield_OneShot', 0),
           'golpear': (1, 'Punch_Jab', 0), 'cubrirse': (2, 'Sword_Block', 0), 'encajar': (1, 'Hit_Chest', 0), 'morir': (1, 'Death01', 0)}
# agarres (respecto a spine02, en el marco del soldado): mano derecha atrás, izquierda delante, las dos en el asta
AGARRE = {'alto': dict(oR=(-0.21, -0.13, 0.17), dir=(0.0, 1.0, 0.07), sep=0.17, NR=(-1.0, 0.0, 0.18), NL=(0.25, 0.0, 1.0), polR=(-0.25, -0.5, -1.0), polL=(0.5, -1.0, 0.3)),
          'bajo': dict(oR=(-0.17, -0.10, -0.03), dir=(0.0, 0.12, 1.0), sep=0.42, NR=(-0.6, 0.8, 0.0), NL=(0.5, 0.85, 0.0), polR=(-0.6, -0.4, -0.9), polL=(0.6, -0.8, 0.1))}
# clip: (agarre, cuánto se quita el giro del torso para que la sarisa mire al frente, empujón en m, centro y anchura del empujón)
CFG_SARISA = {'quieto': ('alto', 0.0, 0, 0, 1), 'andar': ('alto', 0.0, 0, 0, 1), 'correr': ('bajo', 0.6, 0, 0, 1), 'guardia': ('bajo', 1.0, 0, 0, 1), 'lanzar': ('bajo', 1.0, 0.16, 0.45, 0.35),
              'golpear': ('bajo', 1.0, 0.22, 0.42, 0.30), 'cubrirse': ('bajo', 1.0, 0, 0, 1), 'encajar': ('bajo', 1.0, 0, 0, 1), 'morir': (None, 0, 0, 0, 1)}

def _agarrar(m, D, libre, raiz, g, k=1.0, empuje=None, cambia=None):
    """Lleva las dos manos al asta de la sarisa. k: 1 = la sarisa apunta al frente aunque el torso gire; 0 = gira con él."""
    g = dict(AGARRE[g], **(cambia or {})); ix = {b: i for i, b in enumerate(m['huesos'])}; it = ix['spine02']; c = m['cab']; F = len(D); hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    d = np.asarray(g['dir'], float); d /= np.linalg.norm(d); oR0 = np.asarray(g['oR'], float); off = np.zeros(F) if empuje is None else empuje
    RmR0 = poses.girar_mano(hR['F'], -d, g['NR']); RmL0 = poses.girar_mano(hL['F'], -d, g['NL'])
    oR, oL, RR, RL, pR, pL = [], [], [], [], [], []
    for f in range(F):
        fw = D[f, it] @ np.array([0.0, 0, 1]); a = np.arctan2(fw[0], fw[2]) if abs(fw[1]) < 0.985 else 0.0; M = anim.eje([0, 1, 0], -a * k)
        r = oR0 + d * off[f]; oR.append(c['spine02'] + M @ r); oL.append(c['spine02'] + M @ (r + d * g['sep'])); RR.append(M @ RmR0); RL.append(M @ RmL0); pR.append(M @ np.asarray(g['polR'], float)); pL.append(M @ np.asarray(g['polL'], float))
    poses.brazo(m, D, libre, raiz, 'R', np.array(oR), np.array(RR), np.array(pR)); poses.brazo(m, D, libre, raiz, 'L', np.array(oL), np.array(RL), np.array(pL))

def _clip(m, k, G):
    lib, src, bucle = CLIPS_S[k]; D, libre, raiz, dur = anim.retarget(m, lib, src, 30, G[lib]); g, kk, amp, t0, w = CFG_SARISA[k]; poses.punos(m, D, libre)
    if g:
        t = np.linspace(0, 1, len(D)); emp = amp * np.clip(1 - ((t - t0) / w) ** 2, 0, 1) ** 1.5 if amp else None; _agarrar(m, D, libre, raiz, g, kk, emp)
    poses.punos(m, D, libre); return D, libre, raiz, bucle

def mov_sarisa(m, util, cfg):
    """Como construir.movimientos, pero la sarisa va a dos manos: vertical en quieto y al andar; bajada al frente en guardia,
    golpear (estocada), lanzar (empujón), cubrirse, encajar y al correr (carga)."""
    import exportar as X
    G = {1: anim.Glb(anim.ARCH[1]), 2: anim.Glb(anim.ARCH[2])}; clips = {}
    for k in CLIPS_S:
        D, libre, raiz, bucle = _clip(m, k, G); clips[k] = (X.hornear(D, anim.fk(m, D, libre, raiz), m, util), 22 if k == 'lanzar' else 30, bucle)
    ixh = {b: i for i, b in enumerate(m['huesos'])}
    VAR = {2: (dict(oR=(-0.20, -0.15, 0.19), dir=(0.0, 1.0, 0.13)), 0.38, 25), 3: (dict(oR=(-0.23, -0.11, 0.15), dir=(-0.04, 1.0, 0.03), sep=0.21), -0.33, 50)}
    for v, (cam, cabeza, rot) in VAR.items():                 # otras dos maneras de estar quieto
        D, libre, raiz, dur = anim.retarget(m, 1, 'Idle_Loop', 30, G[1]); D = np.roll(D, rot, 0); raiz = np.roll(raiz, rot, 0); R = anim.eje([0, 1, 0], cabeza)
        for b in ('neck01', 'head'): D[:, ixh[b]] = R @ D[:, ixh[b]]
        poses.punos(m, D, libre); _agarrar(m, D, libre, raiz, 'alto', 0.0, cambia=cam); poses.punos(m, D, libre); clips['quieto%d' % v] = (X.hornear(D, anim.fk(m, D, libre, raiz), m, util), 30, 1)
    orden = ['quieto', 'quieto2', 'quieto3', 'andar', 'correr', 'guardia', 'lanzar', 'golpear', 'cubrirse', 'encajar', 'morir']
    return {k: clips[k] for k in orden}

_POSE = {}
def _antebrazo_en_guardia(m):
    """Marco del antebrazo izquierdo en la guardia (primer cuadro): para colgar el escudo donde debe quedar al pelear."""
    if 'g' not in _POSE:
        G = {1: anim.Glb(anim.ARCH[1]), 2: anim.Glb(anim.ARCH[2])}; D, libre, raiz, _ = _clip(m, 'guardia', G); P = anim.fk(m, D, libre, raiz); ix = {b: i for i, b in enumerate(m['huesos'])}
        _POSE['g'] = (D[0, ix['lowerarm01.L']], P[0, ix['lowerarm01.L']], P[0, ix['wrist.L']])
    return _POSE['g']

def falangita(m, B, lod=False, muy=False, fondo=False):
    """Falangita (Macedonia, Epiro; Polibio 18.29-30): sarisa de unos 6 m a dos manos, escudo pequeño colgado del antebrazo
    y del hombro, casco cónico (pilos), linotórax con pteruges, grebas y espada corta en la vaina."""
    ZB.MOTIVO['escudo'] = 'macedonio'; HEM = 0.70
    P, torso, brazo, sb = _base(m, B, lod, muy, fondo, HEM, MAT['tela'], 1, piel_fino=8200)
    P += _linotorax(m, B, torso, brazo, sb, muy)
    P.append(B.falda('faldon_tunica', 0.85, HEM, 52 if muy else 78, 5, MAT['tela'], lambda yy, t: 1.0 + 0.02 * (1.04 - yy) + (0.015 + 0.50 * (0.85 - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.5, tinte=1))
    if not muy: P += _grebas(m, B, MAT['bronce'])
    P += ZB.pilos(m)
    # escudo: en la guardia, de cara al frente y algo a la izquierda, sobre el antebrazo (atado al antebrazo; en el juego no lleva correa al cuello)
    Dl, e, w = _antebrazo_en_guardia(m); f = (w - e) / np.linalg.norm(w - e); n = np.array([0.40, 0.10, 1.0]); n -= f * (n @ f); n /= np.linalg.norm(n); up = np.array([0, 1.0, 0]); up -= n * (up @ n)
    up /= np.linalg.norm(up); cw = e + f * 0.11 + n * 0.085 - up * 0.09; cr = m['cab']['lowerarm01.L'] + Dl.T @ (cw - e)
    P += ZB.pelte(cr, Dl.T @ n, Dl.T @ up, 'lowerarm01.L', radio=0.33, **(dict(lados=8) if fondo else dict(lados=12) if muy else {}))
    hR = poses.mano(m, 'R')
    P += ZB.asta(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, SARISA, 0.97, 'lanza', r0=0.017, r1=0.014, punta=0.30, regaton=0.24, simple=muy, prio=0.13, ancho_punta=0.026)
    P += _vaina_izq(Z.espada, largo=0.58)
    P += Z.suela(m, 'L') + Z.suela(m, 'R')
    return P

M_ESCUDO = dict(K.MUESTRA_HASTATUS)
M_HOPLITA = {k: [[0, 5]] for k in M_ESCUDO}               # el hoplita pelea con la dory; la espada queda en la vaina
M_SARISA = {k: [[0, 5]] for k in M_ESCUDO}

EQUIPOS = {
    'hoplita': dict(fn=hoplita, estilo=dict(pelo=[0.12, 0.085, 0.06]), cfg=K.CFG_HASTATUS, muestra=M_HOPLITA, mov='escudo'),
    'ibero': dict(fn=ibero, estilo=dict(pelo=[0.10, 0.075, 0.055], calzado='zapato'), cfg=K.CFG_HASTATUS, muestra=M_ESCUDO, mov='escudo'),
    'falangita': dict(fn=falangita, estilo=dict(pelo=[0.13, 0.09, 0.065]), cfg=CFG_SARISA, muestra=M_SARISA, mov='sarisa', movimientos=mov_sarisa),
}
