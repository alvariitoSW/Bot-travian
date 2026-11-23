"""AL1 · paso B: el galo grande de Meshy, ya aligerado (paso A), metido en el juego como soldado «galo-grande».

Copia de tools/blender/hastatus_meshy_juego.py (FA2), sin equipo: escudo y armas se ponen por código en el juego.

Origen y licencias:
- Cuerpo, pelo, barba, ropa y correas: modelo generado por el usuario con Meshy (meshy.ai, plan de pago), tarea
  text-to-3d refine 01a20a6f-1e10-7476-8ca9-4cd8c2c89660. Se publica como CC BY-SA 3.0 citando a Meshy como herramienta
  (decisión del usuario, 23/11). Aligerado y con el esqueleto del juego por tools/blender/galo-grande_meshy_ligero.py.
  El modelo original NO se guarda en el repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman 1.3.2 (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A.
 2. Da la vuelta a los triángulos que el aligerado dejó del revés.
 3. Fino y lejos: pone las manos de MakeHuman desde la muñeca (en lejos, con el puño cerrado), teñidas al tono de la piel
    del pecho de Meshy (las muñecas llevan muñequeras de cuero: su color no vale para la mano).
 4. Sin tinte de facción: las calzas a cuadros rojo y negro se quedan como son (licencia de juego, decisión del usuario).
    Por eso no hay textura _masc.
 5. Guarda assets/soldados/galo-grande[_nivel].bin/.json y _color/_normal/_orm.webp, con texturas pequeñas (peso).

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/galo-grande_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo]
Todo junto (paso A etapa 2 + paso B): tools/blender/galo-grande_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'galo-grande'
NIVS = ARG.get('niveles', 'fino,lejos,muylejos,fondo').split(',')
assert os.path.isfile(os.path.join(ENT, 'ligero_fino.npz')), 'falta entrada=<carpeta del paso A con ligero_*.npz>'
TMP = os.path.join(ENT, 'pasoB'); os.makedirs(TMP, exist_ok=True)
os.environ.setdefault('MH_DATOS', '/opt/aqvila-taller/mhdata')
CONS = os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'); sys.path.insert(0, CONS)
sys.argv = [sys.argv[0], '--salida=' + TMP]                     # construir.py lee --salida= al importarse
import mh, anim, poses, exportar as X, piezas as Z, ropa
import construir as K, texturas as TX
from PIL import Image
U0S = {'fino': 0.88, 'lejos': 0.88, 'muylejos': 1.0, 'fondo': 1.0}        # parte del atlas del cuerpo de Meshy (como el paso A)

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
NIVEL = {'fino': ('', False, False, False, 2048, 11820, 820), 'lejos': ('_lejos', True, False, False, 1024, 3546, 326),
         'muylejos': ('_muylejos', True, True, False, 512, 788, 0), 'fondo': ('_fondo', True, True, True, 512, 374, 0)}
# lado y calidad webp de cada textura (pequeñas a propósito: el presupuesto de descarga está cerca del tope)
SALIDA = {'fino': dict(color=(1024, 72), normal=(512, 70), orm=(256, 70)), 'lejos': dict(color=(512, 74), normal=(256, 70), orm=(128, 70)),
          'muylejos': dict(color=(256, 78), normal=(128, 70), orm=(128, 70)), 'fondo': dict(color=(256, 76), normal=(128, 70), orm=(128, 70))}

def tono_piel(Pm, UVm, col, lado):
    """Color de la piel en el pecho de Meshy (pectorales, delante, a los lados de la barba): mediana de lo que parece piel."""
    sel = (Pm[:, 1] > 1.20) & (Pm[:, 1] < 1.34) & (np.abs(Pm[:, 0]) > 0.05) & (np.abs(Pm[:, 0]) < 0.13) & (Pm[:, 2] > 0.06)
    uv = UVm[sel] * [1, -1] + [0, 1]; c = col[np.clip((uv[:, 1] * lado).astype(int), 0, lado - 1), np.clip((uv[:, 0] * lado).astype(int), 0, lado - 1)]
    piel = c[(c[:, 0] > c[:, 1]) & (c[:, 1] > c[:, 2]) & (c[:, 0] > 0.35)]      # cálida y clara: fuera correas y barba
    return np.median(piel if len(piel) > 10 else c, 0)

def soldado(nivel, m):
    suf, lod, muy, fondo, lado, tope, manos = NIVEL[nivel]; U0 = U0S[nivel]
    util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); d = np.load(os.path.join(ENT, 'ligero_%s.npz' % nivel))
    hn = [str(h) for h in d['huesos']]; mapa = np.array([util.index(h) for h in hn]); Pm, Nm, UVm, Tm, SIm, SWm = d['P'].astype(float), d['N'].astype(float), d['UV'].astype(float), d['T'].astype(int), mapa[d['idx']], d['w'].astype(float)
    fn = np.cross(Pm[Tm[:, 1]] - Pm[Tm[:, 0]], Pm[Tm[:, 2]] - Pm[Tm[:, 0]]); rev = (fn * Nm[Tm].sum(1)).sum(1) < 0; Tm[rev] = Tm[rev][:, ::-1]   # del revés -> al derecho
    hw = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if any(s in h for s in ('wrist', 'finger', 'metacarpal'))]) for k in range(4))
    col_m = np.asarray(Image.open(os.path.join(ENT, 'color_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    nm = np.asarray(Image.open(os.path.join(ENT, 'normal_%s.png' % nivel)).convert('RGB'), np.float32) / 255; nm[..., 1] = 1 - nm[..., 1]   # como el falangita
    om = np.asarray(Image.open(os.path.join(ENT, 'orm_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    pieles = []
    if manos:                                                  # manos de MakeHuman desde la muñeca
        Tm = Tm[hw[Tm].mean(1) < 0.5]; obj = min(manos, tope - len(Tm))
        mano = B.g('wrist', 'finger', 'metacarpal'); pieles = K.piel(m, B, mano < 0.35, obj, nombre='piel_mano')
        if lod:                                                # de lejos, puño ya cerrado en la malla (como construir.py)
            utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
            A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
            for p in pieles:
                p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
        empaquetar_franja(pieles, lado, U0)
        TX.RELIEVE_MAX = 1024; tmp = os.path.join(TMP, QUIEN + suf); TX.pintar(pieles, lado, tmp, m)
        lee = lambda k: np.asarray(Image.open(tmp + '_%s.webp' % k).convert('RGB').resize((lado, lado), Image.LANCZOS), np.float32) / 255
        cE, nE, oE = lee('color'), lee('normal'), lee('orm'); x0 = int(U0 * lado)
        ref = tono_piel(Pm, UVm, col_m, lado)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1)
        for cuerpo, franja in ((col_m, cE), (nm, nE), (om, oE)): cuerpo[:, x0:] = franja[:, x0:]
        print('%-9s piel del pecho %s -> manos x %s' % (nivel, np.round(ref * 255).astype(int), np.round(f, 2)))
    out = {}
    for k, im in (('color', col_m), ('normal', nm), ('orm', om)):
        img = Image.fromarray(np.clip(im * 255 + 0.5, 0, 255).astype(np.uint8)); t, cal = SALIDA[nivel][k]
        if t != lado: img = img.resize((t, t), Image.LANCZOS)
        nombre = QUIEN + suf + '_%s.webp' % k; img.save(os.path.join(SAL, nombre), quality=cal, method=6); out[k] = nombre
    # ---- malla
    M = X.Malla(); M.pon('cuerpo', Pm, Nm, UVm * [1, -1] + [0, 1], SIm, SWm, Tm, 0)
    for p in pieles:
        M.pon(p['nombre'].rstrip('0123456789LR'), p['P'], p['N'], p['uvpx'] / lado, p['W'][0], p['W'][1], p['T'], p['conj'])
    clips = K.movimientos(m, util, K.CFG_HASTATUS)
    j = X.guardar(os.path.join(SAL, QUIEN + suf), M, clips, util, dict(texturas=out, muestra=K.MUESTRA_HASTATUS), juego='escudo')
    kb = sum(os.path.getsize(os.path.join(SAL, QUIEN + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum()), j['piezas'], flush=True)
    return kb

if __name__ == '__main__':
    m = mh.construir()
    kb = sum(soldado(n, m) for n in NIVS); print('total %.0f KB' % (kb / 1024))
