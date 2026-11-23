"""AQVILA · cuartel romano republicano (prueba UR2). Arte propio, por código, en Blender.
Recinto de 20 x 18 m: puerta al frente (-Y), dos naves de barracones con pórtico de postes a los lados,
cuerpo principal al fondo con frontón, patio de tierra con postes de entrenamiento y armero.
Toba en el zócalo, enlucido de cal con zócalo rojo, teja de barro, madera sin pintar. Sin almenas ni entramado."""
import bpy, bmesh, math, json
from mathutils import Vector

# ---------- escena limpia ----------
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
for i in list(bpy.data.images): bpy.data.images.remove(i)

# ---------- materiales procedurales ----------
def nuevo(nombre):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    nt = m.node_tree; b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Roughness"].default_value = 0.9
    return m, nt, b

def rampa(nt, pares):
    r = nt.nodes.new("ShaderNodeValToRGB"); e = r.color_ramp.elements
    while len(e) > 1: e.remove(e[-1])
    e[0].position, e[0].color = pares[0][0], (*pares[0][1], 1)
    for p, c in pares[1:]:
        k = e.new(p); k.color = (*c, 1)
    return r

def mat_plaster():
    m, nt, b = nuevo("M_Enlucido")
    geo = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(geo.outputs["Position"], sep.inputs[0])
    ruido = nt.nodes.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = 1.6; ruido.inputs["Detail"].default_value = 8; ruido.inputs["Roughness"].default_value = 0.65
    cal = rampa(nt, [(0.30, (0.60, 0.50, 0.36)), (0.52, (0.80, 0.72, 0.56)), (0.75, (0.86, 0.80, 0.66))]); nt.links.new(ruido.outputs["Fac"], cal.inputs[0])
    ruido2 = nt.nodes.new("ShaderNodeTexNoise"); ruido2.inputs["Scale"].default_value = 3.0; ruido2.inputs["Detail"].default_value = 6
    rojo = rampa(nt, [(0.30, (0.34, 0.07, 0.04)), (0.70, (0.50, 0.12, 0.07))]); nt.links.new(ruido2.outputs["Fac"], rojo.inputs[0])
    # zócalo rojo hasta 1,25 m, con borde irregular; suciedad que sube desde el suelo
    suma = nt.nodes.new("ShaderNodeMath"); suma.operation = "ADD"; nt.links.new(sep.outputs["Z"], suma.inputs[0])
    esc = nt.nodes.new("ShaderNodeMath"); esc.operation = "MULTIPLY"; esc.inputs[1].default_value = 0.10; nt.links.new(ruido2.outputs["Fac"], esc.inputs[0]); nt.links.new(esc.outputs[0], suma.inputs[1])
    corte = nt.nodes.new("ShaderNodeMath"); corte.operation = "GREATER_THAN"; corte.inputs[1].default_value = 1.55; nt.links.new(suma.outputs[0], corte.inputs[0])
    mez = nt.nodes.new("ShaderNodeMix"); mez.data_type = "RGBA"; nt.links.new(corte.outputs[0], mez.inputs["Factor"]); nt.links.new(rojo.outputs["Color"], mez.inputs["A"]); nt.links.new(cal.outputs["Color"], mez.inputs["B"])
    suc = nt.nodes.new("ShaderNodeMapRange"); suc.inputs["From Min"].default_value = 0.2; suc.inputs["From Max"].default_value = 1.0; suc.inputs["To Min"].default_value = 0.62; suc.inputs["To Max"].default_value = 1.0; nt.links.new(sep.outputs["Z"], suc.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs["Factor"].default_value = 1.0
    gris = nt.nodes.new("ShaderNodeCombineColor");
    for k in ("Red", "Green", "Blue"): nt.links.new(suc.outputs["Result"], gris.inputs[k])
    nt.links.new(mez.outputs["Result"], mul.inputs["A"]); nt.links.new(gris.outputs["Color"], mul.inputs["B"]); nt.links.new(mul.outputs["Result"], b.inputs["Base Color"])
    return m

def mat_toba():
    m, nt, b = nuevo("M_Toba")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    lad = nt.nodes.new("ShaderNodeTexBrick"); lad.inputs["Scale"].default_value = 1.0; lad.inputs["Mortar Size"].default_value = 0.035
    lad.inputs["Brick Width"].default_value = 1.1; lad.inputs["Row Height"].default_value = 0.55
    lad.inputs["Color1"].default_value = (0.50, 0.43, 0.30, 1); lad.inputs["Color2"].default_value = (0.40, 0.36, 0.28, 1); lad.inputs["Mortar"].default_value = (0.16, 0.13, 0.10, 1)
    # el patrón de ladrillo vive en XY: se gira la posición para que las hiladas corran en horizontal sobre los muros
    mp = nt.nodes.new("ShaderNodeVectorMath"); mp.operation = "MULTIPLY"; mp.inputs[1].default_value = (1, 1, 1)
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); comb = nt.nodes.new("ShaderNodeCombineXYZ"); nt.links.new(geo.outputs["Position"], sep.inputs[0])
    su = nt.nodes.new("ShaderNodeMath"); su.operation = "ADD"; nt.links.new(sep.outputs["X"], su.inputs[0]); nt.links.new(sep.outputs["Y"], su.inputs[1])
    nt.links.new(su.outputs[0], comb.inputs["X"]); nt.links.new(sep.outputs["Z"], comb.inputs["Y"]); nt.links.new(comb.outputs[0], lad.inputs["Vector"])
    ruido = nt.nodes.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = 5; ruido.inputs["Detail"].default_value = 6
    mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs["Factor"].default_value = 0.55
    nt.links.new(lad.outputs["Color"], mul.inputs["A"]); nt.links.new(ruido.outputs["Color"], mul.inputs["B"]); nt.links.new(mul.outputs["Result"], b.inputs["Base Color"])
    return m

