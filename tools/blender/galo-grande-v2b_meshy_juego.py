"""AL10 · paso B: el galo grande v2b de Meshy, ya aligerado (paso A), metido en el juego como soldado.
Copia de tools/blender/hastatus_meshy_juego.py (FA2-R), SIN armas ni escudo: el juego los pone por código.

Origen y licencias:
- Cuerpo, ropa y adornos: modelo generado por el usuario con Meshy (meshy.ai), plan de pago, refine
  01a20a79-d04a-75f0-b92b-1d9e329f50f4. Se publica como CC BY-SA 3.0 citando a Meshy como herramienta.
  Aligerado y con el esqueleto del juego por tools/blender/galo-grande-v2b_meshy_ligero.py. El original NO va al repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A.
 2. Da la vuelta a los triángulos del revés.
 3. Fino y lejos: manos de MakeHuman desde la muñeca (en lejos, puño cerrado), teñidas al tono de Meshy.
 4. Botas: las de Meshy llevan cordones modernos. Se repintan a cuero liso (color difuminado hacia un pardo de
    cuero, relieve aplanado, más áspero). Zona: triángulos por debajo de 0,19 m en reposo.
 5. Tinte de bando: los cuadros azules de la falda se detectan por su color, pasan a gris y van al canal de tela (R)
    de la máscara. Con la paleta gala (telas[0] = #3f5f7a) sale el azul de Meshy; con las otras telas galas, verde, ocre…
    Los cuadros amarillos no se tiñen.
 6. Guarda assets/soldados/galo-grande-v2b[_nivel].bin/.json y _color/_normal/_orm/_masc.webp (texturas pequeñas: peso).

Uso (source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/galo-grande-v2b_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=...]
Todo junto: tools/blender/galo-grande-v2b_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'galo-grande-v2b'
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
NIVEL = {'fino': ('', False, False, False, 2048, 8400, 600), 'lejos': ('_lejos', True, False, False, 1024, 2850, 250),
         'muylejos': ('_muylejos', True, True, False, 512, 800, 0), 'fondo': ('_fondo', True, True, True, 512, 380, 0)}
SALIDA = {'fino': dict(color=(1024, 66), normal=(512, 70), orm=(256, 70), masc=(256, 85)), 'lejos': dict(color=(512, 72), normal=(256, 68), orm=(128, 70), masc=(128, 85)),
          'muylejos': dict(color=(256, 78), normal=(128, 70), orm=(128, 70), masc=(128, 85)), 'fondo': dict(color=(256, 76), normal=(128, 70), orm=(128, 70), masc=(128, 85))}
TELA_GALA = np.array([0x3f, 0x5f, 0x7a]) / 255                 # telas[0] de la paleta «galo» en js/gfx/soldado.js
CUERO = np.array([0.36, 0.24, 0.15])                            # pardo de cuero liso para las botas (sRGB)
Y_BOTA = 0.19                                                   # altura (m, reposo) por debajo de la cual todo es bota

UMBRAL = (1.15, 0.20)                                           # azul/rojo: desde dónde empieza a teñir y en cuánto llega a 1
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def falda_a_gris(col, x0, fuera):
    """Cuadros azules de la falda (u <= 0,75) -> gris con su sombreado + máscara de tela. El juego hace color·tela·2,2 (en lineal).
    «fuera»: píxeles que no son falda (botas), sin tinte."""
    c = col[:, :x0]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    k = np.clip((b / np.maximum(r, 1e-3) - UMBRAL[0]) / UMBRAL[1], 0, 1) * np.clip((g / np.maximum(r, 1e-3) - 1.0) / 0.12, 0, 1) * np.clip((b - 0.06) / 0.06, 0, 1) * (1 - fuera[:, :x0])
    t = lin(TELA_GALA); cl = lin(c); gl = np.clip((cl @ t) / (t @ t) / 2.2, 0, 1)   # gris que, teñido de rojo romano, da el rojo de Meshy
    gris = srgb(gl)[..., None] * np.ones(3); c[:] = c * (1 - k[..., None]) + gris * k[..., None]
    m = np.zeros(col.shape[:2], np.float32); m[:, :x0] = k; return m

from PIL import ImageDraw, ImageFilter
def mascara_botas(P, UV, T, lado):
    """Píxeles del atlas que pintan las botas: triángulos con los tres vértices por debajo de Y_BOTA (reposo), algo ensanchados."""
    im = Image.new('L', (lado, lado), 0); dr = ImageDraw.Draw(im); uvp = (UV * [1, -1] + [0, 1]) * lado
    for t in T:
        if (P[t, 1] < Y_BOTA).all(): dr.polygon([tuple(q) for q in uvp[t]], fill=255)
    im = im.filter(ImageFilter.MaxFilter(5)); return np.asarray(im, np.float32) / 255

def repintar_botas(col, nm, om, k, lado):
    """Cordones fuera: el color de la bota se difumina y se lleva a cuero pardo (conserva luz y sombra suaves),
    el relieve se aplana y el cuero se vuelve mate."""
    if k.max() == 0: return
    r = max(2, lado // 200); bl = lambda a: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255
    lum = col @ [0.3, 0.59, 0.11]; lb = bl(lum); ref = np.median(lb[k > 0.5]) if (k > 0.5).any() else 0.4
    nuevo = np.clip(CUERO[None, None] * (0.75 + 0.25 * lb / max(ref, 1e-3))[..., None], 0, 1)
    kk = k[..., None]; col[:] = col * (1 - kk) + nuevo * kk
    nm[:] = nm * (1 - 0.8 * kk) + np.array([0.5, 0.5, 1.0]) * 0.8 * kk
    om[..., 1] = om[..., 1] * (1 - k) + 0.75 * k; om[..., 2] *= (1 - k)

def soldado(nivel, m):
    suf, lod, muy, fondo, lado, tope, manos = NIVEL[nivel]
    util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); d = np.load(os.path.join(ENT, 'ligero_%s.npz' % nivel))
    hn = [str(h) for h in d['huesos']]; mapa = np.array([util.index(h) for h in hn]); Pm, Nm, UVm, Tm, SIm, SWm = d['P'].astype(float), d['N'].astype(float), d['UV'].astype(float), d['T'].astype(int), mapa[d['idx']], d['w'].astype(float)
    fn = np.cross(Pm[Tm[:, 1]] - Pm[Tm[:, 0]], Pm[Tm[:, 2]] - Pm[Tm[:, 0]]); rev = (fn * Nm[Tm].sum(1)).sum(1) < 0; Tm[rev] = Tm[rev][:, ::-1]   # del revés -> al derecho
    hw = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if any(s in h for s in ('wrist', 'finger', 'metacarpal'))]) for k in range(4))
    col_m = np.asarray(Image.open(os.path.join(ENT, 'color_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    px = lambda uv, N: np.clip((uv * N).astype(int), 0, N - 1)
    eq = []                                                    # sin armas ni escudo: los pone el juego por código
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
    else:                                                       # muylejos y fondo: franja vacía
        cE = np.full((lado, lado, 3), 0.5, np.float32); nE = np.tile(np.array([0.5, 0.5, 1.0], np.float32), (lado, lado, 1)); oE = np.tile(np.array([1.0, 0.6, 0.0], np.float32), (lado, lado, 1)); mE = np.zeros((lado, lado, 3), np.float32)
    if pieles:                                                  # tono de piel: el de los brazos desnudos de Meshy (sus muñecas llevan brazaletes de cuero rojo)
        ua = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if 'upperarm' in h or 'lowerarm' in h]) for k in range(4))
        uvm = UVm[ua > 0.7] * [1, -1] + [0, 1]; cs = col_m[px(uvm[:, 1], lado), px(uvm[:, 0], lado)]
        piel = cs[(cs[:, 0] > cs[:, 1] * 1.12) & (cs[:, 1] > cs[:, 2] * 1.05) & (cs[:, 0] - cs[:, 2] > 0.15) & (cs[:, 0] < cs[:, 1] * 1.7)]   # solo texeles color carne
        ref = np.median(piel if len(piel) > 20 else cs, 0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    nm = np.asarray(Image.open(os.path.join(ENT, 'normal_%s.png' % nivel)).convert('RGB'), np.float32) / 255; nm[..., 1] = 1 - nm[..., 1]   # como el falangita
    om = np.asarray(Image.open(os.path.join(ENT, 'orm_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    bota = mascara_botas(Pm, UVm, Tm, lado)
    repintar_botas(col_m, nm, om, bota, lado)
    mt = np.zeros_like(col_m); mt[..., 0] = falda_a_gris(col_m, x0, bota)        # tinte de tela solo en los cuadros azules
    if ARG.get('depurar'): Image.fromarray((mt[..., 0] * 255).astype(np.uint8)).save(os.path.join(TMP, 'tinte_%s.png' % nivel)); Image.fromarray((bota * 255).astype(np.uint8)).save(os.path.join(TMP, 'bota_%s.png' % nivel))
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
    clips = K.movimientos(m, util, K.CFG_HASTATUS)                # mismos movimientos «escudo» que el galo de hoy
    j = X.guardar(os.path.join(SAL, QUIEN + suf), M, clips, util, dict(texturas=out, muestra=K.MUESTRA_HASTATUS), juego='escudo')
    kb = sum(os.path.getsize(os.path.join(SAL, QUIEN + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum()), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for n in NIVS: soldado(n, m)
