import { z } from 'zod'
import { idSchema, isoDateSchema } from './common'
import { emailSchema, nameSchema, passwordSchema } from './identity'

/**
 * Profile — GET /profile, PATCH /profile, PUT /profile/avatar, POST /profile/password (204).
 * 422 validation_error (por campo), 409 email_in_use, 422 wrong_password, 422 avatar_invalid.
 * Campos finais devem ser conferidos no Figma (docs/specs/profile.md).
 */
export const AVATAR_MAX_BYTES = 1_000_000
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const BIO_MAX_LENGTH = 280

export const profileSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.email(),
  bio: z.string(),
  website: z.string(),
  avatarUrl: z.string().nullable(),
  updatedAt: isoDateSchema,
})
export type ProfileDto = z.infer<typeof profileSchema>

export const updateProfileRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  bio: z.string().max(BIO_MAX_LENGTH, `Use no máximo ${BIO_MAX_LENGTH} caracteres.`),
  website: z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Informe uma URL válida (https://...).' })]),
})
export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>

/** Upload simulado: a imagem trafega como data URL (o mock persiste localmente). */
export const updateAvatarRequestSchema = z.object({
  dataUrl: z.string().startsWith('data:image/'),
  mimeType: z.enum(AVATAR_MIME_TYPES),
  size: z.number().int().min(1).max(AVATAR_MAX_BYTES),
})
export type UpdateAvatarRequestDto = z.infer<typeof updateAvatarRequestSchema>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: passwordSchema,
})
export type ChangePasswordRequestDto = z.infer<typeof changePasswordRequestSchema>
