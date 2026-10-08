import { describe, expect, it } from 'vitest'
import { Money } from '@/shared/money'
import { applyOrderUpdate, type Order } from './order'
import { resolveIdempotencyKey } from './idempotency-key'
import { validateCollector } from './collector'

const pending: Order = {
  id: 'o1',
  userId: 'u1',
  status: 'pending',
  version: 1,
  items: [],
  subtotal: Money.parse('0.5'),
  discount: Money.zero(),
  networkFee: Money.parse('0.003'),
  total: Money.parse('0.503'),
  appliedCoupon: null,
  walletAddress: '0x' + 'a'.repeat(40),
  network: 'ethereum',
  transactionRef: null,
  rejectionReason: null,
  createdAt: new Date(0),
}

const confirm = { status: 'confirmed', version: 2, transactionRef: '0xabc', rejectionReason: null } as const
const reject = { status: 'rejected', version: 2, transactionRef: null, rejectionReason: 'Saldo insuficiente' } as const

describe('Order state machine', () => {
  it('pending → confirmed com transactionRef', () => {
    const next = applyOrderUpdate(pending, confirm)
    expect(next).toMatchObject({ status: 'confirmed', version: 2, transactionRef: '0xabc' })
  })

  it('pending → rejected com motivo', () => {
    expect(applyOrderUpdate(pending, reject)).toMatchObject({ status: 'rejected', rejectionReason: 'Saldo insuficiente' })
  })

  it('confirmed sem transactionRef é ignorado', () => {
    expect(applyOrderUpdate(pending, { ...confirm, transactionRef: null })).toBe(pending)
  })

  it('terminais são imutáveis (confirmed não vira rejected, nem o contrário)', () => {
    const confirmed = applyOrderUpdate(pending, confirm)
    expect(applyOrderUpdate(confirmed, { ...reject, version: 9 })).toBe(confirmed)
    const rejected = applyOrderUpdate(pending, reject)
    expect(applyOrderUpdate(rejected, { ...confirm, version: 9 })).toBe(rejected)
  })

  it('evento duplicado ou antigo é ignorado (mesma instância)', () => {
    expect(applyOrderUpdate(pending, { ...confirm, version: 1 })).toBe(pending)
    expect(applyOrderUpdate(pending, { ...confirm, version: 0 })).toBe(pending)
  })

  it('pending → pending só avança a versão', () => {
    expect(applyOrderUpdate(pending, { status: 'pending', version: 3, transactionRef: null, rejectionReason: null })).toMatchObject({
      status: 'pending',
      version: 3,
    })
  })
})

describe('resolveIdempotencyKey', () => {
  it('reutiliza a chave quando o conteúdo é o mesmo (recuperar pedido após timeout)', () => {
    const first = resolveIdempotencyKey(null, 'fp1')
    expect(resolveIdempotencyKey(first, 'fp1')).toBe(first)
  })
  it('gera nova chave quando o conteúdo muda', () => {
    const first = resolveIdempotencyKey(null, 'fp1')
    const second = resolveIdempotencyKey(first, 'fp2')
    expect(second.key).not.toBe(first.key)
    expect(second.fingerprint).toBe('fp2')
  })
  it('gera UUIDs distintos', () => {
    expect(resolveIdempotencyKey(null, 'a').key).not.toBe(resolveIdempotencyKey(null, 'a').key)
  })
})

describe('validateCollector', () => {
  it('aceita dados válidos', () => {
    expect(validateCollector({ fullName: 'Ana Souza', email: 'ana@exemplo.com' })).toEqual({})
  })
  it('reporta erros por campo', () => {
    expect(validateCollector({ fullName: 'Ana', email: 'x' })).toEqual({
      fullName: expect.any(String),
      email: expect.any(String),
    })
    expect(validateCollector({ fullName: '', email: '' })).toMatchObject({ fullName: 'Informe seu nome completo.' })
  })
})
