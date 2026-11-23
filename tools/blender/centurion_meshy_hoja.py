"""AL3 · hoja de fotos del centurión, hecha con los archivos del juego (assets/soldados/<nombre>[_nivel].bin/.json/.webp),
no con los intermedios del taller: es lo que carga js/gfx/soldado.js. Render de taller (Cycles), sin navegador.

Hace tres fotos en gobierno/capturas-tarea/:
  AL3-1-cerca-v.jpg      390×844 (a doble resolución): el centurión de cerca, de frente y de espaldas («quieto»).
  AL3-2-jugador-v.jpg    390×844: la vista del jugador en LP3 (detrás y arriba): el centurión delante de dos filas de hastati,
                         arriba en nivel «lejos» y abajo, más lejos, en «muylejos» y «fondo».
  AL3-3-siluetas-h.jpg   844×390: siluetas negras, el centurión entre hastati, de frente y de espaldas.

Uso (entorno del taller): blender-py tools/blender/centurion_meshy_hoja.py -- [quien=centurion] [tropa=hastatus] [muestras=48]
"""
import bpy, os, sys, json, math
import numpy as np
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
QUIEN = ARG.get('quien', 'centurion'); TROPA = ARG.get('tropa', 'hastatus'); MUESTRAS = int(ARG.get('muestras', 48))
SOL = os.path.join(RAIZ, 'assets', 'soldados'); FOTOS = os.path.join(RAIZ, 'gobierno', 'capturas-tarea'); TMP = '/tmp/al3_hoja'; os.makedirs(TMP, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def BL(P): return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)

CACHE = {}
def leer(nombre):
    if nombre in CACHE: return CACHE[nombre]
    j = json.load(open(os.path.join(SOL, nombre + '.json'))); b = open(os.path.join(SOL, nombre + '.bin'), 'rb').read(); n = j['verts']; o = j['off']
    P = np.frombuffer(b, np.float32, n * 3, o['pos']).reshape(n, 3).astype(float); UV = np.frombuffer(b, np.float32, n * 2, o['uv']).reshape(n, 2)
    SI = np.frombuffer(b, np.uint8, n * 4, o['si']).reshape(n, 4); SW = np.frombuffer(b, np.uint8, n * 4, o['sw']).reshape(n, 4) / 255.0
    SET = np.frombuffer(b, np.uint8, n, o['set']); T = np.frombuffer(b, np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3, o['idx']).reshape(-1, 3).astype(int)
    nb = len(j['huesos']); A = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nb, 3, 4).astype(float)
    CACHE[nombre] = d = dict(j=j, P=P, UV=UV, SI=SI, SW=SW, SET=SET, T=T, A=A); return d

