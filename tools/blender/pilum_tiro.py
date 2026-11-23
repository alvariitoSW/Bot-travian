"""AQVILA · prueba «pilum»: lanzamiento de pilum hecho en Blender sobre el esqueleto de Quaternius UAL2 (CC0).
Poses clave con cinemática inversa (manos, pies, pelvis, pecho), agarre de la mano y pilum que sale volando.
El muñeco mira a -Y; su derecha es -X."""
import bpy, math, json, sys
from mathutils import Vector, Matrix, Euler

ARG = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
RENDER = "--sin-render" not in ARG
S = bpy.context.scene; S.render.fps = 24
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
# ---------- limpieza de una pasada anterior ----------
for o in list(bpy.data.objects):
    if o.name.startswith(("T_", "Pilum", "Cam", "Sol", "Suelo", "Icosphere")): bpy.data.objects.remove(o, do_unlink=True)
for pb in arm.pose.bones:
    for c in list(pb.constraints): pb.constraints.remove(c)
    pb.rotation_mode = "QUATERNION"; pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)
if arm.animation_data: arm.animation_data.action = None
for a in list(bpy.data.actions):
    if a.name.startswith(("Pilum", "T_", "Sol", "Cam")): bpy.data.actions.remove(a)
bpy.context.view_layer.update()
REST = {b.name: (arm.matrix_world @ b.matrix_local).copy() for b in arm.data.bones}

def vacio(nombre, m):
    e = bpy.data.objects.new(nombre, None); e.empty_display_size = 0.08; S.collection.objects.link(e); e.matrix_world = m; e.rotation_mode = "QUATERNION"; return e

T = {}
T["pelvis"] = vacio("T_pelvis", REST["pelvis"]); T["pecho"] = vacio("T_pecho", REST["spine_03"]); T["cabeza"] = vacio("T_cabeza", REST["Head"])
T["mano_r"] = vacio("T_mano_r", REST["hand_r"]); T["mano_l"] = vacio("T_mano_l", REST["hand_l"])
T["pie_l"] = vacio("T_pie_l", REST["foot_l"]); T["pie_r"] = vacio("T_pie_r", REST["foot_r"])
T["codo_r"] = vacio("T_codo_r", Matrix.Translation((-1.3, 0.5, 0.7))); T["codo_l"] = vacio("T_codo_l", Matrix.Translation((1.2, 0.3, 0.6)))
T["rod_l"] = vacio("T_rod_l", Matrix.Translation((0.12, -2.0, 0.6))); T["rod_r"] = vacio("T_rod_r", Matrix.Translation((-0.25, -1.6, 0.6)))

P = arm.pose.bones
def copia(hueso, obj, loc=True, rot=True):
    if loc:
        c = P[hueso].constraints.new("COPY_LOCATION"); c.target = obj
    if rot:
        c = P[hueso].constraints.new("COPY_ROTATION"); c.target = obj
def ik(hueso, obj, polo, ang):
    c = P[hueso].constraints.new("IK"); c.target = obj; c.chain_count = 2; c.pole_target = polo; c.pole_angle = math.radians(ang)
copia("pelvis", T["pelvis"]); copia("spine_03", T["pecho"], loc=False); copia("Head", T["cabeza"], loc=False)
ik("lowerarm_r", T["mano_r"], T["codo_r"], float(next((a.split("=")[1] for a in ARG if a.startswith("polo_r=")), -90)))
ik("lowerarm_l", T["mano_l"], T["codo_l"], float(next((a.split("=")[1] for a in ARG if a.startswith("polo_l=")), -90)))
ik("calf_l", T["pie_l"], T["rod_l"], float(next((a.split("=")[1] for a in ARG if a.startswith("polo_p=")), -90)))
ik("calf_r", T["pie_r"], T["rod_r"], float(next((a.split("=")[1] for a in ARG if a.startswith("polo_p=")), -90)))
copia("hand_r", T["mano_r"], loc=False); copia("hand_l", T["mano_l"], loc=False); copia("foot_l", T["pie_l"], loc=False); copia("foot_r", T["pie_r"], loc=False)

# ---------- agarre: los dedos cierran sobre el asta (giro sobre el eje X de cada falange) ----------
for d, a in (("index", (62, 78, 55)), ("middle", (66, 80, 55)), ("ring", (70, 82, 55)), ("pinky", (74, 84, 55))):
    for k, g in enumerate(a, 1):
        pb = P[f"{d}_0{k}_r"]; pb.rotation_mode = "XYZ"; pb.rotation_euler = (math.radians(g), 0, 0)
