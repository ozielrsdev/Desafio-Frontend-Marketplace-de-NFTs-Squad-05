import { Money } from '@/shared/money'
import type { Coupon } from './coupon'
import type { Network } from './network'

export type NftId = string
export type EditionId = string

/** Insumos de uma cotação. Mudar qualquer campo exige nova cotação. */
export interface QuoteInput {
  items: ReadonlyArray<{ nftId: NftId; editionId: EditionId; quantity: number }>
  coupon: Coupon | null
  network: Network
}

export interface QuoteItem {
  nftId: NftId
  editionId: EditionId
  title: string
  quantity: number
  unitPrice: Money
  lineTotal: Money
  availableQuantity: number
}

export type QuoteIssue =
  | { kind: 'item_unavailable'; nftId: NftId; editionId: EditionId; availableQuantity: number }
  | { kind: 'price_changed'; nftId: NftId; editionId: EditionId; previousUnitPrice: Money }

export interface Quote {
  readonly id: string
  readonly version: number
  readonly expiresAt: Date
  readonly items: readonly QuoteItem[]
  readonly subtotal: Money
  readonly discount: Money
  readonly networkFee: Money
  readonly total: Money
  readonly appliedCoupon: string | null
  readonly issues: readonly QuoteIssue[]
}

/**
 * Cria uma `Quote` garantindo as invariantes de valor:
 * subtotal = Σ linhas, desconto em [0, subtotal] e total = subtotal − desconto + taxa de rede.
 */
export function createQuote(props: Quote): Quote {
  const subtotal = props.items.reduce((acc, i) => acc.add(i.lineTotal), Money.zero())
  if (!subtotal.equals(props.subtotal)) {
    throw new RangeError('Cotação inconsistente: subtotal diverge da soma dos itens')
  }
  if (props.discount.isNegative() || !props.discount.min(props.subtotal).equals(props.discount)) {
    throw new RangeError('Cotação inconsistente: desconto fora de [0, subtotal]')
  }
  const expected = props.subtotal.subtract(props.discount).add(props.networkFee)
  if (!expected.equals(props.total)) {
    throw new RangeError('Cotação inconsistente: total ≠ subtotal − desconto + taxa')
  }
  return Object.freeze({ ...props })
}

export function unavailableItems(quote: Quote): QuoteItem[] {
  const keys = new Set(
    quote.issues
      .filter((i) => i.kind === 'item_unavailable')
      .map((i) => `${i.nftId}:${i.editionId}`),
  )
  return quote.items.filter((i) => keys.has(`${i.nftId}:${i.editionId}`))
}

export function isExpired(quote: Quote, now: Date = new Date()): boolean {
  return quote.expiresAt.getTime() <= now.getTime()
}

/** Cotação só permite seguir ao checkout se vigente e sem itens indisponíveis. */
export function canCheckout(quote: Quote, now: Date = new Date()): boolean {
  return (
    quote.items.length > 0 &&
    !isExpired(quote, now) &&
    !quote.issues.some((i) => i.kind === 'item_unavailable')
  )
}
