"""AL6 · paso B: el jefe galo de Meshy, ya aligerado (paso A, jefe_galo_meshy_ligero.py), metido en el juego como soldado
«jefe-galo» (variante de los galos). Copia el camino del hastatus (hastatus_meshy_juego.py), SIN armas ni escudo: los pone el código.

Origen y licencias:
- Cuerpo, casco con penacho, coraza, capa y faldón: modelo generado por el usuario con Meshy (meshy.ai), plan de pago (la salida
  es suya); el usuario lo publica bajo CC BY-SA 3.0, citando a Meshy como herramienta. Refine 01a20a7f-0b5d-70e4-b039-2918c7b43cf1.
  El modelo original NO se guarda en el repositorio (se vuelve a bajar por su identificador).
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A (cuerpo en u <= 0,75 del atlas).
 2. Da la vuelta a los triángulos que el aligerado dejó del revés.
 3. Fino y lejos: pone las manos de MakeHuman desde la muñeca (en lejos, con el puño ya cerrado), teñidas al tono de Meshy.
 4. Tinte de facción: la capa roja (y lo rojo del faldón) se detecta por su color, pasa a gris con su sombreado y se marca en
    el canal de tela (R) de la máscara; con la paleta gala sale de un color por soldado. El penacho no se tiñe (sigue rojo).
 5. Guarda assets/soldados/jefe-galo[_nivel].bin/.json y _color/_normal/_orm/_masc.webp, con texturas pequeñas (peso).

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/jefe_galo_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo]
Todo junto (paso A etapa 2 + paso B): tools/blender/jefe_galo_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'jefe-galo'
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
NIVEL = {'fino': ('', False, False, False, 2048, 8330, 1500), 'lejos': ('_lejos', True, False, False, 1024, 3546, 320),
         'muylejos': ('_muylejos', True, True, False, 512, 788, 0), 'fondo': ('_fondo', True, True, True, 512, 374, 0)}
SALIDA = {'fino': dict(color=(1024, 72), normal=(512, 66), orm=(256, 62), masc=(256, 80)), 'lejos': dict(color=(512, 72), normal=(256, 62), orm=(128, 60), masc=(128, 80)),   # peso: ≈0,5 MB el soldado
          'muylejos': dict(color=(256, 74), normal=(128, 60), orm=(64, 60), masc=(128, 80)), 'fondo': dict(color=(256, 72), normal=(128, 60), orm=(64, 60), masc=(128, 80))}
TELA_ROMANA = np.array([0x8f, 0x2f, 0x22]) / 255               # TELAS[0] de js/gfx/soldado.js (la paleta romana)

lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def penacho(P, T, UV, lado):
    """Texeles del penacho (triángulos por encima de 1,66 m en reposo): no se tiñen."""
    from PIL import ImageDraw
    im = Image.new('L', (lado, lado), 0); d = ImageDraw.Draw(im); uv = UV * [lado, -lado] + [0, lado]
    for t in T[P[T][:, :, 1].mean(1) > 1.66]: d.polygon([tuple(uv[i]) for i in t], fill=255, outline=255)
    return np.asarray(im, np.float32) / 255

def tunica_a_gris(col, x0, fuera=None):
    """Capa roja de Meshy (u <= 0,75) -> gris con su sombreado + máscara de tela. El juego hace color·tela·2,2 (en lineal)."""
    c = col[:, :x0]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    k = np.clip((0.45 - g / np.maximum(r, 1e-3)) / 0.12, 0, 1) * np.clip((0.62 - b / np.maximum(r, 1e-3)) / 0.12, 0, 1)   # capa granate: más azul que la túnica del romano * np.clip((r - 0.09) / 0.08, 0, 1)
    if fuera is not None: k = k * (1 - fuera[:, :x0])
    t = lin(TELA_ROMANA); cl = lin(c); gl = np.clip((cl @ t) / (t @ t) / 2.2, 0, 1)   # gris que, teñido de rojo romano, da el rojo de Meshy
    gris = srgb(gl)[..., None] * np.ones(3); c[:] = c * (1 - k[..., None]) + gris * k[..., None]
    m = np.zeros(col.shape[:2], np.float32); m[:, :x0] = k; return m

def soldado(nivel, m):
    suf, lod, muy, fondo, lado, tope, manos = NIVEL[nivel]
    util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); d = np.load(os.path.join(ENT, 'ligero_%s.npz' % nivel))
    hn = [str(h) for h in d['huesos']]; mapa = np.array([util.index(h) for h in hn]); Pm, Nm, UVm, Tm, SIm, SWm = d['P'].astype(float), d['N'].astype(float), d['UV'].astype(float), d['T'].astype(int), mapa[d['idx']], d['w'].astype(float)
    fn = np.cross(Pm[Tm[:, 1]] - Pm[Tm[:, 0]], Pm[Tm[:, 2]] - Pm[Tm[:, 0]]); rev = (fn * Nm[Tm].sum(1)).sum(1) < 0; Tm[rev] = Tm[rev][:, ::-1]   # del revés -> al derecho
    hw = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if any(s in h for s in ('wrist', 'finger', 'metacarpal'))]) for k in range(4))
    col_m = np.asarray(Image.open(os.path.join(ENT, 'color_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    px = lambda uv, N: np.clip((uv * N).astype(int), 0, N - 1)
    eq = []                                                    # sin armas ni escudo: los pone el código del juego
    pieles = []
    if manos:                                                  # manos de MakeHuman desde la muñeca
        Tm = Tm[hw[Tm].mean(1) < 0.5]; obj = min(manos, tope - len(Tm) - sum(len(p['T']) for p in eq))
        mano = B.g('wrist', 'finger', 'metacarpal'); pieles = K.piel(m, B, mano < 0.35, obj, nombre='piel_mano')
        if lod:                                                # de lejos, puño ya cerrado en la malla (como construir.py)
            utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
            A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
            for p in pieles:
                p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
    pz = pieles + eq; tmp = os.path.join(TMP, QUIEN + suf)
    if pz: empaquetar_franja(pz, lado); TX.RELIEVE_MAX = 1024; TX.pintar(pz, lado, tmp, m)
    # ---- atlas: cuerpo de Meshy (u <= 0,75) + franja pintada (u > 0,75)
    lee = lambda k: np.asarray(Image.open(tmp + '_%s.webp' % k).convert('RGB').resize((lado, lado), Image.LANCZOS), np.float32) / 255
    x0 = int(U0 * lado)
    if pz: cE, nE, oE, mE = lee('color'), lee('normal'), lee('orm'), lee('masc')
    else: cE = np.full((lado, lado, 3), 0.5, np.float32); nE = np.zeros_like(cE) + [0.5, 0.5, 1]; oE = np.zeros_like(cE) + [1, 0.6, 0]; mE = np.zeros_like(cE)
    if pieles:                                                  # tono de piel: el de las muñecas de Meshy
        uvm = UVm[hw >= min(0.7, 0.8 * hw.max())] * [1, -1] + [0, 1]   # en lejos el borde pesa menos de 0,7
        ref =col_m[px(uvm[:, 1], lado), px(uvm[:, 0], lado)].mean(0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    mt = np.zeros_like(col_m); mt[..., 0] = tunica_a_gris(col_m, x0, penacho(Pm, Tm, UVm, lado))   # tinte de tela en la capa (no en el penacho)
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
    j = X.guardar(os.path.join(SAL, QUIEN + suf), M, clips, util, dict(texturas=out, muestra=K.MUESTRA_HASTATUS), juego='escudo')
    kb = sum(os.path.getsize(os.path.join(SAL, QUIEN + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum()), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for n in NIVS: soldado(n, m)
