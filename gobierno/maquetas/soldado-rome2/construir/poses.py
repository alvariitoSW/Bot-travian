"""Posturas añadidas a los movimientos: puños que agarran, brazo del escudo y brazo del pilum (por cinemática inversa).
Todo en «giros desde el reposo»."""
import numpy as np
from anim import eje, marco, rmin, fk

def mano(m, L):
    """Marco de la mano en reposo: centro del agarre, eje del agarre (índice->meñique), dorso y dedos->muñeca."""
    c = m['cab']; w = c['wrist.' + L]; d = c['finger3-1.' + L] - w; d /= np.linalg.norm(d); tr = c['finger5-1.' + L] - c['finger2-1.' + L]; tr -= d * (tr @ d); tr /= np.linalg.norm(tr)
    n = np.cross(d, tr); curva = m['cola']['finger3-3.' + L] - c['finger3-1.' + L]; curva -= d * (curva @ d)
    palma = n if n @ curva > 0 else -n
    centro = (c['finger2-1.' + L] + c['finger5-1.' + L]) / 2 + palma * 0.027 - d * 0.010
    X = tr; N = -palma; Y = np.cross(N, X); return dict(c=centro, X=X, Y=Y, N=N, d=d, palma=palma, F=np.stack([X, Y, N], 1))

def punos(m, D, libre, lados='LR', cierre=1.0):
    ix = {b: i for i, b in enumerate(m['huesos'])}
    for L in lados:
        h = mano(m, L); w = ix['wrist.' + L]
        s = 1.0 if (np.cross(h['d'], h['palma']) @ h['X']) > 0 else -1.0   # sentido que lleva los dedos hacia la palma
        for n in (2, 3, 4, 5):
            for k, ang in ((1, 70), (2, 155), (3, 205)):
                i = ix['finger%d-%d.%s' % (n, k, L)]; D[:, i] = D[:, w] @ eje(h['X'] * s, np.radians(ang * cierre * (1.0 + 0.04 * (n - 3)))); libre[i] = True
        t0 = m['cab']['finger1-2.' + L] - m['cab']['finger1-1.' + L]; obj = 0.80 * h['X'] + 0.50 * h['palma'] + 0.30 * h['d']; R = rmin(t0, obj)   # pulgar: cruza sobre los dedos
        for k in (1, 2, 3):
            i = ix['finger1-%d.%s' % (k, L)]; D[:, i] = D[:, w] @ (eje(np.cross(obj, h['palma']) * 0 + h['d'], np.radians(0)) @ R if cierre > 0.5 else np.eye(3)); libre[i] = True

def torcer(Dp, Dh, eje_r):
    """Media torsión del hijo sobre el eje del padre (para el segundo hueso del antebrazo)."""
    out = Dp.copy()
    for f in range(len(Dp)):
        R = Dp[f].T @ Dh[f]; a = eje_r; b = np.cross(a, [0.3, 0.5, 0.8]); b /= np.linalg.norm(b); rb = R @ b; rb -= a * (rb @ a); n = np.linalg.norm(rb)
        if n < 1e-6: continue
        ang = np.arctan2(np.cross(b, rb / n) @ a, b @ (rb / n)); out[f] = Dp[f] @ eje(a, ang * 0.5)
    return out

def brazo(m, D, libre, raiz, L, objetivo, Rmano, polo, peso=None, torso='spine02'):
    """Lleva la mano L al punto «objetivo» (en coordenadas de reposo, pegado al torso) con la orientación Rmano.
    polo: hacia dónde apunta el codo (en reposo, relativo al torso). peso (F,) mezcla con el movimiento original."""
    ix = {b: i for i, b in enumerate(m['huesos'])}; c = m['cab']; P = fk(m, D, libre, raiz); F = len(D); it = ix[torso]
    iu, iu2, il, il2, iw = [ix[k + '.' + L] for k in ('upperarm01', 'upperarm02', 'lowerarm01', 'lowerarm02', 'wrist')]
    s0, e0, w0 = c['upperarm01.' + L], c['lowerarm01.' + L], c['wrist.' + L]; L1 = np.linalg.norm(e0 - s0); L2 = np.linalg.norm(w0 - e0)
    Fu = marco(e0 - s0, w0 - e0); Ff = marco(w0 - e0, e0 - s0); h = mano(m, L)
    obj = np.broadcast_to(np.asarray(objetivo, float), (F, 3)); Rm = np.broadcast_to(np.asarray(Rmano, float), (F, 3, 3)); pol = np.broadcast_to(np.asarray(polo, float), (F, 3))
    Dn = D.copy()
    for f in range(F):
        fw = D[f, it] @ np.array([0.0, 0, 1]); T = eje([0, 1, 0], np.arctan2(fw[0], fw[2])) if abs(fw[1]) < 0.985 else D[f, it]; s = P[f, iu]; Dw = T @ Rm[f]
        # el objetivo es para el centro del agarre: la muñeca queda donde le toque
        g = P[f, it] + T @ (obj[f] - c[torso]); wr = g - Dw @ (h['c'] - w0)
        v = wr - s; d = np.linalg.norm(v); d2 = min(d, (L1 + L2) * 0.985); v = v / d; a = (L1 * L1 - L2 * L2 + d2 * d2) / (2 * d2); r = np.sqrt(max(L1 * L1 - a * a, 1e-9))
        pp = T @ pol[f]; pp = pp - v * (pp @ v); pp /= np.linalg.norm(pp); e = s + v * a + pp * r; wr = s + v * d2
        Dn[f, iu] = marco(e - s, wr - e) @ Fu.T; Dn[f, il] = marco(wr - e, e - s) @ Ff.T; Dn[f, iw] = Dw
    if peso is not None:                                                    # mezcla sencilla (renormalizada) con el original
        k = np.asarray(peso)[:, None, None]
        for i in (iu, il, iw):
            M = D[:, i] * (1 - k) + Dn[:, i] * k; Dn[:, i] = np.stack([np.linalg.svd(x)[0] @ np.linalg.svd(x)[2] for x in M])
    for i in (iu, il, iw): D[:, i] = Dn[:, i]; libre[i] = True
    D[:, iu2] = D[:, iu]; libre[iu2] = True; ej = (w0 - e0) / L2; D[:, il2] = torcer(D[:, il], D[:, iw], ej); libre[il2] = True

def girar_mano(F_reposo, X, N):
    """Giro que lleva el marco de la mano en reposo a: eje del agarre X y dorso N (en el mundo, cuerpo en reposo)."""
    X = np.asarray(X, float); N = np.asarray(N, float); X /= np.linalg.norm(X); N = N - X * (N @ X); N /= np.linalg.norm(N); return np.stack([X, np.cross(N, X), N], 1) @ F_reposo.T
