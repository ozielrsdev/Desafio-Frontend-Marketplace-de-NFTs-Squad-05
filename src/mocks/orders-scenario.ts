export interface OrdersScenario {
  /** Desfecho da simulação de pagamento: confirma, recusa ou mantém pendente (sem liquidar). */
  payment: 'confirm' | 'reject' | 'hold'
  /** Tempo até o pagamento ser liquidado e `order.updated` ser emitido. */
  settleDelayMs: number
  /**
   * Timeout após criar: o pedido É criado, mas a resposta nunca chega (uma vez). O reenvio
   * com a mesma `Idempotency-Key` recupera o mesmo pedido.
   */
  timeoutOnCreate: boolean
}

const DEFAULT: OrdersScenario = { payment: 'confirm', settleDelayMs: 1500, timeoutOnCreate: false }
let current: OrdersScenario = { ...DEFAULT }

export const ordersScenario = {
  get: (): OrdersScenario => current,
  set: (patch: Partial<OrdersScenario>) => {
    current = { ...current, ...patch }
  },
  reset: () => {
    current = { ...DEFAULT }
  },
}
