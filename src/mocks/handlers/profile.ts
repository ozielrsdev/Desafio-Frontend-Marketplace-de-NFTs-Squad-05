import {
  changePasswordRequestSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
  type ProfileDto,
} from '@/shared/contracts'
import { db } from '../db/store'
import type { MockUser } from '../db/schema'
import { apiError, noContent, ok, validationError } from '../engine/respond'
import { authedRoute, readJson } from '../engine/route'
import { clock } from '../lib/clock'
import { hashPassword, verifyPassword } from '../lib/password'

/** Profile — docs/specs/profile.md */

function toProfileDto(user: MockUser): ProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    website: user.website,
    avatarUrl: user.avatarUrl,
    updatedAt: user.updatedAt,
  }
}

function updateUser(userId: string, mutate: (user: MockUser) => void): MockUser {
  return db.write((draft) => {
    const user = draft.users.find((u) => u.id === userId)!
    mutate(user)
    user.updatedAt = clock.nowIso()
    return { ...user }
  })
}

export const profileHandlers = [
  authedRoute('GET', '/profile', ({ user }) => ok(toProfileDto(user))),

  authedRoute('PATCH', '/profile', async ({ request, user }) => {
    const parsed = updateProfileRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    const email = parsed.data.email.toLowerCase()
    if (db.read().users.some((u) => u.email === email && u.id !== user.id)) {
      return apiError(409, 'email_in_use', 'Este e-mail já pertence a outra conta.', {
        fields: { email: 'Este e-mail já pertence a outra conta.' },
      })
    }
    const updated = updateUser(user.id, (draft) => {
      draft.name = parsed.data.name.trim()
      draft.email = email
      draft.bio = parsed.data.bio
      draft.website = parsed.data.website
    })
    return ok(toProfileDto(updated))
  }),

  authedRoute('PUT', '/profile/avatar', async ({ request, user }) => {
    const parsed = updateAvatarRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return apiError(422, 'avatar_invalid', 'Imagem inválida. Use PNG, JPG ou WEBP de até 1 MB.', {
        fields: { avatar: 'Imagem inválida. Use PNG, JPG ou WEBP de até 1 MB.' },
      })
    }
    const updated = updateUser(user.id, (draft) => {
      draft.avatarUrl = parsed.data.dataUrl
    })
    return ok(toProfileDto(updated))
  }),

  authedRoute('POST', '/profile/password', async ({ request, user }) => {
    const parsed = changePasswordRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error.issues)
    if (!(await verifyPassword(parsed.data.currentPassword, user.salt, user.passwordHash))) {
      return apiError(422, 'wrong_password', 'A senha atual está incorreta.', {
        fields: { currentPassword: 'A senha atual está incorreta.' },
      })
    }
    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return validationError([{ path: ['newPassword'], message: 'A nova senha deve ser diferente da atual.' }])
    }
    const passwordHash = await hashPassword(parsed.data.newPassword, user.salt)
    updateUser(user.id, (draft) => {
      draft.passwordHash = passwordHash
    })
    return noContent()
  }),
]
