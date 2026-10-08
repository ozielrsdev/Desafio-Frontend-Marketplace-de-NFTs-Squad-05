import { couponFixtures, networkFeeFixtures, walletFixtures } from '../fixtures/commerce'
import { buildNftFixtures } from '../fixtures/nfts'
import { FIXTURE_CREATED_AT, userFixtures } from '../fixtures/users'
import { hashPassword } from '../lib/password'
import { MOCK_SCHEMA_VERSION, type MockDbState } from './schema'

/**
 * Repositório em memória do backend simulado, persistido em localStorage para sobreviver a refresh.
 * `reset()` restaura integralmente um estado conhecido (README §6).
 */
export const DB_STORAGE_KEY = 'nftm-mock:db'

let state: MockDbState | null = null

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Estado inicial determinístico (mesmo resultado a cada chamada). */
export async function createSeedState(): Promise<MockDbState> {
  const users = await Promise.all(
    userFixtures.map(async (fixture) => ({
      id: fixture.id,
      name: fixture.name,
      email: fixture.email,
      salt: fixture.salt,
      passwordHash: await hashPassword(fixture.password, fixture.salt),
      bio: fixture.bio,
      website: fixture.website,
      avatarUrl: null,
      createdAt: FIXTURE_CREATED_AT,
      updatedAt: FIXTURE_CREATED_AT,
    })),
  )
  return {
    schemaVersion: MOCK_SCHEMA_VERSION,
    sequence: 1000,
    users,
    sessions: [],
    nfts: buildNftFixtures(),
    // Ana já tem favoritos para o fluxo de recuperação após login.
    favorites: { usr_ana: ['nft_02', 'nft_05'], usr_bruno: [] },
    carts: { usr_ana: [], usr_bruno: [] },
    coupons: structuredClone(couponFixtures),
    quotes: {},
    orders: [],
    idempotency: {},
    wallets: walletFixtures(FIXTURE_CREATED_AT),
    networkFees: { ...networkFeeFixtures },
  }
}

function persist() {
  if (!state) return
  try {
    storage()?.setItem(DB_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota excedida (ex.: muitos avatares): o estado segue em memória.
  }
}

function loadPersisted(): MockDbState | null {
  const raw = storage()?.getItem(DB_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as MockDbState
    return parsed.schemaVersion === MOCK_SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

export const db = {
  /** Carrega o estado persistido ou cria o seed. Chamado no bootstrap dos mocks. */
  async init(seedMutator?: (state: MockDbState) => void): Promise<void> {
    const persisted = loadPersisted()
    if (persisted) {
      state = persisted
      return
    }
    await db.reset(seedMutator)
  },

  /** Restaura o estado conhecido e persiste. `seedMutator` aplica ajustes do cenário ativo. */
  async reset(seedMutator?: (state: MockDbState) => void): Promise<void> {
    const seed = await createSeedState()
    seedMutator?.(seed)
    state = seed
    persist()
  },

  read(): Readonly<MockDbState> {
    if (!state) throw new Error('[mocks] db não inicializado — chame db.init()')
    return state
  },

  /** Única porta de escrita: altera e persiste. */
  write<T>(mutate: (draft: MockDbState) => T): T {
    if (!state) throw new Error('[mocks] db não inicializado — chame db.init()')
    const result = mutate(state)
    persist()
    return result
  },

  /** ID determinístico e legível (ex.: `ord_1001`). */
  nextId(prefix: string): string {
    return db.write((draft) => {
      draft.sequence += 1
      return `${prefix}_${draft.sequence}`
    })
  },

  /** Remove o estado persistido (usado pelo reset completo). */
  clearPersisted() {
    storage()?.removeItem(DB_STORAGE_KEY)
  },
}
