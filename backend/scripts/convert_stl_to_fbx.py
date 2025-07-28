import bpy
import sys
import os

argv = sys.argv
argv = argv[argv.index("--") + 1:]

stl_path = argv[0]
glb_path = argv[1]

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import the STL
bpy.ops.wm.stl_import(filepath=stl_path)

# Export to GLB
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB')

print(f"✅ Successfully converted {stl_path} to {glb_path}")

if os.path.exists(glb_path):
    file_size = os.path.getsize(glb_path) / (1024 * 1024)
    print(f"📦 GLB file size: {file_size:.2f} MB")
else:
    print("❌ Output file not found!")