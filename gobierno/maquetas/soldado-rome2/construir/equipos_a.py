"""GM44d (mitad A): triario, vélite, hondero y peltasta. Mismo cuerpo (MakeHuman, CC0), mismos movimientos
(Quaternius, CC0; juego 'escudo', compartido con el hastatus) y equipo hecho por código (arte propio).
Fuentes, citadas de memoria: Polibio 6.21–23 (vélites, triarios); Diodoro 5.18 y Estrabón 3.5.1 (honderos baleares).
Lo inventado para poder jugar se marca «licencia de juego»."""
import numpy as np, poses, piezas as Z, texturas as TX, piezas_a as A
from piezas import MAT
import construir as K

MUESTRA = K.MUESTRA_HASTATUS

def _piel_tapada(m, B, HEM, cabeza=True):
    """Qué piel queda bajo la túnica (y bajo el casco o el gorro), como en el hastatus."""
    V = m['V']; y = V[:, 1]; torso = B.g('spine', 'clavicle', 'shoulder01', 'root', 'pelvis', 'breast'); brazo = {L: B.g('upperarm', 'shoulder01', lado=L) for L in 'LR'}; sb = {L: B.sbrazo(L) for L in 'LR'}
    oc = ((torso >= 0.5) & (y < 1.385)) | (B.g('upperleg', 'pelvis') >= 0.5) & (y > HEM + 0.035)
    for L in 'LR': oc |= ((brazo[L] + torso) >= 0.6) & (sb[L] < 0.36) & (y < 1.385)
    if cabeza:
        yf, yb = 1.664, 1.612; cab = B.g('head') > 0.5; th = np.arctan2(V[:, 0], V[:, 2] - 0.045); oc |= cab & (y > (yf + yb) / 2 + (yf - yb) / 2 * np.cos(th) + 0.018)
    return oc, torso, brazo, sb

