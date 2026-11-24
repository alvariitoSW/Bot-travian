"""AL10 · fotos del galo grande v2b tal como sale de assets/soldados (bin + json + webp), sin navegador.
Lee el formato del juego (exportar.guardar), dobla la malla con los movimientos compartidos (movimientos_escudo_*.bin),
aplica el tinte de tela como el sombreador de js/gfx/soldado.js (color · mezcla(1, tela·2,2, máscara R), en lineal)
y renderiza en Cycles con la luz del taller. Junto a él pone el galo de hoy (assets/soldados/galo) para la escala.

Uso (source /opt/aqvila-taller/entorno.sh):
  blender-py tools/blender/galo-grande-v2b_meshy_foto.py -- [salida=gobierno/capturas-tarea] [muestras=48]
"""
import bpy, numpy as np, math, os, sys, json
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..')); SOL = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
SAL = os.path.join(RAIZ, ARG.get('salida', 'gobierno/capturas-tarea')); MUESTRAS = int(ARG.get('muestras', 48)); TMP = '/tmp/al10_fotos'
os.makedirs(SAL, exist_ok=True); os.makedirs(TMP, exist_ok=True)
QUIEN = 'galo-grande-v2b'
TELAS_GALAS = ['#3f5f7a', '#5a7a4a', '#9a7a3a', '#8a4a30', '#6a5a7a', '#4a6a6a']        # paleta «galo» de js/gfx/soldado.js
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
hexa = lambda h: lin(np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255)

def leer(nombre):
    j = json.load(open(os.path.join(SOL, nombre + '.json'))); b = open(os.path.join(SOL, nombre + '.bin'), 'rb').read(); o = j['off']; nv = j['verts']; nt = j['tris']
    a = lambda k, dt, n: np.frombuffer(b, dt, n, o[k])
    d = dict(j=j, P=a('pos', np.float32, nv * 3).reshape(nv, 3).astype(float), UV=a('uv', np.float32, nv * 2).reshape(nv, 2), SI=a('si', np.uint8, nv * 4).reshape(nv, 4), SW=a('sw', np.uint8, nv * 4).reshape(nv, 4) / 255.0,
             SET=a('set', np.uint8, nv), T=a('idx', np.uint32 if j['idx32'] else np.uint16, nt * 3).reshape(nt, 3).astype(int))
    nb = len(j['huesos']); d['A'] = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nb, 3, 4).astype(float); return d

def textura(nombre, d, tela):
    t = d['j']['texturas']; col = np.asarray(Image.open(os.path.join(SOL, t['color'])).convert('RGB'), np.float32) / 255
    mk = np.asarray(Image.open(os.path.join(SOL, t['masc'])).convert('RGB').resize(col.shape[1::-1], Image.BILINEAR), np.float32) / 255
    r, g, b = mk[..., 0], mk[..., 1], mk[..., 2]; pelo = np.minimum(r, b); r = np.maximum(r - np.maximum(pelo, np.minimum(r, g)), 0)       # como F_COLOR
    cl = lin(col); cl = cl * (1 - r[..., None]) + cl * hexa(tela) * 2.2 * r[..., None]
    ruta = os.path.join(TMP, '%s_%s.png' % (nombre, tela[1:])); Image.fromarray((np.clip(srgb(cl), 0, 1) * 255 + 0.5).astype(np.uint8)).save(ruta); return ruta

MAT = {}
def material(nombre, d, tela):
    k = (nombre, tela)
    if k in MAT: return MAT[k]
    t = d['j']['texturas']; mt = bpy.data.materials.new('%s_%s' % k); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links
    def tx(ruta, cs): n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(ruta); n.image.colorspace_settings.name = cs; return n
    tc = tx(textura(nombre, d, tela), 'sRGB'); nn = np.asarray(Image.open(os.path.join(SOL, t['normal'])).convert('RGB')).copy(); nn[..., 1] = 255 - nn[..., 1]   # el juego guarda el verde invertido; Blender lo quiere al derecho
    rn = os.path.join(TMP, '%s_n.png' % nombre); Image.fromarray(nn).save(rn); tn = tx(rn, 'Non-Color'); to = tx(os.path.join(SOL, t['orm']), 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0])
    ao = nt.nodes.new('ShaderNodeMath'); ao.operation = 'MULTIPLY_ADD'; L.new(sp.outputs[0], ao.inputs[0]); ao.inputs[1].default_value = 0.65; ao.inputs[2].default_value = 0.35
    mu = nt.nodes.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1.0; L.new(tc.outputs[0], mu.inputs['A']); L.new(ao.outputs[0], mu.inputs['B'])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L.new(mu.outputs['Result'], pb.inputs['Base Color']); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); L.new(pb.outputs[0], o.inputs['Surface']); MAT[k] = mt; return mt

