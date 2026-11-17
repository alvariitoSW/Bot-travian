"""Construye un soldado entero: python3 construir.py hastatus|galo [--lod].
Cuerpo: MakeHuman (CC0). Movimientos: Quaternius UAL 1 y 2 (CC0). Equipo y texturas: hechos aquí por código."""
import sys, os, json, numpy as np, mh, anim, poses, geo, exportar as X, piezas as Z, ropa
from piezas import MAT
AQUI = os.path.dirname(os.path.abspath(__file__)); SAL = os.path.join(AQUI, '..', 'datos')
CLIPS = {'quieto': (1, 'Idle_Loop', 1), 'andar': (1, 'Walk_Loop', 1), 'correr': (1, 'Jog_Fwd_Loop', 1), 'guardia': (1, 'Sword_Idle', 1), 'lanzar': (2, 'OverhandThrow', 0),
         'golpear': (1, 'Sword_Attack', 0), 'cubrirse': (2, 'Sword_Block', 0), 'encajar': (1, 'Hit_Chest', 0), 'morir': (1, 'Death01', 0)}

def piel(m, B, oculto, objetivo, nombre='piel', torso=0.0):
    """Piel visible: quita lo tapado por la ropa, aligera y separa por islas de UV."""
    V, VT = m['V'], m['VT']; clave = {}; vid, tid, T = [], [], []
    for f, g in zip(m['F'], m['G']):
        if g != 'body' or all(oculto[p[0]] for p in f): continue
        k = []
        for v, t in f:
            if (v, t) not in clave: clave[(v, t)] = len(vid); vid.append(v); tid.append(t)
            k.append(clave[(v, t)])
        for i in range(1, len(k) - 1): T.append([k[0], k[i], k[i + 1]])
    vid = np.array(vid); T = np.array(T); P = V[vid]
    cabF = B.g('head', 'neck'); manF = B.g('finger', 'metacarpal', 'wrist'); cab = cabF[vid]; man = manF[vid]; pie = B.g('foot')[vid]
    peso = 1 + 3 * cab + 0.3 * man - 0.5 * pie + torso * B.g('spine', 'clavicle', 'shoulder01', 'breast')[vid]; cara = (cab > 0.5) & (P[:, 2] > 0.075) & (P[:, 1] > 1.50); peso[cara] *= 40 if objetivo > 3000 else 5 if objetivo > 1000 else 1.5
    T = geo.aligerar(P, T, objetivo, peso, costuras=objetivo > 1000); T, (vid, tid) = geo.compactar(T, vid, np.array(tid)); P = V[vid]; UV = VT[tid] * [1, -1]
    isl = geo.islas(T, len(P)); out = []
    for k in range(isl.max() + 1):
        Tk = T[isl == k]; vs = np.unique(Tk); mm = -np.ones(len(P), int); mm[vs] = np.arange(len(vs)); Pk = P[vs]; UVk = UV[vs]; Tk = mm[Tk]
        a3 = np.linalg.norm(np.cross(Pk[Tk[:, 1]] - Pk[Tk[:, 0]], Pk[Tk[:, 2]] - Pk[Tk[:, 0]]), axis=1).sum(); e1 = UVk[Tk[:, 1]] - UVk[Tk[:, 0]]; e2 = UVk[Tk[:, 2]] - UVk[Tk[:, 0]]; a2 = np.abs(e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]).sum()
        esc = np.sqrt(a3 / max(a2, 1e-12)); tam = (np.ptp(UVk[:, 0]) * esc, np.ptp(UVk[:, 1]) * esc); c = cabF[vid[vs]].mean(); mn = manF[vid[vs]].mean()
        si, sw = B.w4(B.Wd[vid[vs]]); p = Z.pieza('%s%d' % (nombre, k), Pk, Tk, UVk, MAT['piel'], tam, W=(si, sw), prio=2.3 if c > 0.5 else 1.35 if mn > 0.5 else 1.0, tinte=2); p['vs'] = vid[vs]; out.append(p)
    return out

