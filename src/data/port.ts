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

// Facts used only when they are explicitly documented by public sources.
// The 450 m jetty and >200 m central mole come from the regional heritage inventory (2015 survey).
// The 100 m entrance width is reported by current 2026 nautical information sources.
export const verifiedPortFacts = {
  northernJettyLengthM: 450,
  centralMoleLengthM: 205,
  entranceWidthM: 100,
  heritageSurveyCorePiers: 8,
}

// V1 visual calibration layer.
// Building positions remain provisional scene coordinates and are intentionally isolated from future SIG coordinates.
export const buildings: BuildingSpec[] = [
  { id: 'capitainerie', label: 'Capitainerie', position: [-58, 5, 70], size: [28, 10, 16], rotationY: -0.16, wall: '#e8d9b9', roof: '#b87553', floors: 2 },
  { id: 'harbor-office', label: 'Bâtiment portuaire', position: [-24, 4, 86], size: [20, 8, 12], rotationY: -0.08, wall: '#efe7d2', roof: '#b66f4a', floors: 2 },
  { id: 'village-01', label: 'Front bâti', position: [22, 6, 104], size: [32, 12, 16], rotationY: 0.08, wall: '#f0ddbb', roof: '#ad6844', floors: 2 },
  { id: 'village-02', label: 'Front bâti', position: [60, 5, 108], size: [28, 10, 16], rotationY: 0.05, wall: '#e5cfaa', roof: '#9f6041', floors: 2 },
  { id: 'village-03', label: 'Front bâti', position: [94, 5, 102], size: [26, 10, 14], rotationY: -0.08, wall: '#f1e2c6', roof: '#a86648', floors: 2 },
  { id: 'service-west', label: 'Service portuaire', position: [-100, 4, 51], size: [18, 8, 12], rotationY: -0.22, wall: '#d9d1bd', roof: '#855c4a', floors: 1 },
]

export const harborLights: HarborLight[] = [
  { id: 'L-001', label: 'Quai ouest 01', position: [-90, 5.5, 42], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-002', label: 'Quai ouest 02', position: [-62, 5.5, 39], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-003', label: 'Quai central 01', position: [-26, 5.5, 35], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-004', label: 'Quai central 02', position: [10, 5.5, 36], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-005', label: 'Promenade 01', position: [43, 5.5, 84], zone: 'promenade', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-006', label: 'Promenade 02', position: [78, 5.5, 86], zone: 'promenade', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-007', label: 'Feu / entrée de port', position: [0, 6.2, -176], zone: 'entrance', basePowerW: null, note: 'Point de démonstration positionné sur l’entrée, à recalibrer précisément.' },
  { id: 'L-008', label: 'Capitainerie', position: [-58, 5.2, 58], zone: 'building', basePowerW: null, note: 'Point de démonstration V1.' },
  { id: 'P-A1', label: 'Ponton A', position: [-73, 2.2, -4], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-B1', label: 'Ponton B', position: [-52, 2.2, -24], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-C1', label: 'Ponton C', position: [-31, 2.2, -44], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-D1', label: 'Ponton D', position: [-10, 2.2, -62], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-E1', label: 'Ponton E', position: [12, 2.2, -79], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-F1', label: 'Ponton F', position: [34, 2.2, -94], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-G1', label: 'Ponton G', position: [56, 2.2, -105], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
  { id: 'P-H1', label: 'Ponton H', position: [77, 2.2, -111], zone: 'pontoon', basePowerW: null, note: 'Borne lumineuse V1.' },
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

// Eight core appontements are represented because the regional heritage inventory explicitly documents eight
// on the central mole. Their exact current 2026 geometry will be replaced with SIG/port data when supplied.
export const pontoons = [
  { id: 'A', x: -74, z: -4, length: 105, angle: -0.035 },
  { id: 'B', x: -53, z: -23, length: 116, angle: -0.025 },
  { id: 'C', x: -32, z: -43, length: 126, angle: -0.016 },
  { id: 'D', x: -11, z: -61, length: 135, angle: -0.006 },
  { id: 'E', x: 11, z: -78, length: 128, angle: 0.006 },
  { id: 'F', x: 33, z: -93, length: 118, angle: 0.018 },
  { id: 'G', x: 55, z: -104, length: 105, angle: 0.032 },
  { id: 'H', x: 76, z: -110, length: 92, angle: 0.047 },
]

export const cameraPresets = {
  aerial: { position: [270, 205, 330] as Vec3, target: [0, 0, -22] as Vec3 },
  harbor: { position: [32, 32, 150] as Vec3, target: [0, 4, -48] as Vec3 },
  promenade: { position: [-105, 11, 107] as Vec3, target: [-24, 5, 40] as Vec3 },
}
