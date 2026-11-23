"""AL7 · fotos del vélite tal como queda en assets/soldados (lee los .bin, .json y .webp del juego, sin navegador).
Pinta con Blender (Cycles): color, relieve, ORM y máscara (la parma con el color de escudo romano). Postura: un cuadro
de los movimientos compartidos (movimientos_escudo_74/36.bin) y solo las piezas que el juego enseña en ese movimiento.
Uso: blender-py tools/blender/velite_meshy_foto.py -- [quien=velite] [salida=gobierno/capturas-tarea] [prefijo=AL7] [tmp=/tmp/x]
"""
import bpy, numpy as np, json, os, sys, math
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..')); SOL = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
QUIEN = ARG.get('quien', 'velite'); SAL = ARG.get('salida', os.path.join(RAIZ, 'gobierno', 'capturas-tarea')); PRE = ARG.get('prefijo', 'AL7'); TMP = ARG.get('tmp', '/tmp/foto_' + QUIEN)
os.makedirs(TMP, exist_ok=True)
ESCUDO = (0x8f / 255, 0x2a / 255, 0x20 / 255)                     # ESCUDOS[0] de js/gfx/soldado.js (romanos)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
def BL(P): return np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)
def lee(suf):
    j = json.load(open(os.path.join(SOL, QUIEN + suf + '.json'))); b = open(os.path.join(SOL, QUIEN + suf + '.bin'), 'rb').read(); n = j['verts']; o = j['off']
    P = np.frombuffer(b, np.float32, n * 3, o['pos']).reshape(-1, 3).astype(float); UV = np.frombuffer(b, np.float32, n * 2, o['uv']).reshape(-1, 2)
    SI = np.frombuffer(b, np.uint8, n * 4, o['si']).reshape(-1, 4); SW = np.frombuffer(b, np.uint8, n * 4, o['sw']).reshape(-1, 4) / 255.0
    SET = np.frombuffer(b, np.uint8, n, o['set']); T = np.frombuffer(b, np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3, o['idx']).reshape(-1, 3)
    nb = len(j['huesos']); A = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nb, 3, 4).astype(float)
    return dict(j=j, P=P, UV=UV, SI=SI, SW=SW, SET=SET, T=T, A=A)
MAT = {}
def material(suf, j):
    if suf in MAT: return MAT[suf]
    mt = bpy.data.materials.new('m' + suf); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links; tx = j['texturas']
    def t(k, cs): n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(os.path.join(SOL, tx[k])); n.image.colorspace_settings.name = cs; return n
    tc, tn, to, tm = t('color', 'sRGB'), t('normal', 'Non-Color'), t('orm', 'Non-Color'), t('masc', 'Non-Color')
    so = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], so.inputs[0]); sm = nt.nodes.new('ShaderNodeSeparateColor'); L.new(tm.outputs[0], sm.inputs[0])
    esc = nt.nodes.new('ShaderNodeMix'); esc.data_type = 'RGBA'; esc.blend_type = 'MULTIPLY'; esc.inputs['Factor'].default_value = 1.0; L.new(tc.outputs[0], esc.inputs['A'])
    esc.inputs['B'].default_value = tuple(min(1.0, c ** 2.2 * 2.2) for c in ESCUDO) + (1,)
    mz = nt.nodes.new('ShaderNodeMix'); mz.data_type = 'RGBA'; L.new(sm.outputs[2], mz.inputs['Factor']); L.new(tc.outputs[0], mz.inputs['A']); L.new(esc.outputs['Result'], mz.inputs['B'])
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled'); L.new(mz.outputs['Result'], pb.inputs['Base Color']); L.new(so.outputs[1], pb.inputs['Roughness']); L.new(so.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal'])
    out = nt.nodes.new('ShaderNodeOutputMaterial'); L.new(pb.outputs[0], out.inputs['Surface']); MAT[suf] = mt; return mt
DAT = {}
def soldado(suf, clip, x=0.0, z=0.0, giro=0.0, frac=0.0):
    d = DAT.setdefault(suf, None) or DAT.__setitem__(suf, lee(suf)) or DAT[suf]; j = d['j']; c = j['clips'][clip]
    M = d['A'][c['ini'] + int(frac * (c['n'] - 1))]; Mv = np.einsum('vk,vkij->vij', d['SW'], M[d['SI']]); P = np.einsum('vij,vj->vi', Mv, np.c_[d['P'], np.ones(len(d['P']))])
    mu = 0
    for f, b in j['muestra'].get(clip, [[0, 0]]):
        if f <= frac: mu = b
    vis = (d['SET'] == 0) | ((mu >> np.maximum(d['SET'].astype(int) - 1, 0)) & 1).astype(bool)
    T = d['T'][vis[d['T']].all(1)]
    cg, sg = math.cos(giro), math.sin(giro); P = np.c_[P[:, 0] * cg + P[:, 2] * sg + x, P[:, 1], -P[:, 0] * sg + P[:, 2] * cg + z]
    me = bpy.data.meshes.new(suf + clip); me.from_pydata(BL(P).tolist(), [], T.tolist()); me.update()
    uv = d['UV'][T.ravel()] * [1, -1] + [0, 1]; me.uv_layers.new(name='UVMap').data.foreach_set('uv', uv.astype(np.float32).ravel())
    for p in me.polygons: p.use_smooth = True
    me.materials.append(material(suf, j)); ob = bpy.data.objects.new(suf + clip, me); sc.collection.objects.link(ob); return ob