def ojos(m, B):
    out = []
    for L in 'lr':
        clave = {}; vid, tid, T = [], [], []
        for f, g in zip(m['F'], m['G']):
            if g != 'helper-%s-eye' % L: continue
            k = []
            for v, t in f:
                if (v, t) not in clave: clave[(v, t)] = len(vid); vid.append(v); tid.append(t)
                k.append(clave[(v, t)])
            for i in range(1, len(k) - 1): T.append([k[0], k[i], k[i + 1]])
        vid = np.array(vid); P = m['V'][vid]; c = P.mean(0); d = P - c; frente = c + np.array([0, 0, np.abs(d[:, 2]).max()]); aux = np.stack([np.linalg.norm(P - frente, axis=1), np.zeros(len(P))], 1)
        out.append(Z.pieza('ojo' + L, P, np.array(T), m['VT'][np.array(tid)] * [1, -1], MAT['ojo'], (0.03, 0.03), 'head', aux=aux, prio=2.5))
    return out

def hastatus(m, B, lod=False, muy=False):
    V = m['V']; c = m['cab']; y = V[:, 1]; P = []
    torso = B.g('spine', 'clavicle', 'shoulder01', 'root', 'pelvis', 'breast'); brazo = {L: B.g('upperarm', 'shoulder01', lado=L) for L in 'LR'}; sb = {L: B.sbrazo(L) for L in 'LR'}
    HEM, HEM_M = 0.60, 0.755
    # --- qué piel queda tapada
    oc = ((torso >= 0.5) & (y < 1.385)) | (B.g('upperleg', 'pelvis') >= 0.5) & (y > HEM + 0.035)
    for L in 'LR': oc |= ((brazo[L] + torso) >= 0.6) & (sb[L] < 0.36) & (y < 1.385)
    yf, yb = 1.664, 1.612; cab = B.g('head') > 0.5; cz = 0.045; th = np.arctan2(V[:, 0], V[:, 2] - cz); oc |= cab & (y > (yf + yb) / 2 + (yf - yb) / 2 * np.cos(th) + 0.018)
    P += piel(m, B, oc, 420 if muy else 1500 if lod else 6900) + ([] if lod else ojos(m, B))
    # --- cota de malla: torso
    cen = np.array([0, 1.2, V[B.sv, 2].mean()])
    selm = (y > 0.985) & (y < 1.50) & ((torso >= 0.5) | ((brazo['L'] + torso >= 0.5) & (sb['L'] < 0.30)) | ((brazo['R'] + torso >= 0.5) & (sb['R'] < 0.30)))
    gros = 0.013; mat = MAT['malla']
    def cuello(Pc, vs):
        Pc = Pc.copy(); Pc[:, 1] = np.minimum(Pc[:, 1], 1.456 + 0.02 * np.clip(-Pc[:, 2], -0.05, 0.1)); return Pc
    P.append(B.cascara('cota', selm, gros, mat, cen, [0, 1, 0], [-1, 0, 0.0], suav=1, prio=1.15, extra=cuello))
    # --- mangas de la túnica
    for L in 'LR':
        o, d = B.brazo[L]; sel = (brazo[L] + B.g('upperarm', lado=L) >= 0.5) & (sb[L] > 0.02) & (sb[L] < 0.60); gr = 0.006 + 0.012 * np.clip(sb[L], 0, 1)
        P.append(B.cascara('manga' + L, sel, gr, MAT['tela'], o, d, [0, 0, -1], aux=np.stack([np.clip(sb[L] / 0.6, 0, 1), np.zeros(len(V))], 1), tinte=1))
    # --- faldones: malla encima, túnica debajo; cinturón
        Q = V[B.sv]; top = Q[np.abs(Q[:, 1] - 1.0) < 0.03]; k0 = 1.0
    P.append(B.falda('faldon_malla', 1.04, HEM_M, 36, 6, MAT['malla'], lambda yy, t: 1.045 + 0.05 * (1.04 - yy), prio=1.15))
    P.append(B.falda('faldon_tunica', HEM_M + 0.05, HEM, 54, 5, MAT['tela'], lambda yy, t: 1.0 + 0.02 * (1.04 - yy) + (0.03 + 0.10 * (HEM_M + 0.05 - yy)) * (0.5 + 0.5 * np.sin(t * 13 + 2 * np.sin(t * 3))) * 0.45, tinte=1))
    P.append(B.falda('cinturon', 1.052, 0.998, 36, 1, MAT['cuero'], lambda yy, t: 1.075, prio=1.3))
    if not lod:
        gsel = (B.g('lowerleg', lado='L') >= 0.5) & (y > 0.125) & (y < 0.515) & (B.Nt[:, 2] > -0.25)
        P.append(B.cascara('greba', gsel, 0.007, MAT['bronce'], c['lowerleg01.L'], c['foot.L'] - c['lowerleg01.L'], [0, 0, -1], aux=np.stack([np.clip((y - 0.125) / 0.39, 0, 1), np.zeros(len(V))], 1), prio=1.2))
    # --- yelmo, escudo, armas
    P += Z.yelmo(m); hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    P += Z.escudo_oval(hL)
    P += Z.pilum(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, bajo=1.0)
    P += Z.espada(hR['c'], -hR['X'], hR['d'], 'wrist.R', 2)
    boca = np.array([-0.228, 1.005, 0.02]); ev = np.array([-0.13, -1, -0.16]); P += Z.vaina(boca, ev, [1, 0, 0], 'root') + Z.espada(boca - ev / np.linalg.norm(ev) * 0.058, ev, [0, 0, 1], 'root', 3, nombre='espada_env', solo_puno=True)
    P += Z.suela(m, 'L') + Z.suela(m, 'R')
    return P

