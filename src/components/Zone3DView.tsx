import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import type { Zone } from '../types';

function ZoneModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} />;
}

export function Zone3DView({ zone, onBack }: { zone: Zone; onBack: () => void }) {
  return (
    <section className="scene-shell">
      <div className="scene-toolbar">
        <button type="button" onClick={onBack}>← Vue globale</button>
        <div>
          <strong>{zone.name}</strong>
          <span>{zone.subtitle}</span>
        </div>
      </div>

      <Canvas shadows camera={{ position: [12, 9, 14], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <directionalLight castShadow position={[10, 16, 8]} intensity={2.1} />
        <Suspense fallback={null}>
          <ZoneModel url={zone.modelUrl} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.03} />
      </Canvas>

      <div className="scene-note">Cette vue charge un GLB préparé dans Blender. Le décor n’est plus construit en primitives Three.js.</div>
    </section>
  );
}
