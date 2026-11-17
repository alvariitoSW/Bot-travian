"""Movimientos de Quaternius (Universal Animation Library 1 y 2, CC0) pasados al esqueleto de MakeHuman.
Se trabaja con «giros desde el reposo» en el mundo: no hacen falta los ejes propios de cada hueso."""
import json, struct, os, numpy as np
DL = os.environ.get('UAL_DATOS', '/tmp/claude-0/-home-user-bot-travian/0f749647-856b-55de-8fbb-de1ea1b71349/scratchpad/dl')
ARCH = {1: DL + '/ual1/AnimationLibrary_Godot_Standard.glb', 2: DL + '/ual2/UAL2_Standard.glb'}
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def q2m(q):
    x, y, z, w = np.moveaxis(np.asarray(q, float), -1, 0); n = np.sqrt(x*x+y*y+z*z+w*w); x, y, z, w = x/n, y/n, z/n, w/n
    return np.stack([np.stack([1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], -1), np.stack([2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], -1), np.stack([2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)], -1)], -2)
def eje(ax, ang):
    ax = np.asarray(ax, float); ax = ax / np.linalg.norm(ax); x, y, z = ax; c, s = np.cos(ang), np.sin(ang); C = 1 - c
    return np.array([[c+x*x*C, x*y*C-z*s, x*z*C+y*s], [y*x*C+z*s, c+y*y*C, y*z*C-x*s], [z*x*C-y*s, z*y*C+x*s, c+z*z*C]])
def rmin(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); v = np.cross(a, b); s = np.linalg.norm(v); c = a @ b
    if s < 1e-8: return np.eye(3)
    return eje(v / s, np.arctan2(s, c))
def marco(d, t):
    d = d / np.linalg.norm(d); t = t - d * (t @ d); t = t / np.linalg.norm(t); return np.stack([d, t, np.cross(d, t)], 1)
def orto(M):
    U, _, Vt = np.linalg.svd(M); return U @ Vt