def mat_teja(eje):
    """teja de barro: hileras de ímbrices que bajan por el faldón (eje = coordenada a lo largo de la cumbrera) y filas de tégulas"""
    m, nt, b = nuevo("M_Teja" + eje)
    geo = nt.nodes.new("ShaderNodeNewGeometry"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(geo.outputs["Position"], sep.inputs[0])
    def diente(salida, periodo, ancho):
        d = nt.nodes.new("ShaderNodeMath"); d.operation = "DIVIDE"; d.inputs[1].default_value = periodo; nt.links.new(salida, d.inputs[0])
        f = nt.nodes.new("ShaderNodeMath"); f.operation = "FRACT"; nt.links.new(d.outputs[0], f.inputs[0])
        c = nt.nodes.new("ShaderNodeMath"); c.operation = "LESS_THAN"; c.inputs[1].default_value = ancho; nt.links.new(f.outputs[0], c.inputs[0]); return c, f
    cob, fr = diente(sep.outputs[eje], 0.55, 0.30)          # cobijas (ímbrices): franja clara
    otro = "Y" if eje == "X" else "X"
    fila, _ = diente(sep.outputs[otro], 0.62, 0.07)          # solape entre filas de tégulas: línea oscura
    ruido = nt.nodes.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = 2.2; ruido.inputs["Detail"].default_value = 7
    base = rampa(nt, [(0.30, (0.36, 0.13, 0.07)), (0.55, (0.52, 0.21, 0.11)), (0.80, (0.62, 0.30, 0.17))]); nt.links.new(ruido.outputs["Fac"], base.inputs[0])
    clara = nt.nodes.new("ShaderNodeMix"); clara.data_type = "RGBA"; clara.blend_type = "MULTIPLY"; clara.inputs["B"].default_value = (1.28, 1.2, 1.12, 1)
    nt.links.new(cob.outputs[0], clara.inputs["Factor"]); nt.links.new(base.outputs["Color"], clara.inputs["A"])
    sombra = nt.nodes.new("ShaderNodeMix"); sombra.data_type = "RGBA"; sombra.blend_type = "MULTIPLY"; sombra.inputs["B"].default_value = (0.45, 0.42, 0.40, 1)
    nt.links.new(fila.outputs[0], sombra.inputs["Factor"]); nt.links.new(clara.outputs["Result"], sombra.inputs["A"])
    # borde oscuro de cada cobija, para que la hilera tenga volumen
    borde = nt.nodes.new("ShaderNodeMath"); borde.operation = "COMPARE"; borde.inputs[1].default_value = 0.32; borde.inputs[2].default_value = 0.035; nt.links.new(fr.outputs[0], borde.inputs[0])
    osc = nt.nodes.new("ShaderNodeMix"); osc.data_type = "RGBA"; osc.blend_type = "MULTIPLY"; osc.inputs["B"].default_value = (0.5, 0.45, 0.42, 1)
    nt.links.new(borde.outputs[0], osc.inputs["Factor"]); nt.links.new(sombra.outputs["Result"], osc.inputs["A"]); nt.links.new(osc.outputs["Result"], b.inputs["Base Color"])
    return m

def mat_ruido(nombre, c0, c1, escala=4.0, veta=None):
    m, nt, b = nuevo(nombre)
    ruido = nt.nodes.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = escala; ruido.inputs["Detail"].default_value = 8
    if veta:
        geo = nt.nodes.new("ShaderNodeNewGeometry"); mp = nt.nodes.new("ShaderNodeVectorMath"); mp.operation = "MULTIPLY"; mp.inputs[1].default_value = veta
        nt.links.new(geo.outputs["Position"], mp.inputs[0]); nt.links.new(mp.outputs[0], ruido.inputs["Vector"])
    r = rampa(nt, [(0.32, c0), (0.72, c1)]); nt.links.new(ruido.outputs["Fac"], r.inputs[0]); nt.links.new(r.outputs["Color"], b.inputs["Base Color"])
    return m

MATS = [mat_plaster(), mat_toba(), mat_teja("X"), mat_teja("Y"),
        mat_ruido("M_Madera", (0.13, 0.08, 0.045), (0.27, 0.17, 0.09), 3.0, (1.2, 1.2, 9.0)),
        mat_ruido("M_Tierra", (0.33, 0.26, 0.17), (0.47, 0.38, 0.25), 1.3),
        mat_ruido("M_Hueco", (0.035, 0.028, 0.022), (0.07, 0.05, 0.04), 4.0),
        mat_ruido("M_Escudo", (0.36, 0.06, 0.04), (0.52, 0.10, 0.06), 6.0),
        mat_ruido("M_Bronce", (0.42, 0.30, 0.12), (0.62, 0.47, 0.20), 9.0)]
ENL, TOBA, TEJAX, TEJAY, MAD, TIERRA, HUECO, ESCUDO, BRONCE = range(9)

# ---------- geometría: todo sólidos cerrados ----------
bm = bmesh.new()

def caja(x0, x1, y0, y1, z0, z1, mat, giro=0.0, eje=None):
    vs = [bm.verts.new(p) for p in [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]]
    fs = [bm.faces.new([vs[i] for i in q]) for q in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]]
    for f in fs: f.material_index = mat
    if giro:
        c = Vector(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)); bmesh.ops.rotate(bm, cent=c, matrix=__import__("mathutils").Matrix.Rotation(giro, 3, eje or "Z"), verts=vs)
    return fs

