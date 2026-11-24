"""AL4 · «triario aligerado» (paso A): el triario (veterano de la tercera línea) que el usuario generó con la API de Meshy
(lote MS2, tarea refine 01a20a83-9e6f-73f8-b12f-867ede383d49), convertido en un modelo ligero con el esqueleto del juego,
en cuatro niveles (fino, lejos, muylejos, fondo). Copia de tools/blender/hastatus_meshy_ligero.py (FA2-R2); cambia solo:
origen, escala (por la altura de los hombros: la cimera no cuenta como estatura), pesos de la cimera (todos a «head»),
fotos AL4-* y el .json de referencia (triario.json, mismos huesos que el hastatus).

Origen del modelo: generado por el usuario con Meshy (plan de pago). Publicado como CC BY-SA 3.0, citando a Meshy como
herramienta (decisión del usuario, 23/11). NO está en el repositorio: «origen» es el triario.glb que da
GET https://api.meshy.ai/openapi/v2/text-to-3d/01a20a83-9e6f-73f8-b12f-867ede383d49 (model_urls.glb): una malla de
1 580 670 triángulos, postura A, sin esqueleto, con tres imágenes de 2048 (color, normal, metal/rugosidad en B/G).
Cuerpo y esqueleto de referencia: MakeHuman (CC0 1.0), leídos con gobierno/maquetas/soldado-rome2/construir/mh.py.

Qué hace:
 Etapa 1. Escala por la línea de los hombros (la de MakeHuman), pies en el suelo, centrado por la cadera (ejes del juego:
   x, y arriba, z adelante). Aligera con Decimate (fino ≤ 11 800, lejos ≤ 3 400, muylejos ≤ 750, fondo ≤ 340 triángulos:
   el paso B suma escudo, lanza y espada), UV nuevas en el 75 % izquierdo del atlas y hornea en Cycles color, normal y ORM.
 Etapa 2. Encaja el esqueleto de MakeHuman en la postura A, pasa pesos por cercanía (faldón y capa: media con «root»;
   cabeza, casco y cimera: «head»), vuelve a la postura de reposo del juego. Fino 74 huesos, el resto 36. Fino y lejos:
   cortados en las muñecas (el paso B pone las manos de MakeHuman); muylejos y fondo: mano de Meshy cerrada en puño.

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  blender-py tools/blender/triario_meshy_ligero.py -- origen=<triario.glb> salida=<carpeta> [fotos=gobierno/capturas-tarea] [etapa=1|2] [muestras=64]
"""
import bpy, numpy as np, math, os, sys, time, json
from mathutils import Vector, Matrix, kdtree
T0 = time.time()
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
sys.path.insert(0, os.path.join(RAIZ, 'gobierno', 'maquetas', 'soldado-rome2', 'construir'))
os.environ.setdefault('MH_DATOS', '/opt/aqvila-taller/mhdata')
import mh, exportar as X, anim, poses
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
ORIGEN = ARG.get('origen', ''); SAL = ARG.get('salida', '/tmp/r6'); FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea'))
ETAPA = int(ARG.get('etapa', 1)); MUESTRAS = int(ARG.get('muestras', 64))
os.makedirs(SAL, exist_ok=True)
def nota(*a): print('[AL4 %5.0fs]' % (time.time() - T0), *a, flush=True)
NIVELES = [('fino', 11800, 2048, 0.012, 0.04), ('lejos', 3400, 1024, 0.025, 0.07), ('muylejos', 750, 512, 0.05, 0.12), ('fondo', 340, 512, 0.07, 0.16)]
ALTO = 1.75; U_MAX = 0.75; VOXEL = {'fino': float(ARG.get('voxel', 0.005)), 'muylejos': 0.012}
sc = bpy.context.scene
def BL(P): P = np.asarray(P, float); return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)      # juego -> Blender
def MH(P): P = np.asarray(P, float); return np.stack([P[:, 0], P[:, 2], -P[:, 1]], 1)      # Blender -> juego
def sel_solo(obs, activo):
    for o in sc.objects: o.select_set(False)
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = activo
def verts(ob): co = np.zeros(len(ob.data.vertices) * 3); ob.data.vertices.foreach_get('co', co); return co.reshape(-1, 3)
from PIL import Image, ImageDraw, ImageFont

