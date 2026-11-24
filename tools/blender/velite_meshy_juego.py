"""AL7 · paso B: el vélite de Meshy, ya aligerado (tools/blender/velite_meshy_ligero.py), metido en el juego como vélite.

Copia el método de tools/blender/hastatus_meshy_juego.py (FA2), sin tocarlo, con el equipo del vélite de hoy
(gobierno/maquetas/soldado-rome2/construir/equipos_a.py:velite).

Origen y licencias:
- Cuerpo, túnica, faja, casco y sandalias: modelo generado por el usuario con Meshy (meshy.ai), plan de pago; se publica
  como CC BY-SA 3.0 citando a Meshy como herramienta. Sin la piel de lobo (licencia de juego, decidido por el usuario 23/11)
  y con la cresta del casco aplastada (casco liso). El modelo original NO se guarda en el repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «escudo» compartido, sin cambios.
- Parma, jabalina en la mano, dos jabalinas con la parma, espada y vaina: arte propio de AQVILA hecho por código
  (piezas_a.py y piezas.py, las mismas funciones que el vélite anterior). Nada copiado de otros juegos.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A (cuerpo en u <= 0,75 del atlas).
 2. Da la vuelta a los triángulos que el aligerado dejó del revés.
 3. Fino y lejos: pone las manos de MakeHuman desde la muñeca (en lejos, con el puño ya cerrado), teñidas al tono de Meshy.
 4. Añade parma (conj. 0), jabalina (1), espada (2), vaina y espada envainada (3), como equipos_a.velite.
 5. Túnica: blanca fija, como la de Meshy (el color del bando lo lleva la parma). Con tenir=1, la parte blanca pasa a
    gris y va al canal de tela de la máscara (se tiñe del color del bando).
 6. Guarda assets/soldados/velite[_nivel].bin/.json y _color/_normal/_orm/_masc.webp, con texturas pequeñas (peso).

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/velite_meshy_juego.py entrada=<carpeta del paso A> [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo] [tenir=0|1]
Todo junto (paso A etapa 2 + paso B): tools/blender/velite_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = 'velite'; TENIR = ARG.get('tenir', '0') == '1'
NIVS = ARG.get('niveles', 'fino,lejos,muylejos,fondo').split(',')
assert os.path.isfile(os.path.join(ENT, 'ligero_fino.npz')), 'falta entrada=<carpeta del paso A con ligero_*.npz>'
TMP = os.path.join(ENT, 'pasoB'); os.makedirs(TMP, exist_ok=True)
os.environ.setdefault('MH_DATOS', '/opt/aqvila-taller/mhdata')
CONS = os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'); sys.path.insert(0, CONS)
sys.argv = [sys.argv[0], '--salida=' + TMP]                     # construir.py lee --salida= al importarse
import mh, anim, poses, exportar as X, piezas as Z, ropa
import construir as K, texturas as TX, piezas_a as PA, equipos_a as EA
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
NIVEL = {'fino': ('', False, False, False, 2048, 10500, 1300), 'lejos': ('_lejos', True, False, False, 1024, 4450, 300),
         'muylejos': ('_muylejos', True, True, False, 512, 950, 0), 'fondo': ('_fondo', True, True, True, 512, 450, 0)}
SALIDA = {'fino': dict(color=(1024, 72), normal=(512, 66), orm=(256, 66), masc=(512, 80)), 'lejos': dict(color=(512, 72), normal=(256, 64), orm=(128, 66), masc=(256, 80)),
          'muylejos': dict(color=(256, 76), normal=(128, 64), orm=(128, 66), masc=(128, 80)), 'fondo': dict(color=(256, 74), normal=(128, 64), orm=(128, 66), masc=(128, 80))}
TELA_ROMANA = np.array([0x8f, 0x2f, 0x22]) / 255               # TELAS[0] de js/gfx/soldado.js (la paleta romana)

lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def tunica_a_gris(col, x0):
    """Túnica blanca de Meshy (u <= 0,75) -> gris con su sombreado + máscara de tela (solo con tenir=1).
    El juego hace color·tela·2,2 (en lineal): el blanco pasa a un gris que, teñido, da el color del bando algo claro."""
    c = col[:, :x0]; mx = c.max(-1); mn = c.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-3)
    k = np.clip((0.16 - sat) / 0.06, 0, 1) * np.clip((mx - 0.42) / 0.10, 0, 1)
    gl = np.clip(lin(c).mean(-1) * 0.62, 0, 1); gris = srgb(gl)[..., None] * np.ones(3); c[:] = c * (1 - k[..., None]) + gris * k[..., None]
    m = np.zeros(col.shape[:2], np.float32); m[:, :x0] = k; return m

def soldado(nivel, m):
    suf, lod, muy, fondo, lado, tope, manos = NIVEL[nivel]
    util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); d = np.load(os.path.join(ENT, 'ligero_%s.npz' % nivel))
    hn = [str(h) for h in d['huesos']]; mapa = np.array([util.index(h) for h in hn]); Pm, Nm, UVm, Tm, SIm, SWm = d['P'].astype(float), d['N'].astype(float), d['UV'].astype(float), d['T'].astype(int), mapa[d['idx']], d['w'].astype(float)
    fn = np.cross(Pm[Tm[:, 1]] - Pm[Tm[:, 0]], Pm[Tm[:, 2]] - Pm[Tm[:, 0]]); rev = (fn * Nm[Tm].sum(1)).sum(1) < 0; Tm[rev] = Tm[rev][:, ::-1]   # del revés -> al derecho
    hw = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if any(s in h for s in ('wrist', 'finger', 'metacarpal'))]) for k in range(4))
    col_m = np.asarray(Image.open(os.path.join(ENT, 'color_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    px = lambda uv, N: np.clip((uv * N).astype(int), 0, N - 1)
    # ---- equipo del vélite de hoy (equipos_a.velite, sin túnica, casco ni piel de lobo)
    hL = poses.mano(m, 'L'); hR = poses.mano(m, 'R')
    eq = [p for p in PA.parma(h=hL, nr=2 if muy else 7, na=12 if fondo else 16 if muy else 28, canto=not muy, umbo=not fondo) if not (muy and p['nombre'] == 'escudo_dorso')]
    eq += PA.jabalina(hR['c'], -hR['X'], hR['N'], 'wrist.R', 1, simple=muy)
    eq += PA.haz_jabalinas(hL, 2 if not muy else 1, simple=muy)
    EA.espada_al_cinto(eq, hR)
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
    if pieles:                                                  # tono de piel: el de las muñecas de Meshy
        uvm = UVm[hw >= min(0.7, 0.8 * hw.max())] * [1, -1] + [0, 1]   # en lejos el borde pesa menos de 0,7
        ref =col_m[px(uvm[:, 1], lado), px(uvm[:, 0], lado)].mean(0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    mt = np.zeros_like(col_m)
    if TENIR: mt[..., 0] = tunica_a_gris(col_m, x0)                         # tinte de tela solo en la túnica
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
    j = X.guardar(os.path.join(SAL, QUIEN + suf), M, clips, util, dict(texturas=out, muestra=EA.MUESTRA), juego='escudo')
    kb = sum(os.path.getsize(os.path.join(SAL, QUIEN + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-9s %6d triángulos %3d huesos %5.0f KB  (%d triángulos del revés, girados)' % (nivel, j['tris'], len(util), kb / 1024, rev.sum()), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for n in NIVS: soldado(n, m)