MAT = {}
def material(nombre, negro=False, tela=None):
    k = (nombre, negro, tela)
    if k in MAT: return MAT[k]
    mt = bpy.data.materials.new('%s%s' % nombre_k(k)); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links; o = nt.nodes.new('ShaderNodeOutputMaterial')
    if negro:
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (0, 0, 0, 1); L.new(e.outputs[0], o.inputs[0]); MAT[k] = mt; return mt
    tx = CACHE[nombre]['j']['texturas']
    def t(c, cs):
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(os.path.join(SOL, tx[c])); n.image.colorspace_settings.name = cs; return n
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); tc = t('color', 'sRGB'); L.new(tc.outputs[0], pb.inputs['Base Color'])
    if tela and 'masc' in tx:                                   # tinte de bando como el juego: color · tela · 2,2 (lineal) donde la máscara R
        c = np.asarray(Image.open(os.path.join(SOL, tx['color'])).convert('RGB'), np.float32) / 255; L_ = lambda v: np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
        mk = np.asarray(Image.open(os.path.join(SOL, tx['masc'])).convert('RGB').resize(c.shape[1::-1]), np.float32)[..., :1] / 255
        tl = L_(np.array([int(tela[i:i + 2], 16) for i in (1, 3, 5)]) / 255); cl = L_(c); cl = cl * (1 - mk) + cl * tl * 2.2 * mk
        ruta = os.path.join(TMP, '%s_%s.png' % (nombre, tela[1:])); Image.fromarray((np.clip(np.where(cl <= 0.0031308, cl * 12.92, 1.055 * np.clip(cl, 0, None) ** (1 / 2.4) - 0.055), 0, 1) * 255).astype(np.uint8)).save(ruta)
        tc.image = bpy.data.images.load(ruta); tc.image.colorspace_settings.name = 'sRGB'
    if 'orm' in tx:
        to = t('orm', 'Non-Color'); sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0]); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    if 'normal' in tx and ARG.get('normal', '1') == '1':
        tn = t('normal', 'Non-Color'); nm = nt.nodes.new('ShaderNodeNormalMap')
        # el archivo del juego lleva el verde invertido (lo pide su UV con v volteada); en Blender se vuelve a invertir
        sv = nt.nodes.new('ShaderNodeSeparateColor'); iv = nt.nodes.new('ShaderNodeMath'); iv.operation = 'SUBTRACT'; iv.inputs[0].default_value = 1.0; cb = nt.nodes.new('ShaderNodeCombineColor')
        L.new(tn.outputs[0], sv.inputs[0]); L.new(sv.outputs[1], iv.inputs[1]); L.new(sv.outputs[0], cb.inputs[0]); L.new(iv.outputs[0], cb.inputs[1]); L.new(sv.outputs[2], cb.inputs[2]); L.new(cb.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    L.new(pb.outputs[0], o.inputs[0]); MAT[k] = mt; return mt
def nombre_k(k): return (k[0], ('_negro' if k[1] else '') + (k[2] or ''))

def figura(nombre, clip='quieto', x=0.0, z=0.0, giro=0.0, negro=False, tela=None):
    d = leer(nombre); j = d['j']; c = j['clips'][clip]; M = d['A'][c['ini']]
    mu = j.get('muestra', {}).get(clip, [[0, 0]])[0][1]
    vis = (d['SET'] == 0) | ((mu >> np.maximum(d['SET'].astype(int) - 1, 0)) & 1).astype(bool)
    Mv = np.einsum('vk,vkij->vij', d['SW'], M[d['SI']]); Pp = np.einsum('vij,vj->vi', Mv, np.c_[d['P'], np.ones(len(d['P']))])
    cg, sg = math.cos(giro), math.sin(giro); Pp = np.stack([Pp[:, 0] * cg + Pp[:, 2] * sg + x, Pp[:, 1], -Pp[:, 0] * sg + Pp[:, 2] * cg + z], 1)
    T = d['T'][vis[d['T']].all(1)]
    me = bpy.data.meshes.new(nombre); me.from_pydata(BL(Pp).tolist(), [], T.tolist()); me.update()
    uv = d['UV'][T.ravel()] * [1, -1] + [0, 1]; me.uv_layers.new(name='UVMap').data.foreach_set('uv', uv.astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material(nombre, negro, tela)); ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob); return ob

def limpiar():
    for o in list(sc.objects):
        if o.type == 'MESH' and o.name != 'suelo': bpy.data.objects.remove(o)