# ======================= ETAPA 1: escala, aligerado, UV y horneado =======================
if ETAPA == 1:
    assert os.path.isfile(ORIGEN) and ORIGEN.endswith('.glb'), 'falta origen=<r.glb>'
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=ORIGEN)
    D = [o for o in sc.objects if o.type == 'MESH'][0]; D.name = 'denso'
    M = np.array(D.matrix_world); co = verts(D) @ M[:3, :3].T + M[:3, 3]
    P = MH(co); P[:, 1] -= P[:, 1].min()
    def hombro(Q, alto):                                          # altura donde el tronco se estrecha en el cuello (|x| < 0,36 del ancho de hombros)
        for y in np.arange(0.62, 0.95, 0.002) * alto:
            q = Q[np.abs(Q[:, 1] - y) < 0.004 * alto]
            if len(q) and np.abs(q[:, 0]).max() < 0.06 * alto: return y
        raise SystemExit('no encuentro los hombros')
    Vm = mh.construir()['V']; yh_mh = hombro(Vm, Vm[:, 1].max()); yh = hombro(P, P[:, 1].max()); P *= yh_mh / yh   # la cimera no cuenta como estatura
    nota('hombros: MakeHuman %.3f, Meshy %.3f -> escala; alto con cimera %.3f' % (yh_mh, yh, P[:, 1].max()))
    c = P[(P[:, 1] > 0.85) & (P[:, 1] < 1.0)]; P[:, [0, 2]] -= [np.median(c[:, 0]), np.median(c[:, 2])]   # centrado por la cadera
    D.matrix_world = Matrix.Identity(4); D.data.vertices.foreach_set('co', BL(P).ravel()); D.data.update()
    nota('denso: %d vértices, alto %.3f' % (len(P), P[:, 1].max()))
    import bmesh                                                  # el GLB parte los vértices en sus costuras UV: se cosen antes de aligerar (si no, el aligerado abre grietas)
    bm = bmesh.new(); bm.from_mesh(D.data); n0 = len(bm.verts); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-5); bm.to_mesh(D.data); bm.free(); D.data.update()
    nota('cosido: %d -> %d vértices' % (n0, len(D.data.vertices)))
    # material del GLB (Principled con color, normal y metal/rugosidad separados) y modos de horneado por emisión
    mat = D.data.materials[0]; nt = mat.node_tree; L = nt.links
    pb = [n for n in nt.nodes if n.bl_idname == 'ShaderNodeBsdfPrincipled'][0]; out = [n for n in nt.nodes if n.bl_idname == 'ShaderNodeOutputMaterial'][0]
    FUE = {'color': pb.inputs['Base Color'].links[0].from_socket, 'rough': pb.inputs['Roughness'].links[0].from_socket, 'metal': pb.inputs['Metallic'].links[0].from_socket}
    EM = {}
    for k, so in FUE.items():
        e = nt.nodes.new('ShaderNodeEmission'); L.new(so, e.inputs[0]); EM[k] = e
    def modo(m_): L.new(pb.outputs[0] if m_ == 'pbr' else EM[m_].outputs[0], out.inputs['Surface'])
    nota('imágenes del GLB:', [(im.name, im.size[:]) for im in bpy.data.images])
    for p in D.data.polygons: p.use_smooth = True
    # aligerado en cadena
    def evaluado(ob):
        dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); ob.modifiers.clear(); old = ob.data; ob.data = me; bpy.data.meshes.remove(old)
    def ntris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)
    fuente_ob = D; BAJOS = {}
    for nombre, tope, res, cage, ray in NIVELES:
        ob = bpy.data.objects.new('B_' + nombre, (D if nombre in ('fino', 'muylejos') else fuente_ob).data.copy()); sc.collection.objects.link(ob)
        if nombre in ('fino', 'muylejos'):                        # remallado por vóxeles (una sola piel cerrada) antes de aligerar: la cimera de Meshy son
            rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = VOXEL[nombre]; evaluado(ob)   # miles de cerdas sueltas que, sin esto, se comen los triángulos de los brazos
        n0 = ntris(ob); objetivo = tope * 0.985
        for intento in range(6):
            dm = ob.modifiers.new('dz', 'DECIMATE'); dm.ratio = min(1.0, objetivo / ntris(ob)); ob.modifiers.new('tri', 'TRIANGULATE'); evaluado(ob)
            if ntris(ob) <= tope: break
            objetivo *= 0.97
        nota('nivel', nombre, n0, '->', ntris(ob), 'triángulos'); BAJOS[nombre] = ob; fuente_ob = ob
    # UV: islas estiradas en u, empaquetadas en el cuadrado y comprimidas al 75 % izquierdo
    sc.tool_settings.use_uv_select_sync = True
    for nombre, ob in BAJOS.items():
        while len(ob.data.uv_layers): ob.data.uv_layers.remove(ob.data.uv_layers[0])
        ob.data.uv_layers.new(name='UVMap')
        sel_solo([ob], ob); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003); bpy.ops.object.mode_set(mode='OBJECT')
        uv = np.zeros(len(ob.data.loops) * 2); ob.data.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2); uv[:, 0] /= U_MAX
        ob.data.uv_layers.active.data.foreach_set('uv', uv.ravel())
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.pack_islands(rotate=False, scale=True, margin=0.004, shape_method='CONVEX'); bpy.ops.object.mode_set(mode='OBJECT')
        uv = np.zeros(len(ob.data.loops) * 2); ob.data.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2); uv[:, 0] *= U_MAX
        ob.data.uv_layers.active.data.foreach_set('uv', uv.ravel()); nota('UV', nombre, 'u máx %.3f v máx %.3f' % (uv[:, 0].max(), uv[:, 1].max()))
    # horneado
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True; sc.world.light_settings.distance = 0.18
    mh_ = bpy.data.materials.new('horneo'); mh_.use_nodes = True; tnodo = mh_.node_tree.nodes.new('ShaderNodeTexImage'); mh_.node_tree.nodes.active = tnodo
    for ob in BAJOS.values():
        ob.data.materials.clear(); ob.data.materials.append(mh_)
        for a in ('visible_camera', 'visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_volume_scatter', 'visible_shadow'): setattr(ob, a, False)
    def pix(im, R): a = np.empty(R * R * 4, np.float32); im.pixels.foreach_get(a); return a.reshape(R, R, 4)[::-1]
    def png(arr, ruta): Image.fromarray((np.clip(arr[..., :3], 0, 1) * 255 + 0.5).astype(np.uint8)).save(ruta, optimize=True)
    for nombre, tope, R, cage, ray in NIVELES:
        ob = BAJOS[nombre]; IM = {}
        for k, cs, fill in (('color', 'sRGB', (0.5, 0.5, 0.5, 1)), ('normal', 'Non-Color', (0.5, 0.5, 1, 1)), ('ao', 'Non-Color', (1, 1, 1, 1)), ('rough', 'Non-Color', (0.6, 0.6, 0.6, 1)), ('metal', 'Non-Color', (0, 0, 0, 1))):
            im = bpy.data.images.new('%s_%s' % (nombre, k), R, R, alpha=False); im.colorspace_settings.name = cs; im.generated_color = fill; IM[k] = im
        t1 = time.time()
        for im_k, tipo, m_, mu in (('color', 'EMIT', 'color', 4), ('rough', 'EMIT', 'rough', 2), ('metal', 'EMIT', 'metal', 1), ('normal', 'NORMAL', 'pbr', 1), ('ao', 'AO', 'pbr', 16)):
            modo(m_); tnodo.image = IM[im_k]; sc.cycles.samples = mu; sel_solo([D, ob], ob)
            bpy.ops.object.bake(type=tipo, use_selected_to_active=True, cage_extrusion=cage, max_ray_distance=ray, margin=max(2, R // 256), use_clear=False, normal_space='TANGENT', target='IMAGE_TEXTURES')
        cu = int(U_MAX * R)
        col = pix(IM['color'], R); nor = pix(IM['normal'], R); orm = np.stack([pix(IM['ao'], R)[..., 0], pix(IM['rough'], R)[..., 0], pix(IM['metal'], R)[..., 0]], -1)
        col[:, cu:, :3] = 0.5; nor[:, cu:, :3] = (0.5, 0.5, 1.0); orm[:, cu:] = (1.0, 0.6, 0.0)      # 25 % derecho libre para el paso B
        png(col, os.path.join(SAL, 'color_%s.png' % nombre)); png(nor, os.path.join(SAL, 'normal_%s.png' % nombre)); png(orm, os.path.join(SAL, 'orm_%s.png' % nombre))
        me = ob.data; Pb = MH(verts(ob)); T = np.array([list(p.vertices) for p in me.polygons]); uv = np.zeros(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', uv)
        np.savez(os.path.join(SAL, 'bruto_%s.npz' % nombre), P=Pb, T=T, UVL=uv.reshape(-1, 3, 2))
        nota('horneado', nombre, '%.0f s' % (time.time() - t1))
    np.save(os.path.join(SAL, 'denso_muestra.npy'), P[::3].astype(np.float32))
    nota('etapa 1 hecha, %.1f min' % ((time.time() - T0) / 60))

# ======================= ETAPA 2: esqueleto, pesos, reposo, exportación =======================
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
m = mh.construir(); V = m['V']; cab = m['cab']
JF = json.load(open(os.path.join(RAIZ, 'assets', 'soldados', 'triario.json'))); JL = json.load(open(os.path.join(RAIZ, 'assets', 'soldados', 'triario_lejos.json')))
H74, H36 = JF['huesos'], JL['huesos']; util74, a74 = X.huesos_utiles(m); assert util74 == H74, 'el orden de huesos no casa con el juego'
I74 = {h: i for i, h in enumerate(H74)}
def sube(k, lista):
    while k not in lista: k = m['padre'][k]
    return k
cuerpo = sorted({p[0] for f, g in zip(m['F'], m['G']) if g == 'body' for p in f}); Vb = V[cuerpo]
Wb = np.zeros((len(V), 74))
for k, w in m['W'].items(): Wb[:, a74[k]] += w
Wb = Wb[cuerpo]; Wb /= Wb.sum(1, keepdims=True) + 1e-12
DEN = np.load(os.path.join(SAL, 'denso_muestra.npy')).astype(float)
def un(v): v = np.asarray(v, float); return v / (np.linalg.norm(v, axis=-1, keepdims=True) + 1e-12)
def rodr(ax, th):
    ax = un(ax); K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]]); return np.eye(3) + math.sin(th) * K + (1 - math.cos(th)) * K @ K
