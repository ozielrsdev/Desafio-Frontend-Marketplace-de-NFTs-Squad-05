import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import {
  SOCKET_EVENTS,
  type NftDto,
  type NftUpdatedEventDto,
  type OrderDto,
  type OrderUpdatedEventDto,
  type RealtimeEventDto,
} from '@/shared/contracts'
import { db } from '../db/store'
import { resolveToken } from '../engine/auth'
import { clock } from '../lib/clock'

/**
 * Servidor Socket.IO simulado com MSW + @mswjs/socket.io-binding (docs/specs/realtime.md).
 *
 * Transporte: apenas WebSocket (o cliente deve usar `transports: ['websocket']`), interceptado
 * na thread principal pelo MSW — não há servidor real nem long-polling. Sem rooms/namespaces
 * no binding: o roteamento por usuário é feito aqui, pelo token enviado no handshake.
 *
 * Mudanças de dados passam por `publish*`, que alteram o banco (REST) e emitem o evento — mantendo
 * REST e Socket.IO coerentes (README §6).
 */
// O MSW remove o prefixo `/socket.io/` do caminho antes de casar o handler: o link é a origem do app.
const SOCKET_ORIGIN = typeof window === 'undefined' ? 'ws://localhost' : window.location.origin.replace(/^http/, 'ws')
const socketLink = ws.link(`${SOCKET_ORIGIN}/`)

/** Engine.IO: servidor envia ping ("2"); sem ping em pingInterval + pingTimeout o cliente reconecta. */
const PING_INTERVAL_MS = 20_000
const EVENT_LOG_LIMIT = 50

interface Connection {
  id: number
  userId: string | null
  emit: (event: string, payload: unknown) => void
  close: () => void
}

const connections = new Map<number, Connection>()
const eventLog: RealtimeEventDto[] = []
let connectionSeq = 0
let online = true
let eventSeq = 0

function nextEventId() {
  eventSeq += 1
  return `evt_${clock.now().toString(36)}_${eventSeq}`
}

function record(event: RealtimeEventDto) {
  eventLog.push(event)
  if (eventLog.length > EVENT_LOG_LIMIT) eventLog.shift()
}

function deliver(event: RealtimeEventDto) {
  for (const connection of connections.values()) {
    if (event.type === SOCKET_EVENTS.orderUpdated) {
      const owner = db.read().orders.find((order) => order.id === event.resource.id)?.userId
      if (!owner || connection.userId !== owner) continue
    }
    connection.emit(event.type, event)
  }
}

export const socketHandlers = [
  socketLink.addEventListener('connection', ({ client, server }) => {
    if (!online) {
      client.close()
      return
    }
    const io = toSocketIo({ client, server } as Parameters<typeof toSocketIo>[0])
    const id = ++connectionSeq
    const connection: Connection = {
      id,
      userId: null,
      emit: (event, payload) => io.client.emit(event, payload),
      close: () => client.close(),
    }
    connections.set(id, connection)

    // Handshake do Socket.IO: "40{...auth}" carrega o token da sessão.
    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string' || !event.data.startsWith('40')) return
      try {
        const auth = JSON.parse(event.data.slice(2) || '{}') as { token?: string }
        const result = resolveToken(auth.token ?? null)
        connection.userId = result.ok ? result.user.id : null
      } catch {
        connection.userId = null
      }
    })

    const ping = setInterval(() => client.send('2'), PING_INTERVAL_MS)
    client.addEventListener('close', () => {
      clearInterval(ping)
      connections.delete(id)
    })
  }),
]

export const realtimeServer = {
  /**
   * Altera preço e/ou disponibilidade de um NFT no banco (versão + 1) e emite `nft.updated`.
   * Usado por cenários, painel de mocks e testes E2E.
   */
  publishNftUpdate(nftId: string, changes: { price?: string; editions?: Array<{ id: string; available: number }> }) {
    const nft = db.write((draft) => {
      const target = draft.nfts.find((n) => n.id === nftId)
      if (!target) return null
      if (changes.price !== undefined) target.price = changes.price
      for (const edition of changes.editions ?? []) {
        const current = target.editions.find((e) => e.id === edition.id)
        if (current) current.available = edition.available
      }
      target.version += 1
      return structuredClone(target) as NftDto
    })
    if (!nft) throw new Error(`[mocks] NFT inexistente: ${nftId}`)
    const event: NftUpdatedEventDto = {
      eventId: nextEventId(),
      type: SOCKET_EVENTS.nftUpdated,
      resource: { kind: 'nft', id: nft.id },
      version: nft.version,
      occurredAt: clock.nowIso(),
      payload: { price: nft.price, editions: nft.editions.map((e) => ({ id: e.id, available: e.available })) },
    }
    record(event)
    deliver(event)
    return event
  },

  /** Emite `order.updated` para o dono do pedido (Ordering chama após mudar o estado no banco). */
  publishOrderUpdate(order: OrderDto) {
    const event: OrderUpdatedEventDto = {
      eventId: nextEventId(),
      type: SOCKET_EVENTS.orderUpdated,
      resource: { kind: 'order', id: order.id },
      version: order.version,
      occurredAt: clock.nowIso(),
      payload: order,
    }
    record(event)
    deliver(event)
    return event
  },

  /** Reenvia um evento já emitido (duplicata) — por padrão o último. */
  replay(eventId?: string) {
    const event = eventId ? eventLog.find((e) => e.eventId === eventId) : eventLog.at(-1)
    if (event) deliver(event)
    return event ?? null
  },

  /** Emite um envelope arbitrário (ex.: evento antigo com versão menor). */
  emitRaw(event: RealtimeEventDto) {
    deliver(event)
  },

  /** Derruba todas as conexões; com `online=false` novas conexões são recusadas até `setOnline(true)`. */
  disconnectAll() {
    for (const connection of connections.values()) connection.close()
    connections.clear()
  },

  setOnline(value: boolean) {
    online = value
    if (!value) realtimeServer.disconnectAll()
  },

  /** Encerra conexões e limpa o histórico (reset de cenário). */
  reset() {
    realtimeServer.disconnectAll()
    eventLog.length = 0
    online = true
  },

  get connectionCount() {
    return connections.size
  },

  get events(): readonly RealtimeEventDto[] {
    return eventLog
  },
}
