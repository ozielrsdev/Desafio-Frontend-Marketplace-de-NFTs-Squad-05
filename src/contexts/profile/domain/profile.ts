import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/shared/contracts'
import type { UserId } from '@/shared/ids'

/** Entidade `CollectorProfile` (docs/specs/profile.md). Senha nunca faz parte da entidade. */
export interface CollectorProfile {
  id: UserId
  name: string
  email: string
  bio: string
  website: string
  avatarUrl: string | null
  updatedAt: Date
}

export type AvatarValidation = { ok: true } | { ok: false; message: string }

/** Regras de avatar: tipos PNG/JPG/WEBP e até 1 MB. */
export function validateAvatarFile(file: { type: string; size: number }): AvatarValidation {
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'Formato não suportado. Use PNG, JPG ou WEBP.' }
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, message: `A imagem deve ter no máximo ${Math.round(AVATAR_MAX_BYTES / 1_000_000)} MB.` }
  }
  if (file.size === 0) return { ok: false, message: 'O arquivo está vazio.' }
  return { ok: true }
}