def galo(m, B, lod=False, muy=False):
    """Guerrero galo (La Tène, s. III a.C.): torso desnudo, bracae de cuadros, torques, pelo encalado, escudo plano."""
    V = m['V']; c = m['cab']; y = V[:, 1]; x = V[:, 0]; z = V[:, 2]; P = []; cz = V[B.sv, 2].mean()
    pierna = {L: B.g('upperleg', 'lowerleg', 'pelvis', lado=L) for L in 'LR'}; bajo = B.g('upperleg', 'lowerleg', 'pelvis', 'root', 'spine05')
    cab = B.g('head') > 0.5; oreja = (np.abs(x) > 0.070) & (z > -0.012) & (z < 0.062)
    linea = 1.562 + 0.118 * np.clip((z + 0.01) / 0.12, 0, 1) ** 1.3; linea = np.where(oreja, np.maximum(linea, 1.648), linea); cuero_cab = cab & (y > linea)
    oc = ((pierna['L'] + pierna['R'] + B.g('root', 'spine05') >= 0.5) & (y < 0.99) & (y > 0.125)) | (cuero_cab & (y > linea + 0.012))
    P += piel(m, B, oc, 520 if muy else 2300 if lod else 9200, torso=3.0) + ([] if lod else ojos(m, B))
    # --- melena: cáscara sobre el cuero cabelludo, peinada hacia atrás en mechones
    clave = {}; vid, T = [], []
    for f, g in zip(m['F'], m['G']):
        if g != 'body' or not all(cuero_cab[p[0]] for p in f): continue
        k = [clave.setdefault(p[0], len(clave)) for p in f]
        for i in range(1, len(k) - 1): T.append([k[0], k[i], k[i + 1]])
    vid = np.array(list(clave)); T = np.array(T); Pc = V[vid]; Nc = X.normales(Pc, T, True)
    T = geo.aligerar(Pc, T, 560, borde_fijo=False); T, (vid, Pc, Nc) = geo.compactar(T, vid, Pc, Nc)
    ang = np.arctan2(Pc[:, 0], Pc[:, 1] - 1.60); atras = np.clip((0.10 - Pc[:, 2]) / 0.14, 0, 1); orilla = np.clip((Pc[:, 1] - linea[vid]) / 0.022, 0, 1); mech = 0.5 + 0.5 * np.sin(ang * 13 + 3 * np.sin(Pc[:, 2] * 40))
    d = (0.007 + 0.024 * atras + 0.014 * mech * (0.4 + 0.6 * atras)) * (0.25 + 0.75 * orilla); Ph = Pc + Nc * d[:, None]; Ph[:, 2] -= 0.022 * atras ** 2; Ph[:, 1] -= 0.018 * np.clip((-0.01 - Pc[:, 2]) / 0.05, 0, 1) * (1 - orilla)
    idx, UV, T2 = Z.desenrollar(Ph, T, np.array([0, 1.60, 0.04]), [0, 0, -1], [0, 1, 0]); si, sw = B.w4(B.Wd[vid[idx]])
    P.append(Z.pieza('melena', Ph[idx], T2, UV, MAT['pelo'], (0.5, 0.26), W=(si, sw), aux=np.stack([UV[:, 0] * 0.09, UV[:, 1]], 1), prio=1.5))
    for s_ in (1, -1):                                         # bigote caído
        cam = np.array([[0.004, 1.5665, 0.160], [0.014, 1.563, 0.157], [0.024, 1.553, 0.150], [0.031, 1.537, 0.141], [0.034, 1.518, 0.133]]) * [s_, 1, 1]; rad = [0.0045, 0.006, 0.0055, 0.004, 0.0012]
        def big(u, v):
            k = v * 4; i = min(int(k), 3); f = k - i; p = cam[i] * (1 - f) + cam[i + 1] * f; r = rad[i] * (1 - f) + rad[i + 1] * f; t = cam[min(i + 1, 4)] - cam[i]; t /= np.linalg.norm(t); a = np.cross(t, [0, 0, 1.0]); a /= np.linalg.norm(a); b = np.cross(t, a); return p + (a * np.cos(u * 6.283) + b * np.sin(u * 6.283) * 0.7) * r
        Pb, UVb, Tb = Z.rej(big, 5, 4); P.append(Z.pieza('bigote' + ('L' if s_ > 0 else 'R'), Pb, Tb if s_ > 0 else Tb[:, ::-1], UVb, MAT['pelo'], (0.03, 0.07), 'head', aux=np.stack([UVb[:, 0] * 0.03, UVb[:, 1]], 1)))
    # --- bracae (pantalón de cuadros) y cinturón
    cen = np.array([0, 0.9, cz]); selc = (bajo >= 0.5) & (y > 0.79) & (y < 1.02)
    P.append(B.cascara('calzon', selc, 0.012, MAT['cuadros'], cen, [0, 1, 0], [-1, 0, 0.0], suav=2))
    for L in 'LR':
        sel = (pierna[L] >= 0.5) & (y > 0.105) & (y < 0.87); gr = 0.009 + 0.006 * np.clip((y - 0.2) / 0.5, 0, 1) - 0.004 * (y < 0.14)
        P.append(B.cascara('pernera' + L, sel, gr, MAT['cuadros'], c['upperleg01.' + L], c['foot.' + L] - c['upperleg01.' + L], [0, 0, -1], suav=2))
    selb = (bajo + B.g('spine04', 'spine03') >= 0.5) & (y > 0.975) & (y < 1.045); auxb = np.stack([np.clip((y - 0.985) / 0.05, 0, 1), np.arctan2(x, z - cz) / (2 * np.pi) + 0.5], 1)
    pb = B.cascara('cinturon', selb, 0.017, MAT['cuero'], cen, [0, 1, 0], [-1, 0, 0.0], aux=auxb, prio=1.3); P.append(pb)
    # --- torques de oro
    perf = [(0.071 + 0.0078 * np.cos(a), 0.0078 * np.sin(a)) for a in np.linspace(0, 2 * np.pi, 7)]
    Pt, UVt, Tt, tam = Z.torno(perf, 20, [0, 1.452, 0.012], [0, 1, 0.26], [0, 0, 1], 1.16); P.append(Z.pieza('torques', Pt, Tt, UVt, MAT['oro'], (0.45, 0.05), 'neck01', aux=np.stack([UVt[:, 1], UVt[:, 0]], 1), prio=1.3))
    # --- escudo, lanza, espada larga y vaina
    hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    P += Z.escudo_oval(hL, alto=1.12, ancho=0.57, R=2.2, n=2.3, mat='escudo_galo', cantos=False)
    P += Z.lanza(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1) + Z.espada(hR['c'], -hR['X'], hR['d'], 'wrist.R', 2, largo=0.78, ancho=0.046, gala=True)
    boca = np.array([-0.215, 0.985, 0.02]); ev = np.array([-0.10, -1, -0.16]); pv = Z.vaina(boca, ev, [1, 0, 0], 'root', largo=0.81, ancho=0.054)
    for q in pv: q['mat'][:] = MAT['hierro']
    P += pv + Z.espada(boca - ev / np.linalg.norm(ev) * 0.058, ev, [0, 0, 1], 'root', 3, nombre='espada_env', solo_puno=True, gala=True)
    return P

