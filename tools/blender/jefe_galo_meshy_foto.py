"""AL6 · foto 390×844 (a doble resolución) del jefe galo tal como sale de assets/soldados/jefe-galo* (los archivos del juego,
no el paso A): malla del .bin, pesos, movimientos compartidos (movimientos_escudo_*.bin) y la capa teñida con la paleta gala
de js/gfx/soldado.js (color · tela · 2,2 en lineal, como el sombreador del juego). Render en Cycles, sin navegador.

Uso (entorno del taller): blender-py tools/blender/jefe_galo_meshy_foto.py -- [salida=gobierno/capturas-tarea/AL6-foto-v.jpg] [muestras=48]
"""
import bpy, os, sys, json, math, numpy as np
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..')); DIR = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
SAL = os.path.join(RAIZ, ARG.get('salida', 'gobierno/capturas-tarea/AL6-foto-v.jpg')); MUESTRAS = int(ARG.get('muestras', 48))
import tempfile; TMP = tempfile.mkdtemp(prefix='al6_')          # fuera del repositorio
TELAS_GALAS = ['#3f5f7a', '#5a7a4a', '#8a4a30']                 # js/gfx/soldado.js, ESTILOS.galo.telas (tres de seis)
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
hexa = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255

def leer(nombre):
    j = json.load(open(os.path.join(DIR, nombre + '.json'))); b = open(os.path.join(DIR, nombre + '.bin'), 'rb').read(); n = j['verts']; o = j['off']
    P = np.frombuffer(b, np.float32, n * 3, o['pos']).reshape(n, 3); UV = np.frombuffer(b, np.float32, n * 2, o['uv']).reshape(n, 2)
    SI = np.frombuffer(b, np.uint8, n * 4, o['si']).reshape(n, 4); SW = np.frombuffer(b, np.uint8, n * 4, o['sw']).reshape(n, 4) / 255
    T = np.frombuffer(b, np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3, o['idx']).reshape(-1, 3)
    A = np.frombuffer(open(os.path.join(DIR, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, len(j['huesos']), 3, 4).astype(float)
    return j, P, UV, SI, SW, T, A

def posa(d, clip, f=0):
    j, P, UV, SI, SW, T, A = d; M = A[j['clips'][clip]['ini'] + f]
    return np.einsum('vk,vkij,vj->vi', SW, M[SI], np.c_[P, np.ones(len(P))])

sc = bpy.context.scene; bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('m'); sc.world = w; w.use_nodes = True; wn = w.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld')
cie = wn.new('ShaderNodeBackground'); cie.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cie.inputs[1].default_value = 0.4
fon = wn.new('ShaderNodeBackground'); fon.inputs[0].default_value = (*lin(hexa('#e9dfc4')), 1)
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); L = w.node_tree.links
L.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); L.new(cie.outputs[0], mx.inputs[1]); L.new(fon.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], wo.inputs[0])
sd = bpy.data.lights.new('sol', 'SUN'); sd.energy = 4.0; sd.angle = math.radians(3); sol = bpy.data.objects.new('sol', sd); sc.collection.objects.link(sol)
sol.rotation_euler = (math.radians(50), 0, math.radians(-35))
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam

