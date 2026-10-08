import { describe, expect, it } from 'vitest'
import { Money } from '@/shared/money'
import { Coupon } from './coupon'
import { canCheckout, createQuote, isExpired, unavailableItems, type Quote } from './quote'
import { diffQuotes } from './quote-diff'

const m = Money.parse
const future = new Date(Date.now() + 60_000)

const aurora = (unit: string, line: string) => ({
  nftId: 'n1', editionId: 'e1', title: 'Aurora', quantity: 3,
  unitPrice: m(unit), lineTotal: m(line), availableQuantity: 5,
})
const bruma = {
  nftId: 'n2', editionId: 'e1', title: 'Bruma', quantity: 1,
  unitPrice: m('0.2'), lineTotal: m('0.2'), availableQuantity: 1,
}

function makeQuote(over: Partial<Quote> = {}): Quote {
  return createQuote({
    id: 'q1',
    version: 1,
    expiresAt: future,
    items: [aurora('0.1', '0.3'), bruma],
    subtotal: m('0.5'),
    discount: m('0.05'),
    networkFee: m('0.003'),
    total: m('0.453'),
    appliedCoupon: 'PROMO10',
    issues: [],
    ...over,
  })
}

describe('createQuote', () => {
  it('aceita cotação consistente (0.1×3 + 0.2 = 0.5, sem erro de float)', () => {
    expect(makeQuote().total.toString()).toBe('0.453')
  })
  it('rejeita subtotal divergente', () => {
    expect(() => makeQuote({ subtotal: m('0.6'), total: m('0.553') })).toThrow(/subtotal/)
  })
  it('rejeita total divergente', () => {
    expect(() => makeQuote({ total: m('0.45') })).toThrow(/total/)
  })
  it('rejeita desconto maior que o subtotal', () => {
    expect(() => makeQuote({ discount: m('0.6'), total: m('-0.097') })).toThrow(/desconto/)
  })
})

describe('canCheckout', () => {
  it('permite cotação vigente e sem problemas', () => expect(canCheckout(makeQuote())).toBe(true))
  it('bloqueia cotação expirada', () => {
    const q = makeQuote({ expiresAt: new Date(Date.now() - 1) })
    expect(isExpired(q)).toBe(true)
    expect(canCheckout(q)).toBe(false)
  })
  it('bloqueia com item indisponível e o destaca', () => {
    const q = makeQuote({
      issues: [{ kind: 'item_unavailable', nftId: 'n2', editionId: 'e1', availableQuantity: 0 }],
    })
    expect(canCheckout(q)).toBe(false)
    expect(unavailableItems(q).map((i) => i.nftId)).toEqual(['n2'])
  })
})

describe('diffQuotes', () => {
  it('sem mudanças', () => expect(diffQuotes(makeQuote(), makeQuote()).changed).toBe(false))
  it('detecta mudança de preço e de total', () => {
    const next = makeQuote({
      items: [aurora('0.15', '0.45'), bruma],
      subtotal: m('0.65'),
      total: m('0.603'),
    })
    const d = diffQuotes(makeQuote(), next)
    expect(d.changed).toBe(true)
    expect(d.money.map((c) => c.field)).toEqual(['subtotal', 'total'])
    expect(d.items).toEqual([{ nftId: 'n1', editionId: 'e1', title: 'Aurora', reason: 'price' }])
  })
  it('detecta item removido', () => {
    const next = makeQuote({
      items: [aurora('0.1', '0.3')],
      subtotal: m('0.3'),
      discount: m('0'),
      total: m('0.303'),
    })
    expect(diffQuotes(makeQuote(), next).items).toContainEqual(
      expect.objectContaining({ nftId: 'n2', reason: 'removed' }),
    )
  })
})

describe('Coupon', () => {
  it('normaliza para maiúsculas', () => expect(Coupon.parse(' promo10 ').code).toBe('PROMO10'))
  it('rejeita formato inválido', () => {
    expect(Coupon.tryParse('a')).toBeNull()
    expect(Coupon.tryParse('com espaço')).toBeNull()
  })
})
