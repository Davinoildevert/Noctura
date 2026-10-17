import type { Zone, ZoneId } from '../types';

export function GlobalPortView({ zones: _zones, onOpen: _onOpen }: { zones: Zone[]; onOpen: (id: ZoneId) => void }) {
  return (
    <section className="map-shell map-shell--static">
      <img
        className="port-photo port-photo--static"
        src="/assets/port/porquerolles-orthophoto.jpg"
        alt="Vue aérienne nocturne du port de Porquerolles"
        draggable={false}
      />
    </section>
  );
}
