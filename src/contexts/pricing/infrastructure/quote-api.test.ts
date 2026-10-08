import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { pricingScenario } from '@/mocks/pricing-scenario'
import { Coupon, CouponError, type QuoteInput } from '../domain'
import { revalidateQuote } from '../application/revalidate-quote'
import { quoteApi } from './quote-api'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => pricingScenario.reset())
afterAll(() => server.close())

const input = (over: Partial<QuoteInput> = {}): QuoteInput => ({
  items: [
    { nftId: 'n1', editionId: 'e1', quantity: 3 },
    { nftId: 'n2', editionId: 'e1', quantity: 1 },
  ],
  coupon: null,
  network: 'ethereum',
  ...over,
})

describe('quoteApi', () => {
  it('cota com precisão decimal (0.1×3 + 0.2 = 0.5; + taxa 0.003)', async () => {
    const q = await quoteApi.quote(input())
    expect(q.subtotal.toString()).toBe('0.5')
    expect(q.networkFee.toString()).toBe('0.003')
    expect(q.total.toString()).toBe('0.503')
  })

  it('aplica cupom e recalcula; remover o cupom volta ao total anterior', async () => {
    const withCoupon = await quoteApi.quote(input({ coupon: Coupon.parse('promo10') }))
    expect(withCoupon.discount.toString()).toBe('0.05')
    expect(withCoupon.total.toString()).toBe('0.453')
    const without = await quoteApi.quote(input())
    expect(without.discount.isZero()).toBe(true)
  })

  it('a taxa depende da rede', async () => {
    const q = await quoteApi.quote(input({ network: 'polygon' }))
    expect(q.networkFee.toString()).toBe('0.0005')
  })

  it.each([
    ['NAOEXISTE', 'coupon_invalid'],
    ['VELHO20', 'coupon_expired'],
    ['RARO15', 'coupon_not_applicable'],
  ])('cupom %s → %s', async (code, expected) => {
    const err = await quoteApi.quote(input({ coupon: Coupon.parse(code) })).catch((e) => e)
    expect(err).toBeInstanceOf(CouponError)
    expect(err.code).toBe(expected)
  })

  it('destaca item indisponível', async () => {
    pricingScenario.set({ soldOut: true })
    const q = await quoteApi.quote(input())
    expect(q.issues).toContainEqual(expect.objectContaining({ kind: 'item_unavailable', nftId: 'n2' }))
  })

  it('cancela via AbortSignal', async () => {
    const ctrl = new AbortController()
    pricingScenario.set({ latencyMs: 50 })
    const p = quoteApi.quote(input(), { signal: ctrl.signal })
    ctrl.abort()
    await expect(p).rejects.toBeDefined()
  })
})

describe('revalidateQuote', () => {
  it('unchanged quando nada mudou', async () => {
    const reviewed = await quoteApi.quote(input())
    const r = await revalidateQuote(quoteApi, reviewed, input())
    expect(r.status).toBe('unchanged')
  })

  it('changed com diff quando o preço muda entre revisão e envio', async () => {
    const reviewed = await quoteApi.quote(input())
    pricingScenario.set({ priceChanged: true })
    const r = await revalidateQuote(quoteApi, reviewed, input())
    expect(r.status).toBe('changed')
    if (r.status === 'changed') {
      expect(r.diff.items).toContainEqual(expect.objectContaining({ nftId: 'n1', reason: 'price' }))
      expect(r.diff.money.map((m) => m.field)).toContain('total')
    }
  })
})
