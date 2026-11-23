"""FA2 · PRUEBA 2 «Tela de verdad»: falangita macedonio con ropa simulada (Blender, modificador Cloth).

Qué hace:
  1. Monta un cuerpo de MakeHuman más musculoso (deformadores de targets/macrodetails, torso en V, cuello y antebrazos).
  2. Hace la armadura rígida por código: coraza de lino con hombreras y canto grueso, casco frigio de bronce con
     carrilleras, escudo macedonio de bronce de 65 cm con estrella de ocho puntas y correa al cuello, grebas, zapatos y sarisa.
  3. Simula la tela en tres tandas (cuerpo y armadura como colisión): quitón de lana (faldón y mangas), clámide prendida
     con fíbula en el hombro derecho, y dos filas de pteruges de lino. Aplica el resultado (tela «congelada»).
  4. Hace el modelo ligero: Decimate por pieza (≤ 14 000 triángulos), UV automáticas y horneado con Cycles en CPU
     (color, normales, oclusión, rugosidad y metal) a texturas de 2048 desde el modelo pesado.
  5. Fotografía el modelo ligero con las condiciones comunes de las tres pruebas y pone el rótulo con Pillow.

Uso:  source /opt/aqvila-taller/entorno.sh
      blender-py tools/blender/falangita_prueba_2.py -- --trabajo=CARPETA [--recargar]
  CARPETA (fuera del repositorio) guarda la escena .blend, las texturas y las vistas previas.
  --recargar parte de la escena ya simulada (salta pasos 1 a 3).
  Las fotos finales van a gobierno/capturas-tarea/FA2-P2-*.jpg.

Licencias: cuerpo de MakeHuman (CC0 1.0, datos leídos con gobierno/maquetas/soldado-rome2/construir/mh.py).
Todo lo demás (ropa, armadura, materiales, texturas horneadas) es arte propio de AQVILA hecho aquí por código.
Nada copiado de otros juegos. Fuentes de época: las de tools/blender/falangita_macedonio.py.
"""
import os, sys, time, math
import numpy as np
import bpy, bmesh
from mathutils import Vector

T0 = time.time()
AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
sys.path.insert(0, os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'))
import mh

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OPC = {a.split('=')[0].lstrip('-'): (a.split('=', 1)[1] if '=' in a else True) for a in ARGS}
TRAB = OPC.get('trabajo', '/tmp/falangita_p2'); os.makedirs(TRAB, exist_ok=True)
FOTOS = os.path.join(RAIZ, 'gobierno', 'capturas-tarea')
ESCENA = os.path.join(TRAB, 'p2_simulado.blend')

def aviso(*a): print('[P2 %5.0fs]' % (time.time() - T0), *a, flush=True)

# ---------------------------------------------------------------- utilidades de malla
def nodos(mat):
    try: mat.use_nodes = True
    except Exception: pass
    return mat.node_tree

def malla(nombre, V, F, mat=None, suave=True, fuera=None):
    """Crea un objeto. fuera(centro_cara) -> vector hacia fuera: voltea las caras que miran hacia dentro."""
    V = np.asarray(V, float); F = [list(f) for f in F]
    if fuera is not None:
        for k, f in enumerate(F):
            p = V[f]; n = np.cross(p[1] - p[0], p[-1] - p[0]) if len(f) == 3 else np.cross(p[2] - p[0], p[3] - p[1])
            if n @ fuera(p.mean(0)) < 0: F[k] = f[::-1]
    me = bpy.data.meshes.new(nombre); me.from_pydata(V.tolist(), [], F); me.validate(); me.update()
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-6); bm.to_mesh(me); bm.free()
    me.polygons.foreach_set('use_smooth', [suave] * len(me.polygons))
    ob = bpy.data.objects.new(nombre, me); bpy.context.scene.collection.objects.link(ob)
    if mat: ob.data.materials.append(mat)
    return ob

def rejilla(P, cerrada=True):
    """P[filas, columnas, 3] -> vértices y cuadriláteros (columnas cerradas en anillo si cerrada)."""
    nf, nc = P.shape[:2]; F = []
    for i in range(nf - 1):
        for j in range(nc if cerrada else nc - 1):
            j2 = (j + 1) % nc; F.append([i * nc + j, i * nc + j2, (i + 1) * nc + j2, (i + 1) * nc + j])
    return P.reshape(-1, 3), F

def modif(ob, tipo, **kw):
    m = ob.modifiers.new(tipo.lower(), tipo)
    for k, v in kw.items(): setattr(m, k, v)
    return m

def congelar(ob):
    """Aplica todos los modificadores (incluida la tela) leyendo la malla evaluada."""
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear(); vieja = ob.data; ob.data = me; me.name = ob.name
    if vieja.users == 0: bpy.data.meshes.remove(vieja)

def grupo(ob, nombre, pesos):
    g = ob.vertex_groups.new(name=nombre)
    for i, w in enumerate(pesos):
        if w > 0: g.add([i], float(w), 'REPLACE')

def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)

