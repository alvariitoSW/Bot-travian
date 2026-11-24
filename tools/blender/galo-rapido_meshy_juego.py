"""AL2 · paso B: el galo rápido de Meshy, ya aligerado (paso A), metido en el juego como soldado «galo-rapido».

Copia de tools/blender/hastatus_meshy_juego.py (FA2-R). Cambia: SIN armas ni escudo (se ponen por código), texturas más
pequeñas (cuidar los KB) y el teñido: solo la túnica (decisión del usuario, 23/11: «color b»), elegida por altura en la
malla (entre cinturón y hombros) y no por color, porque túnica y pantalones son del mismo verde oliva. Los pantalones a
cuadros quedan con su color de Meshy.

Origen y licencias:
- Cuerpo, ropa y pelo: modelo generado por el usuario con Meshy (meshy.ai), plan de pago, MS2 «galo rápido, 2.º intento»
  (refine 01a20a86-e8e0-717d-b1bc-1fdc351c7609). Publicado como CC BY-SA 3.0 citando a Meshy como herramienta (decisión
  del usuario, 23/11). Aligerado y dotado del esqueleto del juego por tools/blender/galo-rapido_meshy_ligero.py (paso A).
  El modelo original NO se guarda en el repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman 1.3.2 (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A (cuerpo en u <= 0,75 del atlas).
 2. Da la vuelta a los triángulos que el aligerado dejó del revés.
 3. Fino y lejos: pone las manos de MakeHuman desde la muñeca (en lejos, con el puño ya cerrado), teñidas al tono de Meshy.
 4. Guarda assets/soldados/galo-rapido[_nivel].bin/.json y _color/_normal/_orm/_masc.webp.

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/galo-rapido_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo]
Todo junto (paso A etapa 2 + paso B): tools/blender/galo-rapido_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'galo-rapido'
NIVS = ARG.get('niveles', 'fino,lejos,muylejos,fondo').split(',')
assert os.path.isfile(os.path.join(ENT, 'ligero_fino.npz')), 'falta entrada=<carpeta del paso A con ligero_*.npz>'
TMP = os.path.join(ENT, 'pasoB'); os.makedirs(TMP, exist_ok=True)
os.environ.setdefault('MH_DATOS', '/opt/aqvila-taller/mhdata')
CONS = os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'); sys.path.insert(0, CONS)
sys.argv = [sys.argv[0], '--salida=' + TMP]                     # construir.py lee --salida= al importarse
import mh, anim, poses, exportar as X, piezas as Z, ropa
import construir as K, texturas as TX
from PIL import Image
U0 = 0.75                                                       # el cuerpo de Meshy ocupa u <= 0,75

def empaquetar_franja(pz, lado):
    """Estantes en la franja derecha del atlas (x > 0,75·lado), como el falangita. Pone p['uvpx'] y p['rect']."""
    x0 = int(U0 * lado) + 6; W = lado - x0 - 4; H = lado - 8; d = 1500.0
    while True:
        tam = [(max(6, int(p['tam'][0] * d * p['prio'])), max(6, int(p['tam'][1] * d * p['prio']))) for p in pz]
        orden = sorted(range(len(pz)), key=lambda i: -tam[i][1]); pos = [None] * len(pz); x = y = 0; alto = 0; ok = True
        for i in orden:
            w, h = tam[i]
            if w > W: ok = False; break
            if x + w > W: x = 0; y += alto + 5; alto = 0
            if y + h > H: ok = False; break
            pos[i] = (x0 + x, 4 + y); x += w + 5; alto = max(alto, h)
        if ok: break
        d *= 0.97
    for p, (px, py), (w, h) in zip(pz, pos, tam): p['uvpx'] = np.array([px, py]) + p['UV'] * [w, h]; p['rect'] = (px, py, w, h)
    return d
#        nivel      sufijo       lod    muy    fondo  lado  tope (triángulos), manos (objetivo MakeHuman)
NIVEL = {'fino': ('', False, False, False, 2048, 9000, 900), 'lejos': ('_lejos', True, False, False, 1024, 2900, 240),
         'muylejos': ('_muylejos', True, True, False, 512, 760, 0), 'fondo': ('_fondo', True, True, True, 512, 360, 0)}
# AL2: texturas más pequeñas que el hastatus (≈400–600 KB por soldado). (lado, calidad webp)
SALIDA = {'fino': dict(color=(1024, 74), normal=(512, 70), orm=(256, 70), masc=(512, 85)), 'lejos': dict(color=(512, 74), normal=(256, 68), orm=(128, 70), masc=(256, 85)),
          'muylejos': dict(color=(256, 78), normal=(128, 70), orm=(64, 70), masc=(128, 85)), 'fondo': dict(color=(256, 76), normal=(64, 70), orm=(64, 70), masc=(128, 85))}
TELA_GALA = np.array([0x5a, 0x7a, 0x4a]) / 255                # telas[1] de PUEBLOS.galo (js/gfx/soldado.js): con ella sale el verde de Meshy
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def tunica_a_gris(col, x0, P, T, UV):
    """AL2: túnica de Meshy -> gris con su sombreado + máscara de tela (canal R). El juego hace color·tela·2,2 (en lineal).
    Zona: triángulos del cuerpo entre el cinturón (y 1,05) y los hombros (1,49), |x| < 0,26, en reposo. Dentro, fuera la piel
    y el bronce del colgante (verde/rojo < 0,8). Se pinta la zona en el atlas y se ensancha 2 px para cubrir los bordes."""
    from PIL import ImageDraw, ImageFilter
    L = col.shape[0]; c3 = P[T].mean(1); sel = (c3[:, 1] > 1.05) & (c3[:, 1] < 1.49) & (np.abs(c3[:, 0]) < 0.26)
    z = Image.new('L', (L, L), 0); dr = ImageDraw.Draw(z)
    for t in T[sel]: dr.polygon([(UV[i, 0] * L, (1 - UV[i, 1]) * L) for i in t], fill=255)
    z = np.asarray(z.filter(ImageFilter.MaxFilter(5)), np.float32) / 255; z[:, x0:] = 0
    r, g = col[..., 0], col[..., 1]; k = z * np.clip((g / np.maximum(r, 1e-3) - 0.80) / 0.06, 0, 1)
    t = lin(TELA_GALA); cl = lin(col); gl = np.clip((cl @ t) / (t @ t) / 2.2, 0, 1)
    gris = srgb(gl)[..., None] * np.ones(3); col[:] = col * (1 - k[..., None]) + gris * k[..., None]
    return k.astype(np.float32)

MUESTRA = {k: [[0, 1]] for k in ('quieto', 'quieto2', 'quieto3', 'andar', 'correr', 'guardia', 'lanzar', 'golpear', 'cubrirse', 'encajar', 'morir')}   # solo el cuerpo (conj. 0)


def soldado(nivel, m):
    suf, lod, muy, fondo, lado, tope, manos = NIVEL[nivel]
    util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); d = np.load(os.path.join(ENT, 'ligero_%s.npz' % nivel))
    hn = [str(h) for h in d['huesos']]; mapa = np.array([util.index(h) for h in hn]); Pm, Nm, UVm, Tm, SIm, SWm = d['P'].astype(float), d['N'].astype(float), d['UV'].astype(float), d['T'].astype(int), mapa[d['idx']], d['w'].astype(float)
    fn = np.cross(Pm[Tm[:, 1]] - Pm[Tm[:, 0]], Pm[Tm[:, 2]] - Pm[Tm[:, 0]]); rev = (fn * Nm[Tm].sum(1)).sum(1) < 0; Tm[rev] = Tm[rev][:, ::-1]   # del revés -> al derecho
    hw = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if any(s in h for s in ('wrist', 'finger', 'metacarpal'))]) for k in range(4))
    col_m = np.asarray(Image.open(os.path.join(ENT, 'color_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    px = lambda uv, N: np.clip((uv * N).astype(int), 0, N - 1)
    eq = []                                                    # AL2: sin armas ni escudo (se ponen por código)
    pieles = []
    if manos:                                                  # manos de MakeHuman desde la muñeca
        Tm = Tm[hw[Tm].mean(1) < 0.5]; obj = min(manos, tope - len(Tm) - sum(len(p['T']) for p in eq))
        mano = B.g('wrist', 'finger', 'metacarpal'); pieles = K.piel(m, B, mano < 0.35, obj, nombre='piel_mano')
        if lod:                                                # de lejos, puño ya cerrado en la malla (como construir.py)
            utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
            A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
            for p in pieles:
                p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
    pz = pieles + eq; x0 = int(U0 * lado)
    if pz:
        empaquetar_franja(pz, lado); TX.RELIEVE_MAX = 1024; tmp = os.path.join(TMP, QUIEN + suf); TX.pintar(pz, lado, tmp, m)
        lee = lambda k: np.asarray(Image.open(tmp + '_%s.webp' % k).convert('RGB').resize((lado, lado), Image.LANCZOS), np.float32) / 255
        cE, nE, oE, mE = lee('color'), lee('normal'), lee('orm'), lee('masc')
    else:                                                      # muylejos y fondo: sin piezas, franja neutra
        cE = np.full((lado, lado, 3), 0.5, np.float32); nE = np.zeros_like(cE) + [0.5, 0.5, 1.0]; oE = np.zeros_like(cE) + [1.0, 0.6, 0.0]; mE = np.zeros_like(cE)
    # ---- atlas: cuerpo de Meshy (u <= 0,75) + franja pintada (u > 0,75)
    if pieles:                                                  # tono de piel: AL2, el del antebrazo (en las muñecas lleva aros de bronce)
        ante = np.isin(d['idx'][:, 0], [i for i, h in enumerate(hn) if h.startswith('lowerarm01')]) & (d['w'][:, 0] > 0.6)
        uvm = UVm[ante] * [1, -1] + [0, 1]
        ref =col_m[px(uvm[:, 1], lado), px(uvm[:, 0], lado)].mean(0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    mt = np.zeros_like(col_m); mt[..., 0] = tunica_a_gris(col_m, x0, Pm, Tm, UVm)   # AL2: tinte de bando solo en la túnica
    nm = np.asarray(Image.open(os.path.join(ENT, 'normal_%s.png' % nivel)).convert('RGB'), np.float32) / 255; nm[..., 1] = 1 - nm[..., 1]   # como el falangita
    om = np.asarray(Image.open(os.path.join(ENT, 'orm_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    out = {}
    for k, cuerpo, franja in (('color', col_m, cE), ('normal', nm, nE), ('orm', om, oE), ('masc', mt, mE)):
        im = cuerpo.copy(); im[:, x0:] = franja[:, x0:]; img = Image.fromarray(np.clip(im * 255 + 0.5, 0, 255).astype(np.uint8))
        t, cal = SALIDA[nivel][k]
        if t != lado: img = img.resize((t, t), Image.LANCZOS)
        nombre = QUIEN + suf + '_%s.webp' % k; img.save(os.path.join(SAL, nombre), quality=cal, method=6); out[k] = nombre
    # ---- malla
    ix = {b: i for i, b in enumerate(util)}; M = X.Malla()
    M.pon('cuerpo', Pm, Nm, UVm * [1, -1] + [0, 1], SIm, SWm, Tm, 0)
    for p in pz:
        si, sw = p['W'] if p['W'] is not None else (ix[p['hueso']], 1.0)
        M.pon(p['nombre'].rstrip('0123456789LR'), p['P'], p['N'], p['uvpx'] / lado, si, sw, p['T'], p['conj'])
    clips = K.movimientos(m, util, K.CFG_HASTATUS)
    j = X.guardar(os.path.join(SAL, QUIEN + suf), M, clips, util, dict(texturas=out, muestra=MUESTRA), juego='escudo')
    kb = sum(os.path.getsize(os.path.join(SAL, QUIEN + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum()), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for n in NIVS: soldado(n, m)
