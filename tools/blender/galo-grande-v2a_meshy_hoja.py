"""AL9 · hoja de fotos del galo grande v2 TAL COMO LO CARGA EL JUEGO (sin navegador: Blender sin pantalla, Cycles).

Lee assets/soldados/galo-grande-v2a[_nivel].bin/.json, sus texturas webp y movimientos_escudo_74/36.bin, dobla la malla
con el cuadro pedido (P' = sum w·M[hueso]·[P,1], como js/gfx/soldado.js) y aplica en la CPU el tinte de la máscara con la
fórmula del sombreador del juego (tela·2,2 en R, tono de piel en G, tono de pelo en R+B), con la paleta gala de soldado.js.
Sin armas ni escudo (el juego los pone por código). Luz y fondo de taller: en el móvil se verá algo más plano.

Uso: source /opt/aqvila-taller/entorno.sh; blender-py tools/blender/galo-grande-v2a_meshy_hoja.py -- [fotos=gobierno/capturas-tarea] [muestras=48]
Saca AL9-1-color-v.jpg (780×1688), AL9-2-niveles-h.jpg, AL9-3-siluetas-h.jpg y AL9-4-piernas-h.jpg (1688×780).
"""
import bpy, numpy as np, math, os, sys, json
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..')); SOL = os.path.join(RAIZ, 'assets', 'soldados')
ARG = dict(a.split('=', 1) for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []) if '=' in a)
FOTOS = ARG.get('fotos', os.path.join(RAIZ, 'gobierno', 'capturas-tarea')); MUESTRAS = int(ARG.get('muestras', 48)); TMP = ARG.get('tmp', '/tmp/al9-hoja')
os.makedirs(TMP, exist_ok=True); os.makedirs(FOTOS, exist_ok=True)
QUIEN = 'galo-grande-v2a'
# paleta gala de js/gfx/soldado.js (galo: pelo, telas, piel)
PELO = [np.array([0.50, 0.42, 0.34]), np.array([1.12, 1.02, 0.92])]
TELAS = ['#3f5f7a', '#5a7a4a', '#9a7a3a', '#8a4a30', '#6a5a7a', '#4a6a6a']
PIEL = [np.array([1.06, 0.99, 0.95]), np.array([0.88, 0.78, 0.72])]
hexa = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255
lin = lambda c: np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
srgb = lambda c: np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)

