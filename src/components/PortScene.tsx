import { OrbitControls, Sky, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildings, cameraPresets, harborLights, intensityFor, pontoons, type BuildingSpec, type HarborLight } from '../data/port'
import { useNocturaStore } from '../store/useNocturaStore'

function CameraRig() {
  const { camera } = useThree()
  const mode = useNocturaStore((s) => s.cameraMode)
  const progress = useRef(1)
  const start = useRef(new THREE.Vector3())

  useEffect(() => {
    start.current.copy(camera.position)
    progress.current = 0
  }, [camera, mode])

  useFrame((_, delta) => {
    if (progress.current >= 1) return
    progress.current = Math.min(1, progress.current + delta * 0.75)
    const t = 1 - Math.pow(1 - progress.current, 3)
    const destination = new THREE.Vector3(...cameraPresets[mode].position)
    camera.position.lerpVectors(start.current, destination, t)
    camera.lookAt(...cameraPresets[mode].target)
  })

  return null
}

function Atmosphere() {
  const isNight = useNocturaStore((s) => s.isNight)
  const { scene } = useThree()
  const background = useRef(new THREE.Color(isNight ? '#06121d' : '#8bc5df'))

  useFrame((_, delta) => {
    const target = new THREE.Color(isNight ? '#06121d' : '#8bc5df')
    background.current.lerp(target, Math.min(1, delta * 1.8))
    scene.background = background.current
    scene.fog = new THREE.Fog(background.current.clone(), isNight ? 260 : 330, isNight ? 680 : 820)
  })

  return (
    <>
      {!isNight && <Sky distance={800} sunPosition={[90, 65, 40]} inclination={0.58} azimuth={0.22} turbidity={7} rayleigh={1.8} mieCoefficient={0.006} mieDirectionalG={0.84} />}
      {isNight && <Stars radius={500} depth={120} count={2500} factor={3.5} saturation={0.15} fade speed={0.25} />}
      <hemisphereLight args={[isNight ? '#6f8ead' : '#cce8f7', isNight ? '#151a1c' : '#706b50', isNight ? 0.42 : 1.35]} />
      <directionalLight
        castShadow
        position={isNight ? [-70, 100, 80] : [110, 130, 70]}
        intensity={isNight ? 0.35 : 2.2}
        color={isNight ? '#9fb9d4' : '#fff1d3'}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={450}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
      />
    </>
  )
}

