import React, { useState } from "react";
import { useUserStore } from "@/data/userstore";
import type { FileType } from "@/data/types";
import { UploadPopup } from "@/components/Navbar";
import { supabase } from "@/data/supabaseclient";
import { GLTFLoader } from "three-stdlib";
import { STLExporter } from "three-stdlib";
import { Download, Trash2 } from "lucide-react"; // Icons

const Home = () => {
  const files = useUserStore((s) => s.files);
  const removeFile = useUserStore((s) => s.removeFile);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  console.log(files, "IFLES")
  // ✅ GLB → STL conversion & download
  const handleDownload = async (file: FileType) => {
    try {
      const { data, error } = await supabase.storage
        .from("cadfiles")
        .download(file.path);

      if (error || !data) {
        console.error("Download error:", error);
        return;
      }

      const arrayBuffer = await data.arrayBuffer();

      const loader = new GLTFLoader();
      loader.parse(arrayBuffer, "", (gltf) => {
        const scene = gltf.scene;

        const exporter = new STLExporter();
        const stlString = exporter.parse(scene);

        const blob = new Blob([stlString], { type: "application/vnd.ms-pki.stl" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        // Remove .glb from end before saving as .stl
        a.download = file.name.replace(/\.glb$/i, "") + ".stl";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error("Error converting GLB to STL:", err);
    }
  };

  // 🗑 Delete from Supabase & UI
  const handleDelete = async (file: FileType) => {
    if (!confirm(`Are you sure you want to delete "${file.name.replace(/\.glb$/i, "")}"?`)) return;

    try {
      const { error } = await supabase.storage
        .from("cadfiles")
        .remove([file.path]);

      if (error) {
        console.error("Error deleting file:", error);
        return;
      }

      removeFile(file.path);
      console.log(`Deleted ${file.name} from Supabase.`);
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white px-6 py-10 flex flex-col items-center overflow-hidden">
      {/* Glowing Background Orb */}
      <div className="absolute w-[900px] h-[900px] bg-green-500/15 rounded-full blur-[200px]" />

      {/* Holographic Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none 
        bg-[linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] 
        bg-[size:50px_50px]" />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-green-300/50 rounded-full blur-[1px] animate-floatParticle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`
          }}
        />
      ))}

      {/* Title */}
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)] mb-8 relative z-10">
        My Projects
      </h1>

      {/* Upload CAD Button */}
      <div className="mb-8 relative z-10">
        <button className="bg-green-500/80 hover:bg-green-500/90 text-black font-semibold px-6 py-2 rounded-md shadow-[0_0_15px_rgba(34,197,94,0.25)] hover:scale-105 transition">
          <UploadPopup />
        </button>
      </div>

      {/* Files List */}
      <div className="w-full max-w-2xl relative z-10">
        {(files.length > 0 || localFiles.length > 0) ? (
          <ul className="rounded-xl border border-green-400/30 bg-black/70 backdrop-blur-md shadow-[0_0_25px_rgba(34,197,94,0.25)] divide-y divide-green-400/20">
            {[...files, ...localFiles].map((file: FileType | File, index) => (
              <li
                key={index}
                className="px-4 py-3 flex justify-between items-center hover:bg-green-400/10 transition"
              >
                <div className="flex items-center gap-3">
                  {/* ✅ Remove .glb from display */}
                  <span className="truncate max-w-xs text-green-100">
                    {file.name.replace(/\.glb$/i, "")}
                  </span>
                  <span className="text-sm text-green-300/70">
                    {"size" in file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                  </span>
                </div>

                {"path" in file && (
                  <div className="flex items-center gap-2">
                    {/* Download */}
                    <button
                      onClick={() => handleDownload(file as FileType)}
                      className="p-2 rounded-md bg-green-500/20 hover:bg-green-500/30 transition"
                      title="Download STL"
                    >
                      <Download size={18} className="text-green-300" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(file as FileType)}
                      className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/30 transition"
                      title="Delete File"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-green-300/70 text-center">No files uploaded yet</p>
        )}
      </div>
    </div>
  );
};

export default Home; 
