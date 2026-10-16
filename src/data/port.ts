import type { Scenario } from '../store/useNocturaStore'
import { geoReferences, geoToScene } from './geospatial'

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

export type PontoonSpec = {
  id: string
  x: number
  z: number
  length: number
  angle: number
  positionConfidence: 'real-anchor' | 'provisional'
}

// Facts used only when explicitly documented by public sources.
export const verifiedPortFacts = {
  northernJettyLengthM: 450,
  centralMoleLengthM: 205,
  entranceWidthM: 100,
  heritageSurveyCorePiers: 8,
}

const geoById = new Map(geoReferences.map((point) => [point.id, point]))

function geoPosition(id: string, y = 0): Vec3 | null {
  const point = geoById.get(id)
  return point ? geoToScene(point.latitude, point.longitude, y) : null
}

function xz(id: string, fallback: [number, number]) {
  const point = geoPosition(id)
  return point ? { x: point[0], z: point[2], confidence: 'real-anchor' as const } : { x: fallback[0], z: fallback[1], confidence: 'provisional' as const }
}

// V1 visual calibration layer. Buildings are still provisional until their SIG footprints are imported.
export const buildings: BuildingSpec[] = [
  { id: 'capitainerie', label: 'Capitainerie', position: [-58, 5, 70], size: [28, 10, 16], rotationY: -0.16, wall: '#e8d9b9', roof: '#b87553', floors: 2 },
  { id: 'harbor-office', label: 'Bâtiment portuaire', position: [-24, 4, 86], size: [20, 8, 12], rotationY: -0.08, wall: '#efe7d2', roof: '#b66f4a', floors: 2 },
  { id: 'village-01', label: 'Front bâti', position: [22, 6, 104], size: [32, 12, 16], rotationY: 0.08, wall: '#f0ddbb', roof: '#ad6844', floors: 2 },
  { id: 'village-02', label: 'Front bâti', position: [60, 5, 108], size: [28, 10, 16], rotationY: 0.05, wall: '#e5cfaa', roof: '#9f6041', floors: 2 },
  { id: 'village-03', label: 'Front bâti', position: [94, 5, 102], size: [26, 10, 14], rotationY: -0.08, wall: '#f1e2c6', roof: '#a86648', floors: 2 },
  { id: 'service-west', label: 'Service portuaire', position: [-100, 4, 51], size: [18, 8, 12], rotationY: -0.22, wall: '#d9d1bd', roof: '#855c4a', floors: 1 },
]

const pierB = geoPosition('B', 2.2) ?? [-52, 2.2, -24]
const pierC = geoPosition('C', 2.2) ?? [-31, 2.2, -44]
const pierD = geoPosition('D', 2.2) ?? [-10, 2.2, -62]
const pierE = geoPosition('E', 2.2) ?? [12, 2.2, -79]
const pierF = geoPosition('F', 2.2) ?? [34, 2.2, -94]
const pierH = geoPosition('H', 2.2) ?? [77, 2.2, -111]

export const harborLights: HarborLight[] = [
  { id: 'L-001', label: 'Quai ouest 01', position: [-90, 5.5, 42], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-002', label: 'Quai ouest 02', position: [-62, 5.5, 39], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-003', label: 'Quai central 01', position: [-26, 5.5, 35], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-004', label: 'Quai central 02', position: [10, 5.5, 36], zone: 'quay', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-005', label: 'Promenade 01', position: [43, 5.5, 84], zone: 'promenade', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-006', label: 'Promenade 02', position: [78, 5.5, 86], zone: 'promenade', basePowerW: null, note: 'Position V1 à recalibrer sur inventaire portuaire.' },
  { id: 'L-007', label: 'Feu / entrée de port', position: [0, 6.2, -176], zone: 'entrance', basePowerW: null, note: 'Point de démonstration ; position exacte à confirmer.' },
  { id: 'L-008', label: 'Capitainerie', position: [-58, 5.2, 58], zone: 'building', basePowerW: null, note: 'Point de démonstration V1.' },
  { id: 'P-A1', label: 'Ponton A', position: [-73, 2.2, -4], zone: 'pontoon', basePowerW: null, note: 'Position provisoire : ancrage géographique public non encore vérifié.' },
  { id: 'P-B1', label: 'Panne B', position: pierB, zone: 'pontoon', basePowerW: null, note: 'Centre géographique recalé sur OpenStreetMap ; luminaire lui-même reste simulé.' },
  { id: 'P-C1', label: 'Panne C', position: pierC, zone: 'pontoon', basePowerW: null, note: 'Centre géographique recalé sur OpenStreetMap ; luminaire lui-même reste simulé.' },
  { id: 'P-D1', label: 'Panne D', position: pierD, zone: 'pontoon', basePowerW: null, note: 'Centre géographique recalé sur OpenStreetMap ; luminaire lui-même reste simulé.' },
  { id: 'P-E1', label: 'Panne E', position: pierE, zone: 'pontoon', basePowerW: null, note: 'Centre géographique recalé sur OpenStreetMap ; luminaire lui-même reste simulé.' },
  { id: 'P-F1', label: 'Panne F', position: pierF, zone: 'pontoon', basePowerW: null, note: 'Centre géographique recalé sur coordonnées publiées par le CNMT ; luminaire simulé.' },
  { id: 'P-G1', label: 'Panne G', position: [56, 2.2, -105], zone: 'pontoon', basePowerW: null, note: 'Position provisoire en attente d’un ancrage géographique vérifié.' },
  { id: 'P-H1', label: 'Panne H', position: pierH, zone: 'pontoon', basePowerW: null, note: 'Centre géographique recalé sur OpenStreetMap ; luminaire lui-même reste simulé.' },
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

const A = xz('A', [-74, -4])
const B = xz('B', [-53, -23])
const C = xz('C', [-32, -43])
const D = xz('D', [-11, -61])
const E = xz('E', [11, -78])
const F = xz('F', [33, -93])
const G = xz('G', [56, -105])
const H = xz('H', [76, -110])

// Centres B/C/D/E/F/H now come from real geographic anchors.
// Lengths and orientations are still visual approximations until way geometry/SIG data is imported.
export const pontoons: PontoonSpec[] = [
  { id: 'A', x: A.x, z: A.z, length: 105, angle: -0.035, positionConfidence: A.confidence },
  { id: 'B', x: B.x, z: B.z, length: 116, angle: -0.025, positionConfidence: B.confidence },
  { id: 'C', x: C.x, z: C.z, length: 126, angle: -0.016, positionConfidence: C.confidence },
  { id: 'D', x: D.x, z: D.z, length: 135, angle: -0.006, positionConfidence: D.confidence },
  { id: 'E', x: E.x, z: E.z, length: 128, angle: 0.006, positionConfidence: E.confidence },
  { id: 'F', x: F.x, z: F.z, length: 118, angle: 0.018, positionConfidence: F.confidence },
  { id: 'G', x: G.x, z: G.z, length: 105, angle: 0.032, positionConfidence: G.confidence },
  { id: 'H', x: H.x, z: H.z, length: 92, angle: 0.047, positionConfidence: H.confidence },
]

export const cameraPresets = {
  aerial: { position: [270, 205, 330] as Vec3, target: [0, 0, -22] as Vec3 },
  harbor: { position: [32, 32, 150] as Vec3, target: [0, 4, -48] as Vec3 },
  promenade: { position: [-105, 11, 107] as Vec3, target: [-24, 5, 40] as Vec3 },
}
