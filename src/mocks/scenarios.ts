/** Cenários reproduzíveis. Seleção: ?scenario=<nome> (persistido) ou VITE_MOCK_SCENARIO. */
export const SCENARIOS = ['default', 'empty', 'slow', 'jittery', 'server-error', 'offline', 'flaky'] as const
export type Scenario = (typeof SCENARIOS)[number]

const KEY = 'mocks:scenario'

export function getScenario(): Scenario {
  try {
    const fromUrl = new URLSearchParams(location.search).get('scenario')
    if (fromUrl && (SCENARIOS as readonly string[]).includes(fromUrl)) {
      localStorage.setItem(KEY, fromUrl)
      return fromUrl as Scenario
    }
    const stored = localStorage.getItem(KEY)
    if (stored && (SCENARIOS as readonly string[]).includes(stored)) return stored as Scenario
  } catch {
    /* storage indisponível */
  }
  const env = import.meta.env.VITE_MOCK_SCENARIO as string | undefined
  return env && (SCENARIOS as readonly string[]).includes(env) ? (env as Scenario) : 'default'
}

export function resetScenario() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