class Glb:
    def __init__(s, p):
        b = open(p, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]; s.j = json.loads(b[20:20+n]); s.bin = b[20+n+8:]
        j = s.j; s.nodos = j['nodes']; s.nombre = [n.get('name', '') for n in s.nodos]; s.padre = [-1] * len(s.nodos)
        for i, n in enumerate(s.nodos):
            for c in n.get('children', []): s.padre[c] = i
        sk = j['skins'][0]; s.art = sk['joints']; ibm = s.acc(sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
        s.reposo = {s.nombre[n]: np.linalg.inv(m) for n, m in zip(s.art, ibm)}
        s.orden = []
        def baja(i):
            s.orden.append(i)
            for c in s.nodos[i].get('children', []): baja(c)
        for i in range(len(s.nodos)):
            if s.padre[i] < 0: baja(i)
    def acc(s, i):
        a = s.j['accessors'][i]; bv = s.j['bufferViews'][a['bufferView']]; o = bv.get('byteOffset', 0) + a.get('byteOffset', 0); n = NC[a['type']]
        return np.frombuffer(s.bin, CT[a['componentType']], a['count'] * n, o).reshape(a['count'], n) if n > 1 else np.frombuffer(s.bin, CT[a['componentType']], a['count'], o)
    def clip(s, nombre, fps=30):
        """Matrices de mundo (F, nodos, 4, 4) de un clip, muestreado a fps."""
        a = next(x for x in s.j['animations'] if x['name'] == nombre); dur = max(s.j['accessors'][sm['input']]['max'][0] for sm in a['samplers'])
        F = max(2, int(round(dur * fps)) + 1); T = np.linspace(0, dur, F); N = len(s.nodos)
        tr = np.zeros((F, N, 3)); ro = np.zeros((F, N, 4)); ro[..., 3] = 1; sc = np.ones((F, N, 3))
        for i, n in enumerate(s.nodos):
            if 'translation' in n: tr[:, i] = n['translation']
            if 'rotation' in n: ro[:, i] = n['rotation']
            if 'scale' in n: sc[:, i] = n['scale']
        for ch in a['channels']:
            sm = a['samplers'][ch['sampler']]; t = s.acc(sm['input']); v = s.acc(sm['output']); i = ch['target']['node']; p = ch['target']['path']
            k = np.clip(np.searchsorted(t, T, 'right') - 1, 0, len(t) - 2) if len(t) > 1 else np.zeros(F, int); k1 = np.minimum(k + 1, len(t) - 1)
            u = np.clip((T - t[k]) / np.maximum(t[k1] - t[k], 1e-9), 0, 1)[:, None]
            if p == 'rotation':
                a0, a1 = v[k].astype(float), v[k1].astype(float); a1 = np.where((a0 * a1).sum(1, keepdims=True) < 0, -a1, a1); ro[:, i] = a0 * (1 - u) + a1 * u
            elif p == 'translation': tr[:, i] = v[k] * (1 - u) + v[k1] * u
            elif p == 'scale': sc[:, i] = v[k] * (1 - u) + v[k1] * u
        L = np.zeros((F, N, 4, 4)); L[..., :3, :3] = q2m(ro) * sc[:, :, None, :]; L[..., :3, 3] = tr; L[..., 3, 3] = 1
        W = np.zeros_like(L)
        for i in s.orden: W[:, i] = L[:, i] if s.padre[i] < 0 else W[:, s.padre[i]] @ L[:, i]
        return {s.nombre[i]: W[:, i] for i in range(N)}, dur

# hueso de MakeHuman -> (hueso UAL1, hueso UAL2, hijo MakeHuman que marca su dirección)
def _lado(L):
    l = L.lower(); m = {
        'clavicle.' + L: ('DEF-shoulder.' + L, 'clavicle_' + l, 'upperarm01.' + L), 'upperarm01.' + L: ('DEF-upper_arm.' + L, 'upperarm_' + l, 'lowerarm01.' + L),
        'lowerarm01.' + L: ('DEF-forearm.' + L, 'lowerarm_' + l, 'wrist.' + L), 'wrist.' + L: ('DEF-hand.' + L, 'hand_' + l, 'MANO'),
        'upperleg01.' + L: ('DEF-thigh.' + L, 'thigh_' + l, 'lowerleg01.' + L), 'lowerleg01.' + L: ('DEF-shin.' + L, 'calf_' + l, 'foot.' + L), 'foot.' + L: ('DEF-foot.' + L, 'foot_' + l, 'PIE')}
    for n, (a, b) in {1: ('thumb', 'thumb'), 2: ('f_index', 'index'), 3: ('f_middle', 'middle'), 4: ('f_ring', 'ring'), 5: ('f_pinky', 'pinky')}.items():
        for k in (1, 2, 3): m['finger%d-%d.%s' % (n, k, L)] = ('DEF-%s.0%d.%s' % (a, k, L), '%s_0%d_%s' % (b, k, l), 'finger%d-%d.%s' % (n, k + 1, L) if k < 3 else 'COLA')
    return m
MAPA = {'root': ('DEF-hips', 'pelvis', None), 'spine05': ('DEF-spine.001', 'spine_01', 'spine03'), 'spine03': ('DEF-spine.002', 'spine_02', 'spine02'), 'spine02': ('DEF-spine.003', 'spine_03', 'neck01'),
        'neck01': ('DEF-neck', 'neck_01', 'head'), 'head': ('DEF-head', 'Head', None), **_lado('L'), **_lado('R')}
HIJO_F = {1: {'DEF-hips': None}, 2: {}}

def retarget(mh, lib, nombre, fps=30, G=None):
    """Devuelve D (F, huesos, 3, 3) giros desde el reposo y P (F, huesos, 3) posición de la cabeza de cada hueso."""
    g = G or Glb(ARCH[lib]); W, dur = g.clip(nombre, fps); F = len(next(iter(W.values()))); H = mh['huesos']; cab, cola, padre = mh['cab'], mh['cola'], mh['padre']
    col = 0 if lib == 1 else 1; inv = {v[col]: k for k, v in MAPA.items()}
    pos_f = lambda n: g.reposo[n][:3, 3]
    def hijo_fuente(n):                                   # primer hijo que sea articulación mapeada (o cualquiera)
        i = g.nombre.index(n); cs = [g.nombre[c] for c in g.nodos[i].get('children', []) if g.nombre[c] in g.reposo]
        return cs
    A = {}
    for b, m in MAPA.items():
        f = m[col]; h = m[2]
        if f not in g.reposo: continue
        if h is None: A[b] = np.eye(3); continue
        L = b[-1]
        if h == 'MANO':                                   # dirección muñeca->dedo medio y través índice->meñique
            fm, fi, fp = [MAPA['finger%d-1.%s' % (n, L)][col] for n in (3, 2, 5)]
            Fs = marco(pos_f(fm) - pos_f(f), pos_f(fp) - pos_f(fi)); Ft = marco(cab['finger3-1.' + L] - cab[b], cab['finger5-1.' + L] - cab['finger2-1.' + L]); A[b] = Fs @ Ft.T; continue
        if h == 'PIE':
            ft = MAPA['foot.' + L][col]; hs = hijo_fuente(ft); ds = pos_f(hs[0]) - pos_f(ft) if hs else np.array([0, -0.3, 1.0])
            dt = cab['toe3-1.' + L] - cab[b]; Fs = marco(ds, np.array([1.0, 0, 0])); Ft = marco(dt, np.array([1.0, 0, 0])); A[b] = Fs @ Ft.T; continue
        if h == 'COLA':
            hs = hijo_fuente(f); dt = cola[b] - cab[b]
            A[b] = rmin(dt, pos_f(hs[0]) - pos_f(f)) if hs else A[b[:-3] + '2' + b[-2:]]; continue
        fh = MAPA[h][col] if h in MAPA else None
        A[b] = rmin(cab[h] - cab[b], pos_f(fh) - pos_f(f))
    nb = len(H); ix = {b: i for i, b in enumerate(H)}; Dm = np.zeros((F, nb, 3, 3)); Dm[:] = np.eye(3); libre = np.zeros(nb, bool)
    fr = MAPA['root'][col]; alto_f = pos_f(fr)[1]; k = cab['root'][1] / alto_f
    for b in H:
        if b in A:
            f = MAPA[b][col]; R0 = orto(g.reposo[f][:3, :3]); Rt = np.stack([orto(x) for x in W[f][:, :3, :3]]); Dm[:, ix[b]] = Rt @ R0.T @ A[b]; libre[ix[b]] = True
    raiz = cab['root'] + (W[fr][:, :3, 3] - pos_f(fr)) * k
    return Dm, libre, raiz, dur

def fk(mh, D, libre, raiz):
    """Propaga los giros a los huesos que siguen a su padre y coloca la cabeza de cada hueso."""
    H = mh['huesos']; cab, padre = mh['cab'], mh['padre']; ix = {b: i for i, b in enumerate(H)}; P = np.zeros(D.shape[:2] + (3,))
    for b in H:
        i = ix[b]; p = padre[b]
        if p is None: P[:, i] = raiz; continue
        j = ix[p]
        if not libre[i]: D[:, i] = D[:, j]
        P[:, i] = P[:, j] + np.einsum('fij,j->fi', D[:, j], cab[b] - cab[p])
    return P
