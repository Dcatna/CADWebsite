import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 3001

app.use(cors())

const upload = multer({ dest: 'uploads/' })
const convertedDir = path.join(__dirname, 'converted')
if (!fs.existsSync(convertedDir)) {
  fs.mkdirSync(convertedDir)
}

app.post('/convert', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).send('No file uploaded')

  const inputPath = path.resolve(file.path)
  const fileNameNoExt = path.parse(file.originalname).name
  const outputPath = path.resolve(`converted/${fileNameNoExt}.glb`)

  const success = await convertToFBX(inputPath, outputPath)

  if (!success) {
    return res.status(500).send('Conversion failed')
  }


  fs.readFile(outputPath, (err, data) => {
    if (err) {
      console.error('Failed to read output:', err)
      return res.status(500).send('Error reading file')
    }

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${fileNameNoExt}.glb"`)
    res.send(data)
    fs.unlinkSync(inputPath)
    fs.unlinkSync(outputPath)
  })
})

// Function to convert files using Blender
async function convertToFBX(inputPath, outputPath) {
  return new Promise((resolve) => {
    // Enhanced path detection with better macOS support
    let blenderPath
    
    if (process.platform === 'darwin') {
      // Check multiple possible macOS locations
      const possiblePaths = [
        '/Applications/Blender.app/Contents/MacOS/Blender',
        '/Applications/Blender 4.4/Blender.app/Contents/MacOS/Blender',
        '/Applications/Blender 4.3/Blender.app/Contents/MacOS/Blender',
        '/opt/homebrew/bin/blender',
        '/usr/local/bin/blender'
      ]
      
      blenderPath = possiblePaths.find(path => fs.existsSync(path))
      if (!blenderPath) {
        console.error('❌ Blender not found in common macOS locations')
        console.log('Please install Blender from https://www.blender.org/download/')
        resolve(false)
        return
      }
    } else if (process.platform === 'win32') {
      blenderPath = 'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe'
    } else {
      blenderPath = 'blender' // Linux
    }

    const scriptPath = 'C:\\Users\\aiden\\AR-CADnew\\CADWebsite\\backend\\scripts\\convert_stl_to_fbx.py'

    // Create the Python script if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
      fs.writeFileSync(scriptPath, getBlenderScript())
    }

    const args = [
      '--background',
      '--python', scriptPath,
      '--', inputPath, outputPath
    ]

    console.log(`🔧 Starting conversion: ${inputPath} -> ${outputPath}`)
    console.log(`🔧 Using Blender: ${blenderPath}`);
    
    const blender = spawn(blenderPath, args);

    let output = '';
    let errorOutput = '';

    blender.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log(`📝 Blender output: ${message.trim()}`);
    });

    blender.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      console.log(`⚠️ Blender stderr: ${message.trim()}`);
    });

    blender.on('close', (code) => {
      console.log(`🏁 Blender process exited with code ${code}`);
      
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log('✅ Conversion successful');
        resolve(true);
      } else {
        console.error('❌ Conversion failed:', errorOutput);
        resolve(false);
      }
    });

    blender.on('error', (error) => {
      console.error('❌ Failed to start Blender:', error);
      resolve(false);
    });
  });
}

// Get the Blender Python script content
function getBlenderScript() {
  return `import bpy
import sys

argv = sys.argv
argv = argv[argv.index("--") + 1:]

stl_path = argv[0]
glb_path = argv[1]

# Enable STL import/export addon
bpy.ops.preferences.addon_enable(module='io_mesh_stl')

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import the STL
bpy.ops.import_mesh.stl(filepath=stl_path)

# Export to GLB
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB')

print(f"✅ Successfully converted {stl_path} to {glb_path}")
`
}



app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
