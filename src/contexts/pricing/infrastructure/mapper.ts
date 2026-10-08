import { Money } from '@/shared/money'
import { createQuote, type Quote, type QuoteInput } from '../domain'
import type { QuoteRequestDto, QuoteResponseDto } from './dto'

export function toRequestDto(input: QuoteInput): QuoteRequestDto {
  return {
    items: input.items.map((i) => ({ nftId: i.nftId, editionId: i.editionId, quantity: i.quantity })),
    couponCode: input.coupon?.code ?? null,
    network: input.network,
  }
}

export function toQuote(dto: QuoteResponseDto): Quote {
  return createQuote({
    id: dto.quoteId,
    version: dto.version,
    expiresAt: new Date(dto.expiresAt),
    items: dto.items.map((i) => ({
      nftId: i.nftId,
      editionId: i.editionId,
      title: i.title,
      quantity: i.quantity,
      unitPrice: Money.parse(i.unitPrice),
      lineTotal: Money.parse(i.lineTotal),
      availableQuantity: i.availableQuantity,
    })),
    subtotal: Money.parse(dto.subtotal),
    discount: Money.parse(dto.discount),
    networkFee: Money.parse(dto.networkFee),
    total: Money.parse(dto.total),
    appliedCoupon: dto.appliedCoupon,
    issues: dto.issues.map((i) =>
      i.type === 'item_unavailable'
        ? { kind: 'item_unavailable', nftId: i.nftId, editionId: i.editionId, availableQuantity: i.availableQuantity }
        : { kind: 'price_changed', nftId: i.nftId, editionId: i.editionId, previousUnitPrice: Money.parse(i.previousUnitPrice) },
    ),
  })
}
