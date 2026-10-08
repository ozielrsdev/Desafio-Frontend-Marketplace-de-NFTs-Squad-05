import { z } from 'zod'
import { cartLineInputSchema } from './cart'
import { idSchema, isoDateSchema, moneySchema } from './common'
import { networks } from './wallets'

/**
 * Pricing — POST /quotes. 422 coupon_invalid | coupon_expired, 409 availability_conflict.
 * A cotação é a referência para o pedido (README §3).
 */
export const quoteRequestSchema = z.object({
  items: z.array(cartLineInputSchema).min(1),
  couponCode: z.string().trim().min(1).optional(),
  network: z.enum(networks),
})
export type QuoteRequestDto = z.infer<typeof quoteRequestSchema>

export const quoteItemSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  title: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: moneySchema,
  lineTotal: moneySchema,
})

export const quoteIssueSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  kind: z.enum(['price_changed', 'unavailable', 'quantity_reduced']),
  previous: z.string().optional(),
  current: z.string().optional(),
})

export const quoteSchema = z.object({
  id: idSchema,
  version: z.number().int().min(1),
  expiresAt: isoDateSchema,
  network: z.enum(networks),
  items: z.array(quoteItemSchema),
  coupon: z.object({ code: z.string(), percent: z.string() }).nullable(),
  subtotal: moneySchema,
  discount: moneySchema,
  networkFee: moneySchema,
  total: moneySchema,
  issues: z.array(quoteIssueSchema),
})
export type QuoteDto = z.infer<typeof quoteSchema>
