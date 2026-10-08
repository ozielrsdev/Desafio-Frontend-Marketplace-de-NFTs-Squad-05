import { z } from 'zod'

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/, 'valor decimal inválido')

/** Contrato `POST /quotes` — request. */
export const quoteRequestDto = z.object({
  items: z.array(z.object({ nftId: z.string(), editionId: z.string(), quantity: z.number().int().min(1) })),
  couponCode: z.string().nullable(),
  network: z.enum(['ethereum', 'polygon', 'arbitrum']),
})
export type QuoteRequestDto = z.infer<typeof quoteRequestDto>

/** Contrato `POST /quotes` — response 200. Valores em ETH sempre como string decimal. */
export const quoteResponseDto = z.object({
  quoteId: z.string(),
  version: z.number().int(),
  expiresAt: z.string().datetime(),
  items: z.array(
    z.object({
      nftId: z.string(),
      editionId: z.string(),
      title: z.string(),
      quantity: z.number().int(),
      unitPrice: decimal,
      lineTotal: decimal,
      availableQuantity: z.number().int(),
    }),
  ),
  subtotal: decimal,
  discount: decimal,
  networkFee: decimal,
  total: decimal,
  appliedCoupon: z.string().nullable(),
  issues: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('item_unavailable'), nftId: z.string(), editionId: z.string(), availableQuantity: z.number().int() }),
      z.object({ type: z.literal('price_changed'), nftId: z.string(), editionId: z.string(), previousUnitPrice: decimal }),
    ]),
  ),
})
export type QuoteResponseDto = z.infer<typeof quoteResponseDto>

/** Erro 422 de cupom e 409 de cotação obsoleta/disponibilidade. */
export const quoteErrorDto = z.object({
  code: z.enum(['coupon_invalid', 'coupon_expired', 'coupon_not_applicable', 'stale_quote', 'availability_conflict']),
  message: z.string().optional(),
})
