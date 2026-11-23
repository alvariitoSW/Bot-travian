"""AL4 · hoja de fotos del triario de Meshy, hecha en Blender sin pantalla (sin navegador).

Lee los soldados ya exportados (assets/soldados/<nombre>.json/.bin, movimientos_escudo_*.bin y las texturas webp), los
dobla en un cuadro del juego con los mismos pesos que js/gfx/soldado.js, aplica el tinte de tela con la paleta romana
(color · tela · 2,2 donde la máscara R lo marca, como el shader del juego) y enseña solo las piezas de su «muestra».
No es el render del juego (sin la luz ni el ruido del shader): sirve para ver forma, color y escala.

Uso (entorno del taller): blender-py tools/blender/triario_meshy_fotos.py -- [fotos=gobierno/capturas-tarea] [muestras=48]
Saca AL4-4-cerca-v.jpg (390×844 a doble densidad), AL4-5-niveles-h.jpg y AL4-6-siluetas-h.jpg (844×390 a doble densidad).
"""
import bpy, numpy as np, math, os, sys, json
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..')); SOL = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea')); MUESTRAS = int(ARG.get('muestras', 48)); TMP = ARG.get('tmp', '/tmp/al4-fotos')
os.makedirs(FOTOS, exist_ok=True); os.makedirs(TMP, exist_ok=True)
TELA = np.array([0x8f, 0x2f, 0x22]) / 255; ESCUDO = np.array([0x8f, 0x2a, 0x20]) / 255
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def BL(P): return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)

def leer(nombre):
    j = json.load(open(os.path.join(SOL, nombre + '.json'))); b = open(os.path.join(SOL, nombre + '.bin'), 'rb').read(); o = j['off']; n = j['verts']
    a = lambda k, t, c, cnt: np.frombuffer(b, t, cnt * c, o[k]).reshape(cnt, c) if c > 1 else np.frombuffer(b, t, cnt, o[k])
    d = dict(j=j, P=a('pos', np.float32, 3, n).astype(float), UV=a('uv', np.float32, 2, n), SI=a('si', np.uint8, 4, n).astype(int), SW=a('sw', np.uint8, 4, n) / 255.0,
             SET=a('set', np.uint8, 1, n), T=a('idx', np.uint32 if j['idx32'] else np.uint16, 3, j['tris']).astype(int))
    nb = len(j['huesos']); d['A'] = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nb, 3, 4).astype(float); return d

MATS = {}
def material(nombre, d):
    if nombre in MATS: return MATS[nombre]
    t = d['j']['texturas']; ab = lambda k: Image.open(os.path.join(SOL, t[k])).convert('RGB')
    col = np.asarray(ab('color'), np.float32) / 255; mk = np.asarray(ab('masc').resize(col.shape[1::-1], Image.BILINEAR), np.float32) / 255
    cl = lin(col); cl = cl * (1 - mk[..., :1]) + cl * lin(TELA) * 2.2 * mk[..., :1]; cl = cl * (1 - mk[..., 2:3]) + cl * lin(ESCUDO) * 2.2 * mk[..., 2:3]
    ruta = os.path.join(TMP, nombre + '_tenido.png'); Image.fromarray((np.clip(srgb(cl), 0, 1) * 255 + 0.5).astype(np.uint8)).save(ruta)
    orm = os.path.join(TMP, nombre + '_orm.png'); ab('orm').save(orm); nor = os.path.join(TMP, nombre + '_nor.png'); ab('normal').save(nor)
    mt = bpy.data.materials.new(nombre); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links
    def tx(r, cs): n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(r); n.image.colorspace_settings.name = cs; return n
    tc, to, tn = tx(ruta, 'sRGB'), tx(orm, 'Non-Color'), tx(nor, 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0])
    ao = nt.nodes.new('ShaderNodeMath'); ao.operation = 'MULTIPLY_ADD'; L.new(sp.outputs[0], ao.inputs[0]); ao.inputs[1].default_value = 0.65; ao.inputs[2].default_value = 0.35
    mu = nt.nodes.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1.0; L.new(tc.outputs[0], mu.inputs['A']); L.new(ao.outputs[0], mu.inputs['B'])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L.new(mu.outputs['Result'], pb.inputs['Base Color']); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    out = nt.nodes.new('ShaderNodeOutputMaterial'); L.new(pb.outputs[0], out.inputs['Surface']); MATS[nombre] = mt; return mt
NEGRO = None
def negro():
    global NEGRO
    if NEGRO is None:
        NEGRO = bpy.data.materials.new('negro'); NEGRO.use_nodes = True; nt = NEGRO.node_tree; nt.nodes.clear(); e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (0, 0, 0, 1)
        o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs['Surface'])
    return NEGRO

