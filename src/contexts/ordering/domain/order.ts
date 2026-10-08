import type { Money } from '@/shared/money'
import type { Network } from '@/shared/network'

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export interface OrderItem {
  nftId: string
  editionId: string
  title: string
  quantity: number
  unitPrice: Money
  lineTotal: Money
}

/**
 * Aggregate raiz. Os itens e valores são o **snapshot** do momento da compra: o recibo
 * é renderizado daqui, nunca do catálogo atual.
 */
export interface Order {
  readonly id: string
  readonly userId: string
  readonly status: OrderStatus
  readonly version: number
  readonly items: readonly OrderItem[]
  readonly subtotal: Money
  readonly discount: Money
  readonly networkFee: Money
  readonly total: Money
  readonly appliedCoupon: string | null
  readonly walletAddress: string
  readonly network: Network
  readonly transactionRef: string | null
  readonly rejectionReason: string | null
  readonly createdAt: Date
}

export interface OrderUpdate {
  status: OrderStatus
  version: number
  transactionRef: string | null
  rejectionReason: string | null
}

export const isTerminal = (status: OrderStatus): boolean => status !== 'pending'

/**
 * Máquina de estados: `pending → confirmed | rejected`. Estados terminais são imutáveis;
 * atualizações com `version` ≤ atual (duplicadas/antigas) são ignoradas; `confirmed`
 * exige `transactionRef`. Retorna a MESMA instância quando nada muda.
 */
export function applyOrderUpdate(order: Order, update: OrderUpdate): Order {
  if (isTerminal(order.status)) return order
  if (update.version <= order.version) return order
  if (update.status === 'pending') return { ...order, version: update.version }
  if (update.status === 'confirmed' && !update.transactionRef) return order
  return {
    ...order,
    status: update.status,
    version: update.version,
    transactionRef: update.status === 'confirmed' ? update.transactionRef : null,
    rejectionReason: update.status === 'rejected' ? (update.rejectionReason ?? 'Pagamento recusado') : null,
  }
}