def movimientos(m, util, cfg):
    G = {1: anim.Glb(anim.ARCH[1]), 2: anim.Glb(anim.ARCH[2])}; clips = {}; hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    bajo = (np.array([0.30, 0.875, 0.265]), poses.girar_mano(hL['F'], [0.97, 0, -0.24], [0.24, 0, 0.97]), [0.6, 0.1, -1.0])
    alto = (np.array([0.20, 1.085, 0.36]), poses.girar_mano(hL['F'], [0.99, 0, -0.12], [0.12, 0, 0.99]), [0.9, -0.5, -0.4])
    porta = lambda yy, inc: (np.array([-0.265, yy, 0.25]), poses.girar_mano(hR['F'], [0.0, -1, -inc], [-1.0, 0, 0.18]), [-0.25, -0.5, -1.0])
    for k, (lib, src, bucle) in CLIPS.items():
        if k not in cfg: continue
        D, libre, raiz, dur = anim.retarget(m, lib, src, 30, G[lib]); izq, der = cfg[k][:2]
        poses.punos(m, D, libre)
        if izq: poses.brazo(m, D, libre, raiz, 'L', *(bajo if izq == 'bajo' else alto))
        if der: poses.brazo(m, D, libre, raiz, 'R', *porta(*der))
        poses.punos(m, D, libre); Pp = anim.fk(m, D, libre, raiz); clips[k] = (X.hornear(D, Pp, m, util), 22 if k == 'lanzar' else 30, bucle)
    ixh = {b: i for i, b in enumerate(m['huesos'])}
    VAR = {2: (([0.29, 0.91, 0.29], [0.90, 0, -0.44], [0.44, 0, 0.90]), (1.0, 0.13), 0.38, 25), 3: (([0.32, 0.85, 0.24], [0.99, 0, -0.12], [0.12, 0, 0.99]), (1.13, -0.03), -0.33, 50)}
    for v, (iz, de, cabeza, rot) in VAR.items():               # otras dos maneras de estar quieto: que no sean todos iguales
        if 'quieto' not in cfg: break
        D, libre, raiz, dur = anim.retarget(m, 1, 'Idle_Loop', 30, G[1]); D = np.roll(D, rot, 0); raiz = np.roll(raiz, rot, 0); R = anim.eje([0, 1, 0], cabeza)
        for b in ('neck01', 'head'): D[:, ixh[b]] = R @ D[:, ixh[b]]
        poses.punos(m, D, libre); poses.brazo(m, D, libre, raiz, 'L', np.array(iz[0]), poses.girar_mano(hL['F'], iz[1], iz[2]), [0.6, 0.1, -1.0])
        if cfg['quieto'][1]: poses.brazo(m, D, libre, raiz, 'R', *porta(*de))
        poses.punos(m, D, libre); clips['quieto%d' % v] = (X.hornear(D, anim.fk(m, D, libre, raiz), m, util), 30, 1)
    if os.environ.get('DEPURA'):                               # reposo y reposo con puños, para ajustar agarres
        for nom, pu in (('reposo', 0), ('puno', 1)):
            D = np.tile(np.eye(3), (2, len(m['huesos']), 1, 1)); libre = np.zeros(len(m['huesos']), bool); raiz = np.tile(m['cab']['root'], (2, 1))
            if pu: poses.punos(m, D, libre)
            clips[nom] = (X.hornear(D, anim.fk(m, D, libre, raiz), m, util), 30, 1)
    return clips

