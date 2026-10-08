import type { QueryClient } from '@tanstack/react-query'
import { withUserChanges, type Session, type SessionUser } from '../domain/session'
import { identityKeys } from './session'

/** Reflete no cabeçalho alterações confirmadas do perfil (nome, e-mail, avatar). */
export function updateSessionUser(queryClient: QueryClient, changes: Partial<Omit<SessionUser, 'id'>>) {
  queryClient.setQueryData<Session | null>(identityKeys.session(), (session) =>
    session ? withUserChanges(session, changes) : session,
  )
}
