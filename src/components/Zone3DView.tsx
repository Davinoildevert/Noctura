import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Zone } from '../types';

type LightControl = {
  id: string;
  intensity: number;
  enabled: boolean;
};

function lightIdFromObjectName(name: string) {
  const match = name.match(/(G_LIGHT_\d+)/);
  return match?.[1] ?? null;
}

function ZoneModel({
  url,
  controls,
  selectedLight,
  onSelectLight,
}: {
  url: string;
  controls: Record<string, LightControl>;
  selectedLight: string | null;
  onSelectLight: (id: string | null) => void;
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((object) => {
      const id = lightIdFromObjectName(object.name);
      if (!id) return;

      const control = controls[id];
      if (!control) return;

      if ((object as THREE.Light).isLight) {
        const light = object as THREE.Light & { userData: Record<string, unknown> };
        const base = typeof light.userData.baseIntensity === 'number'
          ? light.userData.baseIntensity
          : light.intensity || 1;

        light.userData.baseIntensity = base;
        light.intensity = control.enabled ? base * (control.intensity / 100) : 0;
      }

      if (object.name === `${id}_HEAD`) {
        const mesh = object as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((material) => {
          if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;
          const own = material.clone();
          own.emissive = new THREE.Color(1.0, 0.22, 0.02);
          own.emissiveIntensity = control.enabled ? Math.max(0.12, control.intensity / 20) : 0;
          mesh.material = own;
        });
      }
    });
  }, [scene, controls]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const id = lightIdFromObjectName(event.object.name);
    onSelectLight(id);
  };

  useEffect(() => {
    scene.traverse((object) => {
      const id = lightIdFromObjectName(object.name);
      if (!id || !(object instanceof THREE.Mesh)) return;
      object.userData.nocturaSelected = id === selectedLight;
    });
  }, [scene, selectedLight]);

  return <primitive object={scene} onClick={handleClick} />;
}

const defaultControls: Record<string, LightControl> = Object.fromEntries(
  Array.from({ length: 7 }, (_, index) => {
    const id = `G_LIGHT_${String(index + 1).padStart(2, '0')}`;
    return [id, { id, intensity: 100, enabled: true }];
  }),
);

export function Zone3DView({ zone, onBack }: { zone: Zone; onBack: () => void }) {
  const [controls, setControls] = useState<Record<string, LightControl>>(defaultControls);
  const [selectedLight, setSelectedLight] = useState<string | null>('G_LIGHT_01');

  const selected = selectedLight ? controls[selectedLight] : null;

  const updateSelected = (patch: Partial<LightControl>) => {
    if (!selectedLight) return;
    setControls((current) => ({
      ...current,
      [selectedLight]: { ...current[selectedLight], ...patch },
    }));
  };

  const setAllLights = (enabled: boolean) => {
    setControls((current) => Object.fromEntries(
      Object.entries(current).map(([id, value]) => [id, { ...value, enabled }]),
    ));
  };

  return (
    <section className="scene-shell">
      <div className="scene-toolbar">
        <button type="button" onClick={onBack}>← Vue globale</button>
        <div>
          <strong>{zone.name}</strong>
          <span>{zone.subtitle}</span>
        </div>
        <div className="scene-actions">
          <button type="button" onClick={() => setAllLights(true)}>Tout allumer</button>
          <button type="button" onClick={() => setAllLights(false)}>Tout éteindre</button>
        </div>
      </div>

      <Canvas shadows camera={{ position: [12, 9, 14], fov: 45 }} onPointerMissed={() => setSelectedLight(null)}>
        <ambientLight intensity={0.18} />
        <directionalLight castShadow position={[10, 16, 8]} intensity={1.2} />
        <Suspense fallback={null}>
          <ZoneModel
            url={zone.modelUrl}
            controls={controls}
            selectedLight={selectedLight}
            onSelectLight={setSelectedLight}
          />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.03} minDistance={4} maxDistance={45} />
      </Canvas>

      {selected && (
        <aside className="light-control-panel">
          <div>
            <span className="control-kicker">Luminaire NOCTURA</span>
            <strong>{selected.id}</strong>
          </div>

          <label className="switch-row">
            <span>État</span>
            <input
              type="checkbox"
              checked={selected.enabled}
              onChange={(event) => updateSelected({ enabled: event.target.checked })}
            />
            <b>{selected.enabled ? 'ON' : 'OFF'}</b>
          </label>

          <label className="range-row">
            <span>Intensité <b>{selected.intensity}%</b></span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={selected.intensity}
              onChange={(event) => updateSelected({ intensity: Number(event.target.value) })}
            />
          </label>

          <small>Placement des luminaires = prototype NOCTURA tant que le plan d’éclairage 2026 n’est pas disponible.</small>
        </aside>
      )}

      <div className="scene-note">Blender fournit le décor. Three.js ne sert ici qu’à afficher le GLB, déplacer la caméra et piloter les luminaires.</div>
    </section>
  );
}
