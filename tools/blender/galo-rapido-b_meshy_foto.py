"""AL8 · fotos del galo rápido «B» tal como lo guarda el juego (assets/soldados/galo-rapido-b*): lee el .bin y el .json,
lo dobla con un cuadro de movimientos_escudo_*.bin, tiñe la túnica con los colores galos (canal R de _masc, como
js/gfx/soldado.js: color · tela · 2,2) y lo pinta con Cycles. Sin navegador. Fotos a 390×844 y 844×390 (doble densidad).
Uso: blender-py tools/blender/galo-rapido-b_meshy_foto.py -- [fotos=gobierno/capturas-tarea] [muestras=48]
"""
import bpy, numpy as np, math, os, sys, json
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')); S = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea')); MUESTRAS = int(ARG.get('muestras', 48)); TMP = os.path.join(FOTOS, '_tmp_al8'); os.makedirs(TMP, exist_ok=True)
TELAS = ['#3f5f7a', '#5a7a4a', '#9a7a3a', '#8a4a30', '#6a5a7a', '#4a6a6a']          # PUEBLOS.galo.telas de js/gfx/soldado.js
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
def leer(nombre):
    j = json.load(open(os.path.join(S, nombre + '.json'))); b = open(os.path.join(S, nombre + '.bin'), 'rb').read(); o = j['off']; nv, nt = j['verts'], j['tris']
    P = np.frombuffer(b, np.float32, nv * 3, o['pos']).reshape(-1, 3); UV = np.frombuffer(b, np.float32, nv * 2, o['uv']).reshape(-1, 2)
    SI = np.frombuffer(b, np.uint8, nv * 4, o['si']).reshape(-1, 4); SW = np.frombuffer(b, np.uint8, nv * 4, o['sw']).reshape(-1, 4) / 255.0
    T = np.frombuffer(b, np.uint32 if j['idx32'] else np.uint16, nt * 3, o['idx']).reshape(-1, 3)
    A = np.frombuffer(open(os.path.join(S, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, len(j['huesos']), 3, 4).astype(float)
    return j, P, UV, SI, SW, T, A
def doblar(P, SI, SW, M):
    Mv = np.einsum('vk,vkij->vij', SW, M[SI]); return np.einsum('vij,vj->vi', Mv, np.c_[P, np.ones(len(P))])
BL = lambda P: np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)
sc = bpy.context.scene; bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('m'); sc.world.use_nodes = True; bg = sc.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.62, 0.66, 0.70, 1); bg.inputs[1].default_value = 0.55
suelo = bpy.data.meshes.new('suelo'); suelo.from_pydata([(-20, -20, 0), (20, -20, 0), (20, 20, 0), (-20, 20, 0)], [], [(0, 1, 2, 3)]); so = bpy.data.objects.new('suelo', suelo); sc.collection.objects.link(so)
ms = bpy.data.materials.new('tierra'); ms.use_nodes = True; ms.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.36, 0.30, 0.20, 1); suelo.materials.append(ms)
sl = bpy.data.lights.new('sol', 'SUN'); sl.energy = 3.6; sl.angle = math.radians(4); sol = bpy.data.objects.new('sol', sl); sc.collection.objects.link(sol); sol.rotation_euler = (math.radians(50), 0, math.radians(-35))
cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
MAT = {}
def material(nombre, it):
    k = (nombre, it)
    if k in MAT: return MAT[k]
    col = np.asarray(Image.open(os.path.join(S, nombre + '_color.webp')).convert('RGB'), np.float32) / 255; n = col.shape[0]
    mk = np.asarray(Image.open(os.path.join(S, nombre + '_masc.webp')).convert('RGB').resize((n, n), Image.BILINEAR), np.float32)[..., 0:1] / 255
    tela = lin(np.array([int(TELAS[it][i:i + 2], 16) for i in (1, 3, 5)]) / 255)
    cl = lin(col); cl = cl * (1 - mk) + cl * tela * 2.2 * mk; ruta = os.path.join(TMP, '%s_%d.png' % (nombre, it)); Image.fromarray((np.clip(srgb(cl), 0, 1) * 255 + 0.5).astype(np.uint8)).save(ruta)
    orm = Image.open(os.path.join(S, nombre + '_orm.webp')).convert('RGB').resize((n, n)); ro = os.path.join(TMP, '%s_orm.png' % nombre); orm.save(ro)
    m = bpy.data.materials.new('%s%d' % k); m.use_nodes = True; nt = m.node_tree; pb = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = bpy.data.images.load(ruta); to = nt.nodes.new('ShaderNodeTexImage'); to.image = bpy.data.images.load(ro); to.image.colorspace_settings.name = 'Non-Color'
    sp = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs[0], sp.inputs[0]); mu = nt.nodes.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1
    nt.links.new(tc.outputs[0], mu.inputs['A']); nt.links.new(sp.outputs[0], mu.inputs['B']); nt.links.new(mu.outputs['Result'], pb.inputs['Base Color']); nt.links.new(sp.outputs[1], pb.inputs['Roughness']); nt.links.new(sp.outputs[2], pb.inputs['Metallic'])
    MAT[k] = m; return m
