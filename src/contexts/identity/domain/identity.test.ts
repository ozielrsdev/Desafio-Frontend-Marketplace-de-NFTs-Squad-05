import { describe, expect, it } from 'vitest'
import { registerRequestSchema } from '@/shared/contracts'
import { UserId } from '@/shared/ids'
import { isEmail, normalizeEmail } from './email'
import { DEFAULT_RETURN_TO, safeReturnTo } from './returnTo'
import { isSessionExpired, msUntilExpiry, withUserChanges, type Session } from './session'

const session: Session = {
  token: 'tok',
  expiresAt: new Date('2026-10-07T12:00:00.000Z'),
  user: { id: UserId('usr_1'), name: 'Ana', email: 'ana@nft.test', avatarUrl: null },
}

describe('Session', () => {
  it('expira no instante de expiresAt', () => {
    expect(isSessionExpired(session, new Date('2026-10-07T11:59:59.999Z'))).toBe(false)
    expect(isSessionExpired(session, new Date('2026-10-07T12:00:00.000Z'))).toBe(true)
  })

  it('calcula o tempo restante sem ficar negativo', () => {
    expect(msUntilExpiry(session, new Date('2026-10-07T11:59:00.000Z'))).toBe(60_000)
    expect(msUntilExpiry(session, new Date('2026-10-08T00:00:00.000Z'))).toBe(0)
  })

  it('atualiza dados do usuário sem alterar credencial nem id', () => {
    const updated = withUserChanges(session, { name: 'Ana Maria' })
    expect(updated.user).toMatchObject({ id: 'usr_1', name: 'Ana Maria' })
    expect(updated.token).toBe('tok')
    expect(session.user.name).toBe('Ana')
  })
})

describe('Email', () => {
  it('normaliza e valida', () => {
    expect(normalizeEmail('  Ana@NFT.test ')).toBe('ana@nft.test')
    expect(isEmail('ana@nft.test')).toBe(true)
    expect(isEmail('ana@')).toBe(false)
  })
})

describe('safeReturnTo', () => {
  it('aceita caminhos internos preservando query e hash', () => {
    expect(safeReturnTo('/checkout?step=2#pagamento')).toBe('/checkout?step=2#pagamento')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', null, '/login', '/cadastro?x=1'])(
    'rejeita %s',
    (value) => {
      expect(safeReturnTo(value)).toBe(DEFAULT_RETURN_TO)
    },
  )
})

describe('regras de senha do contrato', () => {
  const base = { name: 'Ana', email: 'ana@nft.test' }

  it('exige letra, número e 8 caracteres', () => {
    expect(registerRequestSchema.safeParse({ ...base, password: 'abc12345' }).success).toBe(true)
    expect(registerRequestSchema.safeParse({ ...base, password: 'abcdefgh' }).success).toBe(false)
    expect(registerRequestSchema.safeParse({ ...base, password: '12345678' }).success).toBe(false)
    expect(registerRequestSchema.safeParse({ ...base, password: 'a1' }).success).toBe(false)
  })
})
