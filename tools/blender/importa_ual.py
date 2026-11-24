import bpy, json
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
bpy.ops.import_scene.gltf(filepath="/work/UAL2.glb")
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
acc = sorted(a.name for a in bpy.data.actions)
print("@@JSON@@" + json.dumps({"armadura": arm.name, "escala": list(arm.scale), "huesos": [b.name for b in arm.data.bones], "mallas": [o.name for o in bpy.data.objects if o.type == "MESH"],
  "acciones": acc, "fps": bpy.context.scene.render.fps,
  "tiro": {a.name: list(a.frame_range) for a in bpy.data.actions if any(k in a.name.lower() for k in ("throw", "spear", "javelin"))}}))