def lin(c): c = c / 255.0; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.world = bpy.data.worlds.new('mundo'); wn = sc.world.node_tree.nodes; wn.clear(); wo = wn.new('ShaderNodeOutputWorld'); cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.4
perg = wn.new('ShaderNodeBackground'); perg.inputs[0].default_value = (lin(0xe9), lin(0xdf), lin(0xc4), 1); lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl = sc.world.node_tree.links
wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(perg.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sc.view_settings.view_transform = 'Standard'
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 70; cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
def foto(nombre, w, h, objetivo, dist, azim, elev):
    o = Vector(objetivo); d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = o + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); der = (-d).cross(Vector((0, 0, 1))).normalized(); arr = der.cross(-d).normalized()
    sol.rotation_euler = (-(-der * 0.62 + arr * 0.55 + d * 0.56).normalized()).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.filepath = os.path.join(TMP, nombre + '.png'); bpy.ops.render.render(write_still=True); return Image.open(sc.render.filepath).convert('RGB')
def limpia():
    for o in list(sc.objects):
        if o.type == 'MESH': bpy.data.objects.remove(o)
def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def guardar(img, nombre): img.resize((img.width // 2, img.height // 2), Image.LANCZOS).save(os.path.join(SAL, nombre), quality=80, optimize=True)   # 390x844 y 844x390
def etiqueta(img, txt, x, y, t):
    d = ImageDraw.Draw(img); f = fuente(t); b = d.textbbox((0, 0), txt, font=f); d.rounded_rectangle((x, y, x + b[2] + 16, y + b[3] + 12), 8, fill=(244, 236, 214)); d.text((x + 8, y + 5), txt, font=f, fill=(40, 30, 20))
# 1. de cerca, vertical (390x844 a doble densidad): de frente en guardia y de espaldas quieto
soldado('', 'quieto', x=-0.36, giro=math.radians(-20)); soldado('', 'quieto', x=0.40, giro=math.radians(160))
cam_d.sensor_fit = 'VERTICAL'; im = foto('cerca', 780, 1688, (0.0, 0.0, 0.92), 7.4, 0, 6); cam_d.sensor_fit = 'AUTO'; etiqueta(im, 'Vélite · Meshy · en el juego (fino)', 14, 14, 30); etiqueta(im, 'quieto, de frente y de espaldas', 14, 1620, 26)
guardar(im, PRE + '-1-cerca-v.jpg'); limpia()
# 2. los cuatro niveles, horizontal (844x390 a doble densidad)
for i, suf in enumerate(('', '_lejos', '_muylejos', '_fondo')): soldado(suf, 'guardia', x=(i - 1.5) * 1.05, giro=math.radians(-20), frac=0.2)
im = foto('niveles', 1688, 780, (0.0, 0.0, 0.95), 7.6, 0, 8)
for i, (suf, n) in enumerate((('', 'fino'), ('_lejos', 'lejos'), ('_muylejos', 'muylejos'), ('_fondo', 'fondo'))): etiqueta(im, '%s · %d tr.' % (n, DAT[suf]['j']['tris']), 60 + i * 400, 700, 24)
etiqueta(im, 'Vélite · cuatro niveles (de cerca a lejos)', 14, 14, 30); guardar(im, PRE + '-2-niveles-h.jpg'); limpia()
# 3. la vista del jugador: dos filas de cinco desde atrás y arriba, corriendo y quietos
for k in range(10):
    f, c = divmod(k, 5); soldado('' if f == 0 else '_lejos', 'correr' if f == 0 else 'quieto', x=(c - 2) * 0.95, z=-f * 1.3, giro=0.0, frac=0.1 * c)
im = foto('fila', 1688, 780, (0.0, 0.0, 0.6), 9.5, 180 + 20, 30); etiqueta(im, 'Vélites vistos como el jugador (detrás y arriba)', 14, 14, 30)
guardar(im, PRE + '-3-fila-h.jpg')
print('FOTOS HECHAS')