for k, g in enumerate((28, 30, 35), 1):
    pb = P[f"thumb_0{k}_r"]; pb.rotation_mode = "XYZ"; pb.rotation_euler = (math.radians(g), 0, math.radians(-18 if k == 1 else 0))
for d in ("index", "middle", "ring", "pinky"):                      # la izquierda, medio cerrada sobre el asa del escudo
    for k in (1, 2, 3):
        pb = P[f"{d}_0{k}_l"]; pb.rotation_mode = "XYZ"; pb.rotation_euler = (math.radians(55), 0, 0)

# ---------- pilum: asta de 1,25 m, hierro de 0,65 m con punta piramidal; el origen es el punto de agarre ----------
def hacer_pilum(nombre):
    import bmesh
    bm = bmesh.new()
    def tramo(z0, z1, r0, r1, lados=8):
        a = [bm.verts.new((r0 * math.cos(i * 2 * math.pi / lados), r0 * math.sin(i * 2 * math.pi / lados), z0)) for i in range(lados)]
        b = [bm.verts.new((r1 * math.cos(i * 2 * math.pi / lados), r1 * math.sin(i * 2 * math.pi / lados), z1)) for i in range(lados)]
        fs = [bm.faces.new([a[i], a[(i + 1) % lados], b[(i + 1) % lados], b[i]]) for i in range(lados)]; bm.faces.new(list(reversed(a))); bm.faces.new(b); return fs
    mad = tramo(-0.72, 0.53, 0.014, 0.016)                                   # asta (la contera atrás)
    for f in tramo(0.50, 0.66, 0.030, 0.022, 4): mad.append(f)               # taco de unión
    hier = tramo(0.66, 1.18, 0.008, 0.006, 6) + tramo(1.18, 1.25, 0.016, 0.0005, 4) + tramo(-0.80, -0.72, 0.004, 0.013, 6)
    me = bpy.data.meshes.new(nombre);
    for f in bm.faces: f.material_index = 0
    for f in hier:
        if f.is_valid: f.material_index = 1
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for nm, col, met in (("M_Asta", (0.30, 0.19, 0.10, 1), 0.0), ("M_Hierro", (0.30, 0.31, 0.33, 1), 0.9)):
        m = bpy.data.materials.get(nm) or bpy.data.materials.new(nm); m.use_nodes = True
        b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); b.inputs["Base Color"].default_value = col; b.inputs["Metallic"].default_value = met; b.inputs["Roughness"].default_value = 0.55; me.materials.append(m)
    o = bpy.data.objects.new(nombre, me); S.collection.objects.link(o); o.rotation_mode = "QUATERNION"; return o

pil = hacer_pilum("Pilum_mano"); vuelo = hacer_pilum("Pilum_vuelo")
# en la mano: hijo del hueso; el asta va por el eje Z del hueso (de meñique a pulgar), la punta hacia el meñique (-Z); cruza la palma
pil.parent = arm; pil.parent_type = "BONE"; pil.parent_bone = "hand_r"
pil.matrix_parent_inverse = Matrix.Identity(4)
pil.location = (-0.030, 0.045, 0.0); pil.rotation_quaternion = Euler((math.pi, 0, 0)).to_quaternion()      # el +Z de la malla (punta) queda en el -Z del hueso

# ---------- poses clave ----------
def ejes_mano(punta, palma):
    """orientación del hueso de la mano: su -Z es la punta del pilum; su -X es hacia donde mira la palma"""
    z = -Vector(punta).normalized(); x = -Vector(palma); x = (x - z * x.dot(z)).normalized(); y = z.cross(x)
    return Matrix((x, y, z)).transposed()
def giro(base, guinada, cabeceo, alabeo=0.0):
    return (Matrix.Rotation(math.radians(guinada), 3, "Z") @ Matrix.Rotation(math.radians(cabeceo), 3, "X") @ Matrix.Rotation(math.radians(alabeo), 3, "Y") @ base.to_3x3())
def pon(obj, f, loc=None, rot=None):
    if loc is not None: obj.location = loc; obj.keyframe_insert("location", frame=f)
    if rot is not None: obj.rotation_quaternion = rot.to_quaternion(); obj.keyframe_insert("rotation_quaternion", frame=f)