def tejado(x0, x1, y0, y1, z0, h, eje, vuelo=0.55, canto=0.22):
    """prisma a dos aguas, cerrado; cumbrera a lo largo de `eje`. Faldones con teja, hastiales con enlucido, bajo de madera."""
    if eje == "X":
        a0, a1, b0, b1 = x0 - vuelo * 0.6, x1 + vuelo * 0.6, y0 - vuelo, y1 + vuelo; bm_ = (b0 + b1) / 2
        P = lambda a, b, z: (a, b, z)
    else:
        a0, a1, b0, b1 = y0 - vuelo * 0.6, y1 + vuelo * 0.6, x0 - vuelo, x1 + vuelo; bm_ = (b0 + b1) / 2
        P = lambda a, b, z: (b, a, z)
    zt = z0 + h + canto
    sec = [(b0, z0), (b1, z0), (b1, z0 + canto), (bm_, zt), (b0, z0 + canto)]
    A = [bm.verts.new(P(a0, b, z)) for b, z in sec]; B = [bm.verts.new(P(a1, b, z)) for b, z in sec]
    n = len(sec); caras = []
    caras.append((bm.faces.new(A), ENL)); caras.append((bm.faces.new(list(reversed(B))), ENL))
    for i in range(n):
        j = (i + 1) % n; f = bm.faces.new([A[j], A[i], B[i], B[j]])
        caras.append((f, MAD if i == 0 else (TEJAX if eje == "X" else TEJAY) if i in (2, 3) else MAD))
    for f, m in caras: f.material_index = m
    # caballete de cobijas en la cumbrera
    if eje == "X": caja(a0, a1, bm_ - 0.22, bm_ + 0.22, zt - 0.10, zt + 0.16, TEJAX)
    else: caja(bm_ - 0.22, bm_ + 0.22, a0, a1, zt - 0.10, zt + 0.16, TEJAY)

