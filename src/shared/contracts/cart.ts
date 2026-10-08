import { z } from 'zod'
import { idSchema, isoDateSchema, moneySchema } from './common'

/**
 * Cart — GET /cart, POST /cart/items, PATCH /cart/items/:id, DELETE /cart/items/:id, POST /cart/merge.
 * 409 availability_conflict com `details: AvailabilityConflictDto[]`.
 */
export const cartLineInputSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  quantity: z.number().int().min(1),
})
export type CartLineInputDto = z.infer<typeof cartLineInputSchema>

export const cartItemSchema = z.object({
  id: idSchema,
  nftId: idSchema,
  editionId: idSchema,
  quantity: z.number().int().min(1),
  /** Snapshot informativo; o valor de referência é a cotação (Pricing). */
  unitPrice: moneySchema,
  title: z.string(),
  imageUrl: z.string(),
  editionLabel: z.string(),
  available: z.number().int().min(0),
  nftVersion: z.number().int().min(1),
})
export type CartItemDto = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  updatedAt: isoDateSchema,
})
export type CartDto = z.infer<typeof cartSchema>

export const updateCartItemRequestSchema = z.object({ quantity: z.number().int().min(1) })
export const mergeCartRequestSchema = z.object({ items: z.array(cartLineInputSchema) })

export const availabilityConflictSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  requested: z.number().int(),
  available: z.number().int(),
})
export type AvailabilityConflictDto = z.infer<typeof availabilityConflictSchema>
