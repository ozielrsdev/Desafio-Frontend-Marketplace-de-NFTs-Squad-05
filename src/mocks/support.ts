/**
 * Utilitários de mock para contextos de compra. Quando o motor do Mocking (Dev 1: `db`,
 * persistência versionada, auth) entrar, estes helpers são substituídos por ele.
 */
export const DEFAULT_USER = 'u1'

/** Usuário da requisição: o Identity do mock deve derivá-lo do token; aqui, header ou padrão. */
export const userOf = (request: Request): string => request.headers.get('x-user-id') ?? DEFAULT_USER

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage indisponível: estado só em memória */
  }
}

export function clearMockStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('mock:'))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* noop */
  }
}
