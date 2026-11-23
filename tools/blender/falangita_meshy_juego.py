"""FA2 · paso B: el soldado de Meshy, ya aligerado (paso A), metido en el juego como falangita macedonio y su oficial.

Origen y licencias:
- Cuerpo, ropa y armadura: modelo generado por el usuario con Meshy (meshy.ai), plan gratuito, licencia CC BY 4.0
  (https://creativecommons.org/licenses/by/4.0/), crédito «Meshy». Aligerado y dotado del esqueleto del juego por
  tools/blender/falangita_meshy_ligero.py (paso A). El modelo original NO se guarda en el repositorio.
- Manos (desde la muñeca), esqueleto y pesos: MakeHuman 1.3.2 (CC0 1.0), leídos por gobierno/maquetas/soldado-rome2/construir/.
- Movimientos: Quaternius, Universal Animation Library (CC0 1.0); juego «sarisa» compartido, sin cambios.
- Escudo macedonio, correa, sarisa con manguito, penacho y plumas: arte propio de AQVILA, hecho por código
  (funciones de tools/blender/falangita_macedonio.py). Nada copiado de otros juegos.

Qué hace, por nivel (fino 74 huesos; lejos, muylejos y fondo 36):
 1. Lee ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png del paso A (cuerpo en u <= 0,75 del atlas).
 2. Fino y lejos: quita las manos de Meshy desde la muñeca y pone las de MakeHuman (en lejos, con el puño ya cerrado,
    como construir.py), teñidas con el tono de piel de Meshy. Muylejos y fondo: se quedan las de Meshy (no se ven).
 3. Añade escudo (estrella de 8 puntas; el oficial, sol de 16 rayos), correa pegada al cuerpo de Meshy y sarisa de 6 m
    (conjunto 1). El oficial, además, penacho y dos plumas blancas recolocados sobre el casco de Meshy.
 4. Pinta el equipo y las manos en el 25 % derecho del atlas y lo junta con la textura de Meshy. Máscara de tinte negra
    en el cuerpo de Meshy. Guarda assets/soldados/<clave>[_nivel].bin/.json y _color/_normal/_orm/_masc.webp.

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  python3 tools/blender/falangita_meshy_juego.py entrada=<carpeta del paso A> [quien=falangita|oficial-falange|todos]
      [salida=assets/soldados] [niveles=fino,lejos,muylejos,fondo]
Todo junto (paso A etapa 2 + paso B): tools/blender/falangita_meshy_todo.sh
"""
import os, sys, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a and not a.startswith('--'))
ENT = ARG.get('entrada', ''); SAL = os.path.join(RAIZ, ARG.get('salida', 'assets/soldados')); QUIEN = ARG.get('quien', 'todos')
NIVS = ARG.get('niveles', 'fino,lejos,muylejos,fondo').split(',')
assert os.path.isfile(os.path.join(ENT, 'ligero_fino.npz')), 'falta entrada=<carpeta del paso A con ligero_*.npz>'
TMP = os.path.join(ENT, 'pasoB'); os.makedirs(TMP, exist_ok=True)
os.environ.setdefault('MH_DATOS', '/opt/aqvila-taller/mhdata')
sys.argv = [sys.argv[0], '--salida=' + TMP]                     # construir.py lee --salida= al importarse
sys.path.insert(0, AQUI)
import falangita_macedonio as FM                                 # registra materiales y pintores del escudo, crin y faja
from PIL import Image
K, X, TX, EB, ZB, mh, anim, poses, ropa = FM.K, FM.X, FM.TX, FM.EB, FM.ZB, FM.mh, FM.anim, FM.poses, FM.ropa
U0 = 0.75                                                       # el cuerpo de Meshy ocupa u <= 0,75
#        nivel      sufijo       lod    muy    fondo  lado  tope (triángulos), manos (objetivo MakeHuman)
NIVEL = {'fino': ('', False, False, False, 2048, 13900, 1500), 'lejos': ('_lejos', True, False, False, 1024, 4350, 320),
         'muylejos': ('_muylejos', True, True, False, 512, 1080, 0), 'fondo': ('_fondo', True, True, True, 512, 490, 0)}
# lado y calidad webp de cada mapa por nivel: la textura de Meshy es muy granulada y pesa; normal y orm van más chicos
SALIDA = {'fino': dict(color=(2048, 62), normal=(1024, 68), orm=(512, 70), masc=(1024, 85)), 'lejos': dict(color=(1024, 70), normal=(512, 68), orm=(256, 70), masc=(512, 85)),
          'muylejos': dict(color=(512, 78), normal=(256, 70), orm=(256, 70), masc=(256, 85)), 'fondo': dict(color=(512, 76), normal=(256, 70), orm=(256, 70), masc=(256, 85))}

def empaquetar_franja(pz, lado):
    """Estantes en la franja derecha del atlas (x > 0,75·lado). Pone p['uvpx'] y devuelve los rectángulos."""
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

