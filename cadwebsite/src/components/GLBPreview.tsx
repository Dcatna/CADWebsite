import React, { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function NormalizedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();

  useEffect(() => {
    if (!scene) return;

    // 1️⃣ Normalize size and center
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Center model
    scene.position.sub(center);

    // Scale model so biggest side = 1 unit
    const scale = 1 / maxDim;
    scene.scale.setScalar(scale);

    // 2️⃣ Fixed camera distance so all models look the same size
    camera.position.set(0, 0, 2.5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [scene, camera]);

  return <primitive object={scene} />;
}

const GLBPreview = ({ filePath }: { filePath: string }) => {
  const objectURL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cadfiles/${filePath}`;

  return (
    <div style={{ width: 120, height: 120 }}>
      <Canvas camera={{ fov: 40 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />

        <Suspense fallback={null}>
          <NormalizedModel url={objectURL} />
        </Suspense>

        {/* 3️⃣ Rotate like Tinkercad */}
        <OrbitControls
          autoRotate
          autoRotateSpeed={1.5}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};

export default GLBPreview;