def poste(x, y, z0, z1, r=0.17, lados=8, mat=MAD):
    aro0 = [bm.verts.new((x + r * math.cos(k * 2 * math.pi / lados), y + r * math.sin(k * 2 * math.pi / lados), z0)) for k in range(lados)]
    aro1 = [bm.verts.new((v.co.x, v.co.y, z1)) for v in aro0]
    fs = [bm.faces.new(list(reversed(aro0))), bm.faces.new(aro1)] + [bm.faces.new([aro0[k], aro0[(k + 1) % lados], aro1[(k + 1) % lados], aro1[k]]) for k in range(lados)]
    for f in fs: f.material_index = mat

W, D, S = 10.0, 9.0, 0.30             # medio ancho, medio fondo, cota del patio
# zócalo de toba (se entierra en la ladera) y patio de tierra batida
caja(-W - 0.3, W + 0.3, -D - 0.3, D + 0.3, -3.2, S - 0.02, TOBA)
caja(-W + 0.2, W - 0.2, -D + 0.2, D - 0.2, S - 0.06, S + 0.03, TIERRA)

# --- cuerpo del fondo: nave larga y cuerpo central más alto con frontón hacia el patio ---
caja(-W, W, 5.2, D, S, S + 4.2, ENL); tejado(-W, W, 5.2, D, S + 4.2, 1.5, "X")
caja(-3.4, 3.4, 4.2, D - 0.1, S, S + 6.0, ENL); tejado(-3.4, 3.4, 4.2, D - 0.1, S + 6.0, 1.7, "Y", vuelo=0.7)
caja(-1.2, 1.2, 4.12, 4.24, S, S + 3.1, HUECO)                                   # portón del cuerpo central
caja(-1.45, 1.45, 4.08, 4.26, S + 3.1, S + 3.4, MAD); caja(-1.45, -1.2, 4.08, 4.26, S, S + 3.1, MAD); caja(1.2, 1.45, 4.08, 4.26, S, S + 3.1, MAD)
for sx in (-1, 1):
    caja(sx * 2.4 - 0.3, sx * 2.4 + 0.3, 4.12, 4.24, S + 4.2, S + 4.9, HUECO)       # ventanucos altos
    for k in range(3): caja(sx * (5.0 + k * 1.9) - 0.28, sx * (5.0 + k * 1.9) + 0.28, 5.12, 5.24, S + 2.7, S + 3.3, HUECO)
# escalón de toba ante el portón
caja(-2.2, 2.2, 3.5, 4.2, S, S + 0.18, TOBA)

# --- naves de barracones a los lados: muro, pórtico de postes de madera, tejado a dos aguas que cubre nave y pórtico ---
for sx in (-1, 1):
    xa, xb = (-W, -6.2) if sx < 0 else (6.2, W)                    # nave
    xp = -4.3 if sx < 0 else 4.3                                   # línea de postes
    caja(xa, xb, -D + 0.6, 5.2, S, S + 3.3, ENL)
    tejado(min(xa, xp), max(xb, xp), -D + 0.6, 5.2, S + 3.3, 1.35, "Y", vuelo=0.45)
    caja(min(xp - 0.14, xp + 0.14), max(xp - 0.14, xp + 0.14), -D + 0.6, 5.2, S + 3.05, S + 3.3, MAD)   # carrera sobre los postes
    n = 6
    for k in range(n):
        y = -D + 1.1 + k * (5.2 - 0.5 - (-D + 1.1)) / (n - 1)
        poste(xp, y, S, S + 3.06); caja(xp - 0.26, xp + 0.26, y - 0.26, y + 0.26, S, S + 0.22, TOBA)      # poste sobre dado de toba
        if k < n - 1:
            ym = y + (5.2 - 0.5 - (-D + 1.1)) / (n - 1) / 2; xw = xb if sx < 0 else xa                     # puerta de cada contubernio
            caja(xw - 0.06, xw + 0.06, ym - 0.5, ym + 0.5, S, S + 2.1, HUECO)
            caja(xw - 0.09, xw + 0.09, ym - 0.62, ym + 0.62, S + 2.1, S + 2.28, MAD)
    for k in range(5):                                             # ventanucos al exterior
        y = -D + 2.2 + k * 2.6; xw = xa if sx < 0 else xb
        caja(xw - 0.06, xw + 0.06, y - 0.25, y + 0.25, S + 2.3, S + 2.8, HUECO)

