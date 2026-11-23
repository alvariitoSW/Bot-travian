"""AL1 · fotos de prueba del soldado «galo-grande» tal como lo lee el juego (assets/soldados/galo-grande*.bin/.json/.webp),
doblado con los movimientos compartidos (movimientos_escudo_*.bin). Sin navegador: Blender sin pantalla y Cycles.

Fotos (gobierno/capturas-tarea/, JPG):
  AL1-1-cerca-v.jpg     390×844 (a doble densidad): el nivel fino, quieto, de tres cuartos.
  AL1-2-niveles-h.jpg   844×390: los cuatro niveles en «guardia», en color.
  AL1-3-siluetas-v.jpg  390×844: siluetas en negro (galo grande de frente y de espaldas, junto al hastatus y al galo de antes).
Usa color, relieve (normal, con el verde vuelto al convenio de Blender) y ORM, como el juego.

Uso: source /opt/aqvila-taller/entorno.sh; blender-py tools/blender/galo-grande_meshy_foto.py -- [muestras=48] [fotos=gobierno/capturas-tarea]
"""
import bpy, numpy as np, json, math, os, sys
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
MUESTRAS = int(ARG.get('muestras', 48)); FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea'))
SOL = os.path.join(RAIZ, 'assets', 'soldados'); TMP = '/tmp/al1_fotos'; os.makedirs(TMP, exist_ok=True); os.makedirs(FOTOS, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def BL(P): return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)                 # juego -> Blender

def leer(nombre):
    j = json.load(open(os.path.join(SOL, nombre + '.json'))); b = open(os.path.join(SOL, nombre + '.bin'), 'rb').read(); nv, o = j['verts'], j['off']
    a = lambda k, t, n: np.frombuffer(b, t, n, o[k])
    P = a('pos', np.float32, nv * 3).reshape(-1, 3).astype(float); UV = a('uv', np.float32, nv * 2).reshape(-1, 2)
    SI = a('si', np.uint8, nv * 4).reshape(-1, 4); SW = a('sw', np.uint8, nv * 4).reshape(-1, 4) / 255.0; SET = a('set', np.uint8, nv)
    T = a('idx', np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3).reshape(-1, 3).astype(int)
    A = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, len(j['huesos']), 3, 4).astype(float)
    return dict(j=j, P=P, UV=UV, SI=SI, SW=SW, SET=SET, T=T, A=A)

def pose(d, clip, df=0, conj=(0,)):
    M = d['A'][d['j']['clips'][clip]['ini'] + df]; Mv = np.einsum('vk,vkij->vij', d['SW'], M[d['SI']])
    Pp = np.einsum('vij,vj->vi', Mv, np.c_[d['P'], np.ones(len(d['P']))]); keep = np.isin(d['SET'], conj)
    T = d['T'][keep[d['T']].all(1)]; return Pp, T

MAT = {}
def material(nombre, d):
    if nombre in MAT: return MAT[nombre]
    tx_ = d['j']['texturas']; mt = bpy.data.materials.new(nombre); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links
    def tx(k, cs):
        n = nt.nodes.new('ShaderNodeTexImage'); png = os.path.join(TMP, tx_[k] + '.png'); im = Image.open(os.path.join(SOL, tx_[k])).convert('RGB')
        if k == 'normal': a_ = np.asarray(im).copy(); a_[..., 1] = 255 - a_[..., 1]; im = Image.fromarray(a_)     # el paso B lo volteó para el juego
        im.save(png)
        n.image = bpy.data.images.load(png); n.image.colorspace_settings.name = cs; return n
    tc, to, tn = tx('color', 'sRGB'), tx('orm', 'Non-Color'), tx('normal', 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0])
    ao = nt.nodes.new('ShaderNodeMath'); ao.operation = 'MULTIPLY_ADD'; L.new(sp.outputs[0], ao.inputs[0]); ao.inputs[1].default_value = 0.65; ao.inputs[2].default_value = 0.35
    mu = nt.nodes.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1.0; L.new(tc.outputs[0], mu.inputs['A']); L.new(ao.outputs[0], mu.inputs['B'])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L.new(mu.outputs['Result'], pb.inputs['Base Color']); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); L.new(pb.outputs[0], o.inputs['Surface']); MAT[nombre] = mt; return mt
