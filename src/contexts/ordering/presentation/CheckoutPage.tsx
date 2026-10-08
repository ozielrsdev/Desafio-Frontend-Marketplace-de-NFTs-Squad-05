import { CircleAlert, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  canCheckout,
  QuoteChangedDialog,
  QuoteSummary,
  useQuote,
  type Coupon,
  type Network,
  type Quote,
  type QuoteDiff,
  type QuoteInput,
} from '@/contexts/pricing'
import { listWallets, useWalletConnection, useWallets, WalletPicker, type Wallet } from '@/contexts/wallets'
import { isAppError } from '@/shared/http/errors'
import { hasErrors, validateCollector, type CollectorDetails, type CollectorErrors } from '../domain'
import { useCheckout, useOrderingDeps } from '../application'
import { CollectorForm } from './CollectorForm'

interface Props {
  userId: string
  items: QuoteInput['items']
  coupon: Coupon | null
  onOrderCreated: (orderId: string) => void
  /** Sem carteira: o chamador guarda o retorno ao checkout. */
  onGoToWallets: () => void
  onBackToCart: () => void
}

interface PendingChange {
  quote: Quote
  diff: QuoteDiff
  blocked: boolean
}

export function CheckoutPage({ userId, items, coupon, onOrderCreated, onGoToWallets, onBackToCart }: Props) {
  const { store } = useOrderingDeps()
  const wallets = useWallets(userId)
  const [collector, setCollector] = useState<CollectorDetails>(() => store.loadDraft(userId) ?? { fullName: '', email: '' })
  const [errors, setErrors] = useState<CollectorErrors>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [change, setChange] = useState<PendingChange | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const list = wallets.data ? listWallets(wallets.data) : []
  const wallet: Wallet | null = list.find((w) => w.id === (selectedId ?? wallets.data?.primary?.id)) ?? null
  const network: Network = wallet?.network ?? 'ethereum'

  const quoteInput: QuoteInput = { items, coupon, network }
  const quote = useQuote(userId, quoteInput)
  const connection = useWalletConnection(wallet?.id ?? null)
  const checkout = useCheckout(userId)

  const connected = connection.state.status === 'connected'
  const quoteOk = quote.data ? canCheckout(quote.data) : false
  const busy = checkout.isPending

  const blockers = [
    !wallet && 'Selecione uma carteira.',
    wallet && !connected && 'Conecte a carteira para confirmar.',
    quote.data && !quoteOk && 'Há itens indisponíveis ou a cotação expirou. Volte ao carrinho.',
  ].filter((m): m is string => Boolean(m))

  function updateCollector(next: CollectorDetails) {
    setCollector(next)
    store.saveDraft(userId, next)
  }

  function submit(reviewed: Quote) {
    if (!wallet) return
    checkout.mutate(
      { userId, reviewedQuote: reviewed, quoteInput, wallet: { id: wallet.id, address: wallet.address.value }, collector },
      {
        onSuccess: (result) => {
          if (result.kind === 'created') onOrderCreated(result.order.id)
          else {
            setChange({ quote: result.quote, diff: result.diff, blocked: result.blocked })
            void quote.refetch()
          }
        },
      },
    )
  }

  function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !quote.data || !wallet || !connected || !quoteOk) return
    const found = validateCollector(collector)
    setErrors(found)
    if (hasErrors(found)) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    submit(quote.data)
  }

  const summary = (
    <QuoteSummary
      quote={quote.data}
      isLoading={quote.isPending && quote.fetchStatus !== 'idle'}
      isRefetching={quote.isFetching && !quote.isPending}
      error={quote.error}
      onRetry={() => void quote.refetch()}
    />
  )

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 id="checkout-title" className="mb-6 text-2xl font-bold">Pagamento</h1>
      {/* Uma única árvore: no mobile o resumo vem entre os campos e o botão; no desktop, na coluna lateral. */}
      <form
        ref={formRef}
        onSubmit={onConfirm}
        noValidate
        aria-labelledby="checkout-title"
        className="grid gap-8 lg:grid-cols-[1fr_24rem]"
      >
        <div className="space-y-8 lg:col-start-1">
          <CollectorForm value={collector} errors={errors} onChange={updateCollector} />
          <WalletPicker
            userId={userId}
            selectedId={wallet?.id ?? null}
            onSelect={(w) => setSelectedId(w.id)}
            onRegister={onGoToWallets}
          />
        </div>

        <aside className="space-y-4 self-start rounded-card border border-border bg-surface p-5 shadow-sm lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {summary}
        </aside>

        <div className="space-y-3 lg:col-start-1">
          {checkout.isError && <CheckoutError error={checkout.error} />}
          <button
            type="submit"
            disabled={busy}
            aria-disabled={blockers.length > 0 || undefined}
            aria-describedby={blockers.length ? 'confirm-blockers' : undefined}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-cta px-4 text-base font-semibold text-cta-fg transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            {busy && <Loader2 aria-hidden="true" size={18} className="animate-spin motion-reduce:animate-none" />}
            {busy ? 'Confirmando…' : 'Confirmar compra'}
          </button>
          {blockers.length > 0 && (
            <ul id="confirm-blockers" className="space-y-1 text-sm text-text-muted">
              {blockers.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          <p role="status" aria-live="polite" className="sr-only">{busy ? 'Confirmando a compra, aguarde.' : ''}</p>
          <button type="button" onClick={onBackToCart} className="min-h-11 cursor-pointer rounded-md px-2 font-medium text-primary hover:bg-surface-muted">
            ← Voltar ao carrinho
          </button>
        </div>
      </form>

      <QuoteChangedDialog
        diff={change?.diff ?? null}
        blocked={change?.blocked ?? false}
        onCancel={() => {
          setChange(null)
          onBackToCart()
        }}
        onConfirm={() => {
          const next = change
          setChange(null)
          if (next) submit(next.quote)
        }}
      />
    </main>
  )
}

function CheckoutError({ error }: { error: unknown }) {
  const kind = isAppError(error) ? error.kind : 'transient'
  const text =
    kind === 'unauthenticated'
      ? 'Sua sessão expirou. Entre novamente para continuar — seus dados foram preservados.'
      : kind === 'availability_conflict'
        ? 'Algum item ficou indisponível ou o pedido conflita com uma tentativa anterior. Revise o carrinho.'
        : 'Não foi possível concluir a compra agora. Tente novamente: não criaremos um pedido duplicado.'
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-bg p-3 text-sm font-medium text-danger">
      <CircleAlert aria-hidden="true" size={18} className="mt-0.5 shrink-0" /> {text}
    </p>
  )
}
