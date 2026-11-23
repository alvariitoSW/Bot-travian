"""AL5 · fotos del galo lancero tal como queda en assets/soldados (los .bin y .webp que carga el juego), con Cycles.
Lee la malla del .bin (formato de gobierno/maquetas/soldado-rome2/construir/exportar.py), la dobla con un cuadro de
movimientos_escudo_*.bin y tiñe la túnica y la capa como js/gfx/soldado.js (color·tela·2,2 donde la máscara R lo dice).
No es el dibujo del juego (que es three.js): es una foto de taller con la misma malla, texturas y tinte.
Uso: blender-py tools/blender/galo_lancero_meshy_foto.py -- [fotos=gobierno/capturas-tarea] [tmp=/tmp/al5foto]
"""
import bpy, numpy as np, json, os, sys, math
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..')); SOL = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea')); TMP = ARG.get('tmp', '/tmp/al5foto'); os.makedirs(TMP, exist_ok=True)
QUIEN = 'galo-lancero'
TELAS = ['#3f5f7a', '#8a4a30', '#5a7a4a']                         # PUEBLOS.galo.telas de js/gfx/soldado.js (0, 3 y 1)
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def leer(suf):
    j = json.load(open(os.path.join(SOL, QUIEN + suf + '.json'))); b = open(os.path.join(SOL, QUIEN + suf + '.bin'), 'rb').read(); o = j['off']; n = j['verts']
    P = np.frombuffer(b, np.float32, n * 3, o['pos']).reshape(n, 3); N = np.frombuffer(b, np.int8, n * 3, o['nor']).reshape(n, 3) / 127.0; UV = np.frombuffer(b, np.float32, n * 2, o['uv']).reshape(n, 2)
    SI = np.frombuffer(b, np.uint8, n * 4, o['si']).reshape(n, 4); SW = np.frombuffer(b, np.uint8, n * 4, o['sw']).reshape(n, 4) / 255.0
    T = np.frombuffer(b, np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3, o['idx']).reshape(-1, 3)
    nh = len(j['huesos']); A = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nh, 3, 4).astype(float)
    return j, P, N, UV, SI, SW, T, A
def posar(P, SI, SW, M):
    Mv = np.einsum('vk,vkij->vij', SW, M[SI]); return np.einsum('vij,vj->vi', Mv, np.c_[P, np.ones(len(P))])
