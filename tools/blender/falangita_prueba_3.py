"""FA2 · PRUEBA 3: «Materiales de foto, arte libre». El mismo falangita de hoy, vestido con materiales fotografiados.

Uso (entorno del taller: source /opt/aqvila-taller/entorno.sh):
  /opt/aqvila-taller/blender/bin/python -I tools/blender/falangita_prueba_3_texturas.py <bajadas> <tex>
  blender-py tools/blender/falangita_prueba_3.py -- <tex> <carpeta_fotos>
Deja FA2-P3-cerca-v.jpg (780x1688) y FA2-P3-cuerpo-h.jpg (1688x780) en <carpeta_fotos>.

Malla: la del juego tal cual (assets/soldados/falangita.bin/.json, 13 931 triángulos), puesta en el cuadro 0 del
movimiento «quieto» (movimientos_sarisa_74.bin). Piel, ojos y el color de las telas salen del atlas del juego
(falangita_color.webp, arte propio de AQVILA). Lo nuevo son los materiales de foto, con su escala real (proyección
en caja, en metros), suciedad en cavidades (oclusión) y bordes gastados (bisel), y el relieve del escudo.

Obras de terceros usadas (leídas en su página de OpenGameArt el 23/11/2026; bajadas solo al scratchpad):
| Obra                                                    | Autor        | Licencia  | Página |
| cc0 texture resources 4 - textile (foto IMGP6310: lino) | rubberduck   | CC0       | https://opengameart.org/content/cc0-texture-resources-4-textile |
| Metal - Batch of 90 Seamless Textures with normalmaps   | Keith333     | CC-BY 3.0 | https://opengameart.org/content/metal-batch-of-90-seamless-textures-with-normalmaps |
|   (de ahí: Mottled = martillado del bronce; DullScratched = rayas del bronce y del hierro)                            |
| Fabric - Old Leather - Seamless Texture With Normalmap  | Keith333     | CC-BY 3.0 | https://opengameart.org/content/fabric-old-leather-seamless-texture-with-normalmap |
| 5 wood textures (wood1: asta de la sarisa)              | Luke.RUSTLTD | CC0       | https://opengameart.org/content/5-wood-textures |
CC-BY 3.0 obliga a citar al autor (Keith333) si entra en el juego. Estrella y semicírculos del escudo: dibujo propio.
"""
import json, math, os, sys
import numpy as np
import bpy
from mathutils import Vector

AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
TEX, FOTOS = arg[0], arg[1]
SOL = os.path.join(RAIZ, 'assets', 'soldados')

# ---------------------------------------------------------------- malla del juego, en reposo («quieto», cuadro 0)
J = json.load(open(os.path.join(SOL, 'falangita.json'))); B = open(os.path.join(SOL, 'falangita.bin'), 'rb').read()
nv, nt, off = J['verts'], J['tris'], J['off']
P = np.frombuffer(B, np.float32, nv * 3, off['pos']).reshape(nv, 3).astype(float)
UV = np.frombuffer(B, np.float32, nv * 2, off['uv']).reshape(nv, 2)
SI = np.frombuffer(B, np.uint8, nv * 4, off['si']).reshape(nv, 4).astype(int)
SW = np.frombuffer(B, np.uint8, nv * 4, off['sw']).reshape(nv, 4) / 255.0
T = np.frombuffer(B, np.uint32 if J['idx32'] else np.uint16, nt * 3, off['idx']).reshape(nt, 3).astype(int)
nb = len(J['huesos']); A = np.frombuffer(open(os.path.join(SOL, J['anim'] + '.bin'), 'rb').read(), np.float16).reshape(-1, nb, 3, 4)
M = A[J['clips']['quieto']['ini']].astype(float)                       # (huesos, 3, 4): [D | t]
Ph = np.c_[P, np.ones(nv)]
P = sum(SW[:, k, None] * np.einsum('vij,vj->vi', M[SI[:, k]], Ph) for k in range(4))
P = np.c_[P[:, 0], -P[:, 2], P[:, 1]]                                  # Y arriba (three.js) -> Z arriba (Blender)

