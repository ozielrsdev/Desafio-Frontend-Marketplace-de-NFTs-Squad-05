import {
  diffQuotes,
  hashQuoteInput,
  revalidateQuote,
  StaleQuoteError,
  unavailableItems,
  type Quote,
  type QuoteDiff,
  type QuoteInput,
} from '@/contexts/pricing'
import { isAppError } from '@/shared/http/errors'
import type { CollectorDetails, Order } from '../domain'
import { resolveIdempotencyKey } from '../domain'
import type { OrderingDeps } from './deps'

export interface SubmitCheckoutParams {
  userId: string
  /** Cotação que o usuário revisou na tela. */
  reviewedQuote: Quote
  quoteInput: QuoteInput
  wallet: { id: string; address: string }
  collector: CollectorDetails
}

export type CheckoutResult =
  | { kind: 'created'; order: Order }
  /** Preço/disponibilidade/cupom/taxa mudou: UI mostra o diff e exige nova confirmação. */
  | { kind: 'quote_changed'; quote: Quote; diff: QuoteDiff; blocked: boolean }

const MAX_TRANSIENT_RETRIES = 1

/**
 * Caso de uso "confirmar compra":
 * 1. revalida a cotação imediatamente antes do envio (Pricing);
 * 2. se mudou → devolve o diff, SEM criar pedido;
 * 3. cria o pedido com `Idempotency-Key` persistida por usuário — o reenvio após timeout
 *    reutiliza a mesma chave (retry só em falhas transitórias, sempre com a mesma chave);
 * 4. 409 de cotação obsoleta no servidor também vira `quote_changed`.
 */
export async function submitCheckout(
  deps: OrderingDeps,
  params: SubmitCheckoutParams,
  options?: { signal?: AbortSignal },
): Promise<CheckoutResult> {
  const { userId, reviewedQuote, quoteInput, wallet, collector } = params

  const revalidation = await revalidateQuote(deps.quotes, reviewedQuote, quoteInput, options)
  if (revalidation.status === 'changed') return changed(revalidation.quote, revalidation.diff)

  const fingerprint = [hashQuoteInput(quoteInput), wallet.id, collector.fullName.trim(), collector.email.trim()].join('|')
  const attempt = resolveIdempotencyKey(deps.store.loadAttempt(userId), fingerprint)
  deps.store.saveAttempt(userId, attempt)

  const request = {
    quoteId: revalidation.quote.id,
    walletId: wallet.id,
    walletAddress: wallet.address,
    network: quoteInput.network,
    collector,
  }

  for (let tries = 0; ; tries++) {
    try {
      const order = await deps.gateway.create(request, attempt.key, options)
      return { kind: 'created', order }
    } catch (error) {
      if (error instanceof StaleQuoteError) {
        const fresh = await deps.quotes.quote(quoteInput, options)
        return changed(fresh, diffQuotes(revalidation.quote, fresh))
      }
      const transient = isAppError(error) && (error.kind === 'transient' || error.kind === 'network')
      if (!transient || tries >= MAX_TRANSIENT_RETRIES || options?.signal?.aborted) throw error
    }
  }
}

function changed(quote: Quote, diff: QuoteDiff): CheckoutResult {
  return { kind: 'quote_changed', quote, diff, blocked: unavailableItems(quote).length > 0 }
}
