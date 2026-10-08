import { db } from '../db/store'
import type { MockUser } from '../db/schema'
import { clock } from '../lib/clock'
import { apiError } from './respond'

export type AuthResult = { ok: true; user: MockUser; token: string } | { ok: false; response: Response }

export function readBearer(request: Request): string | null {
  const header = request.headers.get('Authorization')
  const match = header?.match(/^Bearer (.+)$/)
  return match?.[1] ?? null
}

/** Resolve a sessão a partir do token. Sessão vencida → 401 session_expired. */
export function resolveToken(token: string | null): AuthResult {
  if (!token) return { ok: false, response: apiError(401, 'unauthenticated', 'Autenticação necessária.') }
  const session = db.read().sessions.find((s) => s.token === token)
  if (!session) return { ok: false, response: apiError(401, 'unauthenticated', 'Sessão inválida. Entre novamente.') }
  if (Date.parse(session.expiresAt) <= clock.now()) {
    return { ok: false, response: apiError(401, 'session_expired', 'Sua sessão expirou. Entre novamente.') }
  }
  const user = db.read().users.find((u) => u.id === session.userId)
  if (!user) return { ok: false, response: apiError(401, 'unauthenticated', 'Sessão inválida. Entre novamente.') }
  return { ok: true, user, token }
}

export function authenticate(request: Request): AuthResult {
  return resolveToken(readBearer(request))
}