pel0 = REST["pelvis"].translation; R_PIE_L = REST["foot_l"]; R_PIE_R = REST["foot_r"]
#   cuadro: pelvis(dx,dy,dz, guiñada, cabeceo) · pecho(guiñada, cabeceo, alabeo) · muñeca derecha · punta · palma · muñeca izquierda · tobillo izq (pos, giro) · tobillo der (pos, giro, talón)
CL = [
 (1,  (0.00, 0.06, -0.05, -28,  0), (-38,  -2,  0), (-0.34, 0.22, 1.60), (0.00, -1, 0.10), (0.35, 0, 0.94), (0.26, -0.30, 1.12), ((0.11, -0.16, 0.104),  8), ((-0.14, 0.26, 0.104), -55, 0)),
 (10, (0.00, 0.17, -0.09, -52, -6), (-78, -10, -6), (-0.30, 0.66, 1.56), (0.00, -1, 0.20), (0.30, 0, 0.95), (0.16, -0.44, 1.30), ((0.11, -0.24, 0.20),  6), ((-0.14, 0.28, 0.104), -65, 0)),
 (15, (0.00, -0.02, -0.10, -32, 0), (-52,  -4, -4), (-0.36, 0.52, 1.66), (0.00, -1, 0.18), (0.32, 0, 0.95), (0.20, -0.52, 1.22), ((0.11, -0.56, 0.104),  4), ((-0.14, 0.26, 0.104), -55, 12)),
 (19, (0.00, -0.24, -0.07,  8,  9), (34,   16,  6), (-0.20, -0.62, 1.78), (0.00, -1, 0.06), (0.10, -0.3, 0.95), (0.34, -0.36, 1.02), ((0.11, -0.56, 0.104),  4), ((-0.14, 0.22, 0.15), -40, 38)),
 (24, (0.01, -0.31, -0.10, 20, 14), (48,   26,  6), (-0.06, -0.66, 1.22), (0.1, -0.7, -0.7), (0.6, 0.3, -0.7), (0.38, -0.20, 1.00), ((0.11, -0.56, 0.104),  4), ((-0.14, 0.18, 0.16), -35, 34)),
 (30, (0.00, -0.22, -0.09,  6,  8), (14,   12,  2), (-0.24, -0.46, 1.02), (0.0, -0.5, 0.86), (0.9, -0.2, 0.2), (0.32, -0.30, 1.05), ((0.11, -0.48, 0.15),  6), ((-0.14, 0.24, 0.104), -50, 6)),
 (36, (0.00, 0.00, -0.06, -20,  2), (-26,   2,  0), (-0.30, -0.16, 1.00), (0.0, -0.35, 0.94), (0.95, -0.2, 0.1), (0.27, -0.30, 1.10), ((0.11, -0.20, 0.13),  8), ((-0.14, 0.26, 0.104), -55, 0)),
 (40, (0.00, 0.06, -0.05, -28,  0), (-38,  -2,  0), (-0.31, -0.10, 1.00), (0.0, -0.3, 0.95), (0.95, -0.2, 0.1), (0.26, -0.30, 1.12), ((0.11, -0.16, 0.104),  8), ((-0.14, 0.26, 0.104), -55, 0)),
]
for f, pv, ch, mr, punta, palma, ml, pl, pr in CL:
    Rp = giro(REST["pelvis"], pv[3], pv[4]); pon(T["pelvis"], f, pel0 + Vector(pv[:3]), Rp)
    pon(T["pecho"], f, None, giro(REST["spine_03"], ch[0], ch[1], ch[2])); pon(T["cabeza"], f, None, giro(REST["Head"], ch[0] * 0.25, ch[1] * 0.3))
    pon(T["mano_r"], f, Vector(mr), ejes_mano(punta, palma))
    pon(T["mano_l"], f, Vector(ml), giro(REST["hand_l"], ch[0] * 0.6 - 70, 0, -70))
    pon(T["pie_l"], f, Vector(pl[0]), giro(R_PIE_L, pl[1], 0)); pon(T["pie_r"], f, Vector(pr[0]), giro(R_PIE_R, pr[1], pr[2]))

# ---------- el pilum sale de la mano en el cuadro 19 y vuela ----------
SUELTA = 19
S.frame_set(SUELTA); bpy.context.view_layer.update()
m0 = pil.matrix_world.copy(); p0 = m0.translation.copy(); d0 = (m0.to_3x3() @ Vector((0, 0, 1))).normalized()
v = Vector((0.0, -1.0, 0.14)).normalized() * 17.0; g = Vector((0, 0, -9.8))
for f in range(SUELTA, 41):
    t = (f - SUELTA) / 24.0; pos = p0 + v * t + 0.5 * g * t * t; d = (v + g * t).normalized() if f > SUELTA else d0
    vuelo.location = pos; vuelo.rotation_quaternion = d.to_track_quat("Z", "Y"); vuelo.keyframe_insert("location", frame=f); vuelo.keyframe_insert("rotation_quaternion", frame=f)