pieza_de_tri = []
for nombre, n in J['piezas'].items(): pieza_de_tri += [nombre] * n
assert len(pieza_de_tri) == nt
GRUPO = dict(piel='piel', ojol='piel', ojor='piel', manga='tela', faldon_tunica='tela', cota_lino='lino', hombrera='lino',
             pteruges='lino', greba='bronce', yelmo_cuenco='bronce', yelmo_visera='bronce', yelmo_nuca='bronce',
             yelmo_carrillera='bronce', escudo_frente='escudo', escudo_frenteb='bronce', escudo_dorso='cuero', correa='cuero',
             lanza_asta='madera', lanza_punta='hierro', lanza_regaton='hierro', lanza_manguito='bronce', vaina='cuero',
             espada_env_puno='cuero', espada_env_guarda='bronce', suela='cuero')
ORDEN = ['piel', 'tela', 'lino', 'bronce', 'escudo', 'cuero', 'madera', 'hierro']

# UV propia del escudo: plano medio del frente, centro y radio -> la máscara del relieve cae centrada
tri_esc = np.array([GRUPO[p] == 'escudo' for p in pieza_de_tri]); ve = np.unique(T[tri_esc])
c0 = P[ve].mean(0); _, _, V = np.linalg.svd(P[ve] - c0); e1, e2 = V[0], V[1]
q = np.c_[(P[ve] - c0) @ e1, (P[ve] - c0) @ e2]; R = np.linalg.norm(q, axis=1).max()
UVE = np.zeros((nv, 2)); UVE[ve] = q / (2 * R) + 0.5

for o in list(bpy.data.objects): bpy.data.objects.remove(o)
me = bpy.data.meshes.new('falangita'); me.from_pydata([tuple(p) for p in P], [], [tuple(t) for t in T]); me.update()
ua = me.uv_layers.new(name='atlas'); ue = me.uv_layers.new(name='escudo')
li = np.array([l.vertex_index for l in me.loops])
ua.data.foreach_set('uv', (UV[li] * [1, -1] + [0, 1]).ravel()); ue.data.foreach_set('uv', UVE[li].ravel())   # el atlas va con V hacia abajo (como lo lee three.js)
me.polygons.foreach_set('material_index', [ORDEN.index(GRUPO[p]) for p in pieza_de_tri])
for p in me.polygons: p.use_smooth = True
OB = bpy.data.objects.new('falangita', me); bpy.context.scene.collection.objects.link(OB)

# ---------------------------------------------------------------- materiales
def img(nombre, color=True):
    im = bpy.data.images.load(os.path.join(TEX, nombre)) if not os.path.isabs(nombre) else bpy.data.images.load(nombre)
    if not color: im.colorspace_settings.name = 'Non-Color'
    return im

