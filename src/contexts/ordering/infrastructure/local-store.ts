import type { CollectorDetails, StoredAttempt } from '../domain'
import type { OrderLocalStore } from '../application/ports'

const key = (kind: string, userId: string) => `ordering:${kind}:${userId}`

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(k: string, value: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(value))
  } catch {
    /* storage indisponível: segue só em memória/REST */
  }
}

/** Armazenamento privado por usuário. `clearAll` deve rodar no logout / troca de usuário. */
export const orderLocalStore: OrderLocalStore = {
  loadAttempt: (u) => read<StoredAttempt>(key('attempt', u)),
  saveAttempt: (u, a) => write(key('attempt', u), a),
  clearAttempt: (u) => localStorage.removeItem(key('attempt', u)),
  isSettled: (u, id) => (read<string[]>(key('settled', u)) ?? []).includes(id),
  markSettled: (u, id) => write(key('settled', u), [...(read<string[]>(key('settled', u)) ?? []), id]),
  loadDraft: (u) => read<CollectorDetails>(key('draft', u)),
  saveDraft: (u, d) => write(key('draft', u), d),
  clearAll: (u) => {
    for (const kind of ['attempt', 'settled', 'draft']) localStorage.removeItem(key(kind, u))
  },
}
