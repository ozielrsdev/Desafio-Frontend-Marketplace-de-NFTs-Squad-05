import { z } from 'zod'
import { idSchema, isoDateSchema } from './common'

/**
 * Identity — POST /auth/register, POST /auth/login, GET /auth/session, POST /auth/logout.
 * Credencial: header `Authorization: Bearer <token>` (token opaco com expiração).
 * Erros: 422 validation_error (por campo), 409 email_in_use, 401 invalid_credentials | session_expired | unauthenticated.
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

/** Senha forte: 8–72 caracteres, com ao menos uma letra e um número. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`)
  .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
  .regex(/\d/, 'A senha deve conter ao menos um número.')

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Informe ao menos 2 caracteres.')
  .max(60, 'Use no máximo 60 caracteres.')

export const emailSchema = z.email('Informe um e-mail válido.')

export const registerRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
})
export type LoginRequestDto = z.infer<typeof loginRequestSchema>

export const sessionUserSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
})
export type SessionUserDto = z.infer<typeof sessionUserSchema>

/** 201 (register), 200 (login, session). */
export const sessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDateSchema,
  user: sessionUserSchema,
})
export type SessionDto = z.infer<typeof sessionSchema>
