"""FA2 · prueba 5: fotografía, con la luz común de las pruebas, el modelo que el usuario generó con la IA de Meshy
(cuenta gratuita: licencia CC BY 4.0, crédito a Meshy; el modelo NO está en el repositorio: 115 MB, en su Drive, carpeta «Para claude»).
Uso: blender-py tools/blender/falangita_prueba_5_foto.py <carpeta con m.fbx y m_color/_normal/_metallic/_roughness.png> <salida>"""
import bpy, sys, math, os
from mathutils import Vector
d, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=os.path.join(d,'m.fbx'))
ms=[o for o in bpy.context.scene.objects if o.type=='MESH']; o=ms[0]
o.data.calc_loop_triangles(); print('TRIS',len(o.data.loop_triangles),'UV',[u.name for u in o.data.uv_layers])
mat=bpy.data.materials.new('meshy'); mat.use_nodes=True; nt=mat.node_tree; b=nt.nodes['Principled BSDF']
def img(n,cs):
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=bpy.data.images.load(os.path.join(d,n)); t.image.colorspace_settings.name=cs; print('IMG',n,t.image.size[:]); return t
nt.links.new(img('m_color.png','sRGB').outputs[0],b.inputs['Base Color'])
nt.links.new(img('m_metallic.png','Non-Color').outputs[0],b.inputs['Metallic'])
nt.links.new(img('m_roughness.png','Non-Color').outputs[0],b.inputs['Roughness'])
nm=nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(img('m_normal.png','Non-Color').outputs[0],nm.inputs['Color']); nt.links.new(nm.outputs[0],b.inputs['Normal'])
o.data.materials.clear(); o.data.materials.append(mat)
for p in o.data.polygons: p.use_smooth=True
bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(c) for c in o.bound_box]
mn=Vector((min(p[i] for p in pts) for i in range(3))); mx=Vector((max(p[i] for p in pts) for i in range(3))); c=(mn+mx)/2; H=mx.z-mn.z; print('CAJA',mn,mx)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=64; sc.cycles.use_denoising=True; sc.view_settings.view_transform='Standard'
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; wn=w.node_tree; bg=wn.nodes['Background']
# fondo pergamino a cámara, cielo gris azulado tenue para la luz
lp=wn.nodes.new('ShaderNodeLightPath'); bg2=wn.nodes.new('ShaderNodeBackground'); mix=wn.nodes.new('ShaderNodeMixShader')
bg.inputs[0].default_value=(0.62,0.68,0.78,1); bg.inputs[1].default_value=0.35
bg2.inputs[0].default_value=(0.815,0.738,0.552,1); bg2.inputs[1].default_value=1.0
wn.links.new(lp.outputs['Is Camera Ray'],mix.inputs[0]); wn.links.new(bg.outputs[0],mix.inputs[1]); wn.links.new(bg2.outputs[0],mix.inputs[2]); wn.links.new(mix.outputs[0],wn.nodes['World Output'].inputs[0])
sun=bpy.data.objects.new('sol',bpy.data.lights.new('sol','SUN')); sc.collection.objects.link(sun); sun.data.energy=4; sun.data.angle=math.radians(3); sun.data.color=(1,0.92,0.78)
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam; cam.data.lens=70
def foto(nombre,az,dist,obj,rx,ry):
    a=math.radians(az); pos=obj+Vector((math.sin(a)*dist,-math.cos(a)*dist,0.04*dist)); cam.location=pos; cam.rotation_euler=(obj-pos).to_track_quat('-Z','Y').to_euler()
    sun.rotation_euler=(math.radians(52),0,math.radians(az-45))
    sc.render.resolution_x=rx; sc.render.resolution_y=ry; sc.render.filepath=os.path.join(out,nombre); sc.render.image_settings.file_format='PNG'; bpy.ops.render.render(write_still=True)
foto('cerca.png',28,H*2.25,Vector((c.x,c.y,mn.z+H*0.74)),780,1688)
foto('frente.png',30,H*4.3,c,844,780)
foto('espalda.png',150,H*4.3,c,844,780)
