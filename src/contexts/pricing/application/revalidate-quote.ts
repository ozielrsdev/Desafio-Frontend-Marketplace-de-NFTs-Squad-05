import { diffQuotes, StaleQuoteError, type Quote, type QuoteDiff, type QuoteInput } from '../domain'
import type { QuoteGateway } from './ports'

export type Revalidation =
  | { status: 'unchanged'; quote: Quote }
  /** Cotação mudou entre revisão e envio: UI mostra o diff e exige nova confirmação. */
  | { status: 'changed'; quote: Quote; diff: QuoteDiff }

/**
 * Revalidação obrigatória imediatamente antes de enviar o pedido.
 * Sempre busca uma cotação nova (nunca reaproveita cache) e compara com a revisada.
 */
export async function revalidateQuote(
  gateway: QuoteGateway,
  reviewed: Quote,
  input: QuoteInput,
  options?: { signal?: AbortSignal },
): Promise<Revalidation> {
  const fresh = await gateway.quote(input, options)
  const diff = diffQuotes(reviewed, fresh)
  const hasBlockingIssue = fresh.issues.some((i) => i.kind === 'item_unavailable')
  if (!diff.changed && !hasBlockingIssue) return { status: 'unchanged', quote: fresh }
  return { status: 'changed', quote: fresh, diff }
}

/** Servidor recusou o pedido (409) por cotação obsoleta: revalida para mostrar o diff. */
export function isStaleQuoteError(error: unknown): error is StaleQuoteError {
  return error instanceof StaleQuoteError
}
