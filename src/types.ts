export type ZoneId = 'ponton-g' | 'carenage';

export type Zone = {
  id: ZoneId;
  name: string;
  subtitle: string;
  modelUrl: string;
  status: 'reference-ready' | 'needs-detail';
  polygon: string;
};