def carga(suf):
    j = json.load(open(os.path.join(SOL, QUIEN + suf + '.json'))); b = open(os.path.join(SOL, QUIEN + suf + '.bin'), 'rb').read(); nv = j['verts']; o = j['off']
    g = lambda k, dt, n: np.frombuffer(b, dt, n, o[k])
    d = dict(j=j, P=g('pos', np.float32, nv * 3).reshape(nv, 3).astype(float), UV=g('uv', np.float32, nv * 2).reshape(nv, 2),
             SI=g('si', np.uint8, nv * 4).reshape(nv, 4).astype(int), SW=g('sw', np.uint8, nv * 4).reshape(nv, 4) / 255.0,
             T=g('idx', np.uint32 if j['idx32'] else np.uint16, j['tris'] * 3).reshape(-1, 3).astype(int))
    nb = len(j['huesos']); d['A'] = np.frombuffer(open(os.path.join(SOL, j['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nb, 3, 4).astype(float)
    tex = {k: np.asarray(Image.open(os.path.join(SOL, v)).convert('RGB'), np.float32) / 255 for k, v in j['texturas'].items()}
    d['tex'] = tex; return d

def tenir(tex, tela, h1, piel_t):
    """Fórmula del sombreador del juego (F_COLOR de js/gfx/soldado.js), sin barba ni escudo, en lineal."""
    col = lin(tex['color']); mk = np.asarray(Image.fromarray((tex['masc'] * 255).astype(np.uint8)).resize(col.shape[1::-1], Image.BILINEAR), np.float32) / 255
    r, g, b = mk[..., 0], mk[..., 1], mk[..., 2]; pelo = np.minimum(r, b); r2 = np.maximum(r - np.maximum(pelo, np.minimum(r, g)), 0)
    col = col * (1 - r2[..., None]) + col * hexa(tela) ** 2.2 * 2.2 * r2[..., None]          # uTela llega en lineal (THREE.Color)
    col = col * (1 + (PIEL[0] + (PIEL[1] - PIEL[0]) * piel_t - 1) * g[..., None])
    tono = PELO[0] + (PELO[1] - PELO[0]) * h1 * h1; col = col * (1 - pelo[..., None]) + col * tono * pelo[..., None]
    return srgb(np.clip(col, 0, 1))

def pose(d, clip, df):
    c = d['j']['clips'][clip]; M = d['A'][c['ini'] + min(df, c['n'] - 1)]; P1 = np.c_[d['P'], np.ones(len(d['P']))]
    return sum(d['SW'][:, k, None] * np.einsum('vij,vj->vi', M[d['SI'][:, k]], P1) for k in range(4))

sc = bpy.context.scene; bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.world = bpy.data.worlds.new('mundo'); sc.world.use_nodes = True; wn = sc.world.node_tree.nodes; wn.clear(); wl = sc.world.node_tree.links
wo = wn.new('ShaderNodeOutputWorld'); cielo = wn.new('ShaderNodeBackground'); cielo.inputs[0].default_value = (0.42, 0.47, 0.56, 1); cielo.inputs[1].default_value = 0.45
fondo = wn.new('ShaderNodeBackground'); FONDO = [float(lin(np.array(x / 255))) for x in (0xe9, 0xdf, 0xc4)]; fondo.inputs[0].default_value = (*FONDO, 1)
lp = wn.new('ShaderNodeLightPath'); mx = wn.new('ShaderNodeMixShader'); wl.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wl.new(cielo.outputs[0], mx.inputs[1]); wl.new(fondo.outputs[0], mx.inputs[2]); wl.new(mx.outputs[0], wo.inputs[0])
sol_d = bpy.data.lights.new('sol', 'SUN'); sol_d.energy = 4.0; sol_d.angle = math.radians(3); sol = bpy.data.objects.new('sol', sol_d); sc.collection.objects.link(sol)
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 70; cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
BL = lambda P: np.stack([P[:, 0], -P[:, 2], P[:, 1]], 1)

def material(nombre, d, tela=None, h1=0.6, piel_t=0.3, negro=False):
    mt = bpy.data.materials.new(nombre); mt.use_nodes = True; nt = mt.node_tree; nt.nodes.clear(); L = nt.links; o = nt.nodes.new('ShaderNodeOutputMaterial')
    if negro:
        e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (0, 0, 0, 1); L.new(e.outputs[0], o.inputs[0]); return mt
    def img(arr, n, cs):
        ruta = os.path.join(TMP, n + '.png'); Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8)).save(ruta)
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(ruta); t.image.colorspace_settings.name = cs; return t
    tc = img(tenir(d['tex'], tela, h1, piel_t) if tela else d['tex']['color'], nombre + '_c', 'sRGB'); tn = img(d['tex']['normal'], nombre + '_n', 'Non-Color'); to = img(d['tex']['orm'], nombre + '_o', 'Non-Color')
    sp = nt.nodes.new('ShaderNodeSeparateColor'); L.new(to.outputs[0], sp.inputs[0]); pb = nt.nodes.new('ShaderNodeBsdfPrincipled')
    ao = nt.nodes.new('ShaderNodeMath'); ao.operation = 'MULTIPLY_ADD'; L.new(sp.outputs[0], ao.inputs[0]); ao.inputs[1].default_value = 0.65; ao.inputs[2].default_value = 0.35
    mu = nt.nodes.new('ShaderNodeMix'); mu.data_type = 'RGBA'; mu.blend_type = 'MULTIPLY'; mu.inputs['Factor'].default_value = 1.0; L.new(tc.outputs[0], mu.inputs['A']); L.new(ao.outputs[0], mu.inputs['B'])
    L.new(mu.outputs['Result'], pb.inputs['Base Color']); L.new(sp.outputs[1], pb.inputs['Roughness']); L.new(sp.outputs[2], pb.inputs['Metallic'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); L.new(tn.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], pb.inputs['Normal']); L.new(pb.outputs[0], o.inputs[0]); return mt

def hombre(d, clip, df, mat, dx=0.0, giro=0.0, dz=0.0):
    P = pose(d, clip, df); c, s_ = math.cos(giro), math.sin(giro); P = np.c_[P[:, 0] * c + P[:, 2] * s_, P[:, 1], -P[:, 0] * s_ + P[:, 2] * c] + [dx, 0, dz]
    me = bpy.data.meshes.new('h'); me.from_pydata(BL(P).tolist(), [], d['T'].tolist()); me.update()
    me.uv_layers.new(name='UVMap').data.foreach_set('uv', (d['UV'][d['T'].ravel()] * [1, -1] + [0, 1]).astype(np.float32).ravel())   # el juego guarda v hacia abajo
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat); ob = bpy.data.objects.new('h', me); sc.collection.objects.link(ob); return ob

def limpia():
    for o in [o for o in sc.objects if o.type == 'MESH']: bpy.data.objects.remove(o)

def foto(w, h, objetivo, dist, azim, elev, lente=70, solo_fondo=False):
    cam_d.lens = lente; objetivo = Vector(objetivo); dv = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)), -math.cos(math.radians(azim)) * math.cos(math.radians(elev)), math.sin(math.radians(elev))))
    cam.location = objetivo + dv * dist; cam.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
    der = (-dv).cross(Vector((0, 0, 1))).normalized(); arr = der.cross(-dv).normalized(); hl = (-der * 0.62 + arr * 0.55 + dv * 0.56).normalized(); sol.rotation_euler = (-hl).to_track_quat('-Z', 'Y').to_euler()
    cielo.inputs[1].default_value = 0.0 if solo_fondo else 0.45; sol_d.energy = 0.0 if solo_fondo else 4.0
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100; ruta = os.path.join(TMP, 'r.png'); sc.render.filepath = ruta
    bpy.ops.render.render(write_still=True); return Image.open(ruta).convert('RGB')

