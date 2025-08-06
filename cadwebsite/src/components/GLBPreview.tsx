import React, { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const Model = React.forwardRef(({ url }: { url: string }, ref: any) => {
  const { scene } = useGLTF(url);
  useEffect(() => {
    if (ref && scene) {
      ref.current = scene;
    }
  }, [scene, ref]);
  return <primitive object={scene} />;
});

function FitCameraOnce({ object }: { object: THREE.Object3D | null }) {
  const { camera, controls } = useThree() as any;

  useEffect(() => {
    if (!object) return;

    // Compute bounding box & center
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Fit object in view
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraZ *= 1.5; // Add some padding
    camera.position.set(center.x, center.y, center.z + cameraZ);

    camera.near = cameraZ / 100;
    camera.far = cameraZ * 100;
    camera.updateProjectionMatrix();

    // Center controls target
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  }, [object, camera, controls]);

  return null;
}

const GLBPreview = ({ filePath }: { filePath: string }) => {
  const objectURL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cadfiles/${filePath}`;
  const modelRef = useRef<THREE.Object3D | null>(null);

  return (
    <div style={{ width: 120, height: 120 }}>
      <Canvas camera={{ fov: 40 }}>
        {/* Soft Lighting for clean look */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Model url={objectURL} ref={modelRef} />
          <FitCameraOnce object={modelRef.current} />
        </Suspense>

        {/* Rotation only - no zoom or pan */}
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default GLBPreview;