ATLAS = img(os.path.join(SOL, 'falangita_color.webp'))
class Nodos:
    def __init__(s, nombre):
        s.m = bpy.data.materials.new(nombre); s.m.use_nodes = True; s.t = s.m.node_tree; s.t.nodes.clear()
        s.bsdf = s.n('ShaderNodeBsdfPrincipled'); s.out = s.n('ShaderNodeOutputMaterial'); s.l(s.bsdf.outputs[0], s.out.inputs[0])
        s.co = s.n('ShaderNodeTexCoord')
    def n(s, tipo, **kw):
        x = s.t.nodes.new(tipo)
        for k, v in kw.items(): setattr(x, k, v)
        return x
    def l(s, a, b): s.t.links.new(a, b)
    def foto(s, imagen, metros, color=True):
        """Imagen proyectada en caja sobre coordenadas del objeto: una repetición mide «metros»."""
        mp = s.n('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / metros,) * 3; s.l(s.co.outputs['Object'], mp.inputs['Vector'])
        tx = s.n('ShaderNodeTexImage', projection='BOX', projection_blend=0.3); tx.image = img(imagen, color); s.l(mp.outputs[0], tx.inputs['Vector'])
        return tx.outputs['Color']
    def uv(s, imagen, capa):
        um = s.n('ShaderNodeUVMap', uv_map=capa); tx = s.n('ShaderNodeTexImage'); tx.image = imagen if not isinstance(imagen, str) else img(imagen, False)
        s.l(um.outputs[0], tx.inputs['Vector']); return tx.outputs['Color']
    def mezcla(s, f, a, b, modo='MIX'):
        x = s.n('ShaderNodeMix', data_type='RGBA', blend_type=modo); s.lv(f, x.inputs[0]); s.lv(a, x.inputs[6]); s.lv(b, x.inputs[7]); return x.outputs[2]
    def lv(s, v, entrada):
        if isinstance(v, (int, float)): entrada.default_value = v
        elif isinstance(v, tuple): entrada.default_value = v + (1.0,) * (4 - len(v)) if len(entrada.default_value) == 4 else v
        else: s.l(v, entrada)
    def mat(s, op, a, b=0.0, c=0.0):
        x = s.n('ShaderNodeMath', operation=op); s.lv(a, x.inputs[0]); s.lv(b, x.inputs[1]); s.lv(c, x.inputs[2]); return x.outputs[0]
    def rampa(s, v, a, b, ca=(0, 0, 0), cb=(1, 1, 1)):
        x = s.n('ShaderNodeValToRGB'); s.lv(v, x.inputs[0]); e = x.color_ramp.elements
        e[0].position, e[1].position = a, b; e[0].color = ca + (1,); e[1].color = cb + (1,); return x.outputs[0]
    def relieve(s, altura, fuerza, dist, normal=None):
        b = s.n('ShaderNodeBump'); b.inputs['Strength'].default_value = fuerza; b.inputs['Distance'].default_value = dist
        s.l(altura, b.inputs['Height'])
        if normal is not None: s.l(normal, b.inputs['Normal'])
        return b.outputs[0]
    def cavidad(s, dist):
        a = s.n('ShaderNodeAmbientOcclusion', samples=8); a.inputs['Distance'].default_value = dist; return a.outputs['AO']
    def borde(s, radio):
        """1 en las aristas vivas (gastadas), 0 en lo plano: compara la normal biselada con la real."""
        bv = s.n('ShaderNodeBevel', samples=8); bv.inputs['Radius'].default_value = radio; g = s.n('ShaderNodeNewGeometry')
        d = s.n('ShaderNodeVectorMath', operation='DOT_PRODUCT'); s.l(bv.outputs[0], d.inputs[0]); s.l(g.outputs['Normal'], d.inputs[1])
        return s.mat('MULTIPLY', s.mat('SUBTRACT', 1.0, d.outputs['Value']), 14.0)
    def pon(s, entrada, v): s.lv(v, s.bsdf.inputs[entrada])

def m_piel():
    k = Nodos('piel'); c = k.uv(ATLAS, 'atlas'); k.pon('Base Color', c); k.pon('Roughness', 0.52)
    k.pon('Subsurface Weight', 0.12); k.bsdf.inputs['Subsurface Radius'].default_value = (0.9, 0.45, 0.25); k.pon('Subsurface Scale', 0.01)
    return k.m

def m_tela(nombre, metros, fuerza):
    """Color del atlas del juego por el detalle fotografiado del lino (media 0,5 -> x2)."""
    k = Nodos(nombre); c = k.uv(ATLAS, 'atlas'); det = k.foto('lino_det.png', metros, False)
    col = k.mezcla(1.0, c, det, 'MULTIPLY'); col = k.mezcla(1.0, col, (2.0, 2.0, 2.0), 'MULTIPLY')
    sucio = k.rampa(k.cavidad(0.06), 0.25, 0.95, (0.35, 0.30, 0.24), (1, 1, 1)); col = k.mezcla(1.0, col, sucio, 'MULTIPLY')
    k.pon('Base Color', col); k.pon('Roughness', 0.88); k.pon('Sheen Weight', 0.35); k.pon('Sheen Roughness', 0.6)
    k.pon('Normal', k.relieve(det, fuerza, 0.002)); return k.m

def m_bronce(nombre, escudo=False):
    k = Nodos(nombre)
    mart = k.foto('bronce_mart.png', 0.16, False)                       # golpes de 1-2 cm
    ray = k.foto('bronce_ray.png', 0.30, False)
    base = k.rampa(ray, 0.2, 0.8, (0.28, 0.16, 0.07), (0.58, 0.37, 0.16))
    manchas = k.rampa(k.foto('bronce_mart.png', 0.7, False), 0.3, 0.7, (0.62, 0.55, 0.45), (1, 1, 1))   # pátina desigual, a palmos
    base = k.mezcla(1.0, base, manchas, 'MULTIPLY')
    gasto = k.mat('MINIMUM', k.borde(0.006), 1.0)
    col = k.mezcla(gasto, base, (0.92, 0.70, 0.42))                     # aristas frotadas, más claras
    nrm = k.relieve(mart, 0.22, 0.004)
    rug = k.mat('MULTIPLY_ADD', ray, 0.40, 0.24)
    if escudo:
        rel = k.uv('escudo_relieve.png', 'escudo')
        col = k.mezcla(k.mat('MULTIPLY', rel, 0.6), col, (0.90, 0.68, 0.38))   # lo repujado brilla por el roce
        nrm = k.relieve(rel, 1.0, 0.006, nrm); rug = k.mat('SUBTRACT', rug, k.mat('MULTIPLY', rel, 0.12))
    cav = k.cavidad(0.05); verdin = k.rampa(cav, 0.15, 0.85, (0.12, 0.13, 0.08), (1, 1, 1))
    col = k.mezcla(1.0, col, verdin, 'MULTIPLY')
    k.pon('Base Color', col); k.pon('Metallic', 1.0); k.pon('Roughness', k.mat('ADD', rug, k.mat('MULTIPLY', k.mat('SUBTRACT', 1.0, cav), 0.4)))
    k.pon('Normal', nrm); return k.m

def m_cuero():
    k = Nodos('cuero'); c = k.foto('cuero_col.png', 0.25); g = k.n('ShaderNodeRGBToBW'); k.l(c, g.inputs[0])
    col = k.mezcla(1.0, c, (1.35, 1.15, 0.95), 'MULTIPLY')
    col = k.mezcla(1.0, col, k.rampa(k.cavidad(0.04), 0.2, 0.9, (0.4, 0.35, 0.3), (1, 1, 1)), 'MULTIPLY')
    k.pon('Base Color', col); k.pon('Roughness', k.mat('MULTIPLY_ADD', g.outputs[0], -0.6, 0.85)); k.pon('Normal', k.relieve(g.outputs[0], 0.5, 0.002)); return k.m

def m_madera():
    k = Nodos('madera'); c = k.foto('madera_col.png', 0.45); g = k.n('ShaderNodeRGBToBW'); k.l(c, g.inputs[0])
    col = k.n('ShaderNodeHueSaturation'); col.inputs['Saturation'].default_value = 0.75; col.inputs['Value'].default_value = 1.15; k.l(c, col.inputs['Color'])
    k.pon('Base Color', col.outputs[0]); k.pon('Roughness', 0.62); k.pon('Normal', k.relieve(g.outputs[0], 0.25, 0.002)); return k.m

def m_hierro():
    k = Nodos('hierro'); r = k.foto('hierro_ray.png', 0.20, False)
    k.pon('Base Color', k.rampa(r, 0.2, 0.8, (0.22, 0.21, 0.20), (0.50, 0.49, 0.47))); k.pon('Metallic', 1.0)
    k.pon('Roughness', k.mat('MULTIPLY_ADD', r, 0.35, 0.25)); k.pon('Normal', k.relieve(r, 0.15, 0.002)); return k.m

MATS = dict(piel=m_piel(), tela=m_tela('tela', 0.07, 0.35), lino=m_tela('lino', 0.09, 0.45), bronce=m_bronce('bronce'),
            escudo=m_bronce('escudo', True), cuero=m_cuero(), madera=m_madera(), hierro=m_hierro())
for g in ORDEN: me.materials.append(MATS[g])

# ---------------------------------------------------------------- escena común a las tres pruebas
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; cy = sc.cycles; cy.device = 'CPU'; cy.samples = 64
cy.use_denoising = True
try: cy.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
sc.render.film_transparent = True; sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
w = bpy.data.worlds.new('cielo'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes.get('Background') or w.node_tree.nodes.new('ShaderNodeBackground')
bg.inputs['Color'].default_value = (0.62, 0.70, 0.82, 1); bg.inputs['Strength'].default_value = 0.35
sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 4.0; sol.angle = math.radians(3); sol.color = (1.0, 0.86, 0.68)
SO = bpy.data.objects.new('sol', sol); sc.collection.objects.link(SO)
cam = bpy.data.cameras.new('cam'); cam.lens = 70; cam.sensor_fit = 'AUTO'; CA = bpy.data.objects.new('cam', cam); sc.collection.objects.link(CA); sc.camera = CA

def encuadra(giro_grados, objetivo, distancia, alto_ojo=0.15):
    """Gira al soldado (no la cámara: así el sol queda siempre arriba-izquierda-delante del que mira)."""
    OB.rotation_euler = (0, 0, math.radians(giro_grados)); bpy.context.view_layer.update()
    t = Vector(objetivo); CA.location = t + Vector((0, -distancia, alto_ojo * distancia))
    CA.rotation_euler = (t - CA.location).to_track_quat('-Z', 'Y').to_euler()
    d = Vector((0.55, 0.75, -0.42)).normalized()                       # el sol viene de arriba, izquierda y delante
    SO.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def render(ancho, alto, ruta):
    sc.render.resolution_x, sc.render.resolution_y = ancho, alto; sc.render.resolution_percentage = 100
    sc.render.filepath = ruta; bpy.ops.render.render(write_still=True)

zs = P[:, 2]; cuerpo = np.array([p in ('piel', 'yelmo_cuenco', 'suela') for p in pieza_de_tri]); vc = np.unique(T[cuerpo])
x0, x1 = P[vc, 0].min(), P[vc, 0].max(); z0, z1 = P[vc, 2].min(), P[vc, 2].max(); h = z1 - z0
print('tris', nt, 'alto cuerpo %.2f m' % h)
os.makedirs(FOTOS, exist_ok=True); tmp = os.path.join(TEX, '_render'); os.makedirs(tmp, exist_ok=True)
GIRO_FRENTE = -35                                                        # tres cuartos de frente

def fija(objetivo):
    """Objetivo en coordenadas del soldado sin girar -> girado con él."""
    return OB.matrix_world @ Vector(objetivo)

# Cerca: de cintura arriba, tres cuartos de frente
GIRO_CERCA = 30                                                          # tres cuartos por el lado de la sarisa: el escudo no tapa la coraza
encuadra(GIRO_CERCA, (0, 0, 0), 1); cz = z0 + 0.75 * h; cx = (x0 + x1) / 2
encuadra(GIRO_CERCA, fija((cx, 0, cz)), 2.45, 0.05); render(780, 1688, os.path.join(tmp, 'cerca.png'))
# Cuerpo entero: frente y espalda
for nombre, giro in (('frente', GIRO_FRENTE), ('espalda', 180 + 35)):
    encuadra(giro, (0, 0, 0), 1); encuadra(giro, fija((cx * 0.5, 0, z0 + 0.48 * h)), 4.5, 0.06); render(844, 780, os.path.join(tmp, nombre + '.png'))

# ---------------------------------------------------------------- fondo pergamino y rótulo (Pillow)
from PIL import Image, ImageDraw, ImageFont
FONDO = (0xe9, 0xdf, 0xc4)
def letrero(im):
    d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
    except Exception: f = ImageFont.load_default()
    t = 'Prueba 3 · Materiales de foto'; x0_, y0_, x1_, y1_ = d.textbbox((28, 22), t, font=f)
    d.rounded_rectangle((x0_ - 12, y0_ - 9, x1_ + 12, y1_ + 9), 8, fill=(246, 239, 221)); d.text((28, 22), t, font=f, fill=(40, 30, 20))
    return im
def sobre_fondo(ruta):
    a = Image.open(ruta).convert('RGBA'); f = Image.new('RGBA', a.size, FONDO + (255,)); f.alpha_composite(a); return f.convert('RGB')
letrero(sobre_fondo(os.path.join(tmp, 'cerca.png'))).save(os.path.join(FOTOS, 'FA2-P3-cerca-v.jpg'), quality=90)
H = Image.new('RGB', (1688, 780), FONDO); H.paste(sobre_fondo(os.path.join(tmp, 'frente.png')), (0, 0)); H.paste(sobre_fondo(os.path.join(tmp, 'espalda.png')), (844, 0))
letrero(H).save(os.path.join(FOTOS, 'FA2-P3-cuerpo-h.jpg'), quality=90)
print('fotos hechas en', FOTOS)
