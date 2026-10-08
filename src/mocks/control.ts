import type { MockDbState } from './db/schema'
import { db, DB_STORAGE_KEY } from './db/store'
import { clock } from './lib/clock'
import {
  activateScenario,
  addFailure,
  clearFailures,
  currentScenario,
  flags,
  SCENARIO_STORAGE_KEY,
  setFlags,
  setLatency,
} from './runtime'
import { scenarios, type FailureRule, type ScenarioFlags } from './scenarios'
import { realtimeServer } from './socket/server'

/**
 * API de controle do mock (docs/specs/mocking.md, história 15): testes e o painel acionam
 * cenários, reset, relógio, falhas e eventos SEM tocar na UI. Exposta em `window.__mocks`.
 */
const APP_STORAGE_PREFIX = 'nftm:'

/** Remove o estado do app no navegador (sessão, carrinho de visitante, dados privados). */
function clearAppStorage() {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(APP_STORAGE_PREFIX)) keys.push(key)
    }
    keys.forEach((key) => window.localStorage.removeItem(key))
    window.sessionStorage.clear()
  } catch {
    // storage indisponível
  }
}

export const mockControl = {
  scenarios: () => scenarios.map(({ id, label, description }) => ({ id, label, description })),
  scenario: () => currentScenario().id,

  /** Troca o cenário e restaura o estado conhecido (reset completo). */
  async setScenario(id: string) {
    const scenario = activateScenario(id)
    await mockControl.reset({ keepScenario: true })
    return scenario.id
  },

  /** Restaura integralmente o cenário ativo: banco, storage do app, relógio, socket. */
  async reset(options: { keepScenario?: boolean } = {}) {
    if (!options.keepScenario) activateScenario(currentScenario().id)
    clock.reset()
    realtimeServer.reset()
    clearAppStorage()
    db.clearPersisted()
    await db.reset(currentScenario().seed)
  },

  setLatency,
  flags,
  setFlags: (overrides: Partial<ScenarioFlags>) => setFlags(overrides),
  addFailure: (rule: FailureRule) => addFailure(rule),
  clearFailures,
  clock: {
    advance: (ms: number) => clock.advance(ms),
    now: () => clock.nowIso(),
  },
  /** Expira imediatamente todas as sessões (expiração durante navegação/checkout). */
  expireSessions() {
    db.write((draft) => {
      draft.sessions = draft.sessions.map((session) => ({ ...session, expiresAt: new Date(clock.now() - 1000).toISOString() }))
    })
  },
  realtime: realtimeServer,
  /**
   * Cliente `socket.io-client` real para testes da infraestrutura do mock (o app usa o seu próprio cliente).
   * Passa pelo mesmo interceptador MSW que o app.
   */
  async connectTestClient(options: { token?: string } = {}) {
    const { io } = await import('socket.io-client')
    const socket = io({ transports: ['websocket'], auth: options.token ? { token: options.token } : {}, forceNew: true })
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve())
      socket.once('connect_error', reject)
    })
    return socket
  },
  db: {
    read: () => structuredClone(db.read()),
    /** Escrita direta para preparar cenários em testes (ex.: inserir um pedido de outro usuário). */
    mutate: <T>(mutate: (draft: MockDbState) => T) => db.write(mutate),
  },
  storageKeys: { db: DB_STORAGE_KEY, scenario: SCENARIO_STORAGE_KEY },
}

export type MockControl = typeof mockControl

declare global {
  interface Window {
    __mocks?: MockControl
  }
}
