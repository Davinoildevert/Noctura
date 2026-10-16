export type GeoReference = {
  id: string
  label: string
  latitude: number
  longitude: number
  source: string
  sourceUrl: string
  sourceKind: 'osm' | 'official' | 'club'
}

// Real-world anchor points collected from public sources.
// They are kept separate from rendering coordinates so the visual scene can be progressively
// rebuilt from geographic truth instead of accumulating hand-tuned offsets.
export const geoReferences: GeoReference[] = [
  {
    id: 'B',
    label: 'Panne B',
    latitude: 43.00274,
    longitude: 6.20268,
    source: 'OpenStreetMap way 53790404 (via Mapcarta)',
    sourceUrl: 'https://mapcarta.com/W53790404',
    sourceKind: 'osm',
  },
  {
    id: 'C',
    label: 'Panne C',
    latitude: 43.00287,
    longitude: 6.20234,
    source: 'OpenStreetMap way 53790403 (via Mapcarta)',
    sourceUrl: 'https://mapcarta.com/W53790403',
    sourceKind: 'osm',
  },
  {
    id: 'D',
    label: 'Panne D',
    latitude: 43.00305,
    longitude: 6.20187,
    source: 'OpenStreetMap way 53790394 (via Mapcarta)',
    sourceUrl: 'https://mapcarta.com/W53790394',
    sourceKind: 'osm',
  },
  {
    id: 'E',
    label: 'Panne E',
    latitude: 43.00338,
    longitude: 6.20139,
    source: 'OpenStreetMap way 53790393 (via Mapcarta)',
    sourceUrl: 'https://mapcarta.com/W53790393',
    sourceKind: 'osm',
  },
  {
    id: 'F',
    label: 'Panne F',
    latitude: 43.0019444444,
    longitude: 6.2005555556,
    source: 'Coordonnées publiées par le Club Nautique de la Marine à Toulon',
    sourceUrl: 'https://www.cnmt.fr/pratique/services-portuaires/accostage-et-mouillages/',
    sourceKind: 'club',
  },
  {
    id: 'F-bis',
    label: 'Panne F bis / terminal passagers',
    latitude: 43.00274,
    longitude: 6.19994,
    source: 'OpenStreetMap node 10908973098 (via Mapcarta)',
    sourceUrl: 'https://mapcarta.com/N10908973098',
    sourceKind: 'osm',
  },
  {
    id: 'H',
    label: 'Panne H',
    latitude: 43.00212,
    longitude: 6.20171,
    source: 'OpenStreetMap way 53790396 (via Mapcarta)',
    sourceUrl: 'https://mapcarta.com/W53790396',
    sourceKind: 'osm',
  },
]

// Origin chosen near the centre of the marina. One scene unit = one metre.
export const geoOrigin = {
  latitude: 43.0027,
  longitude: 6.2017,
}

const METERS_PER_DEGREE_LATITUDE = 111_320
const longitudeScale = Math.cos((geoOrigin.latitude * Math.PI) / 180)

export function geoToLocalMeters(latitude: number, longitude: number) {
  const east = (longitude - geoOrigin.longitude) * METERS_PER_DEGREE_LATITUDE * longitudeScale
  const north = (latitude - geoOrigin.latitude) * METERS_PER_DEGREE_LATITUDE
  return { east, north }
}

// Three.js scene convention used by NOCTURA: east = +X, north = -Z.
export function geoToScene(latitude: number, longitude: number, y = 0): [number, number, number] {
  const { east, north } = geoToLocalMeters(latitude, longitude)
  return [east, y, -north]
}

export const projectedGeoReferences = geoReferences.map((point) => ({
  ...point,
  scenePosition: geoToScene(point.latitude, point.longitude),
}))
