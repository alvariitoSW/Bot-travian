"""Malla + huesos + movimientos horneados -> un .bin y un .json que lee soldado.js."""
import json, numpy as np

QUITA = ('levator', 'special', 'oris', 'orbicularis', 'risorius', 'temporalis', 'tongue', 'eye', 'toe', 'breast', 'zygomaticus', 'depressor', 'platysma', 'mentalis', 'buccinator', 'jaw', 'oculi', 'procerus', 'nasalis')
def huesos_utiles(mh, sin_dedos=False):
    q = QUITA + (('finger', 'metacarpal') if sin_dedos else ())
    util = [b for b in mh['huesos'] if not any(s in b for s in q)]; a = {}
    for b in mh['huesos']:
        k = b
        while k not in util: k = mh['padre'][k]
        a[b] = util.index(k)
    return util, a

def pesos4(mh, util, a):
    """(nv,4) índices y pesos sobre los huesos útiles."""
    nv = len(mh['V']); M = np.zeros((nv, len(util)))
    for b, w in mh['W'].items(): M[:, a[b]] += w
    s = M.sum(1); M[s == 0, 0] = 1; idx = np.argsort(-M, 1)[:, :4]; w = np.take_along_axis(M, idx, 1); w /= w.sum(1, keepdims=True)
    return idx, w

class Malla:
    def __init__(s): s.P, s.N, s.UV, s.SI, s.SW, s.SET, s.T = [], [], [], [], [], [], []; s.n = 0; s.cuenta = {}
    def pon(s, nombre, P, N, UV, SI, SW, T, conj=0):
        P = np.asarray(P, float); n = len(P); SI = np.asarray(SI); SW = np.asarray(SW, float)
        if SI.ndim == 0: SI = np.tile([int(SI), 0, 0, 0], (n, 1)); SW = np.tile([1.0, 0, 0, 0], (n, 1))
        s.P.append(P); s.N.append(np.asarray(N, float)); s.UV.append(np.asarray(UV, float)); s.SI.append(SI); s.SW.append(SW); s.SET.append(np.full(n, conj)); s.T.append(np.asarray(T, int) + s.n); s.n += n
        s.cuenta[nombre] = s.cuenta.get(nombre, 0) + len(T)
    def junta(s):
        return [np.concatenate(x) for x in (s.P, s.N, s.UV, s.SI, s.SW, s.SET, s.T)]

def normales(P, T, soldar=True):
    """Normales suaves; con soldar=True los vértices en la misma posición (costuras) comparten normal."""
    fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    if soldar:
        _, inv = np.unique(np.round(P, 5), axis=0, return_inverse=True); inv = inv.ravel()
    else: inv = np.arange(len(P))
    acc = np.zeros((inv.max() + 1, 3))
    for k in range(3): np.add.at(acc, inv[T[:, k]], fn)
    n = acc[inv]; l = np.linalg.norm(n, axis=1, keepdims=True); return n / np.maximum(l, 1e-12)

def hornear(D, P, mh, util):
    """Matrices de piel 3x4 por hueso útil: [D | p - D·reposo]. Devuelve (F, nb, 12) por filas."""
    ix = [mh['huesos'].index(b) for b in util]; r = np.stack([mh['cab'][b] for b in util]); Dk = D[:, ix]; t = P[:, ix] - np.einsum('fbij,bj->fbi', Dk, r)
    return np.concatenate([Dk, t[..., None]], -1).reshape(len(D), len(util), 12)

def guardar(ruta, malla, clips, util, extra=None):
    P, N, UV, SI, SW, SET, T = malla.junta(); nv = len(P); partes = []; off = {}; o = 0
    def mete(k, a):
        nonlocal o; b = np.ascontiguousarray(a).tobytes(); pad = (-len(b)) % 4; partes.append(b + b'\0' * pad); off[k] = o; o += len(b) + pad
    mete('pos', P.astype(np.float32)); mete('nor', np.clip(np.round(N * 127), -127, 127).astype(np.int8)); mete('uv', UV.astype(np.float32))
    mete('si', SI.astype(np.uint8)); w = np.round(SW * 255).astype(int); w[:, 0] += 255 - w.sum(1); mete('sw', w.astype(np.uint8)); mete('set', SET.astype(np.uint8))
    mete('idx', T.astype(np.uint32 if nv > 65535 else np.uint16))
    filas = []; cl = {}; f0 = 0
    for nombre, (A, fps, bucle) in clips.items(): cl[nombre] = dict(ini=f0, n=len(A), fps=fps, bucle=bucle); filas.append(A); f0 += len(A)
    A = np.concatenate(filas); nb = A.shape[1]; tex = np.zeros((len(A), nb * 3, 4), np.float16); tex[:] = A.reshape(len(A), nb * 3, 4); mete('anim', tex)
    open(ruta + '.bin', 'wb').write(b''.join(partes))
    j = dict(verts=nv, tris=len(T), huesos=util, cuadros=len(A), clips=cl, off=off, idx32=nv > 65535, piezas=malla.cuenta, **(extra or {}))
    json.dump(j, open(ruta + '.json', 'w'), separators=(',', ':')); return j
