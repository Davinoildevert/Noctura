import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PortScene } from './components/PortScene'
import { harborLights, intensityFor } from './data/port'
import { scenarioLabels, useNocturaStore, type CameraMode, type Scenario } from './store/useNocturaStore'

const scenarios: Scenario[] = ['current', 'eco', 'biodiversity', 'safety']
const cameras: { id: CameraMode; label: string }[] = [
  { id: 'aerial', label: 'Vue aérienne' },
  { id: 'harbor', label: 'Dans le port' },
  { id: 'promenade', label: 'Promenade' },
]

export default function App() {
  const isNight = useNocturaStore((s) => s.isNight)
  const scenario = useNocturaStore((s) => s.scenario)
  const cameraMode = useNocturaStore((s) => s.cameraMode)
  const selectedLightId = useNocturaStore((s) => s.selectedLightId)
  const setNight = useNocturaStore((s) => s.setNight)
  const setScenario = useNocturaStore((s) => s.setScenario)
  const setCameraMode = useNocturaStore((s) => s.setCameraMode)
  const selectLight = useNocturaStore((s) => s.selectLight)

  const selected = harborLights.find((light) => light.id === selectedLightId) ?? null
  const averageIntensity = Math.round(
    (harborLights.reduce((sum, light) => sum + intensityFor(light, scenario), 0) / harborLights.length) * 100,
  )

  return (
    <main className="app-shell">
      <section className="viewport">
        <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }} camera={{ position: [180, 150, 220], fov: 46, near: 0.1, far: 1800 }}>
          <Suspense fallback={null}>
            <PortScene />
          </Suspense>
        </Canvas>
        <div className="vignette" />
      </section>

      <header className="topbar glass-panel">
        <div>
          <p className="eyebrow">OCEAN HACKATHON 2026 · TOULON</p>
          <h1>NOCTURA</h1>
          <p className="subtitle">Jumeau numérique visuel · Port de Porquerolles</p>
        </div>
        <div className="status-pill">
          <span className="status-dot" />
          Simulation locale
        </div>
      </header>

      <aside className="control-panel glass-panel">
        <section>
          <div className="section-heading">
            <span>Scénario</span>
            <strong>{scenarioLabels[scenario]}</strong>
          </div>
          <div className="button-grid scenarios">
            {scenarios.map((item) => (
              <button key={item} className={scenario === item ? 'active' : ''} onClick={() => setScenario(item)}>
                {scenarioLabels[item]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="section-heading">
            <span>Ambiance</span>
            <strong>{isNight ? 'Nuit' : 'Jour'}</strong>
          </div>
          <div className="segmented">
            <button className={!isNight ? 'active' : ''} onClick={() => setNight(false)}>Jour</button>
            <button className={isNight ? 'active' : ''} onClick={() => setNight(true)}>Nuit</button>
          </div>
        </section>

        <section>
          <div className="section-heading">
            <span>Caméra</span>
            <strong>Immersion</strong>
          </div>
          <div className="button-grid">
            {cameras.map((camera) => (
              <button key={camera.id} className={cameraMode === camera.id ? 'active' : ''} onClick={() => setCameraMode(camera.id)}>
                {camera.label}
              </button>
            ))}
          </div>
        </section>

        <section className="kpis">
          <article>
            <span>Intensité moyenne</span>
            <strong>{averageIntensity}%</strong>
          </article>
          <article>
            <span>Points simulés</span>
            <strong>{harborLights.length}</strong>
          </article>
          <article>
            <span>Mode</span>
            <strong>{isNight ? 'Nocturne' : 'Diurne'}</strong>
          </article>
        </section>

        <p className="data-note">V1 : géométrie et points lumineux en cours de recalage sur les données réelles du port. Aucun équipement provisoire n’est présenté comme inventaire 2026.</p>
      </aside>

      {selected && (
        <aside className="light-card glass-panel">
          <button className="close" onClick={() => selectLight(null)} aria-label="Fermer">×</button>
          <p className="eyebrow">POINT LUMINEUX</p>
          <h2>{selected.id}</h2>
          <p>{selected.label}</p>
          <div className="light-meter">
            <span style={{ width: `${Math.round(intensityFor(selected, scenario) * 100)}%` }} />
          </div>
          <dl>
            <div><dt>Zone</dt><dd>{selected.zone}</dd></div>
            <div><dt>Intensité</dt><dd>{Math.round(intensityFor(selected, scenario) * 100)}%</dd></div>
            <div><dt>Puissance</dt><dd>{selected.basePowerW ? `${selected.basePowerW} W` : 'À confirmer'}</dd></div>
          </dl>
          <small>{selected.note}</small>
        </aside>
      )}

      <div className="hint glass-panel">Glisser pour tourner · molette pour zoomer · cliquer sur une lumière</div>
    </main>
  )
}