def material(nombre, tela):
    """Texturas del juego; la capa teñida como en el sombreador (color · tela · 2,2, en lineal)."""
    clave = nombre + (tela or ''); tx = json.load(open(os.path.join(DIR, nombre + '.json')))['texturas']
    col = np.asarray(Image.open(os.path.join(DIR, tx['color'])).convert('RGB'), np.float32) / 255
    msk = np.asarray(Image.open(os.path.join(DIR, tx['masc'])).convert('RGB').resize(col.shape[1::-1], Image.BILINEAR), np.float32)[..., 0:1] / 255
    if tela: cl = lin(col); col = srgb(cl * (1 - msk) + np.clip(cl * lin(hexa(tela)) * 2.2, 0, 1) * msk)
    ruta = os.path.join(TMP, clave + '_c.png'); Image.fromarray(np.clip(col * 255 + 0.5, 0, 255).astype(np.uint8)).save(ruta)
    mt = bpy.data.materials.new(clave); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); Ln = nt.links
    def tex(r, cs): n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(r); n.image.colorspace_settings.name = cs; return n
    tc = tex(ruta, 'sRGB'); tn = tex(os.path.join(DIR, tx['normal']), 'Non-Color'); to = tex(os.path.join(DIR, tx['orm']), 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); Ln.new(to.outputs[0], sp.inputs[0])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); Ln.new(tc.outputs[0], pb.inputs['Base Color']); Ln.new(sp.outputs[1], pb.inputs['Roughness']); Ln.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); Ln.new(tn.outputs[0], nm.inputs['Color']); Ln.new(nm.outputs[0], pb.inputs['Normal'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); Ln.new(pb.outputs[0], o.inputs['Surface']); return mt

def soldado(nombre, clip, x, giro, tela, escala=1.0):
    d = leer(nombre); P = posa(d, clip) * escala; c, s = math.cos(giro), math.sin(giro)
    P = np.stack([P[:, 0] * c + P[:, 2] * s + x, P[:, 1], -P[:, 0] * s + P[:, 2] * c], 1)
    me = bpy.data.meshes.new(nombre); me.from_pydata(np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1).tolist(), [], d[5].tolist()); me.update()
    uv = d[2][d[5].ravel()] * [1, -1] + [0, 1]; me.uv_layers.new(name='UV').data.foreach_set('uv', uv.astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material(nombre, tela)); ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); return ob

def foto(ruta, w, h, centro, ancho):
    cam.location = (centro[0], -10, centro[1]); cam.rotation_euler = (math.radians(90), 0, 0); cd.ortho_scale = ancho
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.filepath = ruta; sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')

def limpiar():
    for o in list(sc.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)

W, H = 780, 1688
# arriba: tres jefes en «quieto», tres colores de capa de la paleta gala, de tres cuartos
for i, t in enumerate(TELAS_GALAS): soldado('jefe-galo', 'quieto', (i - 1) * 0.95, math.radians(-25 + 25 * i), t)
a = foto(os.path.join(TMP, 'a.png'), W, 940, (0, 1.0), 2.95)
limpiar()
# abajo: de espaldas (la vista del jugador) y los cuatro niveles en «quieto», al mismo tamaño (en el .bin la v va hacia abajo)
for i, (n, g) in enumerate((('jefe-galo', 180), ('jefe-galo_lejos', 0), ('jefe-galo_muylejos', 0), ('jefe-galo_fondo', 0))):
    soldado(n, 'quieto', (i - 1.5) * 0.92, math.radians(g + (-20 if g == 0 else 0)), TELAS_GALAS[2] if i else TELAS_GALAS[0])
b = foto(os.path.join(TMP, 'b.png'), W, H - 940, (0, 0.95), 3.75)
img = Image.new('RGB', (W, H)); img.paste(a, (0, 0)); img.paste(b, (0, 940))
d = ImageDraw.Draw(img)
def F(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def eti(txt, x, y, t=24):
    f = F(t); bb = d.textbbox((0, 0), txt, font=f); d.rounded_rectangle((x, y, x + bb[2] + 20, y + bb[3] + 14), 9, fill=(244, 236, 214)); d.text((x + 10, y + 5), txt, font=f, fill=(40, 30, 20))
eti('Jefe galo (Meshy) · capa con el color del bando', 12, 10, 25)
eti('de espaldas', 14, 950, 20)
for i, (n, tr) in enumerate((('fino', 11212), ('lejos', 3415), ('muylejos', 776), ('fondo', 368))):
    eti('%s · %d' % (n, tr), 8 + i * 193, H - 52, 18)
d.line((0, 940, W, 940), fill=(180, 160, 120), width=2)
img.resize((390, 844), Image.LANCZOS).save(SAL.replace('-v.jpg', '-v390.jpg'), quality=90)
img.save(SAL, quality=88); print('foto', SAL)
