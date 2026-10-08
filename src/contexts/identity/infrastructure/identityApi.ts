import { sessionSchema, type LoginRequestDto, type RegisterRequestDto, type SessionDto } from '@/shared/contracts'
import { request, requestVoid } from '@/shared/http'
import { UserId } from '@/shared/ids'
import type { Session } from '../domain/session'

/** Anti-corruption layer: DTO de sessão → aggregate `Session`. */
export function toSession(dto: SessionDto): Session {
  return {
    token: dto.token,
    expiresAt: new Date(dto.expiresAt),
    user: { id: UserId(dto.user.id), name: dto.user.name, email: dto.user.email, avatarUrl: dto.user.avatarUrl },
  }
}

export const identityApi = {
  async register(body: RegisterRequestDto): Promise<Session> {
    return toSession(await request(sessionSchema, { method: 'POST', url: '/auth/register', data: body }))
  },

  async login(body: LoginRequestDto): Promise<Session> {
    return toSession(await request(sessionSchema, { method: 'POST', url: '/auth/login', data: body }))
  },

  /** Usa explicitamente o token informado (sessão recuperada do storage). */
  async getSession(token: string, signal?: AbortSignal): Promise<Session> {
    return toSession(
      await request(sessionSchema, {
        method: 'GET',
        url: '/auth/session',
        headers: { Authorization: `Bearer ${token}` },
        signal,
      }),
    )
  },

  async logout(token: string): Promise<void> {
    await requestVoid({ method: 'POST', url: '/auth/logout', headers: { Authorization: `Bearer ${token}` } })
  },
}
