"""AL3 · paso B: el centurión de Meshy, ya aligerado (paso A: tools/blender/centurion_meshy_ligero.py), como soldado del juego.
Copia de tools/blender/hastatus_meshy_juego.py (FA2-R), que no se toca. Es el oficial a pie que lleva el jugador (LP3).

Origen y licencias:
- Cuerpo, ropa, cota, casco con cresta, capa, grebas y vaina: modelo generado por el usuario con la API de Meshy (meshy.ai),
  plan de pago, tarea refine 01a20a81-6441-70c2-9f9f-06a46097040d. Se publica como CC BY-SA 3.0 citando a Meshy como
  herramienta (decisión del usuario, 23/11). El modelo original NO se guarda en el repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.
- SIN escudo ni armas: el juego los pone por código. La vaina del costado es de Meshy.

Qué cambia frente al hastatus:
 - Sin piezas de equipo: el atlas lleva el cuerpo (u <= 0,86) y las manos de MakeHuman en la franja derecha (fino y lejos);
   en muylejos y fondo el cuerpo ocupa el atlas entero.
 - Sin máscara de tinte: el rojo de la cresta, la capa y la túnica es el del centurión en cualquier bando (lo distingue).
 - Cresta y capa más vivas en lejos, muylejos y fondo: el rojo se satura y aclara para que se lean a distancia.
 - Relieve enderezado: los texeles con la normal hacia dentro (horneado que tocó el forro de la capa) se llevan a plano.
 - Texturas más pequeñas (cuida el peso: ver SALIDA).

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/centurion_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo]
Todo junto (paso A etapa 2 + paso B): tools/blender/centurion_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'centurion'
NIVS = ARG.get('niveles', 'fino,lejos,muylejos,fondo').split(',')
assert os.path.isfile(os.path.join(ENT, 'ligero_fino.npz')), 'falta entrada=<carpeta del paso A con ligero_*.npz>'
TMP = os.path.join(ENT, 'pasoB'); os.makedirs(TMP, exist_ok=True)
os.environ.setdefault('MH_DATOS', '/opt/aqvila-taller/mhdata')
CONS = os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'); sys.path.insert(0, CONS)
sys.argv = [sys.argv[0], '--salida=' + TMP]                     # construir.py lee --salida= al importarse
import mh, anim, poses, exportar as X, piezas as Z, ropa
import construir as K, texturas as TX
from PIL import Image
UMAX = {'fino': 0.86, 'lejos': 0.86, 'muylejos': 1.0, 'fondo': 1.0}   # el cuerpo de Meshy ocupa u <= UMAX (como el paso A)

def empaquetar_franja(pz, lado, U0):
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
NIVEL = {'fino': ('', False, False, False, 2048, 6000, 700), 'lejos': ('_lejos', True, False, False, 1024, 2200, 200),
         'muylejos': ('_muylejos', True, True, False, 512, 800, 0), 'fondo': ('_fondo', True, True, True, 512, 380, 0)}
SALIDA = {'fino': dict(color=(1024, 72), normal=(512, 66), orm=(256, 66)), 'lejos': dict(color=(512, 72), normal=(256, 62), orm=(128, 66)),   # sin máscara
          'muylejos': dict(color=(256, 80), normal=(128, 70), orm=(128, 70)), 'fondo': dict(color=(256, 78), normal=(128, 70), orm=(128, 70))}
VIVO = {'fino': 0.0, 'lejos': 0.5, 'muylejos': 1.0, 'fondo': 1.0}    # cuánto se avivan la cresta y la capa rojas
TELA_ROMANA = np.array([0x8f, 0x2f, 0x22]) / 255               # TELAS[0] de js/gfx/soldado.js (la paleta romana)

lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def enderezar_relieve(nm):
    """El horneado del relieve a veces toca la cara de dentro de la capa (tela fina): normales que apuntan bajo la
    superficie (z < 0 en espacio tangente) y se ven como manchas negras. Se llevan hacia plano, más cuanto peor."""
    n = nm * 2 - 1; z = n[..., 2]; w = np.clip((0.45 - z) / 0.35, 0, 1)[..., None]
    n = n * (1 - w) + np.array([0, 0, 1.0]) * w; n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-6)
    return n * 0.5 + 0.5, float((w[..., 0] > 0.5).mean())

def avivar_rojo(col, x0, f):
    """Rojo de cresta, capa y túnica más saturado y claro (de lejos se lee como el centurión). f de 0 a 1."""
    c = col[:, :x0]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    k = np.clip((0.45 - g / np.maximum(r, 1e-3)) / 0.15, 0, 1) * np.clip((0.45 - b / np.maximum(r, 1e-3)) / 0.15, 0, 1) * np.clip((r - 0.12) / 0.10, 0, 1) * f
    viva = np.stack([np.clip(r * 1.30 + 0.06, 0, 1), g * 0.75, b * 0.75], -1); c[:] = c * (1 - k[..., None]) + viva * k[..., None]
    return float(k.mean())

def tunica_a_gris(col, x0):
    """Túnica roja de Meshy (u <= 0,75) -> gris con su sombreado + máscara de tela. El juego hace color·tela·2,2 (en lineal)."""
    c = col[:, :x0]; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    k = np.clip((0.40 - g / np.maximum(r, 1e-3)) / 0.12, 0, 1) * np.clip((0.40 - b / np.maximum(r, 1e-3)) / 0.12, 0, 1) * np.clip((r - 0.09) / 0.08, 0, 1)
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
    eq = []                                                    # sin escudo ni armas: el juego los pone por código
    pieles = []
    if manos:                                                  # manos de MakeHuman desde la muñeca
        Tm = Tm[hw[Tm].mean(1) < 0.5]; obj = min(manos, tope - len(Tm) - sum(len(p['T']) for p in eq))
        mano = B.g('wrist', 'finger', 'metacarpal'); pieles = K.piel(m, B, mano < 0.35, obj, nombre='piel_mano')
        if lod:                                                # de lejos, puño ya cerrado en la malla (como construir.py)
            utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
            A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
            for p in pieles:
                p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
    U0 = UMAX[nivel]; pz = pieles + eq
    if pz: empaquetar_franja(pz, lado, U0); TX.RELIEVE_MAX = 1024; tmp = os.path.join(TMP, QUIEN + suf); TX.pintar(pz, lado, tmp, m)
    # ---- atlas: cuerpo de Meshy (u <= 0,75) + franja pintada (u > 0,75)
    lee = lambda k: np.asarray(Image.open(tmp + '_%s.webp' % k).convert('RGB').resize((lado, lado), Image.LANCZOS), np.float32) / 255
    x0 = int(U0 * lado)
    if pz: cE, nE, oE, mE = lee('color'), lee('normal'), lee('orm'), lee('masc')
    else: cE = nE = oE = mE = None
    if pieles:                                                  # tono de piel: el de las muñecas de Meshy
        uvm = UVm[hw >= min(0.7, 0.8 * hw.max())] * [1, -1] + [0, 1]   # en lejos el borde pesa menos de 0,7
        ref =col_m[px(uvm[:, 1], lado), px(uvm[:, 0], lado)].mean(0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    viv = avivar_rojo(col_m, x0, VIVO[nivel]) if VIVO[nivel] else 0.0          # sin tinte de facción (sin máscara)
    nm = np.asarray(Image.open(os.path.join(ENT, 'normal_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    nm, malos = enderezar_relieve(nm); nm[..., 1] = 1 - nm[..., 1]   # verde invertido, como el falangita
    om = np.asarray(Image.open(os.path.join(ENT, 'orm_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    out = {}
    for k, cuerpo, franja in (('color', col_m, cE), ('normal', nm, nE), ('orm', om, oE)):
        im = cuerpo.copy()
        if franja is not None: im[:, x0:] = franja[:, x0:]
        img = Image.fromarray(np.clip(im * 255 + 0.5, 0, 255).astype(np.uint8))
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
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados; rojo avivado en %.1f %% del atlas; relieve enderezado en %.1f %%)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum(), viv * 100, malos * 100), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for n in NIVS: soldado(n, m)
