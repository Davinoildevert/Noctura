import type { Zone } from '../types';

// NOTE: these overlay polygons are only UI calibration shapes for the current base photo.
// They are not surveyed GIS boundaries and must be recalibrated on the final orthophoto.
export const zones: Zone[] = [
  {
    id: 'ponton-g',
    name: 'Panne G',
    subtitle: 'Zone prioritaire — références photo disponibles',
    modelUrl: '/assets/models/ponton-g.glb',
    status: 'reference-ready',
    polygon: '47,38 55,37 61,75 53,78 46,72 43,54',
  },
  {
    id: 'carenage',
    name: 'Zone technique / carénage',
    subtitle: 'Deuxième zone — reconstruction après Panne G',
    modelUrl: '/assets/models/carenage.glb',
    status: 'needs-detail',
    polygon: '72,30 88,31 91,49 79,55 70,46',
  },
];
