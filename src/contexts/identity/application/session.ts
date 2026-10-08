import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { isAppError } from '@/shared/errors'
import { onUnauthorized, setAuthTokenProvider } from '@/shared/http'
import type { UserId } from '@/shared/ids'
import { clearPrivateStorage } from '@/shared/storage'
import { isSessionExpired, msUntilExpiry, type Session } from '../domain/session'
import { credentialStore } from '../infrastructure/credentialStore'
import { identityApi } from '../infrastructure/identityApi'

/** Query keys de Identity. A sessão é a origem do `userId` usado nas keys privadas dos outros contextos. */
export const identityKeys = {
  all: ['identity'] as const,
  session: () => [...identityKeys.all, 'session'] as const,
}

/**
 * Sessão atual: `null` para visitante. Recupera a sessão após refresh validando o token salvo.
 * 401 na recuperação = sessão inválida/expirada → visitante (sem erro na UI).
 */
export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: identityKeys.session(),
    queryFn: async ({ signal }): Promise<Session | null> => {
      const token = credentialStore.token()
      if (!token) return null
      try {
        return await identityApi.getSession(token, signal)
      } catch (error) {
        if (isAppError(error) && error.kind === 'unauthenticated') {
          credentialStore.clear()
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60_000,
    retry: (count, error) => isAppError(error) && error.retryable && count < 2,
  })

// ---------------------------------------------------------------------------
// Ciclo de vida da sessão: outros contextos assinam (ex.: Cart faz merge do visitante no login,
// Realtime encerra o socket no logout, Ordering salva rascunho antes da expiração).
// ---------------------------------------------------------------------------
type SignedInListener = (session: Session) => void | Promise<void>
type SessionEndReason = 'logout' | 'expired' | 'switch'
type SessionEndListener = (info: { userId: UserId; reason: SessionEndReason }) => void

const signedInListeners = new Set<SignedInListener>()
const beforeEndListeners = new Set<SessionEndListener>()
const endedListeners = new Set<SessionEndListener>()

export const identityEvents = {
  /** Após login/cadastro bem-sucedido (cache já limpo se houve troca de usuário). */
  onSignedIn(listener: SignedInListener) {
    signedInListeners.add(listener)
    return () => void signedInListeners.delete(listener)
  },
  /** Antes de limpar o cache — última chance de persistir rascunhos por usuário. */
  onBeforeSessionEnd(listener: SessionEndListener) {
    beforeEndListeners.add(listener)
    return () => void beforeEndListeners.delete(listener)
  },
  /** Depois de encerrar a sessão (cache e storage privado já limpos): desconectar sockets, subscriptions etc. */
  onSessionEnded(listener: SessionEndListener) {
    endedListeners.add(listener)
    return () => void endedListeners.delete(listener)
  },
}

let client: QueryClient | null = null
let expiryTimer: ReturnType<typeof setTimeout> | null = null
let navigateToLogin: (reason: 'expired') => void = () => {}

function requireClient(): QueryClient {
  if (!client) throw new Error('[identity] installSessionLifecycle() não foi chamado')
  return client
}

export function getCurrentSession(): Session | null {
  return client?.getQueryData(identityKeys.session()) ?? null
}

export function getCurrentUserId(): UserId | null {
  return getCurrentSession()?.user.id ?? null
}

function scheduleExpiry(session: Session) {
  if (expiryTimer) clearTimeout(expiryTimer)
  // setTimeout aceita no máximo ~24,8 dias.
  const delay = Math.min(msUntilExpiry(session), 2_147_000_000)
  expiryTimer = setTimeout(() => {
    if (getCurrentSession()?.token === session.token) void expireSession()
  }, delay)
}

/** Caso de uso: inicia a sessão após login/cadastro. */
export async function startSession(session: Session) {
  const queryClient = requireClient()
  const previousUserId = getCurrentUserId() ?? credentialStore.lastUserId()
  if (previousUserId && previousUserId !== session.user.id) {
    // Troca de usuário no mesmo navegador: nada do anterior pode sobrar (README §3).
    beforeEndListeners.forEach((listener) => listener({ userId: previousUserId as UserId, reason: 'switch' }))
    queryClient.clear()
    clearPrivateStorage()
    endedListeners.forEach((listener) => listener({ userId: previousUserId as UserId, reason: 'switch' }))
  }
  credentialStore.save(session.token, session.expiresAt)
  credentialStore.setLastUserId(session.user.id)
  queryClient.setQueryData(identityKeys.session(), session)
  scheduleExpiry(session)
  for (const listener of signedInListeners) await listener(session)
}

/** Caso de uso: encerra a sessão (logout voluntário ou expiração). */
export async function endSession(reason: Exclude<SessionEndReason, 'switch'>) {
  const queryClient = requireClient()
  const session = getCurrentSession()
  const token = credentialStore.token()
  if (expiryTimer) clearTimeout(expiryTimer)

  if (session) beforeEndListeners.forEach((listener) => listener({ userId: session.user.id, reason }))
  credentialStore.clear()
  // Cancela tudo em voo antes de limpar, para nenhuma resposta antiga repovoar o cache.
  await queryClient.cancelQueries()
  queryClient.clear()
  queryClient.setQueryData(identityKeys.session(), null)
  // Expiração preserva o storage privado (rascunhos) do mesmo usuário; logout limpa tudo.
  if (reason === 'logout') clearPrivateStorage()
  if (session) endedListeners.forEach((listener) => listener({ userId: session.user.id, reason }))

  if (reason === 'logout' && token) {
    // Revogação no servidor é best effort: a sessão local já foi encerrada.
    await identityApi.logout(token).catch(() => undefined)
  }
}

let expiring = false
async function expireSession() {
  if (expiring || !getCurrentSession()) return
  expiring = true
  try {
    await endSession('expired')
    navigateToLogin('expired')
  } finally {
    expiring = false
  }
}

/**
 * Liga Identity à infraestrutura compartilhada (chamado uma vez na composição do app):
 * token no Axios, 401 → expiração, timer de expiração local.
 */
export function installSessionLifecycle(options: { queryClient: QueryClient; onExpired: (reason: 'expired') => void }) {
  client = options.queryClient
  navigateToLogin = options.onExpired
  setAuthTokenProvider(() => credentialStore.token())

  const stopUnauthorized = onUnauthorized((error, hadCredential) => {
    // Só trata como expiração se a requisição foi feita com credencial de uma sessão ativa.
    if (error.code === 'invalid_credentials') return
    if (hadCredential && getCurrentSession()) void expireSession()
  })

  const unsubscribeCache = client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.query.queryHash !== JSON.stringify(identityKeys.session())) return
    const session = event.query.state.data as Session | null | undefined
    if (session && !isSessionExpired(session)) scheduleExpiry(session)
  })

  return () => {
    stopUnauthorized()
    unsubscribeCache()
    if (expiryTimer) clearTimeout(expiryTimer)
  }
}
