import type { QuoteInput } from '../domain'

/** Hash estável dos insumos: independe da ordem dos itens e do caso do cupom. */
export function hashQuoteInput(input: QuoteInput): string {
  const items = [...input.items]
    .map((i) => `${i.nftId}.${i.editionId}x${i.quantity}`)
    .sort()
    .join('|')
  return `${items}#${input.coupon?.code ?? '-'}#${input.network}`
}