CFG_HASTATUS = {'quieto': ('bajo', (1.07, 0.04)), 'andar': ('bajo', (1.13, 0.10)), 'correr': ('bajo', None), 'guardia': ('alto', None), 'lanzar': ('bajo', None), 'golpear': ('alto', None),
                'cubrirse': ('alto', None), 'encajar': ('alto', None), 'morir': (None, None)}
MUESTRA_HASTATUS = {'quieto': [[0, 5]], 'quieto2': [[0, 5]], 'quieto3': [[0, 5]], 'andar': [[0, 5]], 'correr': [[0, 5]], 'guardia': [[0, 2]], 'lanzar': [[0, 5], [0.36, 4]], 'golpear': [[0, 2]], 'cubrirse': [[0, 2]], 'encajar': [[0, 2]], 'morir': [[0, 2]]}

FUERA_LEJOS = ('bigote', 'escudo_asa', 'suela', 'espada_env', 'greba', 'torques', 'yelmo_nuca')
def aligerar_piezas(pz, r=0.34, muy=False):
    out = []
    for p in pz:
        if any(p['nombre'].startswith(q) for q in FUERA_LEJOS): continue
        if muy and p['nombre'].startswith(('manga', 'cinturon', 'yelmo_carrillera', 'yelmo_pluma', 'escudo_dorso', 'escudo_canto', 'vaina', 'espada_guarda', 'espada_puno', 'pilum_taco', 'calzon')): continue
        if p['nombre'].startswith('piel') or len(p['T']) < 24: out.append(p); continue
        k = (0.07 if muy else 0.22) if p['nombre'].startswith(('cota', 'yelmo_cuenco', 'escudo_espina', 'pernera')) else (0.16 if muy else r)
        T = geo.aligerar(p['P'], p['T'], max(8, int(len(p['T']) * k))); usados = np.unique(T); mm = -np.ones(len(p['P']), int); mm[usados] = np.arange(len(usados)); q = dict(p); q['T'] = mm[T]
        for c in ('P', 'UV', 'mat', 'prm', 'aux', 'N'): q[c] = p[c][usados]
        if p['W'] is not None: q['W'] = (p['W'][0][usados], p['W'][1][usados])
        out.append(q)
    return out