# --- frente: tapia con albardilla de teja y puerta entre dos machones, con tejadillo ---
for sx in (-1, 1):
    x0, x1 = (-W, -2.3) if sx < 0 else (2.3, W)
    caja(x0, x1, -D, -D + 0.6, S, S + 3.0, ENL); caja(x0 - 0.05, x1 + 0.05, -D - 0.14, -D + 0.74, S + 3.0, S + 3.2, TEJAX)
    caja(sx * 2.3 - 0.55, sx * 2.3 + 0.55, -D - 0.25, -D + 0.85, S - 0.1, S + 4.3, TOBA)                     # machón
    caja(sx * 1.05 - 0.75, sx * 1.05 + 0.75, -D - 0.75, -D - 0.62, S, S + 3.3, MAD, giro=sx * -0.95)          # hoja abierta hacia fuera
caja(-2.9, 2.9, -D - 0.2, -D + 0.8, S + 3.75, S + 4.15, MAD)                                                 # dintel de vigas
tejado(-2.9, 2.9, -D - 0.5, -D + 1.1, S + 4.15, 0.75, "X", vuelo=0.25, canto=0.16)
caja(-1.6, 1.6, -D - 1.3, -D - 0.2, S - 0.25, S + 0.02, TOBA)                                                # umbral

# --- patio: postes de entrenamiento (pali), armero con escudos y pila, enseña ---
for i, (x, y) in enumerate([(-2.0, -3.6), (0.0, -4.6), (2.0, -3.6), (-1.0, -1.6), (1.0, -1.6)]):
    poste(x, y, S, S + 1.85, r=0.13, lados=6); caja(x - 0.3, x + 0.3, y - 0.05, y + 0.05, S + 1.25, S + 1.37, MAD)
caja(-2.6, 2.6, 2.55, 2.67, S + 1.05, S + 1.17, MAD)                                                          # armero: travesaño
for x in (-2.6, 0.0, 2.6): poste(x, 2.61, S, S + 1.3, r=0.08, lados=6)
for k in range(6):
    x = -2.15 + k * 0.86
    caja(x - 0.3, x + 0.3, 2.36, 2.46, S + 0.08, S + 1.22, ESCUDO, giro=0.22, eje="X")                         # scutum apoyado
    caja(x - 0.06, x + 0.06, 2.30, 2.37, S + 0.5, S + 0.8, BRONCE, giro=0.22, eje="X")                          # umbo
for k in range(5): poste(3.2 + k * 0.12, 2.75, S, S + 2.0, r=0.022, lados=4, mat=MAD)                         # pila en haz
poste(-3.9, 3.4, S, S + 4.6, r=0.06, lados=6, mat=MAD); caja(-4.25, -3.55, 3.36, 3.44, S + 3.9, S + 4.5, ESCUDO); caja(-3.98, -3.82, 3.32, 3.48, S + 4.6, S + 4.85, BRONCE)

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("SM_Cuartel"); bm.to_mesh(me); bm.free()
for m in MATS: me.materials.append(m)
ob = bpy.data.objects.new("SM_Cuartel", me); bpy.context.scene.collection.objects.link(ob)
for p in me.polygons: p.use_smooth = False
me.update()
tris = sum(len(p.vertices) - 2 for p in me.polygons)
print("@@JSON@@" + json.dumps({"objeto": ob.name, "caras": len(me.polygons), "triangulos": tris, "dimensiones": [round(v, 2) for v in ob.dimensions]}))