def perfil(P, sel, dz=0.01):
    """Alto máximo por franjas de z de los vértices sel cercanos al plano medio (x ~ 0)."""
    q = P[sel & (np.abs(P[:, 0]) < 0.03)]; zs = np.arange(q[:, 2].min(), q[:, 2].max() + dz, dz)
    ys = np.array([q[np.abs(q[:, 2] - z) < dz, 1].max() if (np.abs(q[:, 2] - z) < dz).any() else np.nan for z in zs]); ok = ~np.isnan(ys); return zs[ok], ys[ok]

def a_casco_meshy(pz, Pm, cab, m):
    """Recoloca penacho y plumas (hechos para el casco frigio de MakeHuman) sobre el casco de Meshy."""
    cf = [q for q in FM.casco_frigio(m, 24, 14, False) if q['nombre'] == 'yelmo_cuenco'][0]['P']
    zm, ym = perfil(Pm, cab); zf, yf = perfil(cf, np.ones(len(cf), bool))
    lo, hi = max(zm.min(), zf.min()) + 0.01, min(zm.max(), zf.max()) - 0.01
    dy = lambda z: np.interp(np.clip(z, lo, hi), zm, ym) - np.interp(np.clip(z, lo, hi), zf, yf)
    for p in pz:
        if p['nombre'] == 'yelmo_cresta':                     # anillo a anillo: la base de la crin, apoyada en el casco de Meshy
            for v in np.unique(np.round(p['UV'][:, 1], 4)):
                k = np.abs(p['UV'][:, 1] - v) < 1e-4; zc = p['P'][k, 2].mean(); p['P'][k, 1] += np.interp(np.clip(zc, zm.min(), zm.max()), zm, ym) - 0.006 - p['P'][k, 1].min()
        elif p['nombre'].startswith('yelmo_pluma'):
            b = p['P'][np.argmin(p['P'][:, 1])].copy(); s_ = np.sign(b[0]); y1 = b[1] + dy(b[2])
            q = Pm[cab & (np.abs(Pm[:, 1] - y1) < 0.025) & (np.abs(Pm[:, 2] - b[2]) < 0.04)]
            ancho = (s_ * q[:, 0]).max() if len(q) else abs(b[0]); p['P'] += [s_ * (ancho - abs(b[0])) - s_ * 0.004, y1 - b[1], 0]
    return pz

def a_cuerpo_meshy(p, Pm, Nm, holgura=0.007):
    """Saca la correa por fuera del cuerpo de Meshy, anillo a anillo."""
    P = p['P']; n = len(P); lados = 5; anillos = P.reshape(-1, lados, 3) if n % lados == 0 else None
    if anillos is None: return p
    for a in anillos:
        c = a.mean(0); k = np.argmin(((Pm - c) ** 2).sum(1)); nn = Nm[k] / np.linalg.norm(Nm[k]); need = ((Pm[k] - a) @ nn + holgura).max()
        if need > 0: a += nn * need
    p['P'] = anillos.reshape(-1, 3); p['N'] = X.normales(p['P'], p['T'], True); return p