# ---------------------------------------------------------------- materiales (procedurales)
def material(nombre, color, rug, metal=0.0, var=0.12, escala=40.0, bump=(250.0, 0.15), tejido=None, banda=None, sss=0.0):
    m = bpy.data.materials.new(nombre); nt = nodos(m); N = nt.nodes; L = nt.links
    bs = next(n for n in N if n.type == 'BSDF_PRINCIPLED')
    tc = N.new('ShaderNodeTexCoord')
    ru = N.new('ShaderNodeTexNoise'); ru.inputs['Scale'].default_value = escala; ru.inputs['Detail'].default_value = 6
    L.new(tc.outputs['Object'], ru.inputs['Vector'])
    rv = N.new('ShaderNodeValToRGB'); rv.color_ramp.elements[0].color = (1 - var,) * 3 + (1,); rv.color_ramp.elements[1].color = (1 + var * 0.5,) * 3 + (1,)
    L.new(ru.outputs['Fac'], rv.inputs['Fac'])
    if banda:                                         # bandas pintadas según la altura del objeto (coraza)
        sz = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sz.inputs['Vector'])
        cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'; el = cr.color_ramp.elements
        el[0].position = 0.0; el[0].color = banda[0][1] + (1,)
        for k, (pos, col) in enumerate(banda[1:]):
            e = el[1] if k == 0 else el.new(pos); e.position = pos; e.color = col + (1,)
        L.new(sz.outputs['Z'], cr.inputs['Fac']); fuente = cr.outputs['Color']
    else:
        rgb = N.new('ShaderNodeRGB'); rgb.outputs[0].default_value = color + (1,); fuente = rgb.outputs[0]
    mu = N.new('ShaderNodeVectorMath'); mu.operation = 'MULTIPLY'
    L.new(fuente, mu.inputs[0]); L.new(rv.outputs['Color'], mu.inputs[1]); L.new(mu.outputs[0], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = rug; bs.inputs['Metallic'].default_value = metal
    if sss: bs.inputs['Subsurface Weight'].default_value = sss; bs.inputs['Subsurface Scale'].default_value = 0.01
    alt = N.new('ShaderNodeTexNoise'); alt.inputs['Scale'].default_value = bump[0]; L.new(tc.outputs['Object'], alt.inputs['Vector'])
    bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump[1]; bp.inputs['Distance'].default_value = 0.002
    if tejido:                                         # trama de la lana o del lino: dos ondas cruzadas
        w1 = N.new('ShaderNodeTexWave'); w1.inputs['Scale'].default_value = tejido; w1.wave_type = 'BANDS'; w1.bands_direction = 'X'
        w2 = N.new('ShaderNodeTexWave'); w2.inputs['Scale'].default_value = tejido; w2.wave_type = 'BANDS'; w2.bands_direction = 'Z'
        for w in (w1, w2): L.new(tc.outputs['Object'], w.inputs['Vector'])
        s1 = N.new('ShaderNodeMath'); s1.operation = 'ADD'; L.new(w1.outputs['Fac'], s1.inputs[0]); L.new(w2.outputs['Fac'], s1.inputs[1])
        s2 = N.new('ShaderNodeMath'); s2.operation = 'ADD'; L.new(s1.outputs[0], s2.inputs[0]); L.new(alt.outputs['Fac'], s2.inputs[1])
        L.new(s2.outputs[0], bp.inputs['Height'])
    else: L.new(alt.outputs['Fac'], bp.inputs['Height'])
    L.new(bp.outputs['Normal'], bs.inputs['Normal'])
    return m

# ---------------------------------------------------------------- cuerpo
RECETA = {'macrodetails/universal-male-young-maxmuscle-averageweight': 0.95, 'macrodetails/caucasian-male-young': 1.0,
          'macrodetails/proportions/male-young-maxmuscle-averageweight-idealproportions': 0.8,
          'torso/torso-vshape-incr': 0.7, 'torso/torso-scale-horiz-incr': 0.25, 'torso/torso-muscle-pectoral-incr': 0.5,
          'torso/torso-muscle-dorsi-incr': 0.6, 'neck/neck-scale-horiz-incr': 0.6,
          'armslegs/l-lowerarm-muscle-incr': 0.8, 'armslegs/r-lowerarm-muscle-incr': 0.8,
          'armslegs/l-lowerleg-muscle-incr': 0.4, 'armslegs/r-lowerleg-muscle-incr': 0.4}
B3 = lambda p: np.stack([p[..., 0], -p[..., 2], p[..., 1]], -1)       # MakeHuman (Y arriba, mira a +Z) -> Blender (Z arriba, mira a -Y)

def normales_v(V, F):
    N = np.zeros_like(V)
    for f in F:
        p = V[f]; n = np.cross(p[1] - p[0], p[2] - p[0]) + (np.cross(p[2] - p[0], p[3] - p[0]) if len(f) == 4 else 0)
        N[f] += n
    return N / (np.linalg.norm(N, axis=1, keepdims=True) + 1e-12)

def construir():
    rec = {k: v for k, v in RECETA.items() if os.path.exists(mh.D + '/targets/' + k + '.target')}
    aviso('deformadores:', len(rec), 'de', len(RECETA))
    m = mh.construir(rec, altura=1.76); V = B3(m['V']); J = {k: B3(np.asarray(v)) for k, v in m['cab'].items()}
    nom = list(m['W']); Wm = np.stack([m['W'][k] for k in nom], 1); dom = np.array(nom, dtype=object)[Wm.argmax(1)]
    Fc = [[p[0] for p in f] for f, g in zip(m['F'], m['G']) if g == 'body']
    Fo = [[p[0] for p in f] for f, g in zip(m['F'], m['G']) if g in ('helper-l-eye', 'helper-r-eye')]
    usados = np.array(sorted({i for f in Fc + Fo for i in f})); nuevo = -np.ones(len(V), int); nuevo[usados] = np.arange(len(usados))
    V = V[usados]; dom = dom[usados]; Fc = [[nuevo[i] for i in f] for f in Fc]; Fo = [[nuevo[i] for i in f] for f in Fo]
    Nv = normales_v(V, Fc)
    empieza = lambda *ps: np.array([any(str(d).startswith(p) for p in ps) for d in dom])
    M = dict(V=V, J=J, Nv=Nv, Fc=Fc, torso=empieza('spine', 'pelvis', 'root', 'breast', 'clavicle'),
             brazo=empieza('upperarm', 'shoulder'), muslo=empieza('upperleg', 'pelvis', 'root'), pierna=empieza('lowerleg'), pie=empieza('foot', 'toe'))
    MAT = dict(
        piel=material('piel', (0.52, 0.28, 0.15), 0.55, var=0.10, escala=18, bump=(300, 0.08), sss=0.15),
        ojo=material('ojo', (0.05, 0.035, 0.025), 0.15, var=0.0),
        lana=material('lana', (0.72, 0.64, 0.50), 0.95, var=0.18, escala=12, bump=(400, 0.25), tejido=260),
        capa=material('capa', (0.36, 0.06, 0.05), 0.92, var=0.22, escala=8, bump=(400, 0.30), tejido=220),
        lino=material('lino', (0.86, 0.82, 0.70), 0.85, var=0.10, escala=20, bump=(500, 0.05), tejido=380,
                      banda=[(0.0, (0.42, 0.08, 0.06)), (0.06, (0.86, 0.82, 0.70)), (0.11, (0.42, 0.08, 0.06)), (0.14, (0.86, 0.82, 0.70)), (0.93, (0.42, 0.08, 0.06))]),
        tiras=material('tiras', (0.84, 0.80, 0.68), 0.88, var=0.12, escala=30, bump=(500, 0.06), tejido=380),
        bronce=material('bronce', (0.78, 0.50, 0.24), 0.32, metal=1.0, var=0.18, escala=25, bump=(120, 0.05)),
        oro=material('oro', (0.92, 0.70, 0.30), 0.25, metal=1.0, var=0.08),
        cuero=material('cuero', (0.24, 0.14, 0.08), 0.7, var=0.2, escala=30, bump=(300, 0.2)),
        madera=material('madera', (0.42, 0.27, 0.15), 0.6, var=0.25, escala=6, bump=(80, 0.05)),
        hierro=material('hierro', (0.45, 0.45, 0.46), 0.35, metal=1.0, var=0.12))
    ob = malla('cuerpo', V, Fc + Fo, MAT['piel']); ob.data.materials.append(MAT['ojo'])
    no = len(Fc)
    for k, p in enumerate(ob.data.polygons): p.material_index = 1 if k >= no else 0
    M['ob'] = ob; return M, MAT

# ---------------------------------------------------------------- piezas rígidas
def envolver(P, zs, nang, dz, margen, suav=3):
    """Radio máximo del cuerpo por anillos y sectores, alisado: una funda rígida alrededor."""
    R = np.zeros((len(zs), nang)); C = np.zeros((len(zs), 2)); idx = np.arange(nang)
    for i, z in enumerate(zs):
        s = P[np.abs(P[:, 2] - z) < dz]; c = (s[:, :2].max(0) + s[:, :2].min(0)) / 2; C[i] = c
        d = s[:, :2] - c; a = np.arctan2(d[:, 1], d[:, 0]); r = np.hypot(d[:, 0], d[:, 1])
        b = ((a + np.pi) / (2 * np.pi) * nang).astype(int) % nang; rr = np.zeros(nang); np.maximum.at(rr, b, r)
        ok = rr > 0; R[i] = np.interp(idx, idx[ok], rr[ok], period=nang)
    for _ in range(suav):
        R = (np.roll(R, 1, 1) + 2 * R + np.roll(R, -1, 1)) / 4
        R[1:-1] = (R[:-2] + 2 * R[1:-1] + R[2:]) / 4; C[1:-1] = (C[:-2] + 2 * C[1:-1] + C[2:]) / 4
    return R + margen, C

def anillos(R, C, zs):
    nang = R.shape[1]; a = -np.pi + (np.arange(nang) + 0.5) * 2 * np.pi / nang
    return np.stack([C[:, None, 0] + R * np.cos(a), C[:, None, 1] + R * np.sin(a), np.repeat(np.asarray(zs)[:, None], nang, 1)], -1)

def coraza(M, MAT):
    V, J = M['V'], M['J']; zb = J['root'][2] + 0.05; zt = J['clavicle.L'][2] + 0.012
    zs = np.linspace(zb, zt, 18); R, C = envolver(V[M['torso']], zs, 48, 0.022, 0.024, suav=5)
    R[:3] += np.array([0.012, 0.006, 0.002])[:, None]                       # falda de la coraza algo abierta
    P = anillos(R, C, zs); Vx, F = rejilla(P)
    ob = malla('coraza', Vx, F, MAT['lino'], fuera=lambda c: np.array([c[0] - C.mean(0)[0], c[1] - C.mean(0)[1], 0]))
    modif(ob, 'SOLIDIFY', thickness=0.009, offset=-1, use_even_offset=True); modif(ob, 'SUBSURF', levels=1, render_levels=1)
    M['cor'] = (R, C, zs)
    # hombreras: arco de la espalda al pecho por encima de cada hombro
    Pb = V[M['torso'] | M['brazo']]; Pb = Pb[Pb[:, 2] < J['neck01'][2] + 0.03]; partes = [ob]
    yc, zc = C[-1][1], zt - 0.09; phis = np.radians(np.linspace(-100, 100, 16))
    for s, lado in ((1, 'L'), (-1, 'R')):
        xs = s * np.linspace(0.065, 0.175, 5); Q = np.zeros((len(xs), len(phis), 3))
        for i, x in enumerate(xs):
            sl = Pb[np.abs(Pb[:, 0] - x) < 0.025]; d = sl[:, 1:] - [yc, zc]; a = np.arctan2(d[:, 0], d[:, 1]); r = np.hypot(*d.T)
            for j, ph in enumerate(phis):
                cerca = np.abs(a - ph) < np.radians(9); rb = r[cerca].max() if cerca.any() else 0.10
                rr = max(0.10, rb + 0.02); Q[i, j] = [x, yc + rr * np.sin(ph), zc + rr * np.cos(ph)]
        for _ in range(3): Q[:, 1:-1] = (Q[:, :-2] + 2 * Q[:, 1:-1] + Q[:, 2:]) / 4
        Vx, F = rejilla(Q, cerrada=False)
        h = malla('hombrera' + lado, Vx, F, MAT['lino'], fuera=lambda c: np.array([0, c[1] - yc, c[2] - zc]))
        modif(h, 'SOLIDIFY', thickness=0.008, offset=1); modif(h, 'SUBSURF', levels=1, render_levels=1); partes.append(h)
    return partes

def copia_offset(M, nombre, sel, off, mat, suav=3):
    """Funda que sigue la forma del cuerpo: copia de sus caras, separada por la normal y alisada (grebas, zapatos)."""
    V, F = M['V'], M['Fc']; Fs = [f for f in F if sel[f].all()]; us = np.array(sorted({i for f in Fs for i in f}))
    nv = -np.ones(len(V), int); nv[us] = np.arange(len(us)); P = V[us] + M['Nv'][us] * off
    Fl = [[nv[i] for i in f] for f in Fs]
    for _ in range(suav):
        acc = np.zeros_like(P); cnt = np.zeros(len(P))
        for f in Fl:
            for k in range(len(f)): acc[f[k]] += P[f[k - 1]] + P[f[(k + 1) % len(f)]]; cnt[f[k]] += 2
        P = 0.5 * P + 0.5 * acc / np.maximum(cnt, 1)[:, None]
    P += M['Nv'][us] * 0.002
    ob = malla(nombre, P, Fl, mat); modif(ob, 'SOLIDIFY', thickness=0.004, offset=-1); return ob

def casco(M, MAT):
    V, J = M['V'], M['J']; cab = V[(V[:, 2] > J['neck01'][2] + 0.05) & (np.abs(V[:, 0]) < 0.14)]
    ztop = cab[:, 2].max(); zc = ztop - 0.074; cr = cab[cab[:, 2] > zc - 0.01]
    cx = 0.0; cy = (cr[:, 1].max() + cr[:, 1].min()) / 2 + 0.008; ax = (cr[:, 0].max() - cr[:, 0].min()) / 2 + 0.017; ay = (cr[:, 1].max() - cr[:, 1].min()) / 2 + 0.016
    az = 0.11; zr = lambda t: zc + 0.004 - 0.075 * ((1 - np.cos(t)) / 2) ** 1.6
    nt, nv = 48, 22; P = np.zeros((nv, nt, 3))
    for i, h in enumerate(np.linspace(0, 1, nv)):
        for j, t in enumerate(np.linspace(0, 2 * np.pi, nt, endpoint=False)):
            z = zr(t) + (zc + az - zr(t)) * np.sin(h * np.pi / 2); e = np.clip((z - zc) / az, -1, 1); rr = np.sqrt(1 - e * e) if e > 0 else 1.0
            k = np.clip((h - 0.40) / 0.60, 0, 1); P[i, j] = [cx + ax * rr * np.sin(t), cy - ay * rr * np.cos(t) - 0.085 * k ** 2, z + 0.04 * k ** 1.5]
    cen = np.array([cx, cy, zc]); Vx, F = rejilla(P)
    ob = malla('casco', Vx, F, MAT['bronce'], fuera=lambda c: c - cen - [0, -0.04, 0.02]); modif(ob, 'SOLIDIFY', thickness=0.004, offset=1)
    modif(ob, 'SUBSURF', levels=1, render_levels=1); partes = [ob]
    # visera corta
    ts = np.radians(np.linspace(-75, 75, 16)); Q = np.array([[[cx + ax * f * np.sin(t), cy - ay * f * np.cos(t), zr(t) + 0.004 - dz] for t in ts] for f, dz in ((0.99, 0), (1.22, 0.012))])
    Vx, F = rejilla(Q, cerrada=False); v = malla('visera', Vx, F, MAT['bronce'], fuera=lambda c: np.array([0, 0, 1.0])); modif(v, 'SOLIDIFY', thickness=0.003); partes.append(v)
    # carrilleras
    for s, lado in ((1, 'L'), (-1, 'R')):
        ts = s * np.radians(np.linspace(52, 118, 10)); hs = np.linspace(0, 1, 7)
        Q = np.array([[[cx + ax * (1.04 - 0.05 * h) * np.sin(t), cy - ay * (1.04 - 0.05 * h) * np.cos(t), zr(t) - 0.002 - h * (0.092 - 0.03 * abs(abs(t) - 1.4))] for t in ts] for h in hs])
        Vx, F = rejilla(Q, cerrada=False); c = malla('carrillera' + lado, Vx, F, MAT['bronce'], fuera=lambda p: np.array([p[0] - cx, p[1] - cy, 0]))
        modif(c, 'SOLIDIFY', thickness=0.003); modif(c, 'SUBSURF', levels=1, render_levels=1); partes.append(c)
    M['cabeza'] = (cx, cy, zc, ax, ay); return partes

def escudo(M, MAT):
    Cs = np.array([0.18, -0.37, 1.03]); n = np.array([0.25, -1.0, 0.10]); n /= np.linalg.norm(n)
    u = np.array([0, 0, 1.0]) - n * n[2]; u /= np.linalg.norm(u); e = np.cross(u, n); Rr = 0.325
    rs = list(np.linspace(0, Rr, 14)); fs = np.linspace(0, 2 * np.pi, 56, endpoint=False)
    P = np.array([[Cs + r * (np.cos(f) * e + np.sin(f) * u) + n * 0.05 * (1 - (r / Rr) ** 2) for f in fs] for r in rs])
    P = np.concatenate([P, [[Cs + (Rr + 0.004) * (np.cos(f) * e + np.sin(f) * u) - n * 0.012 for f in fs]]])
    Vx, F = rejilla(P); ob = malla('escudo', Vx, F, MAT['bronce'], fuera=lambda c: n)
    modif(ob, 'SOLIDIFY', thickness=0.005, offset=-1); partes = [ob]
    # estrella de ocho puntas en relieve
    ang = np.arange(16) * np.pi / 8; rr = np.where(np.arange(16) % 2 == 0, 0.19, 0.07)
    z = lambda r: n * (0.05 * (1 - (r / Rr) ** 2) + 0.002)
    Vs = [Cs + z(0)] + [Cs + r * (np.cos(a) * e + np.sin(a) * u) + z(r) for a, r in zip(ang, rr)]
    Fs = [[0, 1 + k, 1 + (k + 1) % 16] for k in range(16)]
    st = malla('estrella', Vs, Fs, MAT['oro'], suave=False, fuera=lambda c: n); modif(st, 'SOLIDIFY', thickness=0.0025, offset=1); partes.append(st)
    # correa al cuello (telamón)
    pts = [Cs + u * 0.27 - e * 0.13 - n * 0.012, Cs + u * 0.31 - e * 0.10 + n * 0.0, np.array([-0.075, -0.05, 1.50]), np.array([-0.05, 0.06, 1.515]),
           np.array([0.05, 0.06, 1.515]), np.array([0.075, -0.05, 1.50]), Cs + u * 0.31 + e * 0.10, Cs + u * 0.27 + e * 0.13 - n * 0.012]
    cu = bpy.data.curves.new('correa', 'CURVE'); cu.dimensions = '3D'; sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts): p.co = (*q, 1)
    sp.use_endpoint_u = True; sp.order_u = 3; cu.bevel_depth = 0.006; cu.bevel_resolution = 1; cu.resolution_u = 6
    oc = bpy.data.objects.new('correa_c', cu); bpy.context.scene.collection.objects.link(oc)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(oc.evaluated_get(dg)); bpy.data.objects.remove(oc)
    co = bpy.data.objects.new('correa', me); bpy.context.scene.collection.objects.link(co); co.data.materials.append(MAT['cuero']); partes.append(co)
    return partes

