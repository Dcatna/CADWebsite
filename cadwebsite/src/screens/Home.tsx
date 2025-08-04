// src/pages/Home.tsx
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import * as THREE from "three";
import { useUserStore } from "@/data/userstore";
import type { FileType } from "@/data/types";
import { UploadPopup } from "@/components/Navbar";
import { supabase } from "@/data/supabaseclient";
import { GLTFLoader, STLExporter } from "three-stdlib";
import { Download, Trash2, UploadCloud } from "lucide-react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// === CSS to include in your global stylesheet (e.g., globals.css) ===
// @keyframes floatParticle {
//   0% { transform: translateY(0) scale(1); opacity: 0.3; }
//   50% { transform: translateY(-2px) scale(1.02); opacity: 0.5; }
//   100% { transform: translateY(0) scale(1); opacity: 0.3; }
// }
// @keyframes slowSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
// @keyframes slowSpinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
// @keyframes slowBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
// @keyframes pulseSlow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.02); } }
// @keyframes softPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
// .animate-floatParticle { animation: floatParticle 12s ease-in-out infinite; }
// .animate-slowSpin { animation: slowSpin 100s linear infinite; }
// .animate-slowSpinReverse { animation: slowSpinReverse 100s linear infinite; }
// .animate-slowBounce { animation: slowBounce 16s ease-in-out infinite; }
// .animate-pulseSlow { animation: pulseSlow 12s ease-in-out infinite; }
// .empty-preview-icon { animation: softPulse 8s ease-in-out infinite; }
// .clip-hexagon {
//   clip-path: polygon(25% 5.77%, 75% 5.77%, 100% 50%, 75% 94.23%, 25% 94.23%, 0% 50%);
// }
// ===================================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center text-red-400">
          <p>Failed to render preview.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const BackgroundLayer: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0f0c]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(10,15,12,0) 50%, rgba(10,15,12,0.85) 100%)`,
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-[200px] bg-gradient-to-br from-green-500/8 to-transparent pointer-events-none" />
      <div className="absolute bottom-[25%] right-[15%] w-[500px] h-[500px] rounded-full blur-[180px] bg-gradient-to-tr from-emerald-400/6 to-transparent pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[80px] h-[80px] rounded-full blur-2xl bg-gradient-to-br from-green-400/10 to-emerald-600/6 animate-slowSpin" />
        <div className="absolute top-[32%] left-[65%] w-[70px] h-[70px] blur-2xl bg-gradient-to-br from-green-300/8 to-emerald-500/6 transform rotate-20 animate-slowSpinReverse" />
        <div
          className="absolute"
          style={{
            top: "60%",
            left: "25%",
            width: 0,
            height: 0,
            borderLeft: "30px solid transparent",
            borderRight: "30px solid transparent",
            borderBottom: "60px solid rgba(34,197,94,0.12)",
            filter: "blur(6px)",
            animation: "slowSpin 70s linear infinite",
          }}
        />
        <div className="absolute top-[50%] left-[80%] w-[70px] h-[70px] blur-2xl clip-hexagon bg-green-400/10 animate-slowSpinReverse" />
        <div className="absolute top-[20%] left-[50%] w-[40px] h-[40px] rounded-full blur-2xl bg-gradient-to-br from-emerald-300/10 to-green-500/6 animate-slowBounce" />
      </div>
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] rounded-full blur bg-green-300/25 animate-floatParticle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
};

const EmptyPreview: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="relative flex items-center justify-center w-36 h-36 rounded-full border border-green-500/40">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-green-800/10 blur-xl" />
        <div className="relative flex flex-col items-center justify-center gap-2 empty-preview-icon">
          <UploadCloud size={48} className="text-green-400" />
          <span className="text-green-300 font-semibold">3D Preview</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-green-100">
        Select a project to preview
      </h3>
    </div>
  );
};

const PreviewScene = ({ url }: { url: string }) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const currentGLTF = useRef<THREE.Object3D | null>(null);
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    // @ts-ignore
    if (gl.outputEncoding !== undefined) {
      // @ts-ignore
      gl.outputEncoding = THREE.sRGBEncoding;
    }
    // @ts-ignore
    if (gl.physicallyCorrectLights !== undefined) {
      // @ts-ignore
      gl.physicallyCorrectLights = true;
    }
  }, [gl]);

  useEffect(() => {
    const hemi = new THREE.HemisphereLight(0x8888ff, 0x222233, 0.5);
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(5, 10, 7);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-5, -3, -5);
    scene.add(hemi, key, fill);
    return () => {
      scene.remove(hemi, key, fill);
    };
  }, [scene]);

  useEffect(() => {
    const loader = new GLTFLoader();
    let cancelled = false;

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;

        if (currentGLTF.current) {
          currentGLTF.current.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              const mats = Array.isArray(obj.material)
                ? obj.material
                : [obj.material];
              mats.forEach((m: any) => {
                if (m.map) m.map.dispose();
                if (m.normalMap) m.normalMap.dispose();
                m.dispose();
              });
            }
          });
          groupRef.current.remove(currentGLTF.current);
        }

        gltf.scene.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.geometry.computeVertexNormals();
            if (obj.material) {
              const mats = Array.isArray(obj.material)
                ? obj.material
                : [obj.material];
              mats.forEach((m: any) => {
                m.flatShading = false;
                m.needsUpdate = true;
              });
            }
          }
        });

        currentGLTF.current = gltf.scene;
        groupRef.current.add(gltf.scene);
        setFitted(false);
      },
      undefined,
      (err) => {
        console.error("GLTF load error:", err);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url, gl]);

  useFrame(() => {
    if (!currentGLTF.current || fitted) return;
    const box = new THREE.Box3().setFromObject(currentGLTF.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) {
      setFitted(true);
      return;
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = (camera.fov * Math.PI) / 180;
      const cameraDistance = (maxDim / 2) / Math.tan(fov / 2);
      const direction = new THREE.Vector3(1, 1, 1)
        .normalize()
        .multiplyScalar(cameraDistance * 1.2);
      camera.position.copy(center.clone().add(direction));
      camera.near = Math.max(0.1, cameraDistance / 100);
      camera.far = cameraDistance * 10;
      camera.updateProjectionMatrix();
    } else {
      camera.position.set(center.x + 2, center.y + 2, center.z + 2);
      if ("updateProjectionMatrix" in camera)
        (camera as any).updateProjectionMatrix();
    }

    setFitted(true);
  });

  return (
    <group ref={(r) => (groupRef.current = r || new THREE.Group())}>
      <primitive object={groupRef.current} />
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
    </group>
  );
};

const getSignedUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from("cadfiles")
    .createSignedUrl(path, 60);
  if (error || !data?.signedUrl) {
    console.error("Failed to get signed URL:", error);
    return null;
  }
  return data.signedUrl;
};

const renameFileInStorage = async (
  file: FileType,
  newBaseName: string
): Promise<{ newPath: string; newName: string } | null> => {
  try {
    const extMatch = file.path.match(/\.[^/.]+$/);
    const ext = extMatch ? extMatch[0] : "";
    const baseName = file.name.replace(/\.[^/.]+$/i, "");
    const sanitizedNewBase = newBaseName.replace(/\.[^/.]+$/i, "");
    const newName = sanitizedNewBase + ext;
    const newPath = file.path.replace(new RegExp(`${baseName}[^/]*$`), newName);

    const { data, error } = await supabase.storage
      .from("cadfiles")
      .download(file.path);
    if (error || !data) {
      console.error("Error downloading for rename:", error);
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });

    const { error: uploadError } = await supabase.storage
      .from("cadfiles")
      .upload(newPath, blob, { upsert: true });
    if (uploadError) {
      console.error("Error uploading renamed file:", uploadError);
      return null;
    }

    const { error: removeError } = await supabase.storage
      .from("cadfiles")
      .remove([file.path]);
    if (removeError) {
      console.error("Error removing old file after rename:", removeError);
    }

    return { newPath, newName };
  } catch (e) {
    console.error("Rename failed:", e);
    return null;
  }
};

const ModelPreviewWrapper = ({ path }: { path: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    getSignedUrl(path).then((u) => {
      if (isMounted.current) {
        setUrl(u);
        setLoading(false);
      }
    });
    return () => {
      isMounted.current = false;
    };
  }, [path]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-green-300">
        Loading preview...
      </div>
    );
  }
  if (!url) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        Failed to load preview URL.
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <PreviewScene url={url} />
      </Canvas>
    </ErrorBoundary>
  );
};

const Home = () => {
  const files = useUserStore((s) => s.files);
  const removeFile = useUserStore((s) => s.removeFile);
  const [selected, setSelected] = useState<FileType | File | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>("");

  const [renamedFiles, setRenamedFiles] = useState<
    Record<string, { name: string; path: string }>
  >({});

  const handleDownload = async (file: FileType) => {
    try {
      const isSTL = file.path.toLowerCase().endsWith(".stl");
      let finalBlob: Blob | null = null;
      let downloadName = "";

      if (isSTL) {
        const { data, error } = await supabase.storage
          .from("cadfiles")
          .download(file.path);
        if (error || !data) {
          console.error("Error downloading STL:", error);
          return;
        }
        const ab = await data.arrayBuffer();
        finalBlob = new Blob([ab], { type: "model/stl" });
        downloadName = file.name;
      } else {
        const stlPath = file.path.replace(/\.glb$/i, ".stl");
        const stlName = file.name.replace(/\.glb$/i, ".stl");

        const { data: cachedStl, error: cachedError } =
          await supabase.storage.from("cadfiles").download(stlPath);
        if (!cachedError && cachedStl) {
          const ab = await cachedStl.arrayBuffer();
          finalBlob = new Blob([ab], { type: "model/stl" });
          downloadName = stlName;
        } else {
          const { data: glbData, error: glbError } =
            await supabase.storage.from("cadfiles").download(file.path);
          if (glbError || !glbData) {
            console.error("Error downloading GLB:", glbError);
            return;
          }
          const arrayBuffer = await glbData.arrayBuffer();
          const stlString: string = await new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.parse(
              arrayBuffer,
              "",
              (gltf) => {
                try {
                  const scene = gltf.scene;
                  const exporter = new STLExporter();
                  const parsed = exporter.parse(scene);
                  resolve(parsed);
                } catch (e) {
                  reject(e);
                }
              },
              (err) => reject(err)
            );
          });
          finalBlob = new Blob([stlString], {
            type: "application/vnd.ms-pki.stl",
          });
          downloadName = stlName;

          // NOTE: intentionally do NOT upload the generated STL to storage to avoid creating a separate project
        }
      }

      if (!finalBlob) {
        console.error("No blob to download.");
        return;
      }

      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error in handleDownload:", err);
    }
  };

  const handleDelete = async (file: FileType) => {
    if (
      !confirm(
        `Are you sure you want to delete "${file.name.replace(
          /\.glb$/i,
          ""
        )}"?`
      )
    )
      return;
    try {
      const { error } = await supabase.storage
        .from("cadfiles")
        .remove([file.path]);
      if (error) {
        console.error("Error deleting file:", error);
        return;
      }
      removeFile(file.path);
      if (
        selected &&
        "path" in selected &&
        "path" in file &&
        selected.path === file.path
      ) {
        setSelected(null);
      }
      setRenamedFiles((r) => {
        const copy = { ...r };
        delete copy[file.path];
        return copy;
      });
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const beginEdit = (file: FileType) => {
    setEditingPath(file.path);
    setTempName(file.name.replace(/\.[^/.]+$/i, ""));
  };

  const commitEdit = async (file: FileType) => {
    if (!editingPath) return;
    const newBase = tempName.trim();
    if (!newBase) {
      setEditingPath(null);
      return;
    }
    const originalBase = file.name.replace(/\.[^/.]+$/i, "");
    if (newBase === originalBase) {
      setEditingPath(null);
      return;
    }

    const result = await renameFileInStorage(file, newBase);
    if (result) {
      setRenamedFiles((r) => ({
        ...r,
        [file.path]: { name: result.newName, path: result.newPath },
      }));
      if (selected && "path" in selected && selected.path === file.path) {
        setSelected({
          ...(selected as FileType),
          name: result.newName,
          path: result.newPath,
        } as FileType);
      }
    }
    setEditingPath(null);
  };

  const allFiles: (FileType | File)[] = useMemo(() => [...files], [files]);

  const displayName = (file: FileType | File) => {
    if ("path" in file && renamedFiles[file.path]) {
      return renamedFiles[file.path].name;
    }
    return ("name" in file ? file.name : "") || "";
  };
  const displayPath = (file: FileType | File) => {
    if ("path" in file && renamedFiles[file.path]) {
      return renamedFiles[file.path].path;
    }
    return "path" in file ? file.path : "";
  };

  return (
    <div className="relative min-h-screen text-white px-6 py-6 flex flex-col gap-6 overflow-visible">
      <BackgroundLayer />

      {/* Header */}
      <div className="w-full flex justify-center mb-6 overflow-visible">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">
            My Projects
          </h1>
          <button className="bg-green-500/80 hover:bg-green-500/90 text-black font-semibold px-6 py-3 rounded-md shadow-[0_0_20px_rgba(34,197,94,0.35)] hover:scale-105 transition flex items-center gap-2">
            <UploadPopup />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-8">
        {/* File list */}
        <div className="w-1/3 relative z-10 flex flex-col">
          <div className="flex-1 overflow-auto">
            {allFiles.length > 0 ? (
              <ul className="rounded-xl border border-green-400/30 bg-black/70 backdrop-blur-md shadow-[0_0_25px_rgba(34,197,94,0.25)] divide-y divide-green-400/20">
                {allFiles.map((file, idx) => {
                  const hasPath = "path" in file;
                  const isSelected =
                    selected &&
                    hasPath &&
                    "path" in selected &&
                    selected.path === file.path;
                  const editing = editingPath === (hasPath ? file.path : "");
                  return (
                    <li
                      key={idx}
                      onClick={() => hasPath && setSelected(file)}
                      className={`px-4 py-3 flex justify-between items-center cursor-pointer transition ${
                        isSelected
                          ? "bg-green-500/10"
                          : "hover:bg-green-400/10"
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        {editing ? (
                          <input
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={() =>
                              hasPath && commitEdit(file as FileType)
                            }
                            onKeyDown={(e: KeyboardEvent) => {
                              if (e.key === "Enter" && hasPath) {
                                commitEdit(file as FileType);
                              } else if (e.key === "Escape") {
                                setEditingPath(null);
                              }
                            }}
                            className="bg-black/70 border border-green-400/40 backdrop-blur-md shadow-[0_0_25px_rgba(34,197,94,0.25)] text-green-100 font-medium px-3 py-2 rounded-xl w-full placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition focus:shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                          />
                        ) : (
                          <span
                            className="truncate max-w-xs text-green-100 font-medium select-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasPath) beginEdit(file as FileType);
                            }}
                            title="Click to rename"
                          >
                            {displayName(file).replace(/\.glb$/i, "")}
                          </span>
                        )}
                        {"size" in file && (
                          <span className="text-sm text-green-300/70">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      {hasPath && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file as FileType);
                            }}
                            className="p-2 rounded-md bg-green-500/20 hover:bg-green-500/30 transition"
                            title="Download STL"
                          >
                            <Download size={18} className="text-green-300" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file as FileType);
                            }}
                            className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/30 transition"
                            title="Delete File"
                          >
                            <Trash2 size={18} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-green-300/70 text-center mt-6">
                No files uploaded yet
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 relative z-10 flex flex-col rounded-xl border border-green-400/30 bg-black/70 backdrop-blur-md shadow-[0_0_25px_rgba(34,197,94,0.25)] p-4">
          {selected && "path" in selected ? (
            <>
              <div className="mb-2 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-green-100">
                  {(
                    renamedFiles[selected.path]?.name ||
                    (selected as FileType).name
                  ).replace(/\.glb$/i, "")}
                </h2>
              </div>
              <div className="flex-1 border border-green-500/40 rounded-md overflow-hidden">
                {selected.path.toLowerCase().endsWith(".glb") ? (
                  <ModelPreviewWrapper path={displayPath(selected)} />
                ) : selected.path
                    .toLowerCase()
                    .endsWith(".stl") ? (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <p className="text-green-200 mb-2">
                      Preview not available for STL. Download to view locally.
                    </p>
                    <button
                      onClick={() => handleDownload(selected as FileType)}
                      className="bg-green-500 px-4 py-2 rounded-md font-semibold"
                    >
                      Download STL
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-center items-center">
                    <p className="text-green-300">
                      Cannot preview this file type.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyPreview />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
