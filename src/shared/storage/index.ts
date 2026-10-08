/**
 * Storage local com namespaces:
 *  - `nftm:guest:*`  dados do visitante (ex.: carrinho local);
 *  - `nftm:u:<userId>:*` dados privados por usuário (ex.: rascunho de checkout);
 *  - `nftm:session` credencial da sessão atual.
 * `clearPrivateStorage()` é chamado no logout/troca de usuário (AGENTS.md §4).
 */
const PREFIX = 'nftm:'
const PRIVATE_PREFIX = `${PREFIX}u:`

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function read<T>(key: string): T | null {
  const raw = safeStorage()?.getItem(key)
  if (raw == null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    safeStorage()?.setItem(key, JSON.stringify(value))
  } catch {
    // Quota cheia ou storage bloqueado: dado local é conveniência, não fonte de verdade.
  }
}

function remove(key: string) {
  safeStorage()?.removeItem(key)
}

export const appStorage = {
  get: <T>(key: string) => read<T>(`${PREFIX}${key}`),
  set: (key: string, value: unknown) => write(`${PREFIX}${key}`, value),
  remove: (key: string) => remove(`${PREFIX}${key}`),
}

export const guestStorage = {
  get: <T>(key: string) => read<T>(`${PREFIX}guest:${key}`),
  set: (key: string, value: unknown) => write(`${PREFIX}guest:${key}`, value),
  remove: (key: string) => remove(`${PREFIX}guest:${key}`),
}

export function privateStorage(userId: string) {
  const ns = `${PRIVATE_PREFIX}${userId}:`
  return {
    get: <T>(key: string) => read<T>(`${ns}${key}`),
    set: (key: string, value: unknown) => write(`${ns}${key}`, value),
    remove: (key: string) => remove(`${ns}${key}`),
  }
}

/** Remove todos os dados privados de todos os usuários deste dispositivo. */
export function clearPrivateStorage() {
  const storage = safeStorage()
  if (!storage) return
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(PRIVATE_PREFIX)) keys.push(key)
  }
  keys.forEach((key) => storage.removeItem(key))
}
