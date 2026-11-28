# AR3 (28/11/2026): atlas del puesto de mercado con piezas de NVIDIA SimReady (CC BY 4.0). Uso: blender-py tools/blender/mercado_simready.py -- <carpeta_simready> <salida>
import bpy,bmesh,sys,glob,os,json
from mathutils import Vector
from PIL import Image
a=sys.argv[sys.argv.index('--')+1:]; base,out=a[0],a[1]
PIEZAS=[ # id, carpeta, triangulos objetivo
 ('olla','cookware_pot_clay_a01',500),('cuenco','dishware_bowl_decor_old_a01',300),('cesta','utensil_breadBasket_a01',600),
 ('pan_redondo','food_prepared_bread_panDiCasa_a01',400),('pan_hogaza','food_prepared_bread_farmerSourdough_a01',400),
 ('uvas','food_produce_grape_a01',600),('pera','food_produce_pear_a01',200),('queso','food_dairy_cheese_h01',150),
 ('sardina','food_fish_spottedSardine_a01',200),('estera','decor_placeMat_table_woven_a01',2)]
C,CEL,PAD=4,256,3; F=(len(PIEZAS)+C-1)//C; W,H=C*CEL,F*CEL
atlas=Image.new('RGB',(W,H),(128,110,90))
bpy.ops.wm.read_factory_settings(use_empty=True)
indice={}
for i,(pid,car,obj) in enumerate(PIEZAS):
    cx,cy=i%C,i//C
    alb=[p for p in glob.glob(f'{base}/{car}/simready_usd/Textures/*_alb.png')][0]
    im=Image.open(alb).convert('RGB').resize((CEL-2*PAD,CEL-2*PAD),Image.LANCZOS)
    if pid=='cuenco':  # el dibujo azul es de loza moderna: se pasa a barro cocido (terracota) conservando las luces
        from PIL import ImageOps
        im=ImageOps.colorize(ImageOps.grayscale(im),black=(60,28,14),white=(214,150,104))
    atlas.paste(im,(cx*CEL+PAD,cy*CEL+PAD))
    antes=set(bpy.data.objects)
    bpy.ops.wm.usd_import(filepath=glob.glob(f'{base}/{car}/simready_usd/sm_*.usd*')[0])
    nuevos=[o for o in bpy.data.objects if o not in antes]
    ms=[o for o in nuevos if o.type=='MESH']
    for o in nuevos:
        if o.type!='MESH': bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in ms: o.select_set(True)
    bpy.context.view_layer.objects.active=ms[0]
    if len(ms)>1: bpy.ops.object.join()
    o=bpy.context.view_layer.objects.active
    o.parent=None
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    me=o.data
    # solo un canal UV
    while len(me.uv_layers)>1: me.uv_layers.remove(me.uv_layers[1])
    me.calc_loop_triangles(); t0=len(me.loop_triangles)
    if pid=='estera':
        # estera plana: un rectángulo de dos triángulos con la textura entera
        mn=Vector(map(min,*[v.co for v in me.vertices])); mx=Vector(map(max,*[v.co for v in me.vertices]))
        bm=bmesh.new(); uv=bm.loops.layers.uv.new('UVMap')
        vs=[bm.verts.new((x,y,mx.z)) for x,y in ((mn.x,mn.y),(mx.x,mn.y),(mx.x,mx.y),(mn.x,mx.y))]
        f=bm.faces.new(vs)
        for l,(u,v) in zip(f.loops,((0,0),(1,0),(1,1),(0,1))): l[uv].uv=(u,v)
        bm.to_mesh(me); bm.free()
    else:
        m=o.modifiers.new('d','DECIMATE'); m.ratio=min(1,obj/t0); m.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier='d')
    # base en el suelo y centrada
    mn=Vector(map(min,*[v.co for v in me.vertices])); mx=Vector(map(max,*[v.co for v in me.vertices]))
    c=Vector(((mn.x+mx.x)/2,(mn.y+mx.y)/2,mn.z))
    for v in me.vertices: v.co-=c
    # UV a su celda del atlas (v hacia arriba en Blender)
    u0=(cx*CEL+PAD)/W; su=(CEL-2*PAD)/W; v0=1-(cy*CEL+CEL-PAD)/H; sv=(CEL-2*PAD)/H
    for l in me.uv_layers.active.data:
        x=min(max(l.uv.x,0),1); y=min(max(l.uv.y,0),1); l.uv=(u0+x*su,v0+y*sv)
    o.name=pid; me.name=pid; me.materials.clear()
    me.calc_loop_triangles()
    indice[pid]={'fuente':car,'triangulos':len(me.loop_triangles),'trianglesOriginal':t0,'tamano_m':[round(mx.x-mn.x,3),round(mx.y-mn.y,3),round(mx.z-mn.z,3)]}
    o.location=(0,0,0)  # todas en el origen y sin giro: el juego las coloca (city3d lee la posición del nodo)
atlas_p=os.path.join(out,'mercado_atlas.jpg'); atlas.save(atlas_p,quality=82,optimize=True)
mat=bpy.data.materials.new('mercado'); mat.use_nodes=True
bsdf=mat.node_tree.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value=0.85; bsdf.inputs['Metallic'].default_value=0
tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(atlas_p)
mat.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
for o in bpy.data.objects:
    if o.type=='MESH': o.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=os.path.join(out,'mercado.glb'),export_format='GLB',export_image_format='JPEG',export_jpeg_quality=82,
    export_normals=True,export_tangents=False,export_materials='EXPORT',export_yup=True,export_apply=True)
json.dump(indice,open(os.path.join(out,'indice.json'),'w'),indent=1,ensure_ascii=False)
print('HECHO',W,H,sum(p['triangulos'] for p in indice.values()))
