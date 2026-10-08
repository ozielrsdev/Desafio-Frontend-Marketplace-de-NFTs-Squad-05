import { CheckCircle2 } from 'lucide-react'
import { forwardRef } from 'react'
import { NETWORK_LABEL } from '@/shared/network'
import type { Order } from '../domain'

const eth = (m: { format(): string }) => `${m.format()} ETH`

/** Recibo renderizado do SNAPSHOT do pedido — nunca do catálogo atual. */
export const OrderReceipt = forwardRef<HTMLHeadingElement, { order: Order }>(function OrderReceipt({ order }, headingRef) {
  return (
    <article aria-labelledby="receipt-title" className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-sm">
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 aria-hidden="true" size={20} /> Pagamento confirmado
        </p>
        <h1 id="receipt-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-offset-4">
          Compra concluída
        </h1>
        <p className="text-sm text-text-muted">
          Pedido <strong className="text-text">{order.id}</strong> ·{' '}
          {order.createdAt.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
      </header>

      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li key={`${item.nftId}:${item.editionId}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{item.title}</p>
              <p className="money text-sm text-text-muted">{item.quantity} × {eth(item.unitPrice)}</p>
            </div>
            <p className="money font-medium">{eth(item.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 text-sm">
        <Row label="Subtotal" value={eth(order.subtotal)} />
        <Row label={order.appliedCoupon ? `Desconto (${order.appliedCoupon})` : 'Desconto'} value={order.discount.isZero() ? eth(order.discount) : `− ${eth(order.discount)}`} />
        <Row label="Taxa de rede" value={eth(order.networkFee)} />
        <div className="flex items-baseline justify-between border-t border-border pt-3 text-lg font-bold">
          <dt>Total pago</dt>
          <dd className="money" data-testid="receipt-total">{eth(order.total)}</dd>
        </div>
      </dl>

      <dl className="space-y-2 rounded-md bg-surface-muted p-4 text-sm">
        <Row label="Rede" value={NETWORK_LABEL[order.network]} />
        <Row label="Carteira" value={`${order.walletAddress.slice(0, 6)}…${order.walletAddress.slice(-4)}`} />
        <div className="space-y-1">
          <dt className="text-text-muted">Identificação da transação (simulada)</dt>
          <dd className="money break-all font-medium" data-testid="transaction-ref">{order.transactionRef}</dd>
        </div>
      </dl>
    </article>
  )
})

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="money font-medium">{value}</dd>
    </div>
  )
}
