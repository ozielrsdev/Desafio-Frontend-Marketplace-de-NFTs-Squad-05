import type { UserId } from '@/shared/ids'

/**
 * Aggregate `Session` (docs/specs/identity.md). Nunca contém senha.
 * O token é opaco: o domínio só se importa com dono e validade.
 */
export interface SessionUser {
  id: UserId
  name: string
  email: string
  avatarUrl: string | null
}

export interface Session {
  token: string
  expiresAt: Date
  user: SessionUser
}

export function isSessionExpired(session: Pick<Session, 'expiresAt'>, now: Date = new Date()): boolean {
  return session.expiresAt.getTime() <= now.getTime()
}

/** Milissegundos até expirar (0 se já expirou). */
export function msUntilExpiry(session: Pick<Session, 'expiresAt'>, now: Date = new Date()): number {
  return Math.max(0, session.expiresAt.getTime() - now.getTime())
}

/** Atualiza os dados exibidos do usuário (ex.: após editar o perfil) sem tocar na credencial. */
export function withUserChanges(session: Session, changes: Partial<Omit<SessionUser, 'id'>>): Session {
  return { ...session, user: { ...session.user, ...changes } }
}