def rmin(a, b):
    a, b = un(a), un(b); ax = np.cross(a, b); s = np.linalg.norm(ax)
    return np.eye(3) if s < 1e-9 else rodr(ax, math.atan2(s, a @ b))
def aff(R, src, dst): return np.c_[R, dst - R @ src]
MF = np.tile(np.c_[np.eye(3), np.zeros(3)], (74, 1, 1))                 # pose de encaje: reposo del juego -> postura A de Meshy
DEP = {}
for L, sg in (('L', 1.0), ('R', -1.0)):
    x, y = DEN[:, 0] * sg, DEN[:, 1]
    Q = DEN[(x > np.where(y < 1.12, 0.29, 0.23)) & (y < 1.34) & (y > 0.5) & ~((y < 0.90) & (x < 0.34))]   # la capa cuelga junto al brazo izquierdo: fuera
    S, E, Wr = cab['upperarm01.' + L], cab['lowerarm01.' + L], cab['wrist.' + L]
    manoV = Vb[Wb[:, [I74[h] for h in H74 if h.endswith('.' + L) and ('finger' in h or 'metacarpal' in h or 'wrist' in h)]].sum(1) > 0.5]
    Lh = np.linalg.norm(manoV - Wr, axis=1).max()
    ymin = Q[:, 1].min(); yw = ymin + Lh * 0.95
    cam_ = [S] + [Q[np.abs(Q[:, 1] - yy) < 0.012].mean(0) for yy in np.arange(1.26, yw, -0.02)] + [Q[np.abs(Q[:, 1] - yw) < 0.012].mean(0)]
    cam_ = np.array(cam_); Wp = cam_[-1]; seg = np.linalg.norm(np.diff(cam_, axis=0), axis=1); s_ = np.r_[0, np.cumsum(seg)]
    fr = np.linalg.norm(E - S) / (np.linalg.norm(E - S) + np.linalg.norm(Wr - E)); Ep = np.array([np.interp(fr * s_[-1], s_, cam_[:, i]) for i in range(3)])
    k1 = np.linalg.norm(Ep - S) / np.linalg.norm(E - S); k2 = np.linalg.norm(Wp - Ep) / np.linalg.norm(Wr - E)
    u1, u2 = un(E - S), un(Wr - E)
    R1 = rmin(E - S, Ep - S) @ (np.eye(3) + (k1 - 1) * np.outer(u1, u1)); R2 = rmin(Wr - E, Wp - Ep); S2 = np.eye(3) + (k2 - 1) * np.outer(u2, u2)
    hm = poses.mano(m, L); Hq = Q[Q[:, 1] < yw]; dp = un(Hq.mean(0) - Wp); ev = np.linalg.svd(Hq - Hq.mean(0))[2]; npal = ev[2] - dp * (ev[2] @ dp); npal = un(npal)
    if npal[0] * sg > 0: npal = -npal                                     # palma hacia el muslo
    pm = un(hm['palma'] - hm['d'] * (hm['palma'] @ hm['d']))
    Fm = np.stack([hm['d'], pm, np.cross(hm['d'], pm)], 1); Fp = np.stack([dp, npal, np.cross(dp, npal)], 1); RH = Fp @ Fm.T
    v2 = un(Wp - Ep); Rrel = RH @ R2.T; b = un(np.cross(v2, [0.3, 0.5, 0.8])); rb = Rrel @ b; rb -= v2 * (rb @ v2); th = math.atan2(np.cross(b, rb) @ v2, b @ un(rb))
    for h in ('upperarm01.', 'upperarm02.'): MF[I74[h + L]] = aff(R1, S, S)
    MF[I74['lowerarm01.' + L]] = aff(R2 @ S2, E, Ep); MF[I74['lowerarm02.' + L]] = aff(rodr(v2, th / 2) @ R2 @ S2, E, Ep)
    for h in H74:
        if h.endswith('.' + L) and ('finger' in h or 'metacarpal' in h or h.startswith('wrist')): MF[I74[h]] = aff(RH, Wr, Wp)
    DEP[L] = dict(codo=Ep.round(3), muneca=Wp.round(3), k1=round(k1, 2), k2=round(k2, 2), giro=round(math.degrees(th)))