def torno(nombre, perfil, base, eje, mat, lados=12, plano=1.0):
    """Sólido de revolución: perfil [(t, r)] a lo largo del eje desde base. plano<1 aplasta (punta de hoja)."""
    eje = eje / np.linalg.norm(eje); a = np.cross(eje, [1, 0, 0]); a /= np.linalg.norm(a); b = np.cross(eje, a)
    fs = np.linspace(0, 2 * np.pi, lados, endpoint=False)
    P = np.array([[base + eje * t + r * (np.cos(f) * a + plano * np.sin(f) * b) for f in fs] for t, r in perfil])
    Vx, F = rejilla(P); Vx = np.concatenate([Vx, [base + eje * perfil[0][0], base + eje * perfil[-1][0]]]); nb = len(Vx) - 2
    F += [[nb, (j + 1) % lados, j] for j in range(lados)] + [[nb + 1, (len(perfil) - 1) * lados + j, (len(perfil) - 1) * lados + (j + 1) % lados] for j in range(lados)]
    return malla(nombre, Vx, F, mat, fuera=lambda c: c - base - eje * ((c - base) @ eje))

def sarisa(M, MAT):
    m = M['J']['finger3-1.R']; base = np.array([m[0] - 0.01, m[1] + 0.01, 0.0]); up = np.array([0, 0, 1.0])
    return [torno('sarisa_asta', [(0.20, 0.016), (2.58, 0.014)], base, up, MAT['madera'], 10),
            torno('sarisa_punta', [(2.55, 0.018), (2.62, 0.016), (2.66, 0.026), (2.75, 0.022), (2.86, 0.0)], base, up, MAT['hierro'], 8, plano=0.35),
            torno('sarisa_regaton', [(0.0, 0.0), (0.10, 0.012), (0.20, 0.018), (0.24, 0.018)], base, up, MAT['hierro'], 8)]

