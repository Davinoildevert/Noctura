import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

# NOCTURA — Panne G reconstruction scaffold
# ------------------------------------------------------------
# Goal: create a detailed, game-ready local scene for Panne G.
# Verified structure is separated from inferred/transient/prototype content
# through custom properties and collection names.
#
# Important:
# - Orthophoto / user imagery remains the source of truth for plan geometry.
# - Boats are transient scene dressing, not an inventory.
# - NOCTURA_LIGHTS are prototype controllable fixtures until a verified
#   2026 lighting inventory is available.

ROOT = Path(__file__).resolve().parents[1]
OUT_MODELS = ROOT / "public" / "assets" / "models"
OUT_PREVIEWS = ROOT / "public" / "assets" / "previews"
OUT_MODELS.mkdir(parents=True, exist_ok=True)
OUT_PREVIEWS.mkdir(parents=True, exist_ok=True)

BLEND_PATH = ROOT / "blender" / "ponton_g.blend"
GLB_PATH = OUT_MODELS / "ponton-g.glb"
MANIFEST_PATH = OUT_MODELS / "ponton-g.manifest.json"
PREVIEW_PATH = OUT_PREVIEWS / "ponton-g-preview.png"

# -----------------------------
# Tunable reconstruction values
# -----------------------------
# These are reconstruction parameters, not claimed survey measurements.
PONTOON_LENGTH_M = 46.0
PONTOON_WIDTH_M = 2.4
DECK_Z = 0.55
QUAY_WIDTH_M = 9.0
QUAY_LENGTH_M = 24.0
WATER_SIZE_M = 120.0

# -----------------------------
# Reset + collections
# -----------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

COLLECTION_NAMES = [
    "REFERENCE",
    "ENVIRONMENT",
    "PONTON_G",
    "BOATS_TRANSIENT",
    "EQUIPMENT_OBSERVED_STYLE",
    "NOCTURA_LIGHTS_PROTOTYPE",
]
collections = {}
for name in COLLECTION_NAMES:
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    collections[name] = col

def move_to_collection(obj, name):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collections[name].objects.link(obj)
    return obj

def tag(obj, status, note=""):
    obj["noctura_status"] = status
    if note:
        obj["noctura_note"] = note
    return obj