nota('encaje de brazos:', DEP)
def lbs(P, W, Ms): Mv = np.einsum('vb,bij->vij', W, Ms); return np.einsum('vij,vj->vi', Mv, np.c_[P, np.ones(len(P))]), Mv
Vfit, _ = lbs(Vb, Wb, MF)
# comprobación del encaje: nube del denso (marrón), cuerpo de MakeHuman doblado (azul)
im = Image.new('RGB', (1600, 900), 'white'); dr = ImageDraw.Draw(im)
for ox, ax_ in ((400, 0), (1200, 2)):
    for Qd, colr in ((DEN[::4], (200, 120, 60)), (Vfit, (40, 40, 200))):
        for p in Qd: dr.point((ox + p[ax_] * 450, 880 - p[1] * 450), fill=colr)
im.save(os.path.join(SAL, 'encaje.png'))
KD = kdtree.KDTree(len(Vfit))
for i, p in enumerate(Vfit): KD.insert(p, i)
KD.balance()
ROOT = I74['root']; HEAD = I74['head']; PIERNA = [I74[h] for h in H74 if 'upperleg' in h or 'lowerleg' in h]
def pesos(P, T):
    W = np.zeros((len(P), 74)); dist = np.zeros(len(P))
    for i, p in enumerate(P):
        r = KD.find_n(p, 6); ws = np.array([1 / (d + 2e-3) ** 2 for _, _, d in r]); W[i] = (Wb[[j for _, j, _ in r]] * ws[:, None]).sum(0) / ws.sum(); dist[i] = r[0][2]
    falda = (P[:, 1] > 0.5) & (P[:, 1] < 1.02) & (np.abs(P[:, 0]) < 0.27) & (dist > 0.018)
    pl = W[falda][:, PIERNA]; W[np.ix_(falda, PIERNA)] = pl * 0.5; W[falda, ROOT] += pl.sum(1) * 0.5
    vec = [[] for _ in range(len(P))]
    for a, b, c in T: vec[a] += [b, c]; vec[b] += [a, c]; vec[c] += [a, b]
    vec = [np.unique(v) for v in vec]
    for _ in range(2): W = 0.5 * W + 0.5 * np.array([W[v].mean(0) if len(v) else W[i] for i, v in enumerate(vec)])
    cabz = np.clip((P[:, 1] - 1.47) / 0.08, 0, 1) * ((np.abs(P[:, 0]) < 0.14) | (P[:, 1] > 1.62))      # la cimera entera, con la cabeza      # sin coger las hombreras; W *= (1 - cabz)[:, None]; W[:, HEAD] += cabz
    return W / W.sum(1, keepdims=True)