# ---------------------------------------------------------------- tela
def tela(ob, pin, masa=0.3, flex=0.5, tens=15.0, aire=1.0, calidad=7, propia=False):
    grupo(ob, 'fijo', pin); c = ob.modifiers.new('tela', 'CLOTH'); s = c.settings
    s.quality = calidad; s.mass = masa; s.tension_stiffness = tens; s.compression_stiffness = tens; s.shear_stiffness = 5.0
    s.bending_stiffness = flex; s.air_damping = aire; s.vertex_group_mass = 'fijo'; s.pin_stiffness = 2.0
    cs = c.collision_settings; cs.collision_quality = 5; cs.distance_min = 0.006; cs.use_self_collision = propia
    if propia: cs.self_distance_min = 0.004
    c.point_cache.frame_start = 1; c.point_cache.frame_end = 200
    return c

def choque(*obs):
    for o in obs:
        if not any(m.type == 'COLLISION' for m in o.modifiers): o.modifiers.new('choque', 'COLLISION')
        o.collision.thickness_outer = 0.009; o.collision.thickness_inner = 0.004; o.collision.cloth_friction = 8.0
        o.collision.use_culling = False; o.collision.use_normal = False      # las fundas tienen dos caras: chocar por las dos

def simular(obs, cuadros, nombre):
    t = time.time(); sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = cuadros
    for f in range(1, cuadros + 1): sc.frame_set(f)
    for o in obs: congelar(o)
    sc.frame_set(1); aviso('tela %s: %d cuadros en %.0f s' % (nombre, cuadros, time.time() - t))

