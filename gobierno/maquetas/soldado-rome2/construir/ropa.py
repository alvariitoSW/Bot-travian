"""Ropa ceñida al cuerpo: sale de las mallas auxiliares de MakeHuman («tights» y «skirt», CC0), que ya traen
sus pesos, así que se dobla con el cuerpo. Aquí se recortan, se engordan y se les da forma."""
import numpy as np, exportar as X, geo
from piezas import pieza, MAT, desenrollar, suavizar, TAU

class Base:
    def __init__(s, mh, util, a):
        s.mh = mh; s.util = util; V = mh['V']; s.V = V; nv = len(V); s.Wd = np.zeros((nv, len(util)))
        for b, w in mh['W'].items(): s.Wd[:, a[b]] += w
        s.Wd /= np.maximum(s.Wd.sum(1, keepdims=True), 1e-9)
        def tri(g):
            T = []
            for f, gg in zip(mh['F'], mh['G']):
                if gg == g:
                    k = [p[0] for p in f]
                    for i in range(1, len(k) - 1): T.append([k[0], k[i], k[i + 1]])
            return np.array(T)
        s.Tt = tri('helper-tights'); s.Ts = tri('helper-skirt'); s.Nt = np.zeros((nv, 3)); tv = np.unique(s.Tt); m = -np.ones(nv, int); m[tv] = np.arange(len(tv)); s.Nt[tv] = X.normales(V[tv], m[s.Tt], True)
        s.sv = np.unique(s.Ts); c = mh['cab']
        s.brazo = {L: (c['upperarm01.' + L], c['lowerarm01.' + L] - c['upperarm01.' + L]) for L in 'LR'}
    def g(s, *nombres, lado=None):
        cols = [i for i, b in enumerate(s.util) if any(n in b for n in nombres) and (lado is None or b.endswith('.' + lado))]; return s.Wd[:, cols].sum(1)
    def sbrazo(s, L):
        o, d = s.brazo[L]; return (s.V - o) @ d / (d @ d)
    def w4(s, Wd):
        idx = np.argsort(-Wd, 1)[:, :4]; w = np.take_along_axis(Wd, idx, 1); return idx, w / w.sum(1, keepdims=True)

    def cascara(s, nombre, sel, grosor, mat, centro, eje, ref, suav=0, prio=1.0, tinte=0, aux=None, extra=None):
        """Trozo de «tights» (vértices sel) engordado «grosor» (número o por vértice) y desenrollado alrededor de un eje."""
        T = s.Tt[sel[s.Tt].all(1)]; vs = np.unique(T); m = -np.ones(len(s.V), int); m[vs] = np.arange(len(vs)); T = m[T]
        gr = grosor[vs] if not np.isscalar(grosor) else grosor; P = s.V[vs] + s.Nt[vs] * (gr[:, None] if not np.isscalar(gr) else gr)
        if suav:
            borde = np.zeros(len(vs), bool); P = suavizar(P, T, suav, 0.5) + s.Nt[vs] * 0.002 * suav
        if extra is not None: P = extra(P, vs)
        idx, UV, T2 = desenrollar(P, T, centro, eje, ref); P = P[idx]; vs2 = vs[idx]; r = np.linalg.norm((P - centro) - np.outer((P - centro) @ (np.asarray(eje) / np.linalg.norm(eje)), np.asarray(eje) / np.linalg.norm(eje)), axis=1).mean()
        tam = ((UV[:, 0].max() - UV[:, 0].min()) * r, UV[:, 1].max() - UV[:, 1].min()); prm = np.stack([UV[:, 0] * r, UV[:, 1]], 1)
        si, sw = s.w4(s.Wd[vs2]); si = np.asarray(si); p = pieza(nombre, P, T2, UV * [1, -1], mat if np.isscalar(mat) else mat[vs2], tam, W=(si, sw), prm=prm, aux=None if aux is None else aux[vs2], prio=prio, tinte=tinte); p['vs'] = vs2; return p

    def falda(s, nombre, y0, y1, cols, filas, mat, radio=lambda y, t: 1.0, prio=1.0, tinte=0, auxf=None):
        """Faldón entre y0 (arriba) e y1 (abajo), remuestreado de la falda auxiliar. radio(y, ángulo) multiplica el radio."""
        Q = s.V[s.sv]; cx, cz = 0.0, Q[:, 2].mean(); ang = np.arctan2(Q[:, 0] - cx, Q[:, 2] - cz); rad = np.hypot(Q[:, 0] - cx, Q[:, 2] - cz); rm = rad.mean(); W = s.Wd[s.sv]
        P, UV, Wn, PR = [], [], [], []
        for j in range(filas + 1):
            y = y0 + (y1 - y0) * j / filas
            for i in range(cols + 1):
                t = -np.pi + TAU * i / cols; da = np.angle(np.exp(1j * (ang - t))); d2 = (da * rm) ** 2 + ((Q[:, 1] - y) * 1.0) ** 2; k = np.argsort(d2)[:4]; w = 1 / (d2[k] + 1e-6); w /= w.sum()
                r = (rad[k] * w).sum() * radio(y, t); P.append([cx + np.sin(t) * r, y, cz + np.cos(t) * r]); Wn.append((W[k] * w[:, None]).sum(0)); UV.append([i / cols, j / filas]); PR.append([t * rm, y])
        T = []
        for j in range(filas):
            for i in range(cols):
                a = j * (cols + 1) + i; b = a + 1; c = a + cols + 1; d = c + 1; T += [[a, d, b], [a, c, d]]
        Wn = np.array(Wn).reshape(filas + 1, cols + 1, -1)
        for _ in range(4):                                   # pesos más suaves: la tela cuelga, no se pega a cada muslo
            Wn = 0.5 * Wn + 0.25 * (np.roll(Wn, 1, 1) + np.roll(Wn, -1, 1)); Wn[:, -1] = Wn[:, 0]
        Wn = Wn.reshape(-1, Wn.shape[-1]); Wn /= Wn.sum(1, keepdims=True)
        UV = np.array(UV); si, sw = s.w4(Wn); aux = np.stack([UV[:, 1], UV[:, 0]], 1) if auxf is None else auxf(UV)
        return pieza(nombre, np.array(P), np.array(T), UV, mat, (TAU * rm, abs(y0 - y1)), W=(si, sw), prm=np.array(PR), aux=aux, prio=prio, tinte=tinte)