def BL(P): return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)
MAT = {}
def material(suf, tela):
    k = (suf, tela)
    if k in MAT: return MAT[k]
    tx = json.load(open(os.path.join(SOL, QUIEN + suf + '.json')))['texturas']
    col = np.asarray(Image.open(os.path.join(SOL, tx['color'])).convert('RGB'), np.float32) / 255
    ms = np.asarray(Image.open(os.path.join(SOL, tx['masc'])).convert('RGB').resize(col.shape[1::-1], Image.BILINEAR), np.float32)[..., 0:1] / 255
    t = lin(np.array([int(tela[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0); cl = lin(col); cl = cl * (1 - ms) + cl * t * 2.2 * ms
    ruta = os.path.join(TMP, '%s%s_%s.png' % (QUIEN, suf, tela[1:])); Image.fromarray((np.clip(srgb(cl), 0, 1) * 255 + 0.5).astype(np.uint8)).save(ruta)
    mt = bpy.data.materials.new(str(k)); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links
    def im(r, cs): n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(r); n.image.colorspace_settings.name = cs; return n
    tc = im(ruta, 'sRGB'); tn = im(os.path.join(SOL, tx['normal']), 'Non-Color'); to = im(os.path.join(SOL, tx['orm']), 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L.new(tc.outputs[0], pb.inputs['Base Color']); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); L.new(pb.outputs[0], o.inputs['Surface']); MAT[k] = mt; return mt
def figura(suf, clip, df, tela, x, z=0.0, giro=0.0):
    j, P, N, UV, SI, SW, T, A = leer(suf); M = A[j['clips'][clip]['ini'] + df]; Pp = posar(P, SI.astype(int), SW, M)
    Mv = np.einsum('vk,vkij->vij', SW, M[SI.astype(int)])[:, :, :3]; Np = np.einsum('vij,vj->vi', Mv, N)                 # normales del .bin (las del juego: suaves a través de las costuras)
    c, s = math.cos(giro), math.sin(giro); Pp = np.c_[Pp[:, 0] * c + Pp[:, 2] * s, Pp[:, 1], -Pp[:, 0] * s + Pp[:, 2] * c] + [x, 0, z]; Np = np.c_[Np[:, 0] * c + Np[:, 2] * s, Np[:, 1], -Np[:, 0] * s + Np[:, 2] * c]
    me = bpy.data.meshes.new(suf + clip); me.from_pydata(BL(Pp).tolist(), [], T.tolist()); me.update()
    uv = UV[T.ravel()] * [1, -1] + [0, 1]; me.uv_layers.new(name='UVMap').data.foreach_set('uv', uv.astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    Nb = BL(Np); Nb /= np.maximum(np.linalg.norm(Nb, axis=1, keepdims=True), 1e-9); me.normals_split_custom_set_from_vertices(Nb.tolist())
    me.materials.append(material(suf, tela)); ob = bpy.data.objects.new(me.name, me); sc.collection.objects.link(ob); return ob
# escena: suelo de tierra, cielo, sol
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; bg = sc.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.55, 0.62, 0.72, 1); bg.inputs[1].default_value = 0.8
bpy.ops.mesh.primitive_plane_add(size=60); suelo = bpy.context.object; ms = bpy.data.materials.new('suelo'); ms.use_nodes = True
ms.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.32, 0.27, 0.18, 1); ms.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.95; suelo.data.materials.append(ms)
sd = bpy.data.lights.new('sol', 'SUN'); sd.energy = 3.5; sd.angle = math.radians(4); sol = bpy.data.objects.new('sol', sd); sc.collection.objects.link(sol); sol.rotation_euler = (math.radians(50), 0, math.radians(-35))
cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
def foto(ruta, w, h, obj, dist, azim, elev, lente):
    cd.lens = lente; obj = Vector(obj); d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = obj + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.filepath = ruta; bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')
def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def etiqueta(img, txt, x, y, t):
    d = ImageDraw.Draw(img); f = fuente(t); b = d.textbbox((0, 0), txt, font=f)
    d.rounded_rectangle((x, y, x + b[2] + 20, y + b[3] + 14), 8, fill=(244, 236, 214)); d.text((x + 10, y + 5), txt, font=f, fill=(40, 30, 20))
def limpia():
    for o in list(sc.objects):
        if o.type == 'MESH' and o is not suelo: bpy.data.objects.remove(o)
# 1 · vertical 390×844 (a doble resolución): el fino de cerca, en guardia, tres cuartos
figura('', 'guardia', 12, TELAS[0], 0.0)
im = foto(os.path.join(TMP, 'cerca.png'), 780, 1688, (0, 0, 1.0), 4.2, -30, 8, 50); etiqueta(im, 'Galo lancero · fino · guardia', 16, 14, 30)
etiqueta(im, '8 043 triángulos · sin lanza ni escudo (los pone el juego)', 16, 1620, 22); im.save(os.path.join(FOTOS, 'AL5-1-cerca-v.jpg'), quality=88)
# 2 · horizontal 844×390: tres tintes del fino y los tres niveles de lejos, vistos como en la batalla (desde atrás y arriba no: de frente, algo alto)
limpia()
for i, (suf, tela) in enumerate((('', TELAS[0]), ('', TELAS[1]), ('', TELAS[2]), ('_lejos', TELAS[0]), ('_muylejos', TELAS[0]), ('_fondo', TELAS[0]))):
    figura(suf, 'quieto', 0, tela, (i - 2.5) * 0.95)
im = foto(os.path.join(TMP, 'fila.png'), 1688, 780, (0, 0, 0.95), 9.0, 0, 10, 60); etiqueta(im, 'Fino con tres colores de bando · lejos · muylejos · fondo', 16, 12, 28)
im.save(os.path.join(FOTOS, 'AL5-2-niveles-h.jpg'), quality=88)
# 3 · horizontal: una fila de doce a la distancia de la batalla, desde atrás y arriba (la vista del jugador)
limpia()
for f in range(2):
    for c in range(6):
        figura('' if f == 0 else '_lejos', 'guardia', 12, TELAS[(c + f) % 3], (c - 2.5) * 0.85, z=-f * 1.1)
im = foto(os.path.join(TMP, 'espalda.png'), 1688, 780, (0, -0.5, 0.9), 11.0, 180, 28, 50); etiqueta(im, 'Vista del jugador: dos filas (fino y lejos), de espaldas', 16, 12, 28)
im.save(os.path.join(FOTOS, 'AL5-3-espalda-h.jpg'), quality=88)
print('FOTOS HECHAS')
