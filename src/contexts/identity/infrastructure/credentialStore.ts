import { appStorage } from '@/shared/storage'

/**
 * Credencial da sessão persistida localmente para recuperar a sessão após refresh.
 * Guarda apenas o token opaco e a validade — nunca senha ou dados do perfil.
 * Lida sempre do storage (o reset dos mocks pode limpá-lo a qualquer momento).
 */
const KEY = 'session'
const LAST_USER_KEY = 'last-user'

interface StoredCredential {
  token: string
  expiresAt: string
}

export const credentialStore = {
  token(): string | null {
    return appStorage.get<StoredCredential>(KEY)?.token ?? null
  },
  save(token: string, expiresAt: Date) {
    appStorage.set(KEY, { token, expiresAt: expiresAt.toISOString() } satisfies StoredCredential)
  },
  clear() {
    appStorage.remove(KEY)
  },
  /** Último usuário autenticado neste dispositivo (detecta troca de usuário). */
  lastUserId(): string | null {
    return appStorage.get<string>(LAST_USER_KEY)
  },
  setLastUserId(userId: string) {
    appStorage.set(LAST_USER_KEY, userId)
  },
}
