import { describe, expect, it } from 'vitest'
import { WalletAddress } from './wallet-address'
import { canPurchase, emptyWalletSet, listWallets, validateWalletDraft, type WalletSet } from './wallet-set'

const A = '0x' + 'a'.repeat(40)
const B = '0x' + 'b'.repeat(40)

const withPrimary: WalletSet = {
  primary: { id: 'w1', role: 'primary', address: WalletAddress.parse(A), network: 'ethereum' },
  secondary: null,
}

describe('WalletAddress', () => {
  it('aceita 0x + 40 hex e abrevia', () => {
    expect(WalletAddress.parse(A).abbreviated()).toBe('0xaaaa…aaaa')
  })
  it.each(['', '0x123', 'aaaa' + 'a'.repeat(38), '0x' + 'g'.repeat(40), '0x' + 'a'.repeat(41)])(
    'rejeita %s',
    (bad) => expect(() => WalletAddress.parse(bad)).toThrow(),
  )
  it('compara sem diferenciar maiúsculas', () => {
    expect(WalletAddress.parse('0x' + 'A'.repeat(40)).equals(WalletAddress.parse(A))).toBe(true)
  })
})

describe('WalletSet', () => {
  it('principal é obrigatória para comprar', () => {
    expect(canPurchase(emptyWalletSet)).toBe(false)
    expect(canPurchase(withPrimary)).toBe(true)
    expect(listWallets(withPrimary)).toHaveLength(1)
  })
})

describe('validateWalletDraft', () => {
  it('aceita rascunho válido', () => {
    const r = validateWalletDraft({ address: B, network: 'polygon' }, withPrimary, 'secondary')
    expect(r.ok).toBe(true)
  })
  it('endereço inválido e rede ausente → erros por campo', () => {
    const r = validateWalletDraft({ address: '0x1', network: '' }, emptyWalletSet, 'primary')
    expect(r).toMatchObject({ ok: false, errors: { address: expect.any(String), network: expect.any(String) } })
  })
  it('rede incompatível (fora da lista fechada)', () => {
    const r = validateWalletDraft({ address: B, network: 'solana' }, emptyWalletSet, 'primary')
    expect(r).toMatchObject({ ok: false, errors: { network: 'Rede não suportada.' } })
  })
  it('endereço duplicado na outra carteira (case-insensitive)', () => {
    const r = validateWalletDraft({ address: '0x' + 'A'.repeat(40), network: 'polygon' }, withPrimary, 'secondary')
    expect(r).toMatchObject({ ok: false, errors: { address: expect.stringContaining('já está cadastrado') } })
  })
  it('editar a própria carteira com o mesmo endereço é permitido', () => {
    const r = validateWalletDraft({ address: A, network: 'arbitrum' }, withPrimary, 'primary')
    expect(r.ok).toBe(true)
  })
})