def poner(nombre, clip='quieto', df=0, dx=0.0, dz=0.0, giro=0.0, silueta=False):
    d = DATOS.setdefault(nombre, leer(nombre)); j = d['j']; c = j['clips'][clip]; M = d['A'][c['ini'] + min(df, c['n'] - 1)]
    Mv = np.einsum('vk,vkij->vij', d['SW'], M[d['SI']]); P = np.einsum('vij,vj->vi', Mv, np.c_[d['P'], np.ones(len(d['P']))])
    mu = 0
    for t1, k in j.get('muestra', {}).get(clip, []):
        if df / c['fps'] >= t1: mu = k
    vis = (d['SET'] == 0) | ((mu >> np.maximum(d['SET'].astype(int) - 1, 0)) & 1).astype(bool); T = d['T'][vis[d['T']].all(1)]
    g = math.radians(giro); R = np.array([[math.cos(g), 0, math.sin(g)], [0, 1, 0], [-math.sin(g), 0, math.cos(g)]]); P = P @ R.T + [dx, 0, dz]
    me = bpy.data.meshes.new(nombre); me.from_pydata(BL(P).tolist(), [], T.tolist()); me.update()
    me.uv_layers.new(name='UVMap').data.foreach_set('uv', (d['UV'][T].reshape(-1, 2) * [1, -1] + [0, 1]).astype(np.float32).ravel())   # el .bin guarda v hacia abajo (como el juego)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(negro() if silueta else material(nombre, d)); ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); return ob
DATOS = {}

def lin1(c): c = c / 255.0; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True
wn = sc.world.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld'); cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.35
perg = wn.new('ShaderNodeBackground'); perg.inputs[0].default_value = (lin1(0xe9), lin1(0xdf), lin1(0xc4), 1); perg.inputs[1].default_value = 1.0
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl = sc.world.node_tree.links
wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(perg.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sc.view_settings.view_transform = 'Standard'; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 6
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol_d.angle = math.radians(3); sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
def foto(ruta, w, h, objetivo, dist, azim, elev, lente=70, orto=0):
    cam_d.lens = lente; cam_d.type = 'ORTHO' if orto else 'PERSP'; cam_d.ortho_scale = orto or 1
    objetivo = Vector(objetivo); d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = objetivo + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    der = (-d).cross(Vector((0, 0, 1))).normalized(); arr = der.cross(-d).normalized(); hl = (-der * 0.62 + arr * 0.55 + d * 0.56).normalized(); sol.rotation_euler = (-hl).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100; sc.render.filepath = ruta; sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')
def limpiar():
    for o in list(sc.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)
def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def etiqueta(img, txt, x, y, t):
    d = ImageDraw.Draw(img); f = fuente(t); b = d.textbbox((0, 0), txt, font=f)
    d.rounded_rectangle((x, y, x + b[2] + 24, y + b[3] + 18), 10, fill=(244, 236, 214)); d.text((x + 12, y + 7), txt, font=f, fill=(40, 30, 20))

# 1. de cerca, fino, quieto, tres cuartos (390×844)
poner('triario'); im = foto(os.path.join(TMP, 'cerca.png'), 780, 1688, (0.0, 0.0, 1.20), 3.6, -35, 6)
etiqueta(im, 'Triario (Meshy) · fino · paleta romana', 16, 12, 27); im.save(os.path.join(FOTOS, 'AL4-4-cerca-v.jpg'), quality=88); limpiar()
# 2. los cuatro niveles en guardia, junto al hastatus de Meshy (844×390)
fila = [('hastatus', 'hastatus'), ('triario', 'fino'), ('triario_lejos', 'lejos'), ('triario_muylejos', 'muylejos'), ('triario_fondo', 'fondo')]
for i, (n, _) in enumerate(fila): poner(n, 'guardia', 12, dx=(i - 2) * 0.95)
im = foto(os.path.join(TMP, 'niveles.png'), 1688, 780, (0.0, 0.0, 1.05), 12.0, -12, 4, orto=5.6); dw = 1688 / 5.6 * 0.95
for i, (n, t) in enumerate(fila): etiqueta(im, '%s · %d' % (t, DATOS[n]['j']['tris']), int(844 + (i - 2) * dw - 95), 700, 19)
etiqueta(im, 'Triario: cuatro niveles en «guardia» (a la izquierda, el hastatus)', 16, 12, 24); im.save(os.path.join(FOTOS, 'AL4-5-niveles-h.jpg'), quality=88); limpiar()
# 3. siluetas: hastatus, triario, triario, hastatus; de frente y de espaldas (844×390)
for i, (n, g) in enumerate([('hastatus', 0), ('triario', 0), ('hastatus', 180), ('triario', 180)]): poner(n, 'quieto', 0, dx=(i - 1.5) * 1.1, giro=g, silueta=True)
im = foto(os.path.join(TMP, 'siluetas.png'), 1688, 780, (0.0, 0.0, 1.15), 12.0, 0, 0, orto=4.9)
etiqueta(im, 'Siluetas: hastatus y triario, de frente y de espaldas', 16, 12, 24); im.save(os.path.join(FOTOS, 'AL4-6-siluetas-h.jpg'), quality=88)
print('FOTOS hechas', {k: v['j']['tris'] for k, v in DATOS.items()})
