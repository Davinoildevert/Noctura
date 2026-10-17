import bpy
from pathlib import Path

# Compatibility launcher for the Panne G builder.
# Blender versions differ slightly in render-engine identifiers and factory
# settings can leave a freshly reset scene without a World datablock.

HERE = Path(__file__).resolve().parent
TARGET = HERE / "build_ponton_g.py"

engine_items = {
    item.identifier
    for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
}

if "BLENDER_EEVEE_NEXT" in engine_items:
    engine = "BLENDER_EEVEE_NEXT"
elif "BLENDER_EEVEE" in engine_items:
    engine = "BLENDER_EEVEE"
elif "CYCLES" in engine_items:
    engine = "CYCLES"
else:
    raise RuntimeError(f"No supported render engine found. Available: {sorted(engine_items)}")

print(f"NOCTURA: using render engine {engine}")

source = TARGET.read_text(encoding="utf-8")

# Render-engine compatibility.
source = source.replace('"BLENDER_EEVEE_NEXT"', repr(engine))

# bpy.ops.wm.read_factory_settings(use_empty=True) may leave scene.world = None
# on Blender 5.x. Create and attach a World before configuring its nodes.
source = source.replace(
    "scene.world.use_nodes = True",
    "if scene.world is None:\n"
    "    scene.world = bpy.data.worlds.new('NOCTURA_WORLD')\n"
    "scene.world.use_nodes = True",
)

namespace = {
    "__name__": "__main__",
    "__file__": str(TARGET),
}

exec(compile(source, str(TARGET), "exec"), namespace, namespace)