def lin(c): c = c / 255.0; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True
sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True; wn = sc.world.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld')
cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.4
fondo = wn.new('ShaderNodeBackground'); fondo.inputs[0].default_value = (lin(0xe9), lin(0xdf), lin(0xc4), 1); fondo.inputs[1].default_value = 1.0
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl = sc.world.node_tree.links
wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(fondo.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sc.view_settings.view_transform = 'Standard'
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol_d.angle = math.radians(3); sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
sol.rotation_euler = (math.radians(50), 0, math.radians(-35))
cam_d = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
suelo_me = bpy.data.meshes.new('suelo'); suelo_me.from_pydata([(-60, -60, 0), (60, -60, 0), (60, 60, 0), (-60, 60, 0)], [], [(0, 1, 2, 3)])
sm = bpy.data.materials.new('suelo'); sm.use_nodes = True; sm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (lin(0x8a), lin(0x7d), lin(0x5c), 1)
suelo_me.materials.append(sm); suelo = bpy.data.objects.new('suelo', suelo_me)

def foto(w, h, objetivo, dist, azim, elev, lente=50, orto=None):
    """azim 0 = de frente (cámara en +z del juego), 180 = de espaldas. elev en grados."""
    cam_d.lens = lente; cam_d.type = 'ORTHO' if orto else 'PERSP'
    if orto: cam_d.ortho_scale = orto
    ob = Vector((objetivo[0], -objetivo[2], objetivo[1])); a, e = math.radians(azim), math.radians(elev)
    dv = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    cam.location = ob + dv * dist; cam.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100
    ruta = os.path.join(TMP, 'f.png'); sc.render.filepath = ruta; bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')

def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def etiqueta(img, txt, x, y, t):
    d = ImageDraw.Draw(img); f = fuente(t); b = d.textbbox((0, 0), txt, font=f)
    d.rounded_rectangle((x, y, x + b[2] + 20, y + b[3] + 14), 9, fill=(244, 236, 214)); d.text((x + 10, y + 5), txt, font=f, fill=(40, 30, 20))

N = {'fino': '', 'lejos': '_lejos', 'muylejos': '_muylejos', 'fondo': '_fondo'}
# ---- 1. de cerca, frente y espalda
img = Image.new('RGB', (780, 1688))
for i, az in enumerate((20, 160)):
    limpiar(); figura(QUIEN); p = foto(780, 844, (0, 0.98, 0), 3.4, az, 6, lente=60); img.paste(p, (0, 844 * i))
etiqueta(img, 'Centurión · fino · de frente', 16, 14, 26); etiqueta(img, 'de espaldas', 16, 858, 26); img.save(os.path.join(FOTOS if ARG.get('normal', '1') == '1' else TMP, 'AL3-1-cerca-v.jpg'), quality=88)
if ARG.get('solo') == '1': sys.exit(0)

# ---- 4. tinte de bando: solo la túnica (decisión del usuario, 23/11)
img = Image.new('RGB', (1688, 780))
for i, (tela, txt) in enumerate((('#8f2f22', 'Bando romano'), ('#6a2c5a', 'Bando cartaginés'))):
    limpiar(); figura(QUIEN, tela=tela); p = foto(844, 780, (0, 1.0, 0), 3.8, 25, 6, lente=55); img.paste(p, (844 * i, 0)); etiqueta(img, txt + ' · capa y cresta no cambian', 844 * i + 14, 12, 22)
img.save(os.path.join(FOTOS, 'AL3-4-tinte-h.jpg'), quality=88)

# ---- 2. vista del jugador: detrás y arriba
sc.collection.objects.link(suelo)
img = Image.new('RGB', (780, 1688))
for i, (niv, dist, txt) in enumerate((('lejos', 9.0, 'Vista del jugador · nivel «lejos»'), ('muylejos', 26.0, 'más lejos · «muylejos» y «fondo»'))):
    limpiar(); figura(QUIEN + N[niv], z=1.6)
    for fila, zf in enumerate((0.0, -1.3)):
        for k in range(-3, 4):
            figura(TROPA + N[niv if fila == 0 or niv == 'lejos' else 'fondo'], 'quieto', x=k * 0.95, z=zf)
    p = foto(780, 844, (0, 0.9, 0.3), dist, 180, 24, lente=50); img.paste(p, (0, 844 * i)); etiqueta(img, txt, 16, 844 * i + 14, 24)
img.save(os.path.join(FOTOS, 'AL3-2-jugador-v.jpg'), quality=88)
sc.collection.objects.unlink(suelo)

# ---- 3. siluetas
sc.world.node_tree.nodes['Background.001'].inputs[0].default_value = (1, 1, 1, 1)
img = Image.new('RGB', (1688, 780))
for i, az in enumerate((0, 180)):
    limpiar()
    for k, nom in enumerate((TROPA, QUIEN, TROPA)): figura(nom, 'quieto', x=(k - 1) * 1.0, negro=True)
    p = foto(844, 780, (0, 1.0, 0), 10, az, 0, orto=3.6); img.paste(p, (844 * i, 0))
etiqueta(img, 'Siluetas · de frente', 14, 12, 24); etiqueta(img, 'de espaldas', 858, 12, 24); img.save(os.path.join(FOTOS, 'AL3-3-siluetas-h.jpg'), quality=88)
print('hoja hecha')
