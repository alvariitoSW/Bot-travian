"""AL4 · paso B: el triario de Meshy, ya aligerado (paso A: tools/blender/triario_meshy_ligero.py), metido en el juego.

Copia de tools/blender/hastatus_meshy_juego.py (FA2-R) con el equipo del triario de hoy (equipos_a.py:triario):
escudo oval, hasta (lanza de empuje de 2,45 m) en vez de pilum, espada, vaina y espada envainada.

Origen y licencias:
- Cuerpo, ropa, cota, casco con cimera, barba, capa y grebas: modelo generado por el usuario con Meshy (meshy.ai), plan de
  pago (lote MS2, refine 01a20a83-9e6f-73f8-b12f-867ede383d49). Publicado como CC BY-SA 3.0
  (https://creativecommons.org/licenses/by-sa/3.0/), citando a Meshy como herramienta (decisión del usuario, 23/11).
  El modelo original NO se guarda en el repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman 1.3.2 (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.
- Escudo, lanza, espada y vaina: arte propio de AQVILA, hecho por código (piezas.py). Nada copiado de otros juegos.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A (cuerpo en u <= 0,75 del atlas).
 2. Da la vuelta a los triángulos que el aligerado dejó del revés.
 3. Fino y lejos: pone las manos de MakeHuman desde la muñeca (en lejos, con el puño ya cerrado), teñidas al tono de la
    piel de Meshy (la de la cara, por color: este triario lleva brazales de hierro en las muñecas).
 4. Añade escudo oval (conj. 0), lanza (1), espada (2), vaina y espada envainada (3).
 5. Tinte de facción: la túnica y la capa marrones de Meshy se detectan por su color, pasan a gris con su sombreado y se
    marcan en el canal de tela (R) de la máscara: con la paleta romana salen rojas, como las del hastatus.
 6. Guarda assets/soldados/triario[_nivel].bin/.json y _color/_normal/_orm/_masc.webp, con texturas más pequeñas que el
    hastatus (presupuesto de descarga).

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/triario_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo]
Todo junto (paso A etapa 2 + paso B): tools/blender/triario_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'triario'
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
NIVEL = {'fino': ('', False, False, False, 2048, 13950, 1500), 'lejos': ('_lejos', True, False, False, 1024, 4350, 320),
         'muylejos': ('_muylejos', True, True, False, 512, 1080, 0), 'fondo': ('_fondo', True, True, True, 512, 490, 0)}
SALIDA = {'fino': dict(color=(1024, 72), normal=(512, 68), orm=(256, 70), masc=(512, 85)), 'lejos': dict(color=(512, 74), normal=(256, 68), orm=(128, 70), masc=(256, 85)),   # más pequeñas que el hastatus: presupuesto de descarga
          'muylejos': dict(color=(256, 78), normal=(128, 70), orm=(128, 70), masc=(128, 85)), 'fondo': dict(color=(256, 76), normal=(128, 70), orm=(128, 70), masc=(128, 85))}
MUESTRA_TRI = dict(K.MUESTRA_HASTATUS, **{k: [[0, 5]] for k in ('lanzar', 'guardia', 'golpear', 'cubrirse', 'encajar')})   # como equipos_a.py: no suelta la lanza
TELA_ROMANA = np.array([0x8f, 0x2f, 0x22]) / 255               # TELAS[0] de js/gfx/soldado.js (la paleta romana)

lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def tunica_a_gris(col, x0):
    """Túnica y capa marrones de Meshy (u <= 0,75) -> gris con su sombreado + máscara de tela. El juego hace color·tela·2,2
    (en lineal). Marrón rojizo y oscuro: g/r < 0,60, b/r < 0,42, r entre 0,08 y 0,45. Fuera quedan la cimera naranja
    (más clara), el cuero de los cinturones (gris pardo), las vendas ocres (g/r alto), la piel y la barba."""
    c = col[:, :x0]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    k = np.clip((0.60 - g / np.maximum(r, 1e-3)) / 0.06, 0, 1) * np.clip((0.42 - b / np.maximum(r, 1e-3)) / 0.08, 0, 1) * np.clip((r - 0.08) / 0.05, 0, 1) * np.clip((0.45 - r) / 0.07, 0, 1)
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
    # ---- equipo del triario de hoy (equipos_a.py:triario: el del hastatus con lanza en vez de pilum)
    hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    eq = Z.escudo_oval(hL, **(dict(nu=4, nv=6, ne=6) if fondo else dict(nu=6, nv=10, ne=10) if muy else {}))
    eq += Z.lanza(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, largo=2.45, bajo=1.15, simple=muy) + Z.espada(hR['c'], -hR['X'], hR['d'], 'wrist.R', 2)
    boca = np.array([-0.228, 1.005, 0.02]); ev = np.array([-0.13, -1, -0.16]); eq += Z.vaina(boca, ev, [1, 0, 0], 'root') + Z.espada(boca - ev / np.linalg.norm(ev) * 0.058, ev, [0, 0, 1], 'root', 3, nombre='espada_env', solo_puno=True)
    if lod: eq = K.aligerar_piezas(eq, muy=muy, fondo=fondo)
    pieles = []
    if manos:                                                  # manos de MakeHuman desde la muñeca
        Tm = Tm[hw[Tm].mean(1) < 0.5]; obj = min(manos, tope - len(Tm) - sum(len(p['T']) for p in eq))
        mano = B.g('wrist', 'finger', 'metacarpal'); pieles = K.piel(m, B, mano < 0.35, obj, nombre='piel_mano')
        if lod:                                                # de lejos, puño ya cerrado en la malla (como construir.py)
            utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
            A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
            for p in pieles:
                p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
    pz = pieles + eq; empaquetar_franja(pz, lado)
    TX.RELIEVE_MAX = 1024; tmp = os.path.join(TMP, QUIEN + suf); TX.pintar(pz, lado, tmp, m)
    # ---- atlas: cuerpo de Meshy (u <= 0,75) + franja pintada (u > 0,75)
    lee = lambda k: np.asarray(Image.open(tmp + '_%s.webp' % k).convert('RGB').resize((lado, lado), Image.LANCZOS), np.float32) / 255
    cE, nE, oE, mE = lee('color'), lee('normal'), lee('orm'), lee('masc'); x0 = int(U0 * lado)
    if pieles:                                                  # tono de piel: el de la cara de Meshy (las muñecas llevan brazal de hierro)
        cu = col_m[:, :x0].reshape(-1, 3); r_, g_, b_ = cu.T; rr = np.maximum(r_, 1e-3)
        ref = np.median(cu[(r_ > 0.5) & (g_ / rr > 0.62) & (g_ / rr < 0.82) & (b_ / rr > 0.55) & (b_ / rr < 0.80)], 0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    mt = np.zeros_like(col_m); mt[..., 0] = tunica_a_gris(col_m, x0)          # tinte de tela solo en la túnica
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
    j = X.guardar(os.path.join(SAL, QUIEN + suf), M, clips, util, dict(texturas=out, muestra=MUESTRA_TRI), juego='escudo')
    kb = sum(os.path.getsize(os.path.join(SAL, QUIEN + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum()), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for n in NIVS: soldado(n, m)