def BL(P): return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)
def figura(nombre, clip, cuadro=0, dx=0.0, dz=0.0, giro=0.0, tela=TELAS_GALAS[0], conj=None):
    d = DATOS.setdefault(nombre, leer(nombre)); c = d['j']['clips'][clip]; M = d['A'][c['ini'] + min(cuadro, c['n'] - 1)]
    Mv = np.einsum('vk,vkij->vij', d['SW'], M[d['SI']]); P = np.einsum('vij,vj->vi', Mv, np.c_[d['P'], np.ones(len(d['P']))])
    T = d['T'] if conj is None else d['T'][np.isin(d['SET'][d['T']].max(1), conj)]
    ca, sa = math.cos(giro), math.sin(giro); P = np.stack([P[:, 0] * ca + P[:, 2] * sa, P[:, 1], -P[:, 0] * sa + P[:, 2] * ca], 1) + [dx, 0, dz]
    me = bpy.data.meshes.new(nombre); me.from_pydata(BL(P).tolist(), [], T.tolist()); me.update()
    uv = d['UV'][T.ravel()] * [1, -1] + [0, 1]; me.uv_layers.new(name='UVMap').data.foreach_set('uv', uv.astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material(nombre, d, tela)); ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); return ob
DATOS = {}

bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def l8(c): c = c / 255.0; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True
wn = sc.world.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld'); cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.35
perg = wn.new('ShaderNodeBackground'); perg.inputs[0].default_value = (l8(0xe9), l8(0xdf), l8(0xc4), 1)
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl = sc.world.node_tree.links
wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(perg.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sc.view_settings.view_transform = 'Standard'; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol_d.angle = math.radians(3); sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
def foto(w, h, objetivo, dist, azim, elev, lente=70):
    cam_d.lens = lente; objetivo = Vector(objetivo); d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = objetivo + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    der = (-d).cross(Vector((0, 0, 1))).normalized(); arr = der.cross(-d).normalized(); hl = (-der * 0.62 + arr * 0.55 + d * 0.56).normalized(); sol.rotation_euler = (-hl).to_track_quat('-Z', 'Y').to_euler()
    ruta = os.path.join(TMP, 'f.png'); sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.filepath = ruta; bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')
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

# 1 · vertical 390×844 (×2): de cerca, como el usuario ve la tropa en el móvil de pie
figura(QUIEN, 'quieto', 0)
im = foto(780, 1688, (0.0, 0.0, 0.93), 4.2, -30, 6); etiqueta(im, 'Galo grande v2b (Meshy) · fino', 16, 12, 30); etiqueta(im, 'sin armas: las pone el juego', 16, 1610, 24)
im.save(os.path.join(SAL, 'AL10-1-cerca-v.jpg'), quality=88); limpiar()
# 2 · horizontal 844×390 (×2): el galo de hoy (escala) y el v2b con cuatro telas galas, en «guardia»
figura('galo', 'guardia', 12, dx=-1.6, conj=[0])
for i, t in enumerate(TELAS_GALAS[:4]): figura(QUIEN, ['guardia', 'quieto', 'andar', 'guardia'][i], [12, 0, 10, 30][i], dx=-0.55 + i * 0.8, giro=[0, 0.3, -0.3, 0.6][i], tela=t)
im = foto(1688, 780, (0.0, 0.0, 0.92), 9.0, -18, 7, lente=60); etiqueta(im, 'Izq.: galo de hoy (sin armas). Dcha.: galo grande v2b con cuatro telas del bando galo', 16, 12, 26)
im.save(os.path.join(SAL, 'AL10-2-fila-h.jpg'), quality=88); limpiar()
# 3 · los cuatro niveles en «guardia», cada uno de lejos como se usa, y las botas de cerca
im3 = Image.new('RGB', (1688, 780), (233, 223, 196))
for i, suf in enumerate(['', '_lejos', '_muylejos', '_fondo']):
    figura(QUIEN + suf, 'guardia', 12); p = foto(340, 780, (0.0, 0.0, 0.92), 5.0, -30, 4); limpiar()
    n = json.load(open(os.path.join(SOL, QUIEN + suf + '.json')))['tris']; etiqueta(p, '%s · %d tr.' % ((suf[1:] or 'fino'), n), 6, 700, 17); im3.paste(p, (340 * i, 0))
figura(QUIEN, 'quieto', 0); p = foto(328, 780, (0.0, 0.0, 0.12), 2.5, -35, 14, lente=45); limpiar(); etiqueta(p, 'botas repintadas', 6, 700, 17); im3.paste(p, (1360, 0))
etiqueta(im3, 'Galo grande v2b · cuatro niveles y botas de cuero liso', 16, 12, 26); im3.save(os.path.join(SAL, 'AL10-3-niveles-h.jpg'), quality=88)
print('fotos en', SAL)