for o, antes, despues in ((pil, False, True), (vuelo, True, False)):
    for f, oc in ((0, antes), (SUELTA - 1, antes), (SUELTA, despues)):
        o.hide_render = oc; o.hide_viewport = oc; o.keyframe_insert("hide_render", frame=f); o.keyframe_insert("hide_viewport", frame=f)

# ---------- cámara, luz y suelo ----------
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); S.collection.objects.link(cam); cam.data.lens = 42
lado = next((a.split("=")[1] for a in ARG if a.startswith("vista=")), "der")
cam.location = {"der": (-5.2, -1.6, 1.45), "frente": (0.9, -6.0, 1.5), "tres": (-3.6, -4.2, 1.9), "mano": (-1.25, -0.25, 1.75)}[lado]
mira = Vector((0, -0.25, 1.0)) if lado != "mano" else Vector((-0.3, 0.25, 1.6))
cam.rotation_euler = (mira - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler(); S.camera = cam
if lado == "mano": cam.data.lens = 60
cam.data.lens = float(next((a.split("=")[1] for a in ARG if a.startswith("lente=")), cam.data.lens))
sol = bpy.data.objects.new("Sol", bpy.data.lights.new("Sol", "SUN")); S.collection.objects.link(sol); sol.data.energy = 3.2; sol.rotation_euler = (math.radians(52), 0, math.radians(-128 if lado != "frente" else -40))
if not S.world: S.world = bpy.data.worlds.new("Mundo")
S.world.use_nodes = True; bg = next(n for n in S.world.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs["Color"].default_value = (0.62, 0.70, 0.80, 1); bg.inputs["Strength"].default_value = 0.9
me = bpy.data.meshes.new("Suelo"); me.from_pydata([(-9, -24, 0), (9, -24, 0), (9, 6, 0), (-9, 6, 0)], [], [(0, 1, 2, 3)]); su = bpy.data.objects.new("Suelo", me); S.collection.objects.link(su)
ms = bpy.data.materials.get("M_Suelo") or bpy.data.materials.new("M_Suelo"); ms.use_nodes = True; next(n for n in ms.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (0.36, 0.33, 0.24, 1); me.materials.append(ms)

info = {}
if "--hornea" in ARG:
    # la animación de los vacíos pasa a claves en los huesos (sin restricciones) y sale un .glb con el esqueleto y una sola acción
    bpy.context.view_layer.objects.active = arm
    for o in bpy.data.objects: o.select_set(o is arm)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    r = bpy.ops.nla.bake(frame_start=1, frame_end=40, step=1, only_selected=False, visual_keying=True, clear_constraints=True, use_current_action=False, bake_types={"POSE"})
    bpy.ops.object.mode_set(mode="OBJECT")
    acc = arm.animation_data.action; acc.name = "Pilum_Throw"
    for a in list(bpy.data.actions):
        if a is not acc and a.users == 0 or (a is not acc and not a.name.startswith(("T_", "Pilum", "Cam", "Sol"))): bpy.data.actions.remove(a)
    malla = bpy.data.objects.get("Mannequin")
    for o in bpy.data.objects: o.select_set(o in (arm, malla))
    e = bpy.ops.export_scene.gltf(filepath="/work/pilum_throw.glb", export_format="GLB", use_selection=True, export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True, export_frame_range=False, export_materials="NONE")
    info["hornea"] = [list(r), list(e), acc.name, list(acc.frame_range)]
S.frame_set(10); bpy.context.view_layer.update()
info["muneca_10"] = [round(x, 3) for x in (arm.matrix_world @ P["hand_r"].head)]; info["punta_10"] = [round(x, 3) for x in (pil.matrix_world.to_3x3() @ Vector((0, 0, 1)))]
info["codo_10"] = [round(x, 3) for x in (arm.matrix_world @ P["lowerarm_r"].head)]; info["rod_l_10"] = [round(x, 3) for x in (arm.matrix_world @ P["calf_l"].head)]
if RENDER:
    try: S.render.engine = "BLENDER_EEVEE"
    except TypeError: S.render.engine = "BLENDER_EEVEE_NEXT"
    S.render.resolution_x, S.render.resolution_y = (int(next((a.split("=")[1] for a in ARG if a.startswith("w=")), 440)), 520); S.render.image_settings.file_format = "JPEG"
    cuadros = [int(x) for x in next((a.split("=")[1] for a in ARG if a.startswith("cuadros=")), "1,6,10,13,15,17,19,21,24,28,34,40").split(",")]
    for f in cuadros:
        S.frame_set(f); S.render.filepath = f"/work/fr/{lado}_{f:02d}.jpg"; bpy.ops.render.render(write_still=True)
    info["cuadros"] = cuadros
print("@@JSON@@" + json.dumps(info))
