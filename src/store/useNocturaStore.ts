import { create } from 'zustand'

export type Scenario = 'current' | 'eco' | 'biodiversity' | 'safety'
export type CameraMode = 'aerial' | 'harbor' | 'promenade'

const scenarioLabels: Record<Scenario, string> = {
  current: 'État actuel',
  eco: 'Éco',
  biodiversity: 'Biodiversité',
  safety: 'Activité / sécurité',
}

type NocturaState = {
  isNight: boolean
  scenario: Scenario
  cameraMode: CameraMode
  selectedLightId: string | null
  setNight: (value: boolean) => void
  setScenario: (value: Scenario) => void
  setCameraMode: (value: CameraMode) => void
  selectLight: (id: string | null) => void
}

export { scenarioLabels }

export const useNocturaStore = create<NocturaState>((set) => ({
  isNight: true,
  scenario: 'biodiversity',
  cameraMode: 'aerial',
  selectedLightId: null,
  setNight: (isNight) => set({ isNight }),
  setScenario: (scenario) => set({ scenario }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  selectLight: (selectedLightId) => set({ selectedLightId }),
}))
