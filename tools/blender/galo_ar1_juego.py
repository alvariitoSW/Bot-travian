"""AR1 · el «Guerrero galo» de las batallas (assets/soldados/galo*), rehecho sobre el galo de Meshy (24/11/2026).

Pedido del usuario (cuadro, pieza soldado:galo): «Haz un guerrero más realista y con tatuajes de la época».
La API de Meshy no admitía encargos ese día («API key credit limit reached»), así que no se generó un modelo nuevo:
se parte del galo grande de Meshy ya aligerado y con esqueleto (AL1, assets/soldados/galo-grande*) y se le añade:
  1. Tatuajes de glasto (azul apagado) en brazos, hombros y pecho: espirales y bandas de estilo La Tène, pintadas en la
     textura en función de la posición 3D (no de las islas UV), así que salen igual en los cuatro niveles.
     Licencia de juego: para los galos continentales de 280-146 a.C. no hay fuente de tatuajes (ver
     gobierno/historia/AR1-galo-marcas.md).
  2. Pelo encalado (Diodoro 5.28): el pelo de la cabeza se aclara a rubio ceniza; la barba no.
  3. El torques de oro, el escudo oval, la lanza, la espada y su vaina del galo de antes (AQVILA, CC0), con sus conjuntos
     (aSet) y su «muestra» y «tiro»: el juego los enseña igual que antes. El torques se ensancha para el cuello de Meshy.
Atlas: mitad izquierda, la textura del cuerpo de Meshy; mitad derecha, la del equipo del galo de antes (solo sus islas).
Máscara: piel (canal verde, tono de piel por soldado) y escudo (canal azul, color del bando), como antes.

Licencias: cuerpo de Meshy (generado por el usuario, plan de pago; se publica CC BY-SA 3.0 citando a Meshy como
herramienta), manos y esqueleto de MakeHuman (CC0), movimientos de Quaternius (CC0), equipo hecho en AQVILA (CC0).
Resultado: CC BY-SA 3.0. Ver assets/soldados/LICENSE.txt.

Uso: python3 tools/blender/galo_ar1_juego.py [equipo=<commit con el galo de antes, por defecto 803e9516>] [salida=assets/soldados]
Lee el galo de antes con «git show <commit>:assets/soldados/galo*», así que se puede repetir aunque ya esté sustituido.
"""
import io, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
COMMIT = ARG.get('equipo', '803e9516'); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); SOL = os.path.join(RAIZ, 'assets', 'soldados')
NIVELES = ['', '_lejos', '_muylejos', '_fondo']
EQUIPO = ('torques', 'escudo_', 'lanza_', 'espada_', 'vaina')


def git(ruta): return subprocess.run(['git', '-C', RAIZ, 'show', COMMIT + ':' + ruta], capture_output=True, check=True).stdout
def bytes_de(nombre, de_git): return git('assets/soldados/' + nombre) if de_git else open(os.path.join(SOL, nombre), 'rb').read()


def leer(nombre, de_git=False):
    j = json.loads(bytes_de(nombre + '.json', de_git)); b = bytes_de(nombre + '.bin', de_git); nv, o = j['verts'], j['off']
    a = lambda k, t, n: np.frombuffer(b, t, n, o[k]).copy()
    d = dict(j=j, P=a('pos', np.float32, nv * 3).reshape(-1, 3), N=a('nor', np.int8, nv * 3).reshape(-1, 3), UV=a('uv', np.float32, nv * 2).reshape(-1, 2),
             SI=a('si', np.uint8, nv * 4).reshape(-1, 4), SW=a('sw', np.uint8, nv * 4).reshape(-1, 4), SET=a('set', np.uint8, nv),
             T=a('idx', np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3).reshape(-1, 3).astype(np.int64))
    d['tex'] = {k: Image.open(io.BytesIO(bytes_de(v, de_git))) for k, v in j['texturas'].items()}
    return d