def tunica(m, B, lod, muy, fondo, HEM=0.62, cabeza=True, mangas=True, objetivo=(170, 420, 1500, 6900), tapa=None):
    """Cuerpo con túnica de lana ceñida con cinturón, sin armadura (vélite, hondero, peltasta)."""
    V = m['V']; y = V[:, 1]; P = []
    oc, torso, brazo, sb = _piel_tapada(m, B, HEM, cabeza)
    if tapa is not None: oc = oc | tapa
    P += K.piel(m, B, oc, objetivo[0] if fondo else objetivo[1] if muy else objetivo[2] if lod else objetivo[3]) + ([] if lod else K.ojos(m, B))
    cen = np.array([0, 1.2, V[B.sv, 2].mean()])
    sel = (y > 0.975) & (y < 1.50) & ((torso >= 0.5) | ((brazo['L'] + torso >= 0.5) & (sb['L'] < 0.30)) | ((brazo['R'] + torso >= 0.5) & (sb['R'] < 0.30)))
    def cuello(Pc, vs):
        Pc = Pc.copy(); Pc[:, 1] = np.minimum(Pc[:, 1], 1.452 + 0.02 * np.clip(-Pc[:, 2], -0.05, 0.1)); return Pc
    # se llama «cota_…» para que aligerar_piezas (construir.py) la aligere de lejos tanto como la cota del hastatus
    P.append(B.cascara('cota_tunica', sel, 0.0115, MAT['tela'], cen, [0, 1, 0], [-1, 0, 0.0], suav=1, prio=1.0, extra=cuello))
    if mangas:
        for L in 'LR':
            o, d = B.brazo[L]; s2 = (brazo[L] + B.g('upperarm', lado=L) >= 0.5) & (sb[L] > 0.02) & (sb[L] < 0.60); gr = 0.006 + 0.012 * np.clip(sb[L], 0, 1)
            P.append(B.cascara('manga' + L, s2, gr, MAT['tela'], o, d, [0, 0, -1], aux=np.stack([np.clip(sb[L] / 0.6, 0, 1), np.zeros(len(V))], 1)))
    top = 1.03
    P.append(B.falda('faldon_tunica', top, HEM, 52 if muy else 78, 6, MAT['tela'], lambda yy, t: 1.035 + 0.03 * (top - yy) + (0.012 + 0.30 * (top - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.5))
    P.append(B.falda('cinturon', 1.052, 1.0, 36, 1, MAT['cuero'], lambda yy, t: 1.07, prio=1.3))
    P += Z.suela(m, 'L') + Z.suela(m, 'R')
    return P

def espada_al_cinto(P, hR, largo=0.63, ancho=0.052):
    """Espada en la mano (conj 2, solo en guardia y golpe) y envainada al costado derecho (conj 3), como el hastatus."""
    P += Z.espada(hR['c'], -hR['X'], hR['d'], 'wrist.R', 2, largo=largo, ancho=ancho)
    boca = np.array([-0.228, 1.005, 0.02]); ev = np.array([-0.13, -1, -0.16])
    P += Z.vaina(boca, ev, [1, 0, 0], 'root', largo=largo + 0.03, ancho=ancho + 0.01) + Z.espada(boca - ev / np.linalg.norm(ev) * 0.058, ev, [0, 0, 1], 'root', 3, nombre='espada_env', solo_puno=True)

# ---------- triario ----------
def _barba(ctx):
    """Triario: veterano, barba más poblada y algo cana (pintada sobre la piel, con relieve)."""
    s = ctx['s']; p = ctx['P'][s]; xs, ys, zs = p.T; axs = np.abs(xs); fino = ctx['fino'][s]; sst = TX.sst
    cara = (ys > 1.44) & (zs > 0.02)
    b = cara * sst(1.585, 1.560, ys) * sst(1.445, 1.475, ys) * (1 - sst(0.150, 0.160, zs) * sst(1.556, 1.568, ys) * sst(0.028, 0.018, axs)) * sst(0.0, 0.045, zs + 0.55 * axs) * (1 - sst(1.545, 1.555, ys) * sst(0.140, 0.152, zs) * sst(0.024, 0.012, axs))
    hebra = TX.r2(xs * 1400 + np.sin(ys * 260) * 0.5, ys * 90, 1.0, 13.0); cana = TX.sst(0.6, 0.8, TX.fbm(p, 50, 2, 91.0))
    col = np.array([0.20, 0.15, 0.11]) * (1 - cana[:, None]) + np.array([0.52, 0.49, 0.45]) * cana[:, None]; w = np.clip(b * (0.70 + 0.30 * hebra), 0, 0.92)
    ctx['C'][s] = TX.mez(ctx['C'][s], col, w); ctx['H'][s] += w * (0.0008 + 0.0010 * hebra); ctx['R'][s] = np.maximum(ctx['R'][s], 0.75 * w); ctx['TI'][s, 1] *= 1 - w; ctx['TI'][s, 0] = np.maximum(ctx['TI'][s, 0], w * (1 - cana) * 0.8)

def triario(m, B, lod=False, muy=False, fondo=False):
    """Triario (Polibio 6.23): armado como el hastatus, pero con hasta (lanza de empuje) en vez de pilum."""
    if not fondo: TX.PINTORES.append(([MAT['piel']], _barba))
    P = [p for p in K.hastatus(m, B, lod, muy, fondo) if not p['nombre'].startswith('pilum')]; hR = poses.mano(m, 'R')
    P += Z.lanza(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, largo=2.45, bajo=1.15, simple=muy)
    return P

# ---------- vélite ----------
def velite(m, B, lod=False, muy=False, fondo=False):
    """Vélite (Polibio 6.21–22): el más joven y pobre. Túnica sin coraza, parma redonda, casco sencillo cubierto con
    piel de lobo, gladius y jabalinas finas: una en la mano derecha y dos con la parma."""
    P = tunica(m, B, lod, muy, fondo, HEM=0.62); hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    if not muy: P += A.casco_simple(m)
    P += A.gorro_piel(m, 'lobo', 'piel_lobo', k=1.13, sobre=0.022, frente=0.035, lado=0.012, nuca=1.455, flare=0.28, esc=1.25, hoc_v=0.16, nu=16 if muy else 28, nv=6 if muy else 11, orejas=not muy, hocico=not fondo)
    P += [p for p in A.parma(h=hL, nr=2 if muy else 7, na=12 if fondo else 16 if muy else 28, canto=not muy, umbo=not fondo) if not (muy and p['nombre'] == 'escudo_dorso')]
    P += A.jabalina(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, simple=muy)
    P += A.haz_jabalinas(hL, 2 if not muy else 1, simple=muy)
    espada_al_cinto(P, hR)
    return P

# ---------- hondero ----------
def hondero(m, B, lod=False, muy=False, fondo=False):
    """Hondero balear (Diodoro 5.18; Estrabón 3.5.1): sin escudo ni armadura, túnica corta, tres hondas
    (en la cabeza, en la cintura y en la mano) y un zurrón de piedras en la izquierda (licencia de juego: en la mano)."""
    pelo, tapa = pelo_corto(m, B)
    P = tunica(m, B, lod, muy, fondo, HEM=0.66, cabeza=False, objetivo=(200, 480, 1900, 7200), tapa=tapa) + [pelo]; hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')   # cabeza descubierta: pelo en cáscara, como el galo
    if not fondo: P += A.honda_cabeza(m, cabos=not lod, trozos=lod, sobre=0.010)
    if not muy:
        P.append(B.falda('honda_cintura', 1.036, 1.018, 36, 1, MAT['cuerda'], lambda yy, t: 1.105, auxf=lambda UV: np.stack([UV[:, 0] * 40, UV[:, 1]], 1)))
    P += A.honda_mano(hR, simple=muy, ligera=lod) + A.bolsa_mano(hL, lados=6 if muy else 10)
    return P

def pelo_corto(m, B, oc_extra=None):
    """Pelo corto y espeso en cáscara sobre el cuero cabelludo (copiado y adaptado de la melena del galo, construir.py).
    Devuelve la pieza y la máscara de piel que tapa (la cabeza aligerada de lejos no se ve picuda)."""
    import geo, exportar as X
    V = m['V']; y = V[:, 1]; x = V[:, 0]; z = V[:, 2]; cab = B.g('head') > 0.5; oreja = (np.abs(x) > 0.070) & (z > -0.012) & (z < 0.062)
    linea = 1.600 + 0.085 * np.clip((z + 0.01) / 0.12, 0, 1) ** 1.3; linea = np.where(oreja, np.maximum(linea, 1.650), linea); cc = cab & (y > linea)
    clave = {}; T = []
    for f, g in zip(m['F'], m['G']):
        if g != 'body' or not all(cc[p[0]] for p in f): continue
        k = [clave.setdefault(p[0], len(clave)) for p in f]
        for i in range(1, len(k) - 1): T.append([k[0], k[i], k[i + 1]])
    vid = np.array(list(clave)); T = np.array(T); Pc = V[vid]; Nc = X.normales(Pc, T, True)
    T = geo.aligerar(Pc, T, 520, borde_fijo=False); T, (vid, Pc, Nc) = geo.compactar(T, vid, Pc, Nc)
    ang = np.arctan2(Pc[:, 0], Pc[:, 1] - 1.60); orilla = np.clip((Pc[:, 1] - linea[vid]) / 0.02, 0, 1); rizo = 0.5 + 0.5 * np.sin(ang * 17 + 4 * np.sin(Pc[:, 2] * 60))
    d = (0.006 + 0.005 * rizo) * (0.3 + 0.7 * orilla); Ph = Pc + Nc * d[:, None]
    idx, UV, T2 = Z.desenrollar(Ph, T, np.array([0, 1.60, 0.04]), [0, 0, -1], [0, 1, 0]); si, sw = B.w4(B.Wd[vid[idx]])
    p = Z.pieza('melena', Ph[idx], T2, UV, MAT['pelo'], (0.5, 0.26), W=(si, sw), aux=np.stack([UV[:, 0] * 0.3, UV[:, 1] * 3], 1), prio=1.4)
    return p, cc & (y > linea + 0.010)

MUESTRA_HONDERO = {k: [[0, 1]] for k in MUESTRA}; MUESTRA_HONDERO['lanzar'] = [[0, 1], [0.36, 0]]

# ---------- peltasta ----------
def peltasta(m, B, lod=False, muy=False, fondo=False):
    """Peltasta (tracios; mercenarios de Cartago y de Epiro): pelte de mimbre en media luna, alopekis (gorro de piel de
    zorro con solapas), túnica y capa corta (zeira), jabalinas y espada corta."""
    V = m['V']; y = V[:, 1]; z = V[:, 2]
    P = tunica(m, B, lod, muy, fondo, HEM=0.63); hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    P += A.gorro_piel(m, 'zorro', 'piel_zorro', k=1.05, sobre=0.10, frente=-0.002, lado=0.0, solapa=0.15, nuca=1.47, lean=0.07, hz=0.02, flare=0.22, hoc_v=0.40, esc=0.8, eje_h=(0, -0.25, 1.0), ore_u=0.09, nu=16 if muy else 28, nv=6 if muy else 12, orejas=not muy, hocico=not fondo)
    if not fondo:                                              # zeira: capa corta de lana sobre los hombros y la espalda
        torso = B.g('spine', 'clavicle', 'shoulder01', 'breast'); brazo = {L: B.g('upperarm', 'shoulder01', lado=L) for L in 'LR'}; sb = {L: B.sbrazo(L) for L in 'LR'}; cz = V[B.sv, 2].mean()
        sel = (y > 1.17) & (y < 1.50) & ((torso >= 0.5) | ((brazo['L'] + torso >= 0.5) & (sb['L'] < 0.35)) | ((brazo['R'] + torso >= 0.5) & (sb['R'] < 0.35))) & ((z < cz + 0.03) | (y > 1.40 - 0.6 * np.abs(V[:, 0]) * 0))
        gr = 0.020 + 0.010 * np.clip((1.40 - y) / 0.2, 0, 1)
        def cae(Pc, vs):                                       # el borde de abajo se separa un poco del cuerpo
            Pc = Pc.copy(); k = np.clip((1.33 - Pc[:, 1]) / 0.16, 0, 1); Pc[:, 2] -= 0.025 * k * (Pc[:, 2] < cz); return Pc
        P.append(B.cascara('cota_zeira', sel, gr, MAT['zeira'], np.array([0, 1.3, cz]), [0, 1, 0], [-1, 0, 0.0], suav=2, prio=1.1, extra=cae))
    P += [p for p in A.pelte(hL, nu=8 if muy else 16, nv=4 if muy else 10, canto=not muy) if not (muy and p['nombre'] == 'escudo_dorso')]
    P += A.jabalina(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, largo=1.45, bajo=0.62, simple=muy)
    P += A.haz_jabalinas(hL, 2 if not muy else 1, largo=1.45, simple=muy)
    espada_al_cinto(P, hR, largo=0.52, ancho=0.05)
    return P

_M_TRI = dict(MUESTRA, **{k: [[0, 5]] for k in ('lanzar', 'guardia', 'golpear', 'cubrirse', 'encajar')})   # el triario no suelta la lanza: combate con ella (la espada, envainada)
EQUIPOS = {
    'triario': dict(fn=triario, estilo=dict(pelo=[0.16, 0.12, 0.09]), cfg=K.CFG_HASTATUS, muestra=_M_TRI, mov='escudo'),
    'velite': dict(fn=velite, estilo=dict(pelo=[0.14, 0.10, 0.07]), cfg=K.CFG_HASTATUS, muestra=MUESTRA, mov='escudo'),
    'hondero': dict(fn=hondero, estilo=dict(pelo=[0.09, 0.07, 0.05], melena=[0.17, 0.13, 0.095]), cfg=K.CFG_HASTATUS, muestra=MUESTRA_HONDERO, mov='escudo'),
    'peltasta': dict(fn=peltasta, estilo=dict(pelo=[0.20, 0.14, 0.09], calzado='zapato'), cfg=K.CFG_HASTATUS, muestra=MUESTRA, mov='escudo'),
}
