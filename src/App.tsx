import { useMemo, useState } from 'react';
import { GlobalPortView } from './components/GlobalPortView';
import { Zone3DView } from './components/Zone3DView';
import { zones } from './data/zones';
import type { ZoneId } from './types';

export default function App() {
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const zone = useMemo(() => zones.find((item) => item.id === activeZone) ?? null, [activeZone]);

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <span className="brand">NOCTURA</span>
          <span className="place">Port de Porquerolles</span>
        </div>
        <div className="badge">Photo réelle + scènes Blender</div>
      </header>

      {zone ? (
        <Zone3DView zone={zone} onBack={() => setActiveZone(null)} />
      ) : (
        <GlobalPortView zones={zones} onOpen={setActiveZone} />
      )}
    </main>
  );
}
