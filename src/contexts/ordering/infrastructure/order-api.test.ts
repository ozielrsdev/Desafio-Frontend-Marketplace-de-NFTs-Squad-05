import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { quoteApi, StaleQuoteError, type QuoteInput } from '@/contexts/pricing'
import { server } from '@/mocks/server'
import { ordersScenario } from '@/mocks/orders-scenario'
import { pricingScenario } from '@/mocks/pricing-scenario'
import { submitCheckout, type OrderingDeps } from '../application'
import type { CollectorDetails, StoredAttempt } from '../domain'
import { orderApi } from './order-api'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => localStorage.clear())
afterEach(() => {
  pricingScenario.reset()
  ordersScenario.reset()
})
afterAll(() => server.close())

const input: QuoteInput = {
  items: [
    { nftId: 'n1', editionId: 'e1', quantity: 3 },
    { nftId: 'n2', editionId: 'e1', quantity: 1 },
  ],
  coupon: null,
  network: 'ethereum',
}
const collector: CollectorDetails = { fullName: 'Ana Souza', email: 'ana@exemplo.com' }
const wallet = { id: 'w_primary', address: '0x' + 'a'.repeat(40) }

function makeDeps() {
  let attempt: StoredAttempt | null = null
  const removed: unknown[] = []
  const deps: OrderingDeps = {
    gateway: orderApi,
    quotes: quoteApi,
    events: { subscribe: () => () => undefined },
    cart: { removePurchased: (_u, items) => void removed.push(items) },
    store: {
      loadAttempt: () => attempt,
      saveAttempt: (_u, a) => { attempt = a },
      clearAttempt: () => { attempt = null },
      isSettled: () => false,
      markSettled: () => undefined,
      loadDraft: () => null,
      saveDraft: () => undefined,
      clearAll: () => undefined,
    },
  }
  return { deps, removed, attempt: () => attempt }
}

const params = async () => ({
  userId: 'u1',
  reviewedQuote: await quoteApi.quote(input),
  quoteInput: input,
  wallet,
  collector,
})

describe('submitCheckout', () => {
  it('cria o pedido pendente com snapshot da cotação', async () => {
    const { deps, attempt } = makeDeps()
    const result = await submitCheckout(deps, await params())
    expect(result.kind).toBe('created')
    if (result.kind !== 'created') return
    expect(result.order).toMatchObject({ status: 'pending', version: 1 })
    expect(result.order.total.toString()).toBe('0.503')
    expect(attempt()).not.toBeNull()
  })

  it('cliques/reenvios com a mesma chave devolvem o MESMO pedido', async () => {
    const { deps } = makeDeps()
    const p = await params()
    const a = await submitCheckout(deps, p)
    const b = await submitCheckout(deps, p)
    expect(a.kind === 'created' && b.kind === 'created' && a.order.id === b.order.id).toBe(true)
  })

  it('preço alterado entre revisão e envio → quote_changed, sem criar pedido', async () => {
    const { deps } = makeDeps()
    const p = await params()
    pricingScenario.set({ priceChanged: true })
    const result = await submitCheckout(deps, p)
    expect(result.kind).toBe('quote_changed')
    if (result.kind === 'quote_changed') {
      expect(result.diff.items).toContainEqual(expect.objectContaining({ nftId: 'n1', reason: 'price' }))
      expect(result.blocked).toBe(false)
    }
    expect((await orderApi.listPending()).length).toBe(0)
  })

  it('edição esgotada → quote_changed bloqueado', async () => {
    const { deps } = makeDeps()
    const p = await params()
    pricingScenario.set({ soldOut: true })
    const result = await submitCheckout(deps, p)
    expect(result).toMatchObject({ kind: 'quote_changed', blocked: true })
  })

  it('após o usuário reconfirmar o novo valor, o pedido é criado com a cotação nova', async () => {
    const { deps } = makeDeps()
    const p = await params()
    pricingScenario.set({ priceChanged: true })
    const changed = await submitCheckout(deps, p)
    if (changed.kind !== 'quote_changed') throw new Error('esperava quote_changed')
    const created = await submitCheckout(deps, { ...p, reviewedQuote: changed.quote })
    expect(created.kind).toBe('created')
    if (created.kind === 'created') expect(created.order.total.toString()).toBe('0.653')
  })
})

describe('orderApi', () => {
  it('servidor rejeita (409 stale_quote) cotação obsoleta', async () => {
    const stale = await quoteApi.quote(input)
    pricingScenario.set({ priceChanged: true })
    await expect(
      orderApi.create(
        { quoteId: stale.id, walletId: wallet.id, walletAddress: wallet.address, network: 'ethereum', collector },
        crypto.randomUUID(),
      ),
    ).rejects.toBeInstanceOf(StaleQuoteError)
  })

  it('mesma chave com conteúdo diferente → 409 de idempotência', async () => {
    const quote = await quoteApi.quote(input)
    const key = crypto.randomUUID()
    const request = { quoteId: quote.id, walletId: wallet.id, walletAddress: wallet.address, network: 'ethereum' as const, collector }
    await orderApi.create(request, key)
    await expect(
      orderApi.create({ ...request, collector: { ...collector, email: 'outro@exemplo.com' } }, key),
    ).rejects.toMatchObject({ kind: 'availability_conflict', code: 'idempotency_conflict' })
  })

  it('pedido pendente é liquidado e recuperável por REST (retomada após refresh)', async () => {
    ordersScenario.set({ payment: 'confirm', settleDelayMs: 0 })
    const quote = await quoteApi.quote(input)
    const order = await orderApi.create(
      { quoteId: quote.id, walletId: wallet.id, walletAddress: wallet.address, network: 'ethereum', collector },
      crypto.randomUUID(),
    )
    await new Promise((r) => setTimeout(r, 20))
    const settled = await orderApi.get(order.id)
    expect(settled).toMatchObject({ status: 'confirmed', version: 2 })
    expect(settled.transactionRef).toMatch(/^0x/)
    expect(await orderApi.listPending()).toHaveLength(0)
  })

  it('pagamento recusado vira rejected com motivo', async () => {
    ordersScenario.set({ payment: 'reject', settleDelayMs: 0 })
    const quote = await quoteApi.quote(input)
    const order = await orderApi.create(
      { quoteId: quote.id, walletId: wallet.id, walletAddress: wallet.address, network: 'ethereum', collector },
      crypto.randomUUID(),
    )
    await new Promise((r) => setTimeout(r, 20))
    expect(await orderApi.get(order.id)).toMatchObject({ status: 'rejected', transactionRef: null })
  })

  it('pedido inexistente / de outro usuário → not_found', async () => {
    await expect(orderApi.get('ord_inexistente')).rejects.toMatchObject({ kind: 'not_found' })
  })
})
