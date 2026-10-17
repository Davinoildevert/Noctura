import bpy
from pathlib import Path

# Compatibility launcher for the Panne G builder.
# Blender 5.x exposes EEVEE as BLENDER_EEVEE, while some earlier builds
# exposed BLENDER_EEVEE_NEXT. Detect the available enum instead of assuming.

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
source = source.replace('"BLENDER_EEVEE_NEXT"', repr(engine))

namespace = {
    "__name__": "__main__",
    "__file__": str(TARGET),
}
exec(compile(source, str(TARGET), "exec"), namespace, namespace)
