import bpy
import sys

argv = sys.argv
argv = argv[argv.index("--") + 1:]  # Get only custom arguments

stl_path = argv[0]
fbx_path = argv[1]

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import the STL file
bpy.ops.wm.stl_import(filepath=stl_path)

# Export to FBX
bpy.ops.export_scene.fbx(filepath=fbx_path)

print(f"Successfully converted {stl_path} to {fbx_path}")