def rasterizar(UV, T, W, H, P):
    """Texel -> triángulo (-1 vacío) y posición 3D interpolada. v hacia abajo (el juego carga con flipY = false)."""
    tid = -np.ones((H, W), np.int32); pos = np.zeros((H, W, 3), np.float32); px = UV * [W, H]
    for t, (a, b, c) in enumerate(T):
        p = px[[a, b, c]]; x0, y0 = np.maximum(np.floor(p.min(0)).astype(int), 0); x1, y1 = np.minimum(np.ceil(p.max(0)).astype(int), [W - 1, H - 1])
        if x1 < x0 or y1 < y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        den = (p[1, 1] - p[2, 1]) * (p[0, 0] - p[2, 0]) + (p[2, 0] - p[1, 0]) * (p[0, 1] - p[2, 1])
        if abs(den) < 1e-12: continue
        l0 = ((p[1, 1] - p[2, 1]) * (xs - p[2, 0]) + (p[2, 0] - p[1, 0]) * (ys - p[2, 1])) / den
        l1 = ((p[2, 1] - p[0, 1]) * (xs - p[2, 0]) + (p[0, 0] - p[2, 0]) * (ys - p[2, 1])) / den
        l2 = 1 - l0 - l1; m = (l0 >= -0.03) & (l1 >= -0.03) & (l2 >= -0.03)
        if not m.any(): continue
        yy, xx = (ys[m] - 0.5).astype(int), (xs[m] - 0.5).astype(int); tid[yy, xx] = t
        pos[yy, xx] = l0[m, None] * P[a] + l1[m, None] * P[b] + l2[m, None] * P[c]
    return tid, pos


# ---------- dibujos de glasto (en metros, sobre la posición de reposo) ----------
def espiral(u, v, R, vueltas=2.2, ancho=0.16):
    """Espiral de Arquímedes centrada en (0,0), radio R: 1 sobre el trazo, 0 fuera (bordes suaves)."""
    r = np.hypot(u, v); th = np.arctan2(v, u); k = R / vueltas
    f = (r / k - th / (2 * np.pi)) % 1.0; d = np.minimum(f, 1 - f)
    return np.clip(1 - (d - ancho / 2) / 0.06, 0, 1) * (r < R) * np.clip((R - r) / (0.15 * R) + 0.3, 0, 1)


def banda(t, t0, ancho):
    return np.clip(1 - (np.abs(t - t0) - ancho / 2) / 0.002, 0, 1)


def eje_brazo(P, lado):
    """Eje del brazo (lado +1 izquierdo, -1 derecho) entre hombro y codo: PCA de los vértices del brazo."""
    s = (P[:, 0] * lado > 0.2) & (P[:, 1] > 1.0) & (P[:, 1] < 1.4)
    q = P[s]; c = q.mean(0); _, _, vt = np.linalg.svd(q - c); e = vt[0]
    if e[1] < 0: e = -e
    return c, e


def tatuajes(pos, P):
    """Intensidad del tatuaje (0..1) por texel, según su posición 3D."""
    x, y, z = pos[..., 0], pos[..., 1], pos[..., 2]; out = np.zeros(x.shape, np.float32)
    for lado in (1, -1):
        c, e = eje_brazo(P, lado)
        rel = pos - c; t = rel @ e; radial = rel - t[..., None] * e; r = np.linalg.norm(radial, axis=-1)
        ref = np.cross(e, [0, 0, 1.0]); ref /= np.linalg.norm(ref); ref2 = np.cross(e, ref)
        ang = np.arctan2(radial @ ref2, radial @ ref)
        en = (x * lado > 0.17) & (r < 0.09)
        # dos bandas dobles en el brazo, arriba y abajo; entre ellas una fila de espirales
        b = banda(t, 0.05, 0.007) + banda(t, 0.065, 0.004) + banda(t, -0.07, 0.007) + banda(t, -0.085, 0.004)
        n = 3; cel = (ang / (2 * np.pi) * n) % 1.0
        u = (cel - 0.5) * (2 * np.pi * 0.045 / n); v = t + 0.0
        es = espiral(u * lado, v, 0.032, vueltas=1.6, ancho=0.34)
        out = np.maximum(out, np.clip(b + es, 0, 1) * en * (t > -0.095) * (t < 0.075))
        # antebrazo: una fila de puntos alrededor, cerca de la muñeca (dibujo sencillo)
    # pecho: una espiral doble en cada pectoral (vistas de frente), unidas por un arco bajo las clavículas
    fr = z > 0.04
    for lado in (1, -1):
        u = (x - lado * 0.09) * lado; v = y - 1.27
        out = np.maximum(out, espiral(u, v, 0.06, vueltas=1.8, ancho=0.34) * fr * (np.abs(x) < 0.2))
    arco = np.abs(np.hypot(x / 0.14, (y - 1.40) / 0.085) - 1.0) < 0.07
    out = np.maximum(out, arco * fr * (y < 1.40) * (np.abs(x) < 0.13) * 0.9)
    return out


