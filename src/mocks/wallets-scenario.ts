export interface WalletsScenario {
  /** Resultado da simulação de conexão. */
  connection: 'accept' | 'refuse'
  latencyMs: number
}

const DEFAULT: WalletsScenario = { connection: 'accept', latencyMs: 0 }
let current: WalletsScenario = { ...DEFAULT }

export const walletsScenario = {
  get: (): WalletsScenario => current,
  set: (patch: Partial<WalletsScenario>) => {
    current = { ...current, ...patch }
  },
  reset: () => {
    current = { ...DEFAULT }
  },
}
