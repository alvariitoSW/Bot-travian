"""AL7 · quita la cresta del casco del vélite de Meshy (la usa tools/blender/velite_meshy_ligero.py). Ejes del juego: x, y arriba, z adelante; alto 1."""
import numpy as np
def quitar_cresta(P, y0=0.895, y1=0.942, xfin=0.022):
    """P normalizado (alto 1, y arriba). Ajusta un elipsoide al cuenco del casco (sin la franja central) y aplasta
    sobre él lo que sobresale en la franja central (la cresta). Devuelve P nuevo y la máscara de vértices movidos."""
    cab = P[P[:, 1] > 0.80]; cz = np.median(cab[:, 2]); cx = np.median(cab[:, 0])
    S = P[(P[:, 1] > y0) & (P[:, 1] < y1) & (np.abs(P[:, 0] - cx) > xfin)]
    # solo la cara exterior: por sectores de ángulo y altura, el punto más lejano del eje
    ang = np.arctan2(S[:, 0] - cx, S[:, 2] - cz); r = np.hypot(S[:, 0] - cx, S[:, 2] - cz)
    k = (np.floor((ang + np.pi) / (2 * np.pi) * 72).astype(int)) * 1000 + np.floor((S[:, 1] - y0) / 0.004).astype(int)
    o = np.lexsort((-r, k)); _, pri = np.unique(k[o], return_index=True); E = S[o[pri]]
    A = np.c_[E ** 2, E]; c, *_ = np.linalg.lstsq(A, np.ones(len(E)), rcond=None)
    ctr = -c[3:] / (2 * c[:3]); g = 1 + (c[3:] ** 2 / (4 * c[:3])).sum(); ax = np.sqrt(g / c[:3])
    q = (P - ctr) / ax; rho = np.linalg.norm(q, axis=1)
    mov = (P[:, 1] > 0.86) & (np.abs(P[:, 0] - cx) < xfin + 0.006) & (rho > 1.0) & (P[:, 1] > ctr[1])
    P2 = P.copy(); P2[mov] = ctr + q[mov] / rho[mov, None] * ax * 1.002
    return P2, mov, dict(centro=ctr.round(4).tolist(), semiejes=ax.round(4).tolist(), movidos=int(mov.sum()), puntos_ajuste=len(E))

def quitar_cola(P, ytop, ybajo=0.83, xfin=0.022):
    mov = np.zeros(len(P), bool)
    """La cola de la cresta baja por la nuca: en cada franja de altura, lo de la franja central que asoma por detrás de
    la nuca (casco o pelo a los lados) se pega a ella."""
    P2 = P.copy(); n = 0
    for y in np.arange(ybajo, ytop, 0.003):
        f = (P[:, 1] >= y) & (P[:, 1] < y + 0.003)
        lado = f & (np.abs(P[:, 0]) > xfin) & (np.abs(P[:, 0]) < xfin + 0.02)
        if lado.sum() < 10: continue
        zl = np.percentile(P[lado, 2], 1)
        sel = f & (np.abs(P[:, 0]) < xfin + 0.006) & (P[:, 2] < zl)
        P2[sel, 2] = zl; n += sel.sum(); mov[sel] = True
    return P2, n, mov


def pintar_cresta(me, mov, imagenes, dentro):
    """Pinta en las texturas del GLB las caras de la cresta (todas sus esquinas movidas) con la mediana de las caras del
    cuenco (máscara «dentro» por vértice): la raya que queda arriba y en la nuca sale del color y brillo del casco."""
    import numpy as np
    from PIL import Image, ImageDraw
    nl = len(me.loops); uv = np.zeros(nl * 2); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    lv = np.zeros(nl, int); me.loops.foreach_get('vertex_index', lv)
    ls = np.zeros(len(me.polygons), int); me.polygons.foreach_get('loop_start', ls); lt = np.zeros(len(me.polygons), int); me.polygons.foreach_get('loop_total', lt)
    cres = [i for i in range(len(ls)) if mov[lv[ls[i]:ls[i] + lt[i]]].all()]
    cuen = [i for i in range(len(ls)) if dentro[lv[ls[i]:ls[i] + lt[i]]].all()]
    for im in imagenes:
        W, H = im.size; a = np.empty(W * H * 4, np.float32); im.pixels.foreach_get(a); a = a.reshape(H, W, 4)
        q = np.concatenate([uv[ls[i]:ls[i] + lt[i]] for i in cuen]); px = np.clip((q * [W, H]).astype(int), 0, [W - 1, H - 1])
        ref = np.median(a[px[:, 1], px[:, 0]], 0)
        msk = Image.new('L', (W, H), 0); d = ImageDraw.Draw(msk)
        for i in cres: d.polygon([(u * W, v * H) for u, v in uv[ls[i]:ls[i] + lt[i]]], fill=255, outline=255)
        from PIL import ImageFilter
        m = np.asarray(msk.filter(ImageFilter.MaxFilter(5)), np.float32) / 255
        a = a * (1 - m[..., None]) + ref * m[..., None]; im.pixels.foreach_set(a.ravel())
    return len(cres), len(cuen)