OBS = []
def soldado(nombre, clip, cuadro, x, z=0.0, giro=0.0, it=0):
    j, P, UV, SI, SW, T, A = leer(nombre); c = j['clips'][clip]; Pp = doblar(P, SI, SW, A[c['ini'] + cuadro % c['n']])
    g = math.radians(giro); R = np.array([[math.cos(g), 0, math.sin(g)], [0, 1, 0], [-math.sin(g), 0, math.cos(g)]]); Pp = Pp @ R.T + [x, 0, z]
    me = bpy.data.meshes.new(nombre); me.from_pydata(BL(Pp).tolist(), [], T.astype(int).tolist()); me.update(); me.uv_layers.new(name='UV').data.foreach_set('uv', (UV[T.astype(int).ravel()] * [1, -1] + [0, 1]).astype(np.float32).ravel())   # el juego guarda v volteada
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material(nombre, it)); ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); OBS.append(ob); return ob
def limpiar():
    for ob in OBS: bpy.data.objects.remove(ob)
    OBS.clear()
def foto(nombre, w, h, objetivo, dist, azim, elev, lente=50):
    d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cd.lens = lente; cam.location = Vector(objetivo) + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w * 2, h * 2; sc.render.filepath = os.path.join(TMP, nombre + '.png'); bpy.ops.render.render(write_still=True)
    return Image.open(sc.render.filepath).convert('RGB')
def etiqueta(img, txt, x, y, t=30):
    d = ImageDraw.Draw(img); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', t); b = d.textbbox((0, 0), txt, font=f)
    d.rounded_rectangle((x, y, x + b[2] + 24, y + b[3] + 18), 10, fill=(244, 236, 214)); d.text((x + 12, y + 7), txt, font=f, fill=(40, 30, 20))
# 1 · de cerca, tres galos con telas distintas, quietos (390×844)
soldado('galo-rapido-b', 'quieto', 10, -0.5, -0.6, 0, 0); soldado('galo-rapido-b', 'quieto2', 30, 0.05, 0.0, 0, 2); soldado('galo-rapido-b', 'quieto3', 50, 0.55, -0.9, 0, 3)
im = foto('cerca', 390, 844, (0, 0, 0.95), 4.6, -18, 4, 42); etiqueta(im, 'Galo rápido B · tres telas', 16, 12); im.save(os.path.join(FOTOS, 'AL8-cerca-v.jpg'), quality=86); limpiar()
# 2 · frente, espalda y guardia; y los cuatro niveles (844×390)
soldado('galo-rapido-b', 'quieto', 0, -1.5, 0, 0, 1); soldado('galo-rapido-b', 'quieto', 0, -0.5, 0, 180, 1); soldado('galo-rapido-b', 'guardia', 12, 0.5, 0, 0, 4); soldado('galo-rapido-b', 'andar', 8, 1.5, 0, 0, 0)
im = foto('vistas', 844, 390, (0, 0, 0.9), 7.4, 0, 6, 50); etiqueta(im, 'Frente · espalda · guardia · andar', 16, 12); im.save(os.path.join(FOTOS, 'AL8-vistas-h.jpg'), quality=86); limpiar()
for i, n in enumerate(('', '_lejos', '_muylejos', '_fondo')): soldado('galo-rapido-b' + n, 'guardia', 12, -1.5 + i, 0, 0, i)
im = foto('niveles', 844, 390, (0, 0, 0.9), 7.4, -20, 6, 50); etiqueta(im, 'Fino · lejos · muylejos · fondo', 16, 12); im.save(os.path.join(FOTOS, 'AL8-niveles-h.jpg'), quality=86); limpiar()
import shutil; shutil.rmtree(TMP); print('fotos hechas')
