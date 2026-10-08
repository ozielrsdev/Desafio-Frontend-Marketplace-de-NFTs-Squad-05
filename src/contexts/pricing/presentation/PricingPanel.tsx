import { canCheckout, type Coupon, type Network, type QuoteInput } from '../domain'
import { useApplyCoupon, useQuote } from '../application'
import { CouponForm } from './CouponForm'
import { QuoteSummary } from './QuoteSummary'

interface Props {
  userId: string
  items: QuoteInput['items']
  network: Network
  coupon: Coupon | null
  onCouponChange: (coupon: Coupon | null) => void
  onProceed: () => void
}

/**
 * Painel de cotação consumido por Cart (resumo) e Ordering. Não calcula valores: exibe a
 * cotação da API. Itens/cupom/rede pertencem ao chamador; mudar qualquer um refaz a cotação.
 */
export function PricingPanel({ userId, items, network, coupon, onCouponChange, onProceed }: Props) {
  const input: QuoteInput = { items, coupon, network }
  const quote = useQuote(userId, input)
  const apply = useApplyCoupon(userId, input)
  const proceedable = quote.data ? canCheckout(quote.data) : false

  return (
    <div className="space-y-6 rounded-card border border-border bg-surface p-5 shadow-sm">
      <QuoteSummary
        quote={quote.data}
        isLoading={quote.isPending && quote.fetchStatus !== 'idle'}
        isRefetching={quote.isFetching && !quote.isPending}
        error={quote.error}
        onRetry={() => void quote.refetch()}
      />
      <CouponForm
        appliedCode={coupon?.code ?? null}
        pending={apply.isPending}
        error={apply.error}
        onApply={(code) => apply.mutate(code, { onSuccess: onCouponChange })}
        onRemove={() => {
          apply.reset()
          onCouponChange(null)
        }}
      />
      <button
        type="button"
        onClick={onProceed}
        disabled={!proceedable || quote.isFetching}
        aria-describedby={!proceedable && quote.data ? 'proceed-blocked' : undefined}
        className="min-h-12 w-full cursor-pointer rounded-md bg-cta px-4 text-base font-semibold text-cta-fg transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        Ir para o pagamento
      </button>
      {!proceedable && quote.data && (
        <p id="proceed-blocked" className="text-sm text-text-muted">
          Resolva os itens indisponíveis ou atualize a cotação para continuar.
        </p>
      )}
    </div>
  )
}
