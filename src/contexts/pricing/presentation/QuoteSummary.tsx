import { AlertTriangle, TicketPercent } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { unavailableItems, type Quote } from '../domain'
import { formatEth } from './format'
import { QuoteSummarySkeleton } from './Skeleton'

interface Props {
  quote: Quote | undefined
  isLoading: boolean
  isRefetching: boolean
  error: Error | null
  onRetry: () => void
}

export function QuoteSummary({ quote, isLoading, isRefetching, error, onRetry }: Props) {
  const announcement = useTotalAnnouncement(quote)

  if (isLoading) {
    return (
      <section aria-labelledby="quote-title" aria-busy="true">
        <h2 id="quote-title" className="mb-4 text-lg font-semibold">Resumo do pedido</h2>
        <QuoteSummarySkeleton />
      </section>
    )
  }

  if (error && !quote) {
    return (
      <section aria-labelledby="quote-title">
        <h2 id="quote-title" className="mb-4 text-lg font-semibold">Resumo do pedido</h2>
        <div role="alert" className="rounded-card border border-danger bg-danger-bg p-4 text-danger">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle aria-hidden="true" size={20} /> Não foi possível calcular o total.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-11 cursor-pointer rounded-md border border-danger px-4 font-medium hover:bg-danger/10"
          >
            Tentar novamente
          </button>
        </div>
      </section>
    )
  }

  if (!quote) return null
  const unavailable = new Set(unavailableItems(quote).map((i) => `${i.nftId}:${i.editionId}`))

  return (
    <section aria-labelledby="quote-title" aria-busy={isRefetching} className="space-y-4">
      <h2 id="quote-title" className="text-lg font-semibold">Resumo do pedido</h2>
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <ul className="divide-y divide-border">
        {quote.items.map((item) => {
          const isOut = unavailable.has(`${item.nftId}:${item.editionId}`)
          return (
            <li
              key={`${item.nftId}:${item.editionId}`}
              className="flex min-h-12 flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium break-words">{item.title}</p>
                <p className="money text-sm text-text-muted">
                  {item.quantity} × {formatEth(item.unitPrice)}
                </p>
                {isOut && (
                  <p className="mt-1 flex items-center gap-1.5 rounded-md bg-danger-bg px-2 py-1 text-sm font-medium text-danger">
                    <AlertTriangle aria-hidden="true" size={16} />
                    {item.availableQuantity === 0
                      ? 'Indisponível — remova do carrinho para continuar'
                      : `Apenas ${item.availableQuantity} disponível(is) — ajuste a quantidade`}
                  </p>
                )}
              </div>
              <p className={`money font-medium ${isOut ? 'text-text-muted line-through' : ''}`}>
                {formatEth(item.lineTotal)}
              </p>
            </li>
          )
        })}
      </ul>

      <dl className="space-y-2">
        <Row label="Subtotal" value={formatEth(quote.subtotal)} />
        <Row
          label={
            <span className="flex items-center gap-1.5">
              Desconto
              {quote.appliedCoupon && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold">
                  <TicketPercent aria-hidden="true" size={14} /> {quote.appliedCoupon}
                </span>
              )}
            </span>
          }
          value={quote.discount.isZero() ? formatEth(quote.discount) : `− ${formatEth(quote.discount)}`}
          tone={quote.discount.isZero() ? undefined : 'success'}
        />
        <Row label="Taxa de rede" value={formatEth(quote.networkFee)} />
        <div className="flex items-baseline justify-between border-t border-border pt-3 text-lg font-bold">
          <dt>Total</dt>
          <dd className="money" data-testid="quote-total">{formatEth(quote.total)}</dd>
        </div>
      </dl>
    </section>
  )
}

function Row({ label, value, tone }: { label: ReactNode; value: string; tone?: 'success' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className={`money font-medium ${tone === 'success' ? 'text-success' : ''}`}>{value}</dd>
    </div>
  )
}

/** Texto para o `aria-live`: só anuncia quando o total muda após a primeira cotação. */
function useTotalAnnouncement(quote: Quote | undefined) {
  const previous = useRef<string | null>(null)
  const [text, setText] = useState('')
  const total = quote?.total.toString() ?? null
  useEffect(() => {
    if (total !== null && previous.current !== null && previous.current !== total && quote) {
      setText(`Cotação atualizada. Novo total: ${formatEth(quote.total)}.`)
    }
    if (total !== null) previous.current = total
  }, [total, quote])
  return text
}