function AnimatedSea() {
  const isNight = useNocturaStore((s) => s.isNight)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uNight: { value: isNight ? 1 : 0 },
        },
        vertexShader: `
          uniform float uTime;
          varying vec3 vWorld;
          varying float vWave;
          void main() {
            vec3 p = position;
            float waveA = sin((p.x * .052) + uTime * .55) * 0.42;
            float waveB = cos((p.y * .041) - uTime * .43) * 0.34;
            float waveC = sin((p.x + p.y) * .025 + uTime * .24) * 0.2;
            p.z += waveA + waveB + waveC;
            vWave = p.z;
            vec4 world = modelMatrix * vec4(p, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: `
          uniform float uNight;
          varying vec3 vWorld;
          varying float vWave;
          void main() {
            vec3 dayDeep = vec3(0.025, 0.31, 0.43);
            vec3 dayShallow = vec3(0.06, 0.53, 0.63);
            vec3 nightDeep = vec3(0.008, 0.055, 0.09);
            vec3 nightShallow = vec3(0.015, 0.12, 0.17);
            float shimmer = smoothstep(-0.6, 0.8, vWave);
            vec3 day = mix(dayDeep, dayShallow, shimmer * .65);
            vec3 night = mix(nightDeep, nightShallow, shimmer * .5);
            vec3 color = mix(day, night, uNight);
            float glint = pow(max(0.0, sin(vWorld.x * .09 + vWorld.z * .05)), 16.0) * (1.0 - uNight) * .09;
            gl_FragColor = vec4(color + glint, 1.0);
          }
        `,
      }),
    [],
  )

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
    material.uniforms.uNight.value = THREE.MathUtils.lerp(material.uniforms.uNight.value, isNight ? 1 : 0, Math.min(1, delta * 2))
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.55, 0]} receiveShadow>
      <planeGeometry args={[1100, 1100, 150, 150]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function StoneQuay({ position, size, rotation = 0 }: { position: [number, number, number]; size: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#aaa18d" roughness={0.88} />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.13, 0]} receiveShadow>
        <boxGeometry args={[size[0] - 0.35, 0.25, size[2] - 0.35]} />
        <meshStandardMaterial color="#c5bda9" roughness={0.8} />
      </mesh>
    </group>
  )
}

function MooringBollard({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 1.05, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.38, 0.65, 10]} />
        <meshStandardMaterial color="#303638" roughness={0.7} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.95, 0.18, 0.22]} />
        <meshStandardMaterial color="#343a3c" metalness={0.5} />
      </mesh>
    </group>
  )
}

function Pontoon({ x, z, length, angle, label }: { x: number; z: number; length: number; angle: number; label: string }) {
  const fingerCount = Math.max(5, Math.floor(length / 16))
  return (
    <group position={[x, 0.42, z]} rotation-y={angle}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.1, 0.42, length]} />
        <meshStandardMaterial color="#9a8770" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2.75, 0.07, length - 0.8]} />
        <meshStandardMaterial color="#b39a79" roughness={0.9} />
      </mesh>
      {Array.from({ length: fingerCount }).map((_, i) => {
        const pz = -length / 2 + 9 + i * ((length - 18) / Math.max(1, fingerCount - 1))
        return (
          <group key={`${label}-finger-${i}`}>
            <mesh position={[-5.2, -0.02, pz]} castShadow>
              <boxGeometry args={[7.5, 0.28, 0.85]} />
              <meshStandardMaterial color="#8d7b64" roughness={0.86} />
            </mesh>
            <mesh position={[5.2, -0.02, pz]} castShadow>
              <boxGeometry args={[7.5, 0.28, 0.85]} />
              <meshStandardMaterial color="#8d7b64" roughness={0.86} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, 0.52, length / 2 - 2]}>
        <boxGeometry args={[1.6, 0.65, 0.12]} />
        <meshStandardMaterial color="#2a4f61" />
      </mesh>
    </group>
  )
}

function GabledRoof({ width, depth, y, color }: { width: number; depth: number; y: number; color: string }) {
  const half = width / 2
  const slopeLength = Math.sqrt(half * half + 3.2 * 3.2)
  const angle = Math.atan2(3.2, half)
  return (
    <group position={[0, y, 0]}>
      <mesh position={[-width / 4, 1.55, 0]} rotation-z={angle} castShadow>
        <boxGeometry args={[slopeLength, 0.32, depth + 1]} />
        <meshStandardMaterial color={color} roughness={0.84} />
      </mesh>
      <mesh position={[width / 4, 1.55, 0]} rotation-z={-angle} castShadow>
        <boxGeometry args={[slopeLength, 0.32, depth + 1]} />
        <meshStandardMaterial color={color} roughness={0.84} />
      </mesh>
    </group>
  )
}

function Building({ spec }: { spec: BuildingSpec }) {
  const [w, h, d] = spec.size
  const floors = spec.floors ?? 2
  const windowsPerFloor = Math.max(2, Math.floor(w / 7))
  return (
    <group position={spec.position} rotation-y={spec.rotationY ?? 0}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={spec.wall} roughness={0.92} />
      </mesh>
      <GabledRoof width={w} depth={d} y={h} color={spec.roof} />
      {Array.from({ length: floors }).flatMap((_, floor) =>
        Array.from({ length: windowsPerFloor }).map((__, i) => {
          const x = -w / 2 + (i + 1) * (w / (windowsPerFloor + 1))
          const y = 2.25 + floor * Math.max(3.2, (h - 2.6) / Math.max(1, floors - 1))
          return (
            <group key={`${spec.id}-window-${floor}-${i}`}>
              <mesh position={[x, Math.min(h - 1.5, y), d / 2 + 0.025]}>
                <boxGeometry args={[1.7, 2.1, 0.12]} />
                <meshStandardMaterial color="#315262" roughness={0.25} metalness={0.08} />
              </mesh>
              <mesh position={[x, Math.min(h - 1.5, y), d / 2 + 0.095]}>
                <boxGeometry args={[0.12, 2.15, 0.08]} />
                <meshStandardMaterial color="#ded1b7" roughness={0.7} />
              </mesh>
            </group>
          )
        }),
      )}
      <mesh position={[0, 1.65, d / 2 + 0.09]}>
        <boxGeometry args={[2.25, 3.3, 0.16]} />
        <meshStandardMaterial color="#6d5745" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.18, d / 2 + 1.2]} receiveShadow>
        <boxGeometry args={[w * 0.82, 0.24, 2.4]} />
        <meshStandardMaterial color="#c9c0aa" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Pine({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.34, 0.5, 4.8, 10]} />
        <meshStandardMaterial color="#6b4a35" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 5.4, 0]}>
        <coneGeometry args={[2.4, 4.2, 10]} />
        <meshStandardMaterial color="#355c44" roughness={0.98} />
      </mesh>
      <mesh castShadow position={[0, 7.15, 0]}>
        <coneGeometry args={[1.75, 3.6, 10]} />
        <meshStandardMaterial color="#2f573f" roughness={0.98} />
      </mesh>
    </group>
  )
}

function Palm({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.2, 0.42, 7, 9]} />
        <meshStandardMaterial color="#8a6541" roughness={0.95} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 1.55, 7.2, Math.sin(a) * 1.55]} rotation={[0.12, -a, Math.PI / 2.7]} castShadow>
            <coneGeometry args={[0.42, 3.7, 7]} />
            <meshStandardMaterial color="#4e7446" roughness={0.94} />
          </mesh>
        )
      })}
    </group>
  )
}

function Boat({ position, rotation = 0, color = '#f4f0e7', scale = 1 }: { position: [number, number, number]; rotation?: number; color?: string; scale?: number }) {
  const group = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.7 + phase) * 0.08
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.45 + phase) * 0.012
  })
  return (
    <group ref={group} position={position} rotation-y={rotation} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[2.25, 0.75, 7.8]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.75, -0.4]} castShadow>
        <boxGeometry args={[1.75, 0.72, 2.8]} />
        <meshStandardMaterial color="#e2e2d8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.05, -0.38]}>
        <boxGeometry args={[1.4, 0.35, 1.9]} />
        <meshStandardMaterial color="#31576a" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 4.1, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 7.4, 8]} />
        <meshStandardMaterial color="#b9b4aa" metalness={0.65} roughness={0.35} />
      </mesh>
    </group>
  )
}

function HarborLamp({ light }: { light: HarborLight }) {
  const isNight = useNocturaStore((s) => s.isNight)
  const scenario = useNocturaStore((s) => s.scenario)
  const selected = useNocturaStore((s) => s.selectedLightId === light.id)
  const selectLight = useNocturaStore((s) => s.selectLight)
  const factor = intensityFor(light, scenario)
  const small = light.zone === 'pontoon'
  const h = small ? 1.45 : 5.2
  const glow = isNight ? factor : 0.03

  return (
    <group position={light.position} onClick={(event) => { event.stopPropagation(); selectLight(light.id) }}>
      <mesh castShadow position={[0, -h / 2 + 0.1, 0]}>
        <cylinderGeometry args={[small ? 0.07 : 0.095, small ? 0.1 : 0.15, h, 10]} />
        <meshStandardMaterial color={selected ? '#6ca8c4' : '#394348'} metalness={0.7} roughness={0.44} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[small ? 0.17 : 0.25, 14, 10]} />
        <meshStandardMaterial color="#ffdfa0" emissive="#ffc65c" emissiveIntensity={glow * 5.5} />
      </mesh>
      {isNight && factor > 0.03 && (
        <pointLight position={[0, -0.05, 0]} color="#ffd38a" intensity={(small ? 2.4 : 8.5) * factor} distance={(small ? 7 : 20) * (0.7 + factor)} decay={2} />
      )}
      {selected && (
        <mesh position={[0, -h / 2, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.65, 0.9, 28]} />
          <meshBasicMaterial color="#69c9f0" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function HarborGeometry() {
  const isNight = useNocturaStore((s) => s.isNight)
  const shoreline = isNight ? '#4c4c3e' : '#77745c'
  return (
    <group>
      <AnimatedSea />

      <mesh position={[0, -1.35, 117]} receiveShadow>
        <boxGeometry args={[330, 3, 92]} />
        <meshStandardMaterial color={shoreline} roughness={1} />
      </mesh>
      <mesh position={[-124, -1.2, 35]} rotation-y={-0.16} receiveShadow>
        <boxGeometry args={[86, 3.2, 170]} />
        <meshStandardMaterial color={shoreline} roughness={1} />
      </mesh>
      <mesh position={[125, -1.2, 32]} rotation-y={0.13} receiveShadow>
        <boxGeometry args={[72, 3.2, 175]} />
        <meshStandardMaterial color={shoreline} roughness={1} />
      </mesh>

      <StoneQuay position={[0, 0, 71]} size={[190, 2.2, 13]} />
      <StoneQuay position={[-94, 0, 28]} size={[12, 2.2, 100]} rotation={-0.1} />
      <StoneQuay position={[95, 0, 20]} size={[12, 2.2, 118]} rotation={0.08} />
      <StoneQuay position={[-57, 0, -103]} size={[10, 2.5, 155]} rotation={0.2} />
      <StoneQuay position={[78, 0, -105]} size={[10, 2.5, 148]} rotation={-0.14} />

      {pontoons.map((pontoon) => <Pontoon key={pontoon.id} x={pontoon.x} z={pontoon.z} length={pontoon.length} angle={pontoon.angle} label={pontoon.id} />)}

      {Array.from({ length: 10 }).map((_, i) => <MooringBollard key={`bollard-${i}`} x={-82 + i * 18} z={64.2} />)}

      {buildings.map((building) => <Building key={building.id} spec={building} />)}

      {[[-109, 1, 86], [-94, 1, 96], [-73, 1, 104], [113, 1, 90], [130, 1, 80], [145, 1, 101], [82, 1, 114], [52, 1, 119]].map((p, i) => (
        <Pine key={`pine-${i}`} position={p as [number, number, number]} scale={0.9 + (i % 3) * 0.12} />
      ))}
      {[[-61, 1, 80], [-44, 1, 84], [-25, 1, 86], [4, 1, 91]].map((p, i) => (
        <Palm key={`palm-${i}`} position={p as [number, number, number]} scale={0.9 + i * 0.04} />
      ))}

      {[
        [-60, 0.25, -16, 0.05, '#f3f1e9'], [-48, 0.25, -34, 0.03, '#dfebe9'], [-35, 0.25, 2, -0.02, '#f5e7d0'],
        [-18, 0.25, -51, 0.02, '#f3f1e9'], [-5, 0.25, -10, -0.05, '#e5ecef'], [12, 0.25, -67, 0.04, '#f3e4d0'],
        [28, 0.25, -21, -0.04, '#f7f6ef'], [47, 0.25, -76, 0.01, '#e6eded'], [59, 0.25, -36, 0.03, '#fff7e8'],
        [74, 0.25, -65, -0.04, '#f0f2ee'],
      ].map(([x, y, z, r, c], i) => <Boat key={`boat-${i}`} position={[x as number, y as number, z as number]} rotation={r as number} color={c as string} scale={0.85 + (i % 3) * 0.08} />)}

      {harborLights.map((light) => <HarborLamp key={light.id} light={light} />)}
    </group>
  )
}

export function PortScene() {
  const cameraMode = useNocturaStore((s) => s.cameraMode)
  const selectLight = useNocturaStore((s) => s.selectLight)
  const target = cameraPresets[cameraMode].target

  return (
    <>
      <CameraRig />
      <Atmosphere />
      <HarborGeometry />
      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        dampingFactor={0.055}
        minDistance={8}
        maxDistance={470}
        maxPolarAngle={Math.PI * 0.49}
        minPolarAngle={0.08}
      />
      <mesh position={[0, -3.1, 0]} onClick={() => selectLight(null)}>
        <boxGeometry args={[950, 1, 950]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  )
}
