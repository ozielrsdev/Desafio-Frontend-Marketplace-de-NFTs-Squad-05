import { loginRequestSchema, registerRequestSchema, type SessionDto } from '@/shared/contracts'
import { db } from '../db/store'
import type { MockSession, MockUser } from '../db/schema'
import { authenticate, readBearer } from '../engine/auth'
import { apiError, noContent, ok, validationError } from '../engine/respond'
import { readJson, route } from '../engine/route'
import { clock } from '../lib/clock'
import { createSalt, hashPassword, verifyPassword } from '../lib/password'
import { flags } from '../runtime'

/** Identity — docs/specs/identity.md */

export function toSessionDto(session: MockSession, user: MockUser): SessionDto {
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
  }
}

function openSession(userId: string): MockSession {
  const session: MockSession = {
    token: `tok_${crypto.randomUUID().replaceAll('-', '')}`,
    userId,
    expiresAt: new Date(clock.now() + flags().sessionTtlMs).toISOString(),
  }
  db.write((draft) => {
    // Remove sessões vencidas para o estado persistido não crescer indefinidamente.
    draft.sessions = draft.sessions.filter((s) => Date.parse(s.expiresAt) > clock.now())
    draft.sessions.push(session)
  })
  return session
}

export const identityHandlers = [
  route('POST', '/auth/register', async ({ request }) => {
    const parsed = registerRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    if (db.read().users.some((u) => u.email === normalizedEmail)) {
      return apiError(409, 'email_in_use', 'Este e-mail já está cadastrado.', {
        fields: { email: 'Este e-mail já está cadastrado. Entre na sua conta.' },
      })
    }
    const salt = createSalt()
    const now = clock.nowIso()
    const user: MockUser = {
      id: db.nextId('usr'),
      name: name.trim(),
      email: normalizedEmail,
      salt,
      passwordHash: await hashPassword(password, salt),
      bio: '',
      website: '',
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    }
    db.write((draft) => {
      draft.users.push(user)
      draft.favorites[user.id] = []
      draft.carts[user.id] = []
      draft.wallets[user.id] = { primary: null, secondary: null }
    })
    return ok(toSessionDto(openSession(user.id), user), 201)
  }),

  route('POST', '/auth/login', async ({ request }) => {
    const parsed = loginRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const user = db.read().users.find((u) => u.email === parsed.data.email.toLowerCase())
    // Mensagem única: não revela se o e-mail existe (docs/specs/identity.md, história 5).
    if (!user || !(await verifyPassword(parsed.data.password, user.salt, user.passwordHash))) {
      return apiError(401, 'invalid_credentials', 'E-mail ou senha incorretos.')
    }
    return ok(toSessionDto(openSession(user.id), user))
  }),

  route('GET', '/auth/session', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const session = db.read().sessions.find((s) => s.token === auth.token)!
    return ok(toSessionDto(session, auth.user))
  }),

  route('POST', '/auth/logout', ({ request }) => {
    const token = readBearer(request)
    if (token) {
      db.write((draft) => {
        draft.sessions = draft.sessions.filter((s) => s.token !== token)
      })
    }
    return noContent()
  }),
]
