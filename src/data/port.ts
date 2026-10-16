import type { Scenario } from '../store/useNocturaStore'

export type Vec3 = [number, number, number]

export type HarborLight = {
  id: string
  label: string
  position: Vec3
  zone: 'quay' | 'pontoon' | 'entrance' | 'building' | 'promenade'
  basePowerW: number | null
  note: string
}

export type BuildingSpec = {
  id: string
  label: string
  position: Vec3
  size: Vec3
  rotationY?: number
  wall: string
  roof: string
  floors?: number
}

// V1 visual calibration layer.
// Positions are provisional scene coordinates and intentionally isolated from future SIG coordinates.
export const buildings: BuildingSpec[] = [
  { id: 'capitainerie', label: 'Capitainerie', position: [-48, 5, 60], size: [28, 10, 16], rotationY: -0.16, wall: '#e8d9b9', roof: '#b87553', floors: 2 },
  { id: 'harbor-office', label: 'Bâtiment portuaire', position: [-17, 4, 74], size: [20, 8, 12], rotationY: -0.08, wall: '#efe7d2', roof: '#b66f4a', floors: 2 },
  { id: 'village-01', label: 'Front bâti', position: [28, 6, 90], size: [32, 12, 16], rotationY: 0.08, wall: '#f0ddbb', roof: '#ad6844', floors: 2 },
  { id: 'village-02', label: 'Front bâti', position: [64, 5, 93], size: [28, 10, 16], rotationY: 0.05, wall: '#e5cfaa', roof: '#9f6041', floors: 2 },
  { id: 'village-03', label: 'Front bâti', position: [96, 5, 88], size: [26, 10, 14], rotationY: -0.08, wall: '#f1e2c6', roof: '#a86648', floors: 2 },
  { id: 'service-west', label: 'Service portuaire', position: [-82, 4, 42], size: [18, 8, 12], rotationY: -0.22, wall: '#d9d1bd', roof: '#855c4a', floors: 1 },
]

export const harborLights: HarborLight[] = [
  { id: 'L-001', label: 'Quai ouest 01', position: [-70, 5.5, 32], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-002', label: 'Quai ouest 02', position: [-48, 5.5, 30], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-003', label: 'Quai central 01', position: [-20, 5.5, 27], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-004', label: 'Quai central 02', position: [8, 5.5, 28], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-005', label: 'Promenade 01', position: [38, 5.5, 71], zone: 'promenade', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-006', label: 'Promenade 02', position: [70, 5.5, 72], zone: 'promenade', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-007', label: 'Entrée port', position: [-2, 6.2, -118], zone: 'entrance', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-008', label: 'Capitainerie', position: [-48, 5.2, 48], zone: 'building', basePowerW: null, note: 'Point de démonstration V1.' },
  { id: 'P-A1', label: 'Ponton A', position: [-52, 2.2, -8], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-B1', label: 'Ponton B', position: [-28, 2.2, -22], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-C1', label: 'Ponton C', position: [-4, 2.2, -34], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-D1', label: 'Ponton D', position: [20, 2.2, -45], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-E1', label: 'Ponton E', position: [44, 2.2, -54], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
]

const scenarioFactors: Record<Scenario, Record<HarborLight['zone'], number>> = {
  current: { quay: 1, pontoon: 0.85, entrance: 1, building: 0.9, promenade: 0.9 },
  eco: { quay: 0.58, pontoon: 0.42, entrance: 0.8, building: 0.55, promenade: 0.45 },
  biodiversity: { quay: 0.35, pontoon: 0.2, entrance: 0.72, building: 0.38, promenade: 0.22 },
  safety: { quay: 0.95, pontoon: 0.7, entrance: 1, building: 0.8, promenade: 0.72 },
}

export function intensityFor(light: HarborLight, scenario: Scenario) {
  return scenarioFactors[scenario][light.zone]
}

export const pontoons = [
  { id: 'A', x: -54, z: -8, length: 88, angle: -0.04 },
  { id: 'B', x: -30, z: -20, length: 96, angle: -0.025 },
  { id: 'C', x: -6, z: -32, length: 105, angle: -0.01 },
  { id: 'D', x: 18, z: -43, length: 112, angle: 0.008 },
  { id: 'E', x: 42, z: -52, length: 103, angle: 0.02 },
  { id: 'F', x: 65, z: -57, length: 88, angle: 0.045 },
]

export const cameraPresets = {
  aerial: { position: [180, 150, 220] as Vec3, target: [0, 0, -10] as Vec3 },
  harbor: { position: [28, 28, 120] as Vec3, target: [0, 4, -22] as Vec3 },
  promenade: { position: [-82, 10, 92] as Vec3, target: [-18, 5, 30] as Vec3 },
}