def soldado(quien, nivel, m):
    suf, lod, muy, fondo, lado, tope, manos = NIVEL[nivel]
    util, a = X.huesos_utiles(m, sin_dedos=lod); B = ropa.Base(m, util, a); d = np.load(os.path.join(ENT, 'ligero_%s.npz' % nivel))
    hn = [str(h) for h in d['huesos']]; mapa = np.array([util.index(h) for h in hn]); Pm, Nm, UVm, Tm, SIm, SWm = d['P'].astype(float), d['N'].astype(float), d['UV'].astype(float), d['T'].astype(int), mapa[d['idx']], d['w'].astype(float)
    hw = sum(SWm[:, k] * np.isin(d['idx'][:, k], [i for i, h in enumerate(hn) if any(s in h for s in ('wrist', 'finger', 'metacarpal'))]) for k in range(4))
    cab = sum(SWm[:, k] * (np.array(hn)[d['idx'][:, k]] == 'head') for k in range(4)) > 0.5
    col_m = np.asarray(Image.open(os.path.join(ENT, 'color_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    px = lambda uv, N: np.clip((uv * N).astype(int), 0, N - 1)
    of = quien == 'oficial-falange'; FM.MOTIVO['escudo'] = 'sol16' if of else 'estrella8'; ZB.MOTIVO['escudo'] = 'macedonio'
    eq = FM.escudo(m, fondo, muy, lod) + FM.sarisa(m, muy)
    if not muy: eq += [a_cuerpo_meshy(p, Pm, Nm) for p in FM.correa(m, B, 10 if lod else 22)]
    if of: eq += a_casco_meshy(FM.penacho(m, *((5, 4) if fondo else (7, 4) if muy else (9, 6) if lod else (16, 8)), ancho=0.066) + FM.plumas(m, 2 if fondo else 3 if muy else 5 if lod else 8), Pm, cab, m)
    if lod:
        propias = [p for p in eq if p['nombre'].startswith(FM.PROPIAS)]; eq = K.aligerar_piezas([p for p in eq if not p['nombre'].startswith(FM.PROPIAS)], muy=muy, fondo=fondo) + propias
    pieles = []
    if manos:                                                  # manos de MakeHuman desde la muñeca, con el hueco que quede
        Tm = Tm[hw[Tm].mean(1) < 0.5]; obj = min(manos, tope - len(Tm) - sum(len(p['T']) for p in eq))
        mano = B.g('wrist', 'finger', 'metacarpal'); pieles = K.piel(m, B, mano < 0.35, obj, nombre='piel_mano')
        if lod:                                                # de lejos, puño ya cerrado en la malla (como construir.py)
            utilF, aF = X.huesos_utiles(m); BF = ropa.Base(m, utilF, aF); D = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, D, lib)
            A = X.hornear(D, anim.fk(m, D, lib, m['cab']['root'][None]), m, utilF)[0].reshape(len(utilF), 3, 4)
            for p in pieles:
                p['P'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A, np.c_[p['P'], np.ones(len(p['P']))]); p['N'] = np.einsum('vb,bij,vj->vi', BF.Wd[p['vs']], A[:, :, :3], p['N']); p['N'] /= np.maximum(np.linalg.norm(p['N'], axis=1, keepdims=True), 1e-9)
    pz = pieles + eq; empaquetar_franja(pz, lado)
    TX.RELIEVE_MAX = 1024; TX.ESTILO = dict(TX.ESTILO, **FM.ESTILO); tmp = os.path.join(TMP, quien + suf); TX.pintar(pz, lado, tmp, m)
    # ---- atlas: cuerpo de Meshy (u <= 0,75) + franja pintada (u > 0,75)
    lee = lambda k: np.asarray(Image.open(tmp + '_%s.webp' % k).convert('RGB').resize((lado, lado), Image.LANCZOS), np.float32) / 255
    cE, nE, oE, mE = lee('color'), lee('normal'), lee('orm'), lee('masc'); x0 = int(U0 * lado)
    if pieles:                                                  # tono de piel: el de las manos de Meshy
        uvm = UVm[hw > 0.7] * [1, -1] + [0, 1]; ref = col_m[px(uvm[:, 1], lado), px(uvm[:, 0], lado)].mean(0)
        hp = np.concatenate([p['uvpx'] for p in pieles]).astype(int).clip(0, lado - 1); act = cE[hp[:, 1], hp[:, 0]].mean(0); f = np.clip(ref / np.maximum(act, 1e-3), 0.3, 3)
        for p in pieles:
            x, y, w, h = p['rect']; sl = (slice(max(y - 4, 0), y + h + 4), slice(max(x - 4, x0), x + w + 4)); cE[sl] = np.clip(cE[sl] * f, 0, 1); mE[sl] = 0
    nm = np.asarray(Image.open(os.path.join(ENT, 'normal_%s.png' % nivel)).convert('RGB'), np.float32) / 255; nm[..., 1] = 1 - nm[..., 1]   # Meshy: verde hacia arriba de la imagen; el juego lee v hacia abajo
    om = np.asarray(Image.open(os.path.join(ENT, 'orm_%s.png' % nivel)).convert('RGB'), np.float32) / 255
    out = {}
    for k, cuerpo, franja in (('color', col_m, cE), ('normal', nm, nE), ('orm', om, oE), ('masc', np.zeros_like(col_m), mE)):
        im = cuerpo.copy(); im[:, x0:] = franja[:, x0:]; img = Image.fromarray(np.clip(im * 255 + 0.5, 0, 255).astype(np.uint8))
        t, cal = SALIDA[nivel][k]
        if t != lado: img = img.resize((t, t), Image.LANCZOS)
        nombre = quien + suf + '_%s.webp' % k; img.save(os.path.join(SAL, nombre), quality=cal, method=6); out[k] = nombre
    # ---- malla
    ix = {b: i for i, b in enumerate(util)}; M = X.Malla()
    M.pon('cuerpo', Pm, Nm, UVm * [1, -1] + [0, 1], SIm, SWm, Tm, 0)
    for p in pz:
        si, sw = p['W'] if p['W'] is not None else (ix[p['hueso']], 1.0)
        M.pon(p['nombre'].rstrip('0123456789LR'), p['P'], p['N'], p['uvpx'] / lado, si, sw, p['T'], p['conj'])
    clips = EB.mov_sarisa(m, util, EB.CFG_SARISA)
    j = X.guardar(os.path.join(SAL, quien + suf), M, clips, util, dict(texturas=out, muestra=EB.M_SARISA), juego='sarisa')
    kb = sum(os.path.getsize(os.path.join(SAL, quien + suf + e)) for e in ('.bin', '.json')) + sum(os.path.getsize(os.path.join(SAL, v)) for v in out.values())
    print('%-16s %-9s %6d triángulos %3d huesos %5.0f KB' % (quien, nivel, j['tris'], len(util), kb / 1024), j['piezas'], flush=True)

if __name__ == '__main__':
    m = mh.construir()
    for q in (('falangita', 'oficial-falange') if QUIEN == 'todos' else (QUIEN,)):
        for n in NIVS: soldado(q, n, m)