def quiton(M, MAT):
    V, J = M['V'], M['J']; R, C, zsc = M['cor']; z0 = zsc[0] + 0.03; zf = J['lowerleg01.L'][2] + 0.13
    cad = V[(M['torso'] | M['muslo']) & (V[:, 2] < z0 + 0.04) & (V[:, 2] > z0 - 0.04)]
    R0, C0 = envolver(cad, [z0], 72, 0.02, 0.012, suav=2); zs = np.linspace(z0, zf, 26); t = (zs - z0) / (zf - z0)
    ang = -np.pi + (np.arange(72) + 0.5) * 2 * np.pi / 72; ruido = 0.6 + 0.4 * np.sin(3 * ang + 1.3)
    Rr = R0[0][None, :] + 0.012 + 0.055 * t[:, None] + (0.010 + 0.040 * t[:, None]) * ruido[None, :] * np.sin(14 * ang + 0.8 * np.sin(2 * ang))[None, :] ** 1
    Rr = np.maximum(Rr, R0[0][None, :] + 0.004); P = anillos(Rr, np.repeat(C0, len(zs), 0), zs); Vx, F = rejilla(P)
    c0 = C0[0]; sk = malla('quiton_falda', Vx, F, MAT['lana'], fuera=lambda c: np.array([c[0] - c0[0], c[1] - c0[1], 0]))
    pin = np.repeat(np.where(np.arange(len(zs)) < 2, 1.0, 0.0), 72); tela(sk, pin, masa=0.35, flex=1.0)
    out = [sk]
    for s, L in ((1, 'L'), (-1, 'R')):
        a, b = J['upperarm01.' + L], J['lowerarm01.' + L]; u = (b - a) / np.linalg.norm(b - a); lg = np.linalg.norm(b - a)
        e1 = np.cross(u, [0, 1.0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(u, e1)
        brazo = V[M['brazo']]; d = brazo - a; tt = d @ u; perp = d - np.outer(tt, u); ra = np.percentile(np.linalg.norm(perp, axis=1)[(tt > 0.02) & (tt < 0.5 * lg)], 92)
        ts = np.linspace(-0.04, 0.55 * lg, 12); fs = np.linspace(0, 2 * np.pi, 32, endpoint=False)
        P = np.array([[a + u * x + (ra + 0.014 + 0.03 * max(0, x / (0.55 * lg)) ** 1.2 + 0.008 * np.sin(7 * f) * max(0, x / (0.55 * lg))) * (np.cos(f) * e1 + np.sin(f) * e2) for f in fs] for x in ts])
        Vx, F = rejilla(P); ob = malla('quiton_manga' + L, Vx, F, MAT['lana'], fuera=lambda c, a=a, u=u: (c - a) - u * ((c - a) @ u))
        tela(ob, np.repeat(np.where(np.arange(len(ts)) < 3, 1.0, 0.0), 32), masa=0.3, flex=1.0); out.append(ob)
    return out

def pteruges(M, MAT, fila):
    R, C, zs = M['cor']; nang = R.shape[1]; n = 26; ancho = 2 * np.pi / n * 0.44; desf = 0 if fila == 0 else np.pi / n
    largo, dr, fl = (0.16, -0.002, 0.03) if fila == 0 else (0.235, -0.006, 0.02)
    Rb = lambda a: np.interp((a + np.pi) / (2 * np.pi) * nang - 0.5, np.arange(nang), R[0], period=nang)
    Vt, F, pin = [], [], []; filas = 7
    for k in range(n):
        ac = -np.pi + 2 * np.pi * k / n + desf; base = len(Vt)
        for i in range(filas):
            h = i / (filas - 1)
            for a in np.linspace(ac - ancho, ac + ancho, 3):
                r = Rb(a) + dr + fl * h; Vt.append([C[0][0] + r * np.cos(a), C[0][1] + r * np.sin(a), zs[0] + 0.02 - largo * h]); pin.append(1.0 if i == 0 else 0.0)
        for i in range(filas - 1):
            for j in range(2): q = base + i * 3 + j; F.append([q, q + 1, q + 4, q + 3])
    c0 = C[0]; ob = malla('pteruges%d' % fila, Vt, F, MAT['tiras'], fuera=lambda c: np.array([c[0] - c0[0], c[1] - c0[1], 0]))
    tela(ob, pin, masa=0.10, flex=40.0, tens=40.0, aire=6.0); return ob

def clamide(M, MAT, obst):
    J = M['J']; zs_ = 1.51; rx, ry = 0.18, 0.15; ts = np.radians(np.linspace(205, 0, 40))
    top = [np.array([rx * np.cos(t), ry * np.sin(t) + 0.005, zs_ - 0.02 * max(0, np.cos(t)) ** 2]) for t in ts]; fijo = [1.0] * len(top)
    a, b = J['upperarm01.L'], J['lowerarm01.L']; nb = np.array([b[2] - a[2], 0, -(b[0] - a[0])]); nb = -nb / np.linalg.norm(nb)
    if nb[2] < 0: nb = -nb
    for k, t in enumerate(np.linspace(0.12, 0.42, 6)): top.append(a + (b - a) * t + nb * 0.085); fijo.append(0.0)
    top = np.array(top); seg = np.linalg.norm(np.diff(top, axis=0), axis=1); s_ = np.concatenate([[0], np.cumsum(seg)])
    ns = 58; su = np.linspace(0, s_[-1], ns); top = np.stack([np.interp(su, s_, top[:, k]) for k in range(3)], 1); fijo = np.interp(su, s_, fijo)
    nv = 36; P = np.zeros((nv, ns, 3)); Lg = 0.84; zb = top[:, 2].min() - Lg
    O = obst[(obst[:, 2] < top[:, 2].max() - 0.02) & (obst[:, 2] > zb)]
    for j in range(ns):
        d = np.array([top[j][0], top[j][1], 0]); d /= np.linalg.norm(d) + 1e-9; pr = O[:, :2] @ d[:2]
        lat = np.linalg.norm(O[:, :2] - pr[:, None] * d[None, :2], axis=1); cerca = (lat < 0.06) & (pr > 0)
        rn = max(np.hypot(*top[j][:2]) + 0.02, (pr[cerca].max() if cerca.any() else 0) + 0.045)
        for i in range(nv):
            h = i / (nv - 1); r0 = np.hypot(*top[j][:2]); r = r0 + (rn - r0) * min(1.0, h * 14)
            pl = (0.004 + 0.035 * h) * np.sin(2 * np.pi * su[j] / 0.10 + 2.0 * h)
            P[i, j] = [d[0] * (r + pl), d[1] * (r + pl), top[j][2] - Lg * h]
        P[0, j] = top[j]
    Vx, F = rejilla(P, cerrada=False); pin = np.concatenate([np.where(fijo > 0.5, 1.0, 0.0), np.where(fijo > 0.5, 0.6, 0.0), np.zeros(ns * (nv - 2))])
    ob = malla('clamide', Vx, F, MAT['capa'], fuera=lambda c: np.array([c[0], c[1], 0]))
    tela(ob, pin, masa=0.4, flex=0.8, aire=5.0, propia=True)
    # fíbula de bronce en el hombro derecho
    p = top[0] + [0, -0.012, 0.012]; fb = torno('fibula', [(0.0, 0.0), (0.004, 0.022), (0.010, 0.020), (0.014, 0.0)], p, np.array([-0.3, -0.6, 0.5]), MAT['oro'], 14)
    return ob, fb

# ---------------------------------------------------------------- escena común (luz, cámara, render)
def escena_foto(muestras=64):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = muestras
    try: sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception as e: aviso('sin eliminación de ruido:', e)
    sc.render.film_transparent = True; sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    w = sc.world or bpy.data.worlds.new('mundo'); sc.world = w; nt = nodos(w); bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.55, 0.62, 0.72, 1); bg.inputs['Strength'].default_value = 0.35
    if 'sol' not in bpy.data.objects:
        so = bpy.data.lights.new('sol', 'SUN'); so.energy = 4.0; so.angle = math.radians(3); o = bpy.data.objects.new('sol', so); sc.collection.objects.link(o)
        Ld = Vector((-0.55, -0.75, 0.50)).normalized(); o.rotation_euler = (-Ld).to_track_quat('-Z', 'Y').to_euler()
    if 'camara' not in bpy.data.objects:
        ca = bpy.data.cameras.new('camara'); ca.lens = 70; ca.sensor_width = 36; o = bpy.data.objects.new('camara', ca); sc.collection.objects.link(o); sc.camera = o

def foto(ruta, w, h, objetivo, azim, dist, alto=0.08):
    sc = bpy.context.scene; c = sc.camera; t = Vector(objetivo); az = math.radians(azim)
    c.location = t + Vector((math.sin(az) * dist, -math.cos(az) * dist, alto * dist)); c.rotation_euler = (t - c.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.filepath = ruta
    t0 = time.time(); bpy.ops.render.render(write_still=True); aviso('foto', os.path.basename(ruta), '%.0f s' % (time.time() - t0))

def componer(capas, w, h, salida, rotulo='Prueba 2 · Tela de verdad'):
    from PIL import Image, ImageDraw, ImageFont
    lienzo = Image.new('RGB', (w, h), (0xe9, 0xdf, 0xc4))
    for ruta, x in capas:
        im = Image.open(ruta).convert('RGBA'); lienzo.paste(im, (x, 0), im)
    d = ImageDraw.Draw(lienzo); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 34)
    bx = d.textbbox((28, 22), rotulo, font=f); d.rounded_rectangle((bx[0] - 14, bx[1] - 10, bx[2] + 14, bx[3] + 10), 8, fill=(245, 238, 220)); d.text((28, 22), rotulo, font=f, fill=(40, 30, 20))
    lienzo.save(salida, quality=90); aviso('guardada', salida)

def fotos(prefijo, dir_, ancho=1.0, muestras=64):
    escena_foto(muestras); W, H = int(780 * ancho), int(1688 * ancho)
    a = os.path.join(TRAB, prefijo + '_cerca.png'); foto(a, W, H, (-0.02, -0.08, 1.40), -32, 2.45, 0.06)
    b = os.path.join(TRAB, prefijo + '_frente.png'); foto(b, H // 2, W, (0.0, 0.0, 0.99), 35, 4.35, 0.05)
    c = os.path.join(TRAB, prefijo + '_espalda.png'); foto(c, H // 2, W, (0.0, 0.0, 0.99), 145, 4.35, 0.05)
    componer([(a, 0)], W, H, os.path.join(dir_, 'FA2-P2-cerca-v.jpg' if prefijo == 'final' else prefijo + '-cerca.jpg'))
    componer([(b, 0), (c, H // 2)], H, W, os.path.join(dir_, 'FA2-P2-cuerpo-h.jpg' if prefijo == 'final' else prefijo + '-cuerpo.jpg'))

# ---------------------------------------------------------------- modelo ligero y horneado
OBJETIVO = dict(cuerpo=4300, coraza=1100, hombreraL=160, hombreraR=160, quiton_falda=1500, quiton_mangaL=260, quiton_mangaR=260,
                clamide=2000, pteruges0=700, pteruges1=700, casco=900, visera=60, carrilleraL=90, carrilleraR=90,
                escudo=700, estrella=64, correa=160, grebaL=220, grebaR=220, zapatoL=260, zapatoR=260,
                sarisa_asta=40, sarisa_punta=40, sarisa_regaton=30, fibula=40)

def ligero(pesados):
    bajos = []
    for o in pesados:
        tela_ = o.name.startswith(('clamide', 'quiton', 'pteruges'))            # la tela va de una sola hoja en el ligero
        for m in o.modifiers:
            if tela_ and m.type in ('SOLIDIFY', 'SUBSURF'): m.show_viewport = False
        dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); b = bpy.data.objects.new(o.name + '_b', me)
        for m in o.modifiers: m.show_viewport = True
        bpy.context.scene.collection.objects.link(b); n = tris(b); obj = OBJETIVO.get(o.name, 200)
        if n > obj: modif(b, 'DECIMATE', ratio=obj / n, use_collapse_triangulate=True); congelar(b)
        modif(b, 'TRIANGULATE'); congelar(b); bajos.append(b)
    bpy.ops.object.select_all(action='DESELECT')
    for b in bajos: b.select_set(True)
    bpy.context.view_layer.objects.active = bajos[0]; bpy.ops.object.join(); lo = bajos[0]; lo.name = 'falangita_ligero'
    lo.data.materials.clear(); lo.data.polygons.foreach_set('use_smooth', [True] * len(lo.data.polygons))
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0025)
    bpy.ops.object.mode_set(mode='OBJECT'); aviso('ligero:', tris(lo), 'triángulos')
    return lo

def hornear(lo, pesados, tam=2048):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    m = bpy.data.materials.new('ligero'); nt = nodos(m); lo.data.materials.append(m); N = nt.nodes; L = nt.links; bs = next(n for n in N if n.type == 'BSDF_PRINCIPLED')
    tex = N.new('ShaderNodeTexImage'); N.active = tex
    def canal(nombre, que, color=True):
        im = bpy.data.images.new(nombre, tam, tam, alpha=False); im.colorspace_settings.name = 'sRGB' if color else 'Non-Color'; tex.image = im
        for o in pesados:
            for mat in o.data.materials:
                b = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if b is None: continue
                e = b.inputs['Emission Color']
                for l in list(e.links): mat.node_tree.links.remove(l)
                if que in ('Base Color', 'Metallic', 'Roughness'):
                    s = b.inputs[que]
                    if s.links: mat.node_tree.links.new(s.links[0].from_socket, e)
                    else: v = s.default_value; e.default_value = tuple(v) if que == 'Base Color' else (v, v, v, 1)
                b.inputs['Emission Strength'].default_value = 1.0 if que != 'off' else 0.0
        bpy.ops.object.select_all(action='DESELECT')
        for o in pesados: o.select_set(True)
        lo.select_set(True); bpy.context.view_layer.objects.active = lo
        t = time.time(); tipo = {'NORMAL': 'NORMAL', 'AO': 'AO'}.get(que, 'EMIT'); sc.cycles.samples = 24 if tipo == 'AO' else 1
        bpy.ops.object.bake(type=tipo, use_selected_to_active=True, cage_extrusion=0.02, max_ray_distance=0.08, margin=6, normal_space='TANGENT')
        aviso('horneado', nombre, '%.0f s' % (time.time() - t)); return im
    alb = canal('p2_color', 'Base Color'); rug = canal('p2_rug', 'Roughness', False); met = canal('p2_metal', 'Metallic', False)
    for o in pesados:
        for mat in o.data.materials:
            b = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if b: b.inputs['Emission Strength'].default_value = 0.0
    nor = canal('p2_normal', 'NORMAL', False); ao = canal('p2_ao', 'AO', False)
    # paquete ORM: oclusión (R), rugosidad (G), metal (B)
    px = lambda im: np.array(im.pixels[:]).reshape(tam, tam, 4)
    orm = np.stack([px(ao)[..., 0], px(rug)[..., 0], px(met)[..., 0], np.ones((tam, tam))], -1)
    im = bpy.data.images.new('p2_orm', tam, tam, alpha=False); im.colorspace_settings.name = 'Non-Color'; im.pixels[:] = orm.ravel()
    rutas = {}
    for img, nombre, fmt in ((alb, 'p2_color.jpg', 'JPEG'), (nor, 'p2_normal.png', 'PNG'), (im, 'p2_orm.png', 'PNG')):
        img.filepath_raw = os.path.join(TRAB, nombre); img.file_format = fmt; img.save(); rutas[nombre] = img.filepath_raw
    # material final del modelo ligero: solo las tres texturas
    N.remove(tex)
    ta = N.new('ShaderNodeTexImage'); ta.image = alb
    to = N.new('ShaderNodeTexImage'); to.image = im
    tn = N.new('ShaderNodeTexImage'); tn.image = nor
    sp = N.new('ShaderNodeSeparateColor'); L.new(to.outputs['Color'], sp.inputs['Color'])
    ma = N.new('ShaderNodeMath'); ma.operation = 'MULTIPLY_ADD'; L.new(sp.outputs[0], ma.inputs[0]); ma.inputs[1].default_value = 0.65; ma.inputs[2].default_value = 0.35
    mu = N.new('ShaderNodeVectorMath'); mu.operation = 'MULTIPLY'; L.new(ta.outputs['Color'], mu.inputs[0]); L.new(ma.outputs[0], mu.inputs[1])
    L.new(mu.outputs[0], bs.inputs['Base Color']); L.new(sp.outputs[1], bs.inputs['Roughness']); L.new(sp.outputs[2], bs.inputs['Metallic'])
    nm = N.new('ShaderNodeNormalMap'); L.new(tn.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], bs.inputs['Normal'])
    mb = sum(os.path.getsize(p) for p in rutas.values()) / 1e6; aviso('texturas: %.2f MB' % mb, rutas)
    return mb

# ---------------------------------------------------------------- principal
def principal():
    if OPC.get('recargar') and os.path.exists(ESCENA):
        bpy.ops.wm.open_mainfile(filepath=ESCENA); aviso('escena simulada recargada')
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        M, MAT = construir(); cuerpo = M['ob']; V = M['V']
        partes = coraza(M, MAT) + casco(M, MAT) + escudo(M, MAT) + sarisa(M, MAT)
        for s, L in ((1, 'L'), (-1, 'R')):
            lado = (V[:, 0] * s) > 0.02
            partes.append(copia_offset(M, 'greba' + L, M['pierna'] & lado & (V[:, 2] > 0.15) & (V[:, 2] < M['J']['lowerleg01.L'][2] - 0.02), 0.010, MAT['bronce']))
            partes.append(copia_offset(M, 'zapato' + L, (M['pie'] | (M['pierna'] & (V[:, 2] < 0.13))) & lado, 0.006, MAT['cuero'], suav=2))
        aviso('cuerpo y armadura listos;', sum(tris(o) for o in [cuerpo] + partes), 'triángulos (pesado, sin modificadores)')
        cor = [o for o in partes if o.name.startswith(('coraza', 'hombrera'))]
        choque(cuerpo, *cor)
        # tanda 1: quitón (faldón y mangas)
        q = quiton(M, MAT); simular(q, 50, 'quitón')
        for o in q: modif(o, 'SOLIDIFY', thickness=0.003, offset=-1); modif(o, 'SUBSURF', levels=1, render_levels=1)
        esc = [o for o in partes if o.name in ('escudo', 'casco', 'carrilleraL', 'carrilleraR')]
        choque(*q, *esc)
        # tanda 2: fila interior de pteruges; tanda 3: fila exterior
        p1 = pteruges(M, MAT, 1); simular([p1], 40, 'pteruges interiores'); choque(p1)
        p0 = pteruges(M, MAT, 0); simular([p0], 40, 'pteruges exteriores'); choque(p0)
        # tanda 4: clámide, sobre todo lo anterior
        obst = np.concatenate([V] + [np.array([(o.matrix_world @ v.co)[:] for v in o.data.vertices]) for o in q + cor + esc + [p0, p1]])
        capa, fib = clamide(M, MAT, obst)
        at = bpy.data.objects.new('atrae', None); bpy.context.scene.collection.objects.link(at); at.location = (0, 0.03, 1.0)
        bpy.context.view_layer.objects.active = at; at.select_set(True); bpy.ops.object.forcefield_toggle()
        at.field.type = 'FORCE'; at.field.shape = 'LINE'; at.field.strength = -4.0; at.field.falloff_power = 0.0   # atrae la capa hacia el eje del cuerpo: se ciñe a la espalda y a los brazos
        simular([capa], 72, 'clámide'); bpy.data.objects.remove(at)
        modif(capa, 'SOLIDIFY', thickness=0.004, offset=1); modif(capa, 'SUBSURF', levels=1, render_levels=1)
        for p in (p0, p1): modif(p, 'SOLIDIFY', thickness=0.0025, offset=1)
        for o in bpy.data.objects:
            for mm in [m for m in o.modifiers if m.type == 'COLLISION']: o.modifiers.remove(mm)
        bpy.ops.wm.save_as_mainfile(filepath=ESCENA); aviso('escena guardada', ESCENA)
    pesados = [o for o in bpy.data.objects if o.type == 'MESH']
    if OPC.get('previa'):
        fotos('previa', TRAB, ancho=0.5, muestras=16); return
    lo = ligero(pesados); n = tris(lo); mb = hornear(lo, pesados)
    for o in pesados: o.hide_render = True
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(TRAB, 'p2_ligero.blend'))
    fotos('final', FOTOS)
    aviso('FIN: %d triángulos, %.2f MB de texturas, %.1f min' % (n, mb, (time.time() - T0) / 60))

principal()
