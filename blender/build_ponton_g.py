import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

# Production scene scaffold for Panne G.
# Detailed geometry is added only from verified photo/orthophoto references.
bpy.ops.wm.read_factory_settings(use_empty=True)

for name in ['REFERENCE', 'ENVIRONMENT', 'PONTON_G', 'BOATS', 'EQUIPMENT', 'NOCTURA_LIGHTS']:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.world.color = (0.008, 0.015, 0.025)

bpy.ops.object.camera_add(location=(18, -22, 14), rotation=(1.05, 0, 0.65))
cam = bpy.context.object
cam.name = 'NOCTURA_CAMERA'
scene.camera = cam

blend_path = ROOT / 'blender' / 'ponton_g.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

bpy.ops.export_scene.gltf(
    filepath=str(OUT / 'ponton-g.glb'),
    export_format='GLB',
    export_apply=True,
    export_yup=True,
)

print(f'Created {blend_path}')
print(f'Exported {OUT / "ponton-g.glb"}')
