import type { Zone, ZoneId } from '../types';

export function GlobalPortView({ zones, onOpen }: { zones: Zone[]; onOpen: (id: ZoneId) => void }) {
  return (
    <section className="map-shell">
      <img
        className="port-photo"
        src="/assets/port/porquerolles-orthophoto.jpg"
        alt="Vue aérienne réelle du port de Porquerolles"
      />

      <svg className="zone-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Zones interactives NOCTURA">
        {zones.map((zone) => (
          <g
            key={zone.id}
            className="zone-group"
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir ${zone.name}`}
            onClick={() => onOpen(zone.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onOpen(zone.id);
            }}
          >
            <polygon points={zone.polygon} />
          </g>
        ))}
      </svg>

      <div className="map-help">Vue globale = vraie photo. Clique une zone pour ouvrir sa scène locale 3D.</div>
    </section>
  );
}