def fuente(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()
def etiqueta(img, txt, x, y, t):
    dr = ImageDraw.Draw(img); f = fuente(t); b = dr.textbbox((0, 0), txt, font=f)
    dr.rounded_rectangle((x, y, x + b[2] + 24, y + b[3] + 18), 10, fill=(244, 236, 214)); dr.text((x + 12, y + 7), txt, font=f, fill=(40, 30, 20))

N = {k: carga(s) for k, s in (('fino', ''), ('lejos', '_lejos'), ('muylejos', '_muylejos'), ('fondo', '_fondo'))}
F = N['fino']
# 1 · color (vertical): tres hombres de dos bandos, con su tono de pelo y piel
VAR = [('#3f5f7a', 0.95, 0.2), ('#8a4a30', 0.35, 0.8), ('#3f5f7a', 0.6, 0.5)]
mats = [material('v%d' % i, F, *v) for i, v in enumerate(VAR)]
hombre(F, 'guardia', 12, mats[0], 0.0); hombre(F, 'quieto', 0, mats[1], -0.62, 0.35, -0.6); hombre(F, 'quieto', 30, mats[2], 0.62, -0.35, -0.6)
im = foto(780, 1688, (0.0, 0.0, 0.98), 7.6, -14, 8, lente=50); etiqueta(im, 'Galo grande v2 · fino · dos bandos', 16, 12, 27); im.save(os.path.join(FOTOS, 'AL9-1-color-v.jpg'), quality=90); limpia()
# 2 · los cuatro niveles (horizontal), cada uno a su color
im2 = Image.new('RGB', (1688, 780))
for i, (n, d) in enumerate(N.items()):
    hombre(d, 'guardia', 12, material('n' + n, d, '#5a7a4a', 0.6, 0.4)); p = foto(422, 780, (0.0, 0.0, 0.92), 4.6, -30, 3)
    etiqueta(p, '%s · %d triáng.' % (n, d['j']['tris']), 8, 700, 19); im2.paste(p, (422 * i, 0)); limpia()
etiqueta(im2, 'Galo grande v2 · los cuatro niveles del juego, en «guardia»', 16, 12, 27); im2.save(os.path.join(FOTOS, 'AL9-2-niveles-h.jpg'), quality=90)
# 3 · siluetas en negro, de frente, de lado y de espaldas (lo que lee el jugador de lejos)
negro = material('negro', F, negro=True); im3 = Image.new('RGB', (1688, 780)); i = 0
for clip, df in (('quieto', 0), ('guardia', 12), ('golpear', 16)):
    for azim in (0, 90, 180):
        if i >= 8: break
        hombre(F, clip, df, negro); p = foto(211, 780, (0.0, 0.0, 0.92), 6.0, azim, 3, solo_fondo=True)
        etiqueta(p, clip, 6, 690, 15); etiqueta(p, {0: 'frente', 90: 'lado', 180: 'espalda'}[azim], 6, 728, 15); im3.paste(p, (211 * i, 0)); i += 1; limpia()
etiqueta(im3, 'Galo grande v2 · siluetas', 16, 12, 24); im3.save(os.path.join(FOTOS, 'AL9-3-siluetas-h.jpg'), quality=90)
# 4 · piernas y falda a cuadros en movimiento (andar, correr, guardia, golpear), de frente y de lado
mat4 = material('p', F, '#9a7a3a', 0.7, 0.4); im4 = Image.new('RGB', (1688, 780)); i = 0
for clip, df in (('andar', 10), ('andar', 30), ('correr', 7), ('correr', 21)):
    for azim in (-25, 70):
        hombre(F, clip, df, mat4); p = foto(211, 780, (0.0, 0.0, 0.80), 5.0, azim, 4)
        etiqueta(p, '%s %d' % (clip, df), 6, 728, 15); im4.paste(p, (211 * i, 0)); i += 1; limpia()
etiqueta(im4, 'Galo grande v2 · la falda con las piernas en marcha', 16, 12, 24); im4.save(os.path.join(FOTOS, 'AL9-4-piernas-h.jpg'), quality=90)
print('HOJA HECHA', FOTOS, flush=True)