def cuatro(W):
    idx = np.argsort(-W, 1)[:, :4]; w = np.take_along_axis(W, idx, 1); w /= w.sum(1, keepdims=True); return idx.astype(np.uint8), w.astype(np.float32)
# puño cerrado (como el juego para los niveles lejanos)
Dp = np.tile(np.eye(3), (1, len(m['huesos']), 1, 1)); lib = np.zeros(len(m['huesos']), bool); poses.punos(m, Dp, lib)
APUNO = X.hornear(Dp, anim.fk(m, Dp, lib, cab['root'][None]), m, util74)[0].reshape(74, 3, 4)
A74 = np.frombuffer(open(os.path.join(RAIZ, 'assets', 'soldados', JF['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, 74, 3, 4).astype(float)
A36 = np.frombuffer(open(os.path.join(RAIZ, 'assets', 'soldados', JL['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, 36, 3, 4).astype(float)
CMANO = np.eye(74)                                                          # dedos y metacarpos -> muñeca
for h in H74:
    if 'finger' in h or 'metacarpal' in h: CMANO[I74[h]] = 0; CMANO[I74[h], I74['wrist.' + h[-1]]] = 1
def cerrar(P, W, Rb=0.026, tmax=1.05 * math.pi):
    """Cierra cada mano alrededor de un asta de 3,4 cm: curva los dedos (más allá de los nudillos) sobre el eje índice->meñique."""
    P = P.copy()
    for L in 'LR':
        cols = [I74[h] for h in H74 if h.endswith('.' + L) and ('finger' in h or 'metacarpal' in h or h.startswith('wrist'))]
        hm = poses.mano(m, L); K = (cab['finger2-1.' + L] + cab['finger5-1.' + L]) / 2 - hm['d'] * 0.008; d = hm['d']; n = hm['palma']; Xa = un(np.cross(n, d))
        sel = np.where(W[:, cols].sum(1) > 0.5)[0]; q = P[sel] - K; t = q @ d; sn = q @ n; xl = q @ Xa
        x2 = (cab['finger2-1.' + L] - K) @ Xa; pul = (xl - x2) * np.sign((cab['finger5-1.' + L] - K) @ Xa - x2)      # pulgar: al otro lado del índice
        f = np.clip((t + 0.004) / 0.012, 0, 1) * np.clip(1 + pul / 0.012, 0, 1)
        th = np.minimum(np.maximum(t, 0) / Rb, tmax); resto = np.maximum(t - tmax * Rb, 0); r = Rb - sn
        nueva = K + n * Rb + (-np.outer(r * np.cos(th), n) + np.outer(r * np.sin(th), d)) + np.outer(resto, -n * np.sin(tmax) + d * np.cos(tmax)) + np.outer(xl, Xa)
        P[sel] = P[sel] + f[:, None] * (nueva - P[sel])
    return P
CUADROS = {'quieto': 0, 'guardia': 12, 'cubrirse': 14, 'golpear': 16}
C36 = np.zeros((74, 36))
for h in H74: C36[I74[h], H36.index(sube(h, H36))] = 1
def normales(P, T):
    n = np.zeros_like(P); f = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    for k in range(3): np.add.at(n, T[:, k], f)
    return un(n)
def cortar(P, T, UVL, W):
    """Corta el antebrazo en el plano de la muñeca de MakeHuman (normal al antebrazo): quita la mano de Meshy y parte los
    triángulos que cruzan el plano, con posición, UV y pesos interpolados. El borde queda en el plano, sin dientes."""
    P = list(P); W = list(W); EJ = {}; Pa = np.asarray(P)
    for L, sg in (('L', 1.0), ('R', -1.0)): EJ[L] = (cab['wrist.' + L], un(cab['wrist.' + L] - cab['lowerarm01.' + L]), sg)
    T2, UV2, nuevos, arista = [], [], {'L': [], 'R': []}, {}
    for f, tri in enumerate(T):
        c = Pa[tri].mean(0); L = 'L' if c[0] > 0 else 'R'; Wr, d, sg = EJ[L]; q = Pa[tri] - Wr; t = q @ d; rad = np.linalg.norm(q - np.outer(t, d), axis=1)
        if abs(c[0]) < 0.1 or rad.min() > 0.15 or (t <= 0).all(): T2.append(list(tri)); UV2.append(UVL[f]); continue
        if (t > 0).all(): continue
        poli = []
        for i in range(3):
            j = (i + 1) % 3; a_, b_ = int(tri[i]), int(tri[j])
            if t[i] <= 0: poli.append((a_, UVL[f, i]))
            if (t[i] <= 0) != (t[j] <= 0):
                al = t[i] / (t[i] - t[j]); k = (min(a_, b_), max(a_, b_))
                if k not in arista:
                    arista[k] = len(P); P.append(P[a_] + al * (P[b_] - P[a_])); W.append(W[a_] + al * (W[b_] - W[a_])); nuevos[L].append(arista[k])
                poli.append((arista[k], UVL[f, i] + al * (UVL[f, j] - UVL[f, i])))
        for i in range(1, len(poli) - 1): T2.append([poli[0][0], poli[i][0], poli[i + 1][0]]); UV2.append(np.array([poli[0][1], poli[i][1], poli[i + 1][1]]))
    P = np.array(P); W = np.array(W); info = {}
    for L, (Wr, d, sg) in EJ.items():
        B = P[nuevos[L]]; q = B - Wr; rad = np.linalg.norm(q - np.outer(q @ d, d), axis=1)
        info['wrist.' + L] = dict(centro_hueso=Wr.round(4).tolist(), eje=d.round(4).tolist(), centro_borde=B.mean(0).round(4).tolist(), radio_medio=round(float(rad.mean()), 4), radio_max=round(float(rad.max()), 4), vertices_borde=len(B))
    nota('corte de muñecas', {k: (v['vertices_borde'], v['radio_medio']) for k, v in info.items()})
    return P, np.array(T2, T.dtype), np.array(UV2, UVL.dtype), W, info
MUNECAS = {}
LIG = {}; LEE = []
for nombre, tope, R, cage, ray in NIVELES:
    B = np.load(os.path.join(SAL, 'bruto_%s.npz' % nombre)); Pa, T, UVL = B['P'], B['T'], B['UVL']
    W = pesos(Pa, T); _, Mv = lbs(Pa, W, MF)
    Pr = np.linalg.solve(Mv[:, :, :3], (Pa - Mv[:, :, 3])[..., None])[..., 0]          # vuelta a la postura de reposo del juego
    if nombre in ('fino', 'lejos'): W = W @ CMANO; Pr, T, UVL, W, MUNECAS[nombre] = cortar(Pr, T, UVL, W)    # sin manos: las pone el paso B
    else: Pr = cerrar(Pr, W); W = W @ CMANO                                             # puño de Meshy cerrado en la malla
    if nombre != 'fino': W = W @ C36; H = H36; AN = A36; CL = JL['clips']
    else: H = H74; AN = A74; CL = JF['clips']
    # vértices partidos en las costuras UV
    clave = {}; vid = []; uvs = []; Tn = np.zeros_like(T)
    for t in range(len(T)):
        for k in range(3):
            q = (int(T[t, k]), round(float(UVL[t, k, 0]), 6), round(float(UVL[t, k, 1]), 6))
            if q not in clave: clave[q] = len(vid); vid.append(q[0]); uvs.append(UVL[t, k])
            Tn[t, k] = clave[q]
    vid = np.array(vid); Nr = normales(Pr, T)[vid]; idx, w = cuatro(W[vid])
    np.savez(os.path.join(SAL, 'ligero_%s.npz' % nombre), P=Pr[vid].astype(np.float32), N=Nr.astype(np.float32), UV=np.array(uvs, np.float32), T=Tn.astype(np.uint16 if len(vid) < 65536 else np.uint32), huesos=np.array(H), idx=idx, w=w)
    poses_ = {}
    for clip, df in CUADROS.items():
        Mf = AN[CL[clip]['ini'] + df]; Pp, _ = lbs(Pr, W, Mf); poses_[clip] = Pp
    LIG[nombre] = dict(T=T, UVL=UVL, poses=poses_, tris=len(T), verts=len(vid), kb=sum(os.path.getsize(os.path.join(SAL, '%s_%s.png' % (t, nombre))) for t in ('color', 'normal', 'orm')) // 1024 + os.path.getsize(os.path.join(SAL, 'ligero_%s.npz' % nombre)) // 1024, R=R)
    nota('nivel', nombre, len(T), 'triángulos', len(vid), 'vértices', len(H), 'huesos', 'alto en reposo %.3f' % Pr[:, 1].max(), '| KB', LIG[nombre]['kb'])
open(os.path.join(SAL, 'LEEME.txt'), 'w').write("""AL4 paso A · triario de Meshy aligerado (CC BY-SA 3.0, Meshy como herramienta; generado por el usuario). Guion: tools/blender/triario_meshy_ligero.py
Por nivel (fino, lejos, muylejos, fondo): ligero_<nivel>.npz y color_/normal_/orm_<nivel>.png (fino 2048, lejos 1024, muylejos y fondo 512).
npz: P (nv,3) float32 vértices en REPOSO de MakeHuman (mh.construir() por defecto), metros, ejes del juego: x, y arriba, z adelante, pies en y=0.
     N (nv,3) normales en reposo; UV (nv,2) con v hacia arriba (convenio Blender/three.js, sin voltear); T (nt,3) triángulos (uint16).
     huesos: nombres. fino = 74 huesos (los de assets/soldados/triario.json, movimientos_escudo_74.bin); los otros = 36 (triario_lejos.json, _36.bin).
     idx (nv,4) uint8 índices sobre «huesos»; w (nv,4) float32, suman 1.
Vértices ya partidos en las costuras UV (un vértice = una UV). Doblar: P' = sum_k w_k * M[idx_k] @ [P,1] con M (3x4) del cuadro del .bin.
Fino y lejos: SIN manos. Cortados en el plano de la muñeca de MakeHuman (normal al antebrazo: eje = wrist - lowerarm01),
     los triángulos que cruzan el plano se parten en él (borde limpio, sin dientes). El paso B pone las manos de MakeHuman desde ese plano (en lejos, con el puño cerrado).
     Los vértices del borde llevan pesos de antebrazo y muñeca. Las islas de la mano siguen en el atlas, sin uso.
Muylejos y fondo: mano de Meshy cerrada en puño en la malla, sin dedos.
Atlas: el cuerpo ocupa u <= 0,75; el 25 % derecho (u > 0,75) está libre (color gris, normal plana, ORM (1, 0,6, 0)) para escudo, lanza y espada.
normal: espacio tangente, convenio OpenGL (verde hacia arriba), como three.js. orm: R oclusión, G rugosidad, B metal.
Sin escudo, lanza ni espada: los pone el paso B.
Muñecas en reposo (metros, ejes del juego; radio = distancia del borde al eje del antebrazo):
""" + '\n'.join('  %s %s: %s' % (n, h, json.dumps(v, ensure_ascii=False)) for n, d in MUNECAS.items() for h, v in d.items()) + '\n')

# ---- fotos (luz común de las pruebas)
def lin(c): c = c / 255.0; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True
wn = sc.world.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld'); cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.35
perg = wn.new('ShaderNodeBackground'); perg.inputs[0].default_value = (lin(0xe9), lin(0xdf), lin(0xc4), 1); perg.inputs[1].default_value = 1.0
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl = sc.world.node_tree.links
wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(perg.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 6
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol_d.angle = math.radians(3); sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 70; cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
MAT = {}
def material(nombre):
    if nombre in MAT: return MAT[nombre]
    mt = bpy.data.materials.new(nombre); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links
    def tx(t, cs): n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(os.path.join(SAL, '%s_%s.png' % (t, nombre))); n.image.colorspace_settings.name = cs; return n
    tc, tn, to = tx('color', 'sRGB'), tx('normal', 'Non-Color'), tx('orm', 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0])
    ao = nt.nodes.new('ShaderNodeMath'); ao.operation = 'MULTIPLY_ADD'; L.new(sp.outputs[0], ao.inputs[0]); ao.inputs[1].default_value = 0.65; ao.inputs[2].default_value = 0.35
    mu = nt.nodes.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1.0; L.new(tc.outputs[0], mu.inputs['A']); L.new(ao.outputs[0], mu.inputs['B'])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L.new(mu.outputs['Result'], pb.inputs['Base Color']); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); L.new(pb.outputs[0], o.inputs['Surface']); MAT[nombre] = mt; return mt
def malla(nombre, clip, dx=0.0):
    d = LIG[nombre]; me = bpy.data.meshes.new(nombre + clip); P = d['poses'][clip] + [dx, 0, 0]
    me.from_pydata(BL(P).tolist(), [], d['T'].tolist()); me.update(); me.uv_layers.new(name='UVMap').data.foreach_set('uv', d['UVL'].astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material(nombre)); ob = bpy.data.objects.new(nombre + clip, me); sc.collection.objects.link(ob); return ob
def foto(ruta, w, h, objetivo, dist, azim, elev):
    objetivo = Vector(objetivo); d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = objetivo + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    der = (-d).cross(Vector((0, 0, 1))).normalized(); arr = der.cross(-d).normalized(); hl = (-der * 0.62 + arr * 0.55 + d * 0.56).normalized()
    sol.rotation_euler = (-hl).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100; sc.render.filepath = ruta; sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')
def solo(obs):
    for o in sc.objects:
        if o.type == 'MESH': o.hide_render = o not in obs
def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def etiqueta(img, txt, x, y, t):
    d = ImageDraw.Draw(img); f = fuente(t); b = d.textbbox((0, 0), txt, font=f)
    d.rounded_rectangle((x, y, x + b[2] + 24, y + b[3] + 18), 10, fill=(244, 236, 214)); d.text((x + 12, y + 7), txt, font=f, fill=(40, 30, 20))
os.makedirs(FOTOS, exist_ok=True)
ob = malla('fino', 'quieto'); solo([ob])
im1 = foto(os.path.join(SAL, 'f_cerca.png'), 780, 1688, (0.03, 0.0, 1.30), 2.25, -42, 4); etiqueta(im1, 'Triario · Meshy aligerado · fino', 16, 12, 27)
im1.save(os.path.join(FOTOS, 'AL4-1-ligero-v.jpg'), quality=90)
im2 = Image.new('RGB', (1688, 780))
for i, (nombre, *_r) in enumerate(NIVELES):
    ob = malla(nombre, 'guardia'); solo([ob]); p = foto(os.path.join(SAL, 'f_niv_%s.png' % nombre), 422, 780, (0.0, 0.0, 0.92), 4.6, -35, 3)
    etiqueta(p, '%s · %d triáng.' % (nombre, LIG[nombre]['tris']), 8, 700, 19); im2.paste(p, (422 * i, 0))
etiqueta(im2, 'Triario aligerado · cuatro niveles en «guardia»', 16, 12, 27); im2.save(os.path.join(FOTOS, 'AL4-2-niveles-h.jpg'), quality=90)
im3 = Image.new('RGB', (1688, 780)); i = 0
for nombre in ('fino', 'lejos'):
    for clip in CUADROS:
        ob = malla(nombre, clip); solo([ob]); p = foto(os.path.join(SAL, 'f_mov_%s_%s.png' % (nombre, clip)), 211, 780, (0.0, 0.0, 0.92), 6.0, -35, 3)
        etiqueta(p, nombre, 6, 690, 15); etiqueta(p, clip, 6, 728, 15); im3.paste(p, (211 * i, 0)); i += 1
etiqueta(im3, 'Triario aligerado · movimientos del juego «escudo»', 16, 12, 24); im3.save(os.path.join(FOTOS, 'AL4-3-movimiento-h.jpg'), quality=90)
nota('FIN', {k: (v['tris'], v['verts'], v['kb']) for k, v in LIG.items()}, 'minutos %.1f' % ((time.time() - T0) / 60))
