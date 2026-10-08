import { describe, expect, it } from 'vitest'
import { changePasswordRequestSchema, updateProfileRequestSchema } from '@/shared/contracts'
import { validateAvatarFile } from './profile'

describe('validateAvatarFile', () => {
  it('aceita PNG/JPG/WEBP até 1 MB', () => {
    expect(validateAvatarFile({ type: 'image/png', size: 500_000 })).toEqual({ ok: true })
    expect(validateAvatarFile({ type: 'image/webp', size: 1_000_000 })).toEqual({ ok: true })
  })

  it('rejeita tipo não suportado, arquivo grande ou vazio', () => {
    expect(validateAvatarFile({ type: 'image/gif', size: 10 }).ok).toBe(false)
    expect(validateAvatarFile({ type: 'image/png', size: 1_000_001 }).ok).toBe(false)
    expect(validateAvatarFile({ type: 'image/png', size: 0 }).ok).toBe(false)
  })
})

describe('validadores de perfil', () => {
  const valid = { name: 'Ana', email: 'ana@nft.test', bio: '', website: '' }

  it('aceita site vazio ou URL http(s)', () => {
    expect(updateProfileRequestSchema.safeParse(valid).success).toBe(true)
    expect(updateProfileRequestSchema.safeParse({ ...valid, website: 'https://ana.dev' }).success).toBe(true)
    expect(updateProfileRequestSchema.safeParse({ ...valid, website: 'ftp://ana.dev' }).success).toBe(false)
  })

  it('rejeita nome curto e e-mail inválido', () => {
    expect(updateProfileRequestSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false)
    expect(updateProfileRequestSchema.safeParse({ ...valid, email: 'ana' }).success).toBe(false)
  })

  it('exige nova senha forte', () => {
    expect(changePasswordRequestSchema.safeParse({ currentPassword: 'x', newPassword: 'Nova1234' }).success).toBe(true)
    expect(changePasswordRequestSchema.safeParse({ currentPassword: 'x', newPassword: 'fraca' }).success).toBe(false)
  })
})