def montar(nombre, piezas_, m, util, clips, muestra, lado=2048, tex=True):
    import texturas
    ix = {b: i for i, b in enumerate(util)}; M = X.Malla(); atlas = texturas.empaquetar(piezas_, lado)
    for p, (x0, y0, w, h) in zip(piezas_, atlas):
        uv = (np.array([x0, y0]) + p['UV'] * [w, h]) / lado; p['uvpx'] = uv * lado
        if p['W'] is not None: si, sw = p['W']
        else: si, sw = ix[p['hueso']], 1.0
        M.pon(p['nombre'].rstrip('0123456789LR'), p['P'], p['N'], uv, si, sw, p['T'], p['conj'])
    arch = texturas.pintar(piezas_, lado, os.path.join(SAL, nombre), m) if tex else {}
    j = X.guardar(os.path.join(SAL, nombre), M, clips, util, dict(texturas=arch, muestra=muestra)); return j

if __name__ == '__main__':
    import texturas
    quien = sys.argv[1] if len(sys.argv) > 1 else 'hastatus'; muy = '--lod2' in sys.argv; lod = '--lod' in sys.argv or muy; m = mh.construir(); util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a)
    if quien == 'galo': texturas.ESTILO = dict(pelo=[0.55, 0.47, 0.30], calzado='zapato', melena=[0.74, 0.66, 0.47]); pz = galo(m, B, lod, muy)
    else: pz = hastatus(m, B, lod, muy)
    if lod:                                                    # de lejos no hay huesos de dedos: el puño va ya cerrado en la malla
        utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
        A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
        for p in pz:
            if p['nombre'].startswith('piel'): p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = X.normales(p['P'], p['T'], True)
        pz = aligerar_piezas(pz, muy=muy)
    clips = movimientos(m, util, CFG_HASTATUS); nombre = quien + ('_muylejos' if muy else '_lejos' if lod else ''); j = montar(nombre, pz, m, util, clips, MUESTRA_HASTATUS, lado=512 if muy else 1024 if lod else 2048)
    print(j['verts'], 'vértices', j['tris'], 'triángulos', len(util), 'huesos', j['cuadros'], 'cuadros'); print(j['piezas']); print({k: round(os.path.getsize(os.path.join(SAL, k)) / 1e6, 2) for k in sorted(os.listdir(SAL)) if k.startswith(nombre + '.') or k.startswith(nombre + '_')})
