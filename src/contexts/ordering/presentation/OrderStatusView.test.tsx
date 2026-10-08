import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { quoteApi } from '@/contexts/pricing'
import { server } from '@/mocks/server'
import { ordersScenario } from '@/mocks/orders-scenario'
import { OrderingDepsProvider, type OrderEventHandlers, type OrderEvent } from '../application'
import { orderApi } from '../infrastructure'
import { OrderStatusView } from './OrderStatusView'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  ordersScenario.reset()
})
afterAll(() => server.close())

/** Fonte de eventos controlada pelo teste (o transporte Socket.IO real é coberto no E2E). */
function fakeEvents() {
  let handlers: OrderEventHandlers | null = null
  const unsubscribe = vi.fn()
  return {
    source: { subscribe: (_u: string, h: OrderEventHandlers) => ((handlers = h), unsubscribe) },
    emit: (e: OrderEvent) => act(() => handlers!.onEvent(e)),
    reconnect: () => act(() => handlers!.onReconnect()),
    setConnected: (c: boolean) => act(() => handlers!.onConnectionChange(c)),
    unsubscribe,
  }
}

async function createPendingOrder() {
  ordersScenario.set({ payment: 'hold' })
  const quote = await quoteApi.quote({ items: [{ nftId: 'n1', editionId: 'e1', quantity: 2 }], coupon: null, network: 'polygon' })
  return orderApi.create(
    { quoteId: quote.id, walletId: 'w_primary', walletAddress: '0x' + 'a'.repeat(40), network: 'polygon', collector: { fullName: 'Ana Souza', email: 'a@b.co' } },
    crypto.randomUUID(),
  )
}

function setup(orderId: string, events = fakeEvents()) {
  const removed: unknown[] = []
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onRetry = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <OrderingDepsProvider
        gateway={orderApi}
        quotes={quoteApi}
        events={events.source}
        cart={{ removePurchased: (_u, items) => void removed.push(items) }}
        store={{
          loadAttempt: () => null, saveAttempt: () => undefined, clearAttempt: () => undefined,
          isSettled: () => false, markSettled: () => undefined, loadDraft: () => null, saveDraft: () => undefined, clearAll: () => undefined,
        }}
      >
        <OrderStatusView userId="u1" orderId={orderId} onRetry={onRetry} onContinueShopping={() => undefined} />
      </OrderingDepsProvider>
    </QueryClientProvider>,
  )
  return { events, removed, onRetry }
}

const event = (o: Partial<OrderEvent> & { orderId: string }): OrderEvent => ({
  eventId: `e-${Math.random()}`,
  userId: 'u1',
  version: 2,
  occurredAt: new Date().toISOString(),
  status: 'confirmed',
  transactionRef: '0xfeedbeef',
  rejectionReason: null,
  ...o,
})

describe('OrderStatusView', () => {
  it('pendente → confirmado em tempo real; recibo do snapshot; remove só o comprado do carrinho', async () => {
    const order = await createPendingOrder()
    const { events, removed } = setup(order.id)
    expect(await screen.findByText(/Aguardando confirmação/)).toBeInTheDocument()
    expect(screen.queryByTestId('receipt-total')).not.toBeInTheDocument()

    await events.emit(event({ orderId: order.id }))
    expect(await screen.findByTestId('receipt-total')).toHaveTextContent('0.2005 ETH')
    expect(screen.getByTestId('transaction-ref')).toHaveTextContent('0xfeedbeef')
    expect(removed).toEqual([[{ nftId: 'n1', editionId: 'e1', quantity: 2 }]])
  })

  it('evento duplicado ou antigo não regride nem reaplica; terminal é imutável', async () => {
    const order = await createPendingOrder()
    const { events, removed } = setup(order.id)
    await screen.findByText(/Aguardando confirmação/)

    const confirm = event({ orderId: order.id, eventId: 'same', version: 3 })
    await events.emit(confirm)
    await events.emit(confirm) // duplicado
    await events.emit(event({ orderId: order.id, version: 2, status: 'rejected', transactionRef: null })) // antigo
    await events.emit(event({ orderId: order.id, version: 9, status: 'rejected', transactionRef: null })) // terminal imutável

    expect(await screen.findByTestId('receipt-total')).toBeInTheDocument()
    expect(screen.queryByText('Pagamento recusado')).not.toBeInTheDocument()
    expect(removed).toHaveLength(1)
  })

  it('ignora eventos de outro usuário', async () => {
    const order = await createPendingOrder()
    const { events } = setup(order.id)
    await screen.findByText(/Aguardando confirmação/)
    await events.emit(event({ orderId: order.id, userId: 'u2' }))
    expect(screen.getByText(/Aguardando confirmação/)).toBeInTheDocument()
  })

  it('recusado: mostra motivo, mantém itens no carrinho e oferece tentar de novo', async () => {
    const order = await createPendingOrder()
    const { events, removed, onRetry } = setup(order.id)
    await screen.findByText(/Aguardando confirmação/)
    await events.emit(event({ orderId: order.id, status: 'rejected', transactionRef: null, rejectionReason: 'Saldo insuficiente' }))
    expect(await screen.findByRole('heading', { name: 'Pagamento recusado' })).toHaveFocus()
    expect(screen.getByText(/Saldo insuficiente/)).toBeInTheDocument()
    expect(removed).toHaveLength(0)
    screen.getByRole('button', { name: 'Tentar novamente' }).click()
    expect(onRetry).toHaveBeenCalled()
  })

  it('indica reconexão e reconcilia via REST ao reconectar (pedido liquidado enquanto offline)', async () => {
    const order = await createPendingOrder()
    const { events } = setup(order.id)
    await screen.findByText(/Aguardando confirmação/)

    await events.setConnected(false)
    expect(screen.getByText(/Reconectando/)).toBeInTheDocument()

    // Pedido foi confirmado no servidor enquanto o socket estava fora.
    ordersScenario.set({ payment: 'confirm', settleDelayMs: 0 })
    const stored = JSON.parse(localStorage.getItem('mock:orders:u1')!)
    stored.orders[0].settleAt = Date.now() - 1
    stored.orders[0].settleTo = 'confirmed'
    localStorage.setItem('mock:orders:u1', JSON.stringify(stored))

    await events.setConnected(true)
    await events.reconnect()
    await waitFor(() => expect(screen.getByTestId('receipt-total')).toBeInTheDocument())
    expect(screen.queryByText(/Reconectando/)).not.toBeInTheDocument()
  })

  it('libera a subscription ao desmontar', async () => {
    const order = await createPendingOrder()
    const { events } = setup(order.id)
    await screen.findByText(/Aguardando confirmação/)
    cleanup()
    expect(events.unsubscribe).toHaveBeenCalled()
  })

  it('pedido inexistente: erro com saída', async () => {
    setup('ord_nao_existe')
    expect(await screen.findByRole('alert')).toHaveTextContent('Pedido não encontrado')
  })
})