NEGRO = bpy.data.materials.new('negro'); NEGRO.use_nodes = True; _n = NEGRO.node_tree.nodes; _n.clear()
_e = _n.new('ShaderNodeEmission'); _e.inputs[0].default_value = (0, 0, 0, 1); NEGRO.node_tree.links.new(_e.outputs[0], _n.new('ShaderNodeOutputMaterial').inputs['Surface'])

def malla(nombre, d, clip, dx=0.0, giro=0.0, negro=False, df=0, dy=0.0):
    Pp, T = pose(d, clip, df); c, s = math.cos(giro), math.sin(giro); Pp = Pp @ np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]]).T + [dx, dy, 0]
    me = bpy.data.meshes.new(nombre); me.from_pydata(BL(Pp).tolist(), [], T.tolist()); me.update()
    uv = d['UV'][T.ravel()] * [1, -1] + [0, 1]; me.uv_layers.new(name='UVMap').data.foreach_set('uv', uv.astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    me.materials.append(NEGRO if negro else material(nombre.split('#')[0], d)); ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); return ob

# ---- luz común de las pruebas (la de FA2)
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
def foto(ruta, w, h, objetivo, dist, azim, elev, orto=None):
    objetivo = Vector(objetivo); d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = objetivo + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cam_d.type = 'ORTHO' if orto else 'PERSP'
    if orto: cam_d.ortho_scale = orto
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

G = {n: leer('galo-grande' + s) for n, s in (('fino', ''), ('lejos', '_lejos'), ('muylejos', '_muylejos'), ('fondo', '_fondo'))}
# 1 · de cerca
ob = malla('fino', G['fino'], 'quieto'); solo([ob])
im = foto(os.path.join(TMP, 'cerca.png'), 780, 1688, (0.03, 0.0, 1.0), 4.2, -30, 6); etiqueta(im, 'Galo grande · fino · %d triáng.' % G['fino']['j']['tris'], 16, 12, 27)
im.save(os.path.join(FOTOS, 'AL1-1-cerca-v.jpg'), quality=88)
# 2 · los cuatro niveles en guardia
im2 = Image.new('RGB', (1688, 780))
for i, n in enumerate(G):
    ob = malla(n + '#g', G[n], 'guardia', df=12); solo([ob]); p = foto(os.path.join(TMP, 'niv_%s.png' % n), 422, 780, (0.0, 0.0, 0.92), 4.6, -35, 3)
    etiqueta(p, '%s · %d triáng.' % (n, G[n]['j']['tris']), 8, 700, 19); im2.paste(p, (422 * i, 0))
etiqueta(im2, 'Galo grande · cuatro niveles en «guardia»', 16, 12, 27); im2.save(os.path.join(FOTOS, 'AL1-2-niveles-h.jpg'), quality=88)
# 3 · siluetas en dos filas (arriba: hastatus y galo grande de frente; abajo: galo grande de espaldas y galo de antes)
H = leer('hastatus'); V = leer('galo')
obs = [malla('h#s', H, 'quieto', dx=-0.45, dy=2.15, negro=True), malla('gg#s1', G['fino'], 'quieto', dx=0.45, dy=2.15, negro=True),
       malla('gg#s2', G['fino'], 'quieto', dx=-0.45, giro=math.pi, negro=True), malla('v#s', V, 'quieto', dx=0.45, negro=True)]
solo(obs); im3 = foto(os.path.join(TMP, 'sil.png'), 780, 1688, (0.0, 0.0, 1.95), 20, 0, 0, orto=4.75)
etiqueta(im3, 'Siluetas, todos de 1,75 m', 16, 12, 24)
etiqueta(im3, 'hastatus', 40, 790, 22); etiqueta(im3, 'galo grande (frente)', 400, 790, 22)
etiqueta(im3, 'galo grande (espalda)', 16, 1620, 22); etiqueta(im3, 'galo de antes', 470, 1620, 22)
im3.save(os.path.join(FOTOS, 'AL1-3-siluetas-v.jpg'), quality=88)
print('FOTOS HECHAS', {n: (d['j']['verts'], d['j']['tris']) for n, d in G.items()})
