import { delay, http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { createOrderRequestDto, type OrderDto, type OrderEventDto } from '@/contexts/ordering/infrastructure/dto'
import { loadJson, saveJson, userOf } from '../support'
import { ordersScenario } from '../orders-scenario'
import { getIssuedQuote, isQuoteCurrent } from './pricing'

interface StoredOrder extends OrderDto {
  /** Instante em que o pagamento é liquidado; null = mantido pendente. */
  settleAt: number | null
  settleTo: 'confirmed' | 'rejected'
}
interface Db {
  orders: StoredOrder[]
  idempotency: Record<string, { hash: string; orderId: string }>
}

const storageKey = (user: string) => `mock:orders:${user}`
const read = (user: string) => loadJson<Db>(storageKey(user), { orders: [], idempotency: {} })
const write = (user: string, db: Db) => saveJson(storageKey(user), db)
const toDto = ({ settleAt: _a, settleTo: _b, ...dto }: StoredOrder): OrderDto => dto

/* ── Socket.IO simulado (@mswjs/socket.io-binding) ───────────────────────────────────── */

const orderSocket = ws.link(/.*\/socket\.io\/.*/)
const clients = new Set<{ io: ReturnType<typeof toSocketIo>; close: () => void }>()
let eventCounter = 0

/** Emite `order.updated` para todos os clientes conectados (o filtro por usuário é do cliente). */
export function emitOrderEvent(envelope: OrderEventDto) {
  clients.forEach(({ io }) => io.client.emit('order.updated', envelope))
}

/** Derruba as conexões; o cliente Socket.IO reconecta sozinho. */
export function dropSocketConnections() {
  clients.forEach(({ close }) => close())
  clients.clear()
}

function eventFor(order: StoredOrder): OrderEventDto {
  eventCounter += 1
  return {
    eventId: `evt_${Date.now()}_${eventCounter}`,
    type: 'order.updated',
    resource: { kind: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    payload: {
      userId: order.userId,
      status: order.status,
      transactionRef: order.transactionRef,
      rejectionReason: order.rejectionReason,
    },
  }
}

/* ── Liquidação do pagamento ─────────────────────────────────────────────────────────── */

function settle(user: string, orderId: string) {
  const db = read(user)
  const order = db.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return
  order.status = order.settleTo
  order.version += 1
  order.settleAt = null
  if (order.settleTo === 'confirmed') {
    order.transactionRef = `0x${order.id.replace(/\D/g, '').padStart(8, '0').repeat(8).slice(0, 64)}`
  } else {
    order.rejectionReason = 'Pagamento recusado pela carteira.'
  }
  write(user, db)
  emitOrderEvent(eventFor(order))
}

/** Recuperação após refresh: pedidos cujo prazo venceu enquanto a página estava fechada. */
function settleOverdue(user: string) {
  const now = Date.now()
  for (const o of read(user).orders) if (o.status === 'pending' && o.settleAt !== null && o.settleAt <= now) settle(user, o.id)
}

/* ── REST ────────────────────────────────────────────────────────────────────────────── */

export const orderHandlers = [
  orderSocket.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const entry = { io, close: () => connection.client.close(1001, 'mock-drop') }
    clients.add(entry)
    connection.client.addEventListener('close', () => clients.delete(entry))
  }),

  http.post('/api/orders', async ({ request }) => {
    const user = userOf(request)
    const key = request.headers.get('Idempotency-Key')
    if (!key) return HttpResponse.json({ code: 'validation', message: 'Idempotency-Key obrigatório' }, { status: 400 })
    const body = createOrderRequestDto.safeParse(await request.json())
    if (!body.success) return HttpResponse.json({ code: 'validation', message: 'Requisição inválida' }, { status: 422 })

    const quote = getIssuedQuote(body.data.quoteId)
    // O hash identifica a intenção de compra (não o quoteId, que muda a cada revalidação).
    const hash = JSON.stringify({
      wallet: body.data.walletId,
      network: body.data.network,
      collector: body.data.collector,
      items: quote?.items.map((i) => [i.nftId, i.editionId, i.quantity]) ?? null,
      coupon: quote?.appliedCoupon ?? null,
    })

    const db = read(user)
    const known = db.idempotency[key]
    if (known) {
      if (known.hash !== hash) {
        return HttpResponse.json({ code: 'idempotency_conflict', message: 'Chave reutilizada com conteúdo diferente' }, { status: 409 })
      }
      const existing = db.orders.find((o) => o.id === known.orderId)!
      return HttpResponse.json(toDto(existing), { status: 200 })
    }

    if (!quote || !isQuoteCurrent(quote.quoteId)) {
      return HttpResponse.json({ code: 'stale_quote', message: 'Cotação desatualizada' }, { status: 409 })
    }
    if (quote.issues.some((i) => i.type === 'item_unavailable')) {
      return HttpResponse.json({ code: 'availability_conflict', message: 'Item indisponível' }, { status: 409 })
    }

    const scenario = ordersScenario.get()
    const order: StoredOrder = {
      id: `ord_${Date.now().toString(36)}${db.orders.length}`,
      userId: user,
      status: 'pending',
      version: 1,
      items: quote.items.map(({ availableQuantity: _a, ...i }) => i),
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      appliedCoupon: quote.appliedCoupon,
      walletAddress: body.data.walletAddress,
      network: body.data.network,
      transactionRef: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      settleAt: scenario.payment === 'hold' ? null : Date.now() + scenario.settleDelayMs,
      settleTo: scenario.payment === 'reject' ? 'rejected' : 'confirmed',
    }
    db.orders.push(order)
    db.idempotency[key] = { hash, orderId: order.id }
    write(user, db)
    if (order.settleAt !== null) setTimeout(() => settle(user, order.id), scenario.settleDelayMs)

    if (scenario.timeoutOnCreate) {
      ordersScenario.set({ timeoutOnCreate: false })
      await delay('infinite')
    }
    return HttpResponse.json(toDto(order), { status: 201 })
  }),

  http.get('/api/orders', ({ request }) => {
    const user = userOf(request)
    settleOverdue(user)
    const status = new URL(request.url).searchParams.get('status')
    const orders = read(user).orders.filter((o) => !status || o.status === status)
    return HttpResponse.json({ orders: orders.map(toDto) })
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
    const user = userOf(request)
    settleOverdue(user)
    // Pedido de outro usuário é indistinguível de inexistente (404).
    const order = read(user).orders.find((o) => o.id === params.id)
    if (!order) return HttpResponse.json({ code: 'not_found', message: 'Pedido não encontrado' }, { status: 404 })
    return HttpResponse.json(toDto(order))
  }),
]