def pintar(color, tid, pos, P):
    C = np.asarray(color.convert('RGB')).astype(np.float32) / 255; dentro = tid >= 0
    r, g, b = C[..., 0], C[..., 1], C[..., 2]; lum = C.mean(-1)
    piel = dentro & (r > 0.33) & (r - g > 0.09) & (g - b > 0.04) & (r < 0.85)
    tat = tatuajes(pos, P) * piel
    tat = np.asarray(Image.fromarray((tat * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255 * piel
    glasto = np.array([0.20, 0.27, 0.40], np.float32)
    C = C * (1 - 0.78 * tat[..., None]) + (glasto * (0.6 + lum[..., None])) * 0.78 * tat[..., None]
    # pelo encalado: cabeza (arriba y detrás), pelo oscuro, no la barba
    x, y, z = pos[..., 0], pos[..., 1], pos[..., 2]
    pelo = dentro & (lum < 0.36) & ~piel & (((y > 1.63) & (z < 0.09)) | ((y > 1.50) & (z < -0.04)) | ((y > 1.58) & (np.abs(x) > 0.07) & (z < 0.05)))
    pelo = np.asarray(Image.fromarray((pelo * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32) / 255 * dentro
    cal = np.array([0.80, 0.74, 0.60], np.float32) * (0.45 + 1.6 * lum[..., None])
    C = C * (1 - 0.7 * pelo[..., None]) + np.clip(cal, 0, 1) * 0.7 * pelo[..., None]
    return Image.fromarray((np.clip(C, 0, 1) * 255 + 0.5).astype(np.uint8)), piel, tat


def mascara_islas(UV, T, W, H, crece=3):
    m = Image.new('L', (W, H), 0); from PIL import ImageDraw; dr = ImageDraw.Draw(m)
    for a, b, c in T: dr.polygon([tuple(UV[i] * [W, H]) for i in (a, b, c)], fill=255)
    return np.asarray(m.filter(ImageFilter.MaxFilter(2 * crece + 1))) > 0


def juntar(izq, der_img, der_islas, modo):
    """Atlas 2:1. izq: imagen del cuerpo (W×H); der: la del galo de antes, a W×H, solo en sus islas; fuera, un color plano."""
    W, H = izq.size; d = der_img.convert(modo).resize((W, H), Image.LANCZOS); a = np.asarray(d).copy()
    isl = np.asarray(Image.fromarray(der_islas.astype(np.uint8) * 255).resize((W, H), Image.NEAREST)) > 0
    if a.ndim == 3: a[~isl] = a[isl].mean(0).astype(a.dtype) if isl.any() else 0
    else: a[~isl] = 0
    out = Image.new(modo, (2 * W, H)); out.paste(izq.convert(modo), (0, 0)); out.paste(Image.fromarray(a), (W, 0)); return out


def escribir(nombre, j, P, N, UV, SI, SW, SET, T):
    nv = len(P); idx32 = nv > 65535; partes = []; off = {}; pos = 0
    def pon(k, arr):
        nonlocal pos
        pad = (-pos) % 4; partes.append(b'\0' * pad); pos += pad; off[k] = pos; bts = arr.tobytes(); partes.append(bts); pos += len(bts)
    pon('pos', P.astype(np.float32)); pon('nor', N.astype(np.int8)); pon('uv', UV.astype(np.float32)); pon('si', SI.astype(np.uint8))
    pon('sw', SW.astype(np.uint8)); pon('set', SET.astype(np.uint8)); pon('idx', T.astype(np.uint32 if idx32 else np.uint16))
    j = dict(j); j.update(verts=nv, tris=len(T), off=off, idx32=idx32)
    open(os.path.join(SAL, nombre + '.bin'), 'wb').write(b''.join(partes))
    json.dump(j, open(os.path.join(SAL, nombre + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))


def nivel(niv):
    B = leer('galo-grande' + niv); E = leer('galo' + niv, de_git=True)
    assert B['j']['huesos'] == E['j']['huesos'] and B['j']['anim'] == E['j']['anim'], 'esqueletos distintos en ' + niv
    # --- triángulos del equipo del galo de antes (por el orden de 'piezas')
    i = 0; tri_eq = []; piezas_eq = {}
    for k, c in E['j']['piezas'].items():
        if k.startswith(EQUIPO): tri_eq.append(np.arange(i, i + c)); piezas_eq[k] = c
        i += c
    tri_eq = np.concatenate(tri_eq); TE = E['T'][tri_eq]; ve = np.unique(TE); mapa = -np.ones(len(E['P']), np.int64); mapa[ve] = np.arange(len(ve))
    Pe, Ne, UVe, SIe, SWe, SETe = (E[k][ve].copy() for k in ('P', 'N', 'UV', 'SI', 'SW', 'SET')); TE = mapa[TE]
    # torques: ensanchado al cuello de Meshy (barba delante, melena detrás: se ve a los lados)
    if 'torques' in piezas_eq:
        o = sum(c for k, c in E['j']['piezas'].items() if list(E['j']['piezas']).index(k) < list(E['j']['piezas']).index('torques') and k.startswith(EQUIPO))
        vt = np.unique(TE[o:o + piezas_eq['torques']])
        c = np.array([0.0, Pe[vt, 1].mean(), (Pe[vt, 2].min() + Pe[vt, 2].max()) / 2])
        Pe[vt, 0] = c[0] + (Pe[vt, 0] - c[0]) * 1.30; Pe[vt, 2] = (Pe[vt, 2] - c[2]) * 1.55 + 0.0; Pe[vt, 1] += -0.025
    # --- cuerpo: tatuajes y pelo en su textura
    col = B['tex']['color']; W, H = col.size
    tid, pos = rasterizar(B['UV'], B['T'], W, H, B['P'])
    col2, piel, tat = pintar(col, tid, pos, B['P'])
    # --- atlas 2:1
    isl_e = mascara_islas(UVe, TE, *E['tex']['color'].size)
    tex = {}
    tex['color'] = juntar(col2, E['tex']['color'], isl_e, 'RGB')
    nW = B['tex']['normal'].size; tex['normal'] = juntar(B['tex']['normal'], E['tex']['normal'], isl_e, 'RGB')
    tex['orm'] = juntar(B['tex']['orm'], E['tex']['orm'], isl_e, 'RGB')
    mz = np.zeros((H, W, 3), np.uint8); mz[..., 1] = (piel * 255).astype(np.uint8)
    em = np.asarray(E['tex']['masc'].convert('RGB')).copy(); em[..., 0] = 0; em[..., 1] = 0          # del equipo, solo el escudo (azul)
    tex['masc'] = juntar(Image.fromarray(mz).resize((W // 2, H // 2), Image.BILINEAR), Image.fromarray(em), isl_e, 'RGB')
    # --- geometría junta (cuerpo, luego equipo)
    UVb = B['UV'] * [0.5, 1.0]; UVe2 = UVe * [0.5, 1.0] + [0.5, 0.0]
    P = np.concatenate([B['P'], Pe]); N = np.concatenate([B['N'], Ne]); UV = np.concatenate([UVb, UVe2])
    SI = np.concatenate([B['SI'], SIe]); SW = np.concatenate([B['SW'], SWe]); SET = np.concatenate([B['SET'], SETe]); T = np.concatenate([B['T'], TE + len(B['P'])])
    nom = 'galo' + niv; texn = {}
    calidad = {'color': 82, 'normal': 80, 'orm': 80, 'masc': 90}
    for k, im in tex.items():
        f = nom + '_' + k + '.webp'; texn[k] = f; im.save(os.path.join(SAL, f), 'WEBP', quality=calidad[k], method=6)
    j = dict(E['j']); j['piezas'] = dict(B['j']['piezas'], **piezas_eq); j['texturas'] = texn; j['origen'] = 'AR1: cuerpo galo-grande (Meshy) con glasto y pelo encalado; equipo del galo de antes'
    escribir(nom, j, P, N, UV, SI, SW, SET, T)
    kb = sum(os.path.getsize(os.path.join(SAL, f)) for f in [nom + '.bin', nom + '.json'] + list(texn.values())) / 1024
    print(f'{nom}: {len(P)} vértices, {len(T)} triángulos (cuerpo {len(B["T"])} + equipo {len(TE)}), texturas {tex["color"].size}, {kb:.0f} KB, texeles tatuados {int((tat > 0.3).sum())}')


if __name__ == '__main__':
    for n in ARG.get('niveles', ','.join(NIVELES)).split(','):
        nivel(n if n in NIVELES else ('' if n == 'fino' else '_' + n))
