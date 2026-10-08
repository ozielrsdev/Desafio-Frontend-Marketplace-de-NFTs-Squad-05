import { Clock } from 'lucide-react'
import { usePendingOrders } from '../application'

/** Recuperação de pedido pendente após refresh/reconexão, sem criar nova compra. */
export function PendingOrderBanner({ userId, onOpen }: { userId: string; onOpen: (orderId: string) => void }) {
  const pending = usePendingOrders(userId)
  const order = pending.data?.[0]
  if (!order) return null
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning-bg p-3 text-warning">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Clock aria-hidden="true" size={18} /> Você tem um pedido aguardando confirmação.
      </p>
      <button type="button" onClick={() => onOpen(order.id)} className="min-h-11 cursor-pointer rounded-md border border-current px-4 text-sm font-semibold hover:bg-black/5">
        Retomar pedido
      </button>
    </div>
  )
}