# -----------------------------
# Materials
# -----------------------------
def mat_principled(name, base, roughness=0.5, metallic=0.0, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m

MAT_WOOD = mat_principled("MAT_WOOD_DECK", (0.22, 0.16, 0.10), 0.72)
MAT_WOOD_LIGHT = mat_principled("MAT_WOOD_EDGE", (0.38, 0.28, 0.17), 0.62)
MAT_METAL = mat_principled("MAT_METAL_DARK", (0.055, 0.065, 0.072), 0.28, 0.75)
MAT_GALV = mat_principled("MAT_GALVANISED", (0.32, 0.34, 0.36), 0.3, 0.65)
MAT_CONCRETE = mat_principled("MAT_CONCRETE", (0.26, 0.25, 0.23), 0.9)
MAT_RUBBER = mat_principled("MAT_RUBBER", (0.018, 0.018, 0.02), 0.92)
MAT_WHITE = mat_principled("MAT_WHITE_PAINT", (0.72, 0.74, 0.73), 0.38)
MAT_RED = mat_principled("MAT_SAFETY_RED", (0.55, 0.025, 0.018), 0.42)
MAT_BLUE = mat_principled("MAT_BOAT_BLUE", (0.025, 0.12, 0.22), 0.28)
MAT_GLASS = mat_principled("MAT_GLASS_DARK", (0.03, 0.08, 0.10), 0.16, 0.1)
MAT_LIGHT = mat_principled(
    "MAT_NOCTURA_EMISSIVE",
    (0.20, 0.12, 0.035),
    0.28,
    0.0,
    emission=(1.0, 0.42, 0.08),
    emission_strength=6.0,
)

# Water with procedural normals
MAT_WATER = bpy.data.materials.new("MAT_WATER")
MAT_WATER.use_nodes = True
nodes = MAT_WATER.node_tree.nodes
links = MAT_WATER.node_tree.links
for n in list(nodes):
    nodes.remove(n)
out = nodes.new("ShaderNodeOutputMaterial")
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Base Color"].default_value = (0.004, 0.035, 0.055, 1.0)
bsdf.inputs["Metallic"].default_value = 0.0
bsdf.inputs["Roughness"].default_value = 0.12
bsdf.inputs["IOR"].default_value = 1.333
bsdf.inputs["Transmission Weight"].default_value = 0.18
noise = nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 2.2
noise.inputs["Detail"].default_value = 5.0
noise.inputs["Roughness"].default_value = 0.7
bump = nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.22
bump.inputs["Distance"].default_value = 0.14
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

# -----------------------------
# Primitive helpers
# -----------------------------
def add_box(name, loc, scale, mat, collection, bevel=0.0, status="RECONSTRUCTION"):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = obj.modifiers.new("EdgeSoftening", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    tag(obj, status)
    return obj

def add_cylinder(name, loc, radius, depth, mat, collection, vertices=32, status="RECONSTRUCTION"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    move_to_collection(obj, collection)
    tag(obj, status)
    return obj

def add_curve(name, points, radius, mat, collection, status="RECONSTRUCTION"):
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for bp, co in zip(spline.bezier_points, points):
        bp.co = co
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    collections[collection].objects.link(obj)
    curve.materials.append(mat)
    tag(obj, status)
    return obj

def add_text(name, text, loc, size=0.45):
    curve = bpy.data.curves.new(name, type="FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.size = size
    obj = bpy.data.objects.new(name, curve)
    collections["REFERENCE"].objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (math.radians(90), 0, 0)
    curve.materials.append(MAT_WHITE)
    tag(obj, "REFERENCE_ONLY")
    return obj

# -----------------------------
# Environment
# -----------------------------
water = add_box(
    "WATER_SURFACE",
    (0, 8, -0.12),
    (WATER_SIZE_M, WATER_SIZE_M, 0.15),
    MAT_WATER,
    "ENVIRONMENT",
    bevel=0.03,
)
tag(water, "CONTEXT_RECONSTRUCTION", "Procedural water surface; not bathymetry.")

# Shore/quay on landward side
quay = add_box(
    "QUAY_MAIN",
    (0, -8.2, 0.20),
    (QUAY_LENGTH_M, QUAY_WIDTH_M, 0.8),
    MAT_CONCRETE,
    "ENVIRONMENT",
    bevel=0.08,
)
tag(quay, "PHOTO_DERIVED_STYLE", "Quay massing follows visible reference style, not a survey mesh.")

# curb and rubber fenders
add_box("QUAY_CURB", (0, -3.85, 0.62), (QUAY_LENGTH_M, 0.35, 0.35), MAT_CONCRETE, "ENVIRONMENT", bevel=0.05)
for x in (-9, -6, -3, 0, 3, 6, 9):
    add_cylinder(
        f"QUAY_FENDER_{x:+.0f}",
        (x, -3.62, 0.18),
        0.34,
        0.48,
        MAT_RUBBER,
        "EQUIPMENT_OBSERVED_STYLE",
        vertices=24,
        status="PHOTO_DERIVED_STYLE",
    ).rotation_euler = (math.radians(90), 0, 0)

# -----------------------------
# Pontoon structure
# -----------------------------
# Pontoon axis = +Y, starting from gangway near quay.
pontoon_center_y = 20.0
deck = add_box(
    "PONTON_G_DECK_BASE",
    (0, pontoon_center_y, DECK_Z),
    (PONTOON_WIDTH_M, PONTOON_LENGTH_M, 0.26),
    MAT_WOOD,
    "PONTON_G",
    bevel=0.06,
)
tag(deck, "ORTHO_ALIGNED_RECONSTRUCTION", "Length/width are tunable reconstruction parameters.")

# Visible plank segmentation
plank_step = 0.55
n_planks = int(PONTOON_LENGTH_M / plank_step)
for i in range(n_planks):
    y = pontoon_center_y - PONTOON_LENGTH_M / 2 + (i + 0.5) * plank_step
    plank = add_box(
        f"DECK_PLANK_{i:03d}",
        (0, y, DECK_Z + 0.155),
        (PONTOON_WIDTH_M - 0.10, plank_step - 0.025, 0.045),
        MAT_WOOD_LIGHT if i % 5 == 0 else MAT_WOOD,
        "PONTON_G",
        bevel=0.01,
    )
    tag(plank, "PHOTO_DERIVED_STYLE")

# edge beams / floats
for x in (-PONTOON_WIDTH_M / 2 - 0.10, PONTOON_WIDTH_M / 2 + 0.10):
    add_box(
        f"EDGE_BEAM_{'L' if x < 0 else 'R'}",
        (x, pontoon_center_y, DECK_Z - 0.03),
        (0.20, PONTOON_LENGTH_M, 0.32),
        MAT_METAL,
        "PONTON_G",
        bevel=0.03,
    )
    for i in range(8):
        y = pontoon_center_y - PONTOON_LENGTH_M/2 + 3.0 + i*5.7
        add_box(
            f"FLOAT_{'L' if x < 0 else 'R'}_{i:02d}",
            (x * 1.02, y, 0.13),
            (0.42, 2.8, 0.38),
            MAT_RUBBER,
            "PONTON_G",
            bevel=0.08,
        )

# Gangway
gangway_y = -2.2
gang = add_box(
    "GANGWAY_G",
    (0, gangway_y, 1.0),
    (1.35, 5.6, 0.15),
    MAT_GALV,
    "PONTON_G",
    bevel=0.04,
)
gang.rotation_euler = (math.radians(-7), 0, 0)
tag(gang, "PHOTO_DERIVED_STYLE", "Gangway type based on observed port imagery.")

for x in (-0.67, 0.67):
    add_cylinder(f"GANGWAY_RAIL_{'L' if x < 0 else 'R'}", (x, gangway_y, 1.58), 0.035, 5.6, MAT_GALV, "PONTON_G", vertices=12).rotation_euler = (math.radians(90), 0, 0)
    for j, y in enumerate((-4.2, -2.2, -0.2)):
        add_cylinder(f"GANGWAY_POST_{'L' if x < 0 else 'R'}_{j}", (x, y, 1.38), 0.035, 0.9, MAT_GALV, "PONTON_G", vertices=12)

# -----------------------------
# Mooring equipment
# -----------------------------
for i in range(10):
    y = pontoon_center_y - PONTOON_LENGTH_M/2 + 3.0 + i*4.4
    for side in (-1, 1):
        x = side * (PONTOON_WIDTH_M/2 - 0.20)
        add_box(
            f"CLEAT_BASE_{i:02d}_{'L' if side < 0 else 'R'}",
            (x, y, DECK_Z + 0.23),
            (0.28, 0.18, 0.10),
            MAT_METAL,
            "EQUIPMENT_OBSERVED_STYLE",
            bevel=0.03,
            status="PHOTO_DERIVED_STYLE",
        )
        bar = add_cylinder(
            f"CLEAT_BAR_{i:02d}_{'L' if side < 0 else 'R'}",
            (x, y, DECK_Z + 0.34),
            0.045,
            0.36,
            MAT_METAL,
            "EQUIPMENT_OBSERVED_STYLE",
            vertices=16,
            status="PHOTO_DERIVED_STYLE",
        )
        bar.rotation_euler = (0, math.radians(90), 0)

# Utility pedestals (style observed; exact count/placement provisional)
for idx, y in enumerate((4.5, 14.5, 24.5, 34.5)):
    side = -1 if idx % 2 == 0 else 1
    x = side * 0.72
    ped = add_box(
        f"UTILITY_PEDESTAL_{idx+1:02d}",
        (x, y, DECK_Z + 0.58),
        (0.34, 0.30, 0.95),
        MAT_WHITE,
        "EQUIPMENT_OBSERVED_STYLE",
        bevel=0.06,
        status="PROVISIONAL_PLACEMENT",
    )
    ped["noctura_note"] = "Equipment style observed in port imagery; exact Panne G placement unverified."
    add_cylinder(
        f"UTILITY_SOCKET_{idx+1:02d}",
        (x + (-0.175 if side < 0 else 0.175), y, DECK_Z + 0.62),
        0.055,
        0.035,
        MAT_BLUE,
        "EQUIPMENT_OBSERVED_STYLE",
        vertices=20,
        status="STYLE_REFERENCE",
    ).rotation_euler = (0, math.radians(90), 0)

# Lifebuoy station near landward section
add_cylinder("LIFEBUOY_RING", (1.05, 1.0, 1.55), 0.34, 0.10, MAT_RED, "EQUIPMENT_OBSERVED_STYLE", vertices=40, status="PHOTO_DERIVED_STYLE").rotation_euler = (math.radians(90), 0, 0)
add_cylinder("LIFEBUOY_POST", (1.05, 1.0, 1.1), 0.04, 1.5, MAT_GALV, "EQUIPMENT_OBSERVED_STYLE", vertices=12, status="PHOTO_DERIVED_STYLE")

# -----------------------------
# Boats — transient dressing
# -----------------------------
def create_boat(name, x, y, length=8.0, beam=2.7, yaw=0.0, sail=True, accent=MAT_BLUE):
    L = length
    B = beam
    z0 = 0.02
    z1 = 0.78
    verts = [
        (0, L/2, z0), (-B/2, L*0.18, z0), (-B*0.42, -L/2, z0), (B*0.42, -L/2, z0), (B/2, L*0.18, z0),
        (0, L/2-0.30, z1), (-B*0.42, L*0.16, z1), (-B*0.34, -L/2+0.25, z1), (B*0.34, -L/2+0.25, z1), (B*0.42, L*0.16, z1),
    ]
    faces = [
        (0,1,2,3,4),
        (5,9,8,7,6),
        (0,5,6,1),(1,6,7,2),(2,7,8,3),(3,8,9,4),(4,9,5,0)
    ]
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collections["BOATS_TRANSIENT"].objects.link(obj)
    obj.location = (x, y, -0.05)
    obj.rotation_euler[2] = yaw
    mesh.materials.append(MAT_WHITE)
    bevel = obj.modifiers.new("HullBevel", "BEVEL")
    bevel.width = 0.16
    bevel.segments = 3
    tag(obj, "TRANSIENT_DRESSING", "Generic boat; not a vessel inventory.")

    cabin = add_box(f"{name}_CABIN", (x, y-0.5, 0.80), (beam*0.65, length*0.22, 0.65), MAT_WHITE, "BOATS_TRANSIENT", bevel=0.20, status="TRANSIENT_DRESSING")
    cabin.rotation_euler[2] = yaw
    win = add_box(f"{name}_WINDSHIELD", (x, y+0.22, 1.05), (beam*0.52, 0.10, 0.34), MAT_GLASS, "BOATS_TRANSIENT", bevel=0.04, status="TRANSIENT_DRESSING")
    win.rotation_euler[2] = yaw
    stripe = add_box(f"{name}_STRIPE", (x, y, 0.52), (beam*0.90, length*0.70, 0.07), accent, "BOATS_TRANSIENT", bevel=0.03, status="TRANSIENT_DRESSING")
    stripe.rotation_euler[2] = yaw

    if sail:
        mast = add_cylinder(f"{name}_MAST", (x, y, 5.2), 0.045, 9.0, MAT_GALV, "BOATS_TRANSIENT", vertices=16, status="TRANSIENT_DRESSING")
        mast.rotation_euler[2] = yaw

    return obj

boat_layout = [
    (-4.0, 7.5, 8.2, 2.7, 0.02, True),
    (4.2, 11.5, 7.8, 2.6, -0.03, True),
    (-4.3, 17.0, 9.2, 2.9, 0.01, True),
    (4.5, 22.5, 8.6, 2.8, 0.02, False),
    (-4.4, 28.5, 7.3, 2.5, -0.02, True),
    (4.4, 34.5, 9.4, 3.0, 0.01, True),
]
for i, (x,y,l,b,yaw,sail) in enumerate(boat_layout, 1):
    create_boat(f"BOAT_TRANSIENT_{i:02d}", x, y, l, b, yaw, sail, MAT_BLUE if i % 2 else MAT_RED)

rope_pairs = [
    ((-2.6, 7.3, 0.45), (-1.05, 6.3, DECK_Z+0.28)),
    ((2.6, 11.3, 0.45), (1.05, 10.3, DECK_Z+0.28)),
    ((-2.8, 17.0, 0.45), (-1.05, 16.0, DECK_Z+0.28)),
    ((2.8, 22.5, 0.45), (1.05, 21.4, DECK_Z+0.28)),
]
for i, (a,b) in enumerate(rope_pairs):
    mid = ((a[0]+b[0])/2, (a[1]+b[1])/2, min(a[2],b[2])-0.10)
    add_curve(f"MOORING_ROPE_{i:02d}", [a, mid, b], 0.018, MAT_RUBBER, "EQUIPMENT_OBSERVED_STYLE", status="TRANSIENT_DRESSING")

# -----------------------------
# NOCTURA controllable lighting
# -----------------------------
LIGHT_POINTS = [
    ("G_LIGHT_01", -0.78, 5.5),
    ("G_LIGHT_02",  0.78, 11.5),
    ("G_LIGHT_03", -0.78, 17.5),
    ("G_LIGHT_04",  0.78, 23.5),
    ("G_LIGHT_05", -0.78, 29.5),
    ("G_LIGHT_06",  0.78, 35.5),
    ("G_LIGHT_07", -0.78, 41.0),
]
manifest_lights = []

def create_bollard_light(light_id, x, y, intensity=650.0):
    body = add_cylinder(light_id, (x, y, DECK_Z + 0.42), 0.095, 0.68, MAT_METAL, "NOCTURA_LIGHTS_PROTOTYPE", vertices=20, status="NOCTURA_PROTOTYPE")
    head = add_cylinder(f"{light_id}_HEAD", (x, y, DECK_Z + 0.78), 0.13, 0.12, MAT_LIGHT, "NOCTURA_LIGHTS_PROTOTYPE", vertices=24, status="NOCTURA_PROTOTYPE")
    body["light_id"] = light_id
    body["control_group"] = "PONTON_G"
    body["intensity_pct"] = 100
    body["prototype_placement"] = True
    head["light_id"] = light_id

    data = bpy.data.lights.new(name=f"{light_id}_SOURCE", type="POINT")
    data.energy = intensity
    data.color = (1.0, 0.36, 0.07)
    data.shadow_soft_size = 0.65
    light = bpy.data.objects.new(f"{light_id}_SOURCE", data)
    collections["NOCTURA_LIGHTS_PROTOTYPE"].objects.link(light)
    light.location = (x, y, DECK_Z + 0.82)
    light["light_id"] = light_id
    light["intensity_pct"] = 100
    light["base_energy_w"] = intensity
    light["prototype_placement"] = True
    manifest_lights.append({
        "id": light_id,
        "object": light_id,
        "sourceObject": f"{light_id}_SOURCE",
        "prototypePlacement": True,
        "defaultIntensityPct": 100,
        "position": [x, y, DECK_Z + 0.82],
    })

for light_id, x, y in LIGHT_POINTS:
    create_bollard_light(light_id, x, y)

# -----------------------------
# Lighting / world / camera
# -----------------------------
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(PREVIEW_PATH)

scene.world.use_nodes = True
wn = scene.world.node_tree.nodes
world_bg = wn.get("Background")
world_bg.inputs["Color"].default_value = (0.005, 0.012, 0.025, 1.0)
world_bg.inputs["Strength"].default_value = 0.20

sun_data = bpy.data.lights.new("MOON_SUN", "SUN")
sun_data.energy = 1.4
sun_data.color = (0.42, 0.58, 1.0)
sun_obj = bpy.data.objects.new("MOON_SUN", sun_data)
collections["ENVIRONMENT"].objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(38), math.radians(-22), math.radians(-28))

area_data = bpy.data.lights.new("SOFT_SKY_FILL", "AREA")
area_data.energy = 850
area_data.shape = "DISK"
area_data.size = 22
area_data.color = (0.16, 0.28, 0.48)
area_obj = bpy.data.objects.new("SOFT_SKY_FILL", area_data)
collections["ENVIRONMENT"].objects.link(area_obj)
area_obj.location = (0, 12, 18)

bpy.ops.object.camera_add(location=(19.5, -19.0, 14.0))
cam = bpy.context.object
cam.name = "NOCTURA_CAMERA"
move_to_collection(cam, "REFERENCE")
scene.camera = cam
cam.data.lens = 36
cam.data.sensor_width = 36

def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

look_at(cam, (0, 19.0, 0.6))
cam.data.dof.use_dof = True
cam.data.dof.focus_object = deck
cam.data.dof.aperture_fstop = 5.6

label = add_text("LABEL_PONTON_G", "PANNE G · reconstruction", (0, 19, 3.2), 0.75)
label.hide_render = True

# -----------------------------
# Color / atmosphere
# -----------------------------
scene.view_settings.look = "AgX - Medium High Contrast"

fog_mat = bpy.data.materials.new("MAT_FOG_VOLUME")
fog_mat.use_nodes = True
fog_nodes = fog_mat.node_tree.nodes
fog_links = fog_mat.node_tree.links
for n in list(fog_nodes):
    fog_nodes.remove(n)
fog_out = fog_nodes.new("ShaderNodeOutputMaterial")
fog_vol = fog_nodes.new("ShaderNodeVolumePrincipled")
fog_vol.inputs["Density"].default_value = 0.002
fog_vol.inputs["Color"].default_value = (0.03, 0.08, 0.12, 1.0)
fog_links.new(fog_vol.outputs["Volume"], fog_out.inputs["Volume"])
fog = add_box("ATMOSPHERE_VOLUME", (0, 18, 5), (80, 100, 16), fog_mat, "ENVIRONMENT", status="ART_DIRECTION")
fog.display_type = "WIRE"

# -----------------------------
# Metadata + save / preview / export
# -----------------------------
scene["noctura_scene"] = "PONTON_G"
scene["noctura_version"] = "2"
scene["source_policy"] = "Verified imagery drives geometry; prototype lighting clearly flagged."
scene["geometry_status"] = "Reconstruction from orthophoto + user-provided port imagery; not survey-grade."
scene["lighting_status"] = "Prototype positions until 2026 lighting inventory is supplied."

manifest = {
    "scene": "PONTON_G",
    "version": 2,
    "geometryStatus": "reconstruction-not-survey",
    "lightingStatus": "prototype-placement",
    "lights": manifest_lights,
}
MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
bpy.ops.render.render(write_still=True)

bpy.ops.export_scene.gltf(
    filepath=str(GLB_PATH),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_extras=True,
    export_lights=True,
    export_cameras=False,
)

print("=" * 72)
print("NOCTURA / PANNE G BUILD COMPLETE")
print(f"Blend:    {BLEND_PATH}")
print(f"GLB:      {GLB_PATH}")
print(f"Manifest: {MANIFEST_PATH}")
print(f"Preview:  {PREVIEW_PATH}")
print("NOTE: NOCTURA light positions are prototype placeholders, not a 2026 inventory.")
print("=" * 72)
