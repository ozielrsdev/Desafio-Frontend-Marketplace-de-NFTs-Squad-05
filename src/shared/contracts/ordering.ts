import { z } from 'zod'
import { idSchema, isoDateSchema, moneySchema } from './common'
import { networks } from './wallets'

/**
 * Ordering — POST /orders (header Idempotency-Key), GET /orders/:id, GET /orders?status=pending.
 * Mesma chave + mesmo corpo → mesmo pedido (200). Mesma chave + corpo diferente → 409 idempotency_conflict.
 * Cotação obsoleta → 409 quote_stale. Pedido de outro usuário → 404 not_found.
 */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
export const orderStatuses = ['pending', 'confirmed', 'rejected'] as const

export const collectorDataSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
})

export const createOrderRequestSchema = z.object({
  quoteId: idSchema,
  quoteVersion: z.number().int().min(1),
  walletId: idSchema,
  network: z.enum(networks),
  collector: collectorDataSchema,
})
export type CreateOrderRequestDto = z.infer<typeof createOrderRequestSchema>

export const orderItemSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  title: z.string(),
  imageUrl: z.string(),
  editionLabel: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: moneySchema,
  lineTotal: moneySchema,
})

/** Snapshot imutável: o recibo nunca é recalculado a partir do catálogo. */
export const orderSchema = z.object({
  id: idSchema,
  status: z.enum(orderStatuses),
  items: z.array(orderItemSchema),
  subtotal: moneySchema,
  discount: moneySchema,
  networkFee: moneySchema,
  total: moneySchema,
  network: z.enum(networks),
  walletAddress: z.string(),
  collector: collectorDataSchema,
  transactionRef: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: z.number().int().min(1),
})
export type OrderDto = z.infer<typeof orderSchema>

export const orderListSchema = z.object({ items: z.array(orderSchema) })
