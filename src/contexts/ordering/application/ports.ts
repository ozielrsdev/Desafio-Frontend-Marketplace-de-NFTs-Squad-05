import type { Network } from '@/shared/network'
import type { CollectorDetails, Order, OrderStatus, StoredAttempt } from '../domain'

export interface CreateOrderRequest {
  quoteId: string
  walletId: string
  walletAddress: string
  network: Network
  collector: CollectorDetails
}

/**
 * Port REST. `create` envia o header `Idempotency-Key`.
 * Lança StaleQuoteError (409 cotação obsoleta) ou AppError normalizado.
 */
export interface OrderGateway {
  create(request: CreateOrderRequest, idempotencyKey: string, options?: { signal?: AbortSignal }): Promise<Order>
  get(orderId: string, options?: { signal?: AbortSignal }): Promise<Order>
  listPending(options?: { signal?: AbortSignal }): Promise<Order[]>
}

/** Evento `order.updated` já traduzido para o domínio (o envelope fica na infraestrutura). */
export interface OrderEvent {
  eventId: string
  orderId: string
  userId: string
  version: number
  occurredAt: string
  status: OrderStatus
  transactionRef: string | null
  rejectionReason: string | null
}

export interface OrderEventHandlers {
  onEvent: (event: OrderEvent) => void
  /** Após queda de conexão: reconciliar via REST. */
  onReconnect: () => void
  onConnectionChange: (connected: boolean) => void
}

/** Port do Realtime (cliente Socket.IO único por sessão, na infraestrutura). */
export interface OrderEventSource {
  subscribe(userId: string, handlers: OrderEventHandlers): () => void
}

/** Cart é um contexto vizinho: Ordering só conhece esta porta, implementada na composição. */
export interface CartPort {
  removePurchased(userId: string, items: ReadonlyArray<{ nftId: string; editionId: string; quantity: number }>): void
}

/** Persistência local por usuário (chave de idempotência, rascunho, pedidos já liquidados). */
export interface OrderLocalStore {
  loadAttempt(userId: string): StoredAttempt | null
  saveAttempt(userId: string, attempt: StoredAttempt): void
  clearAttempt(userId: string): void
  isSettled(userId: string, orderId: string): boolean
  markSettled(userId: string, orderId: string): void
  loadDraft(userId: string): CollectorDetails | null
  saveDraft(userId: string, draft: CollectorDetails): void
  clearAll(userId: string): void
}
