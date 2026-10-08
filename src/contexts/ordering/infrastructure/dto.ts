import { z } from 'zod'

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/, 'valor decimal inválido')
const status = z.enum(['pending', 'confirmed', 'rejected'])

/** Contrato `POST /orders` — request (o header `Idempotency-Key` viaja à parte). */
export const createOrderRequestDto = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  walletAddress: z.string(),
  network: z.enum(['ethereum', 'polygon', 'arbitrum']),
  collector: z.object({ fullName: z.string(), email: z.string() }),
})
export type CreateOrderRequestDto = z.infer<typeof createOrderRequestDto>

/** Pedido + recibo (snapshot). Valores em ETH sempre string decimal. */
export const orderDto = z.object({
  id: z.string(),
  userId: z.string(),
  status,
  version: z.number().int(),
  items: z.array(
    z.object({
      nftId: z.string(),
      editionId: z.string(),
      title: z.string(),
      quantity: z.number().int(),
      unitPrice: decimal,
      lineTotal: decimal,
    }),
  ),
  subtotal: decimal,
  discount: decimal,
  networkFee: decimal,
  total: decimal,
  appliedCoupon: z.string().nullable(),
  walletAddress: z.string(),
  network: z.enum(['ethereum', 'polygon', 'arbitrum']),
  transactionRef: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string().datetime(),
})
export type OrderDto = z.infer<typeof orderDto>

export const pendingOrdersDto = z.object({ orders: z.array(orderDto) })

export const orderErrorDto = z.object({
  code: z.string(),
  message: z.string().optional(),
})

/** Envelope Socket.IO `order.updated` (realtime.md). */
export const orderEventDto = z.object({
  eventId: z.string(),
  type: z.literal('order.updated'),
  resource: z.object({ kind: z.literal('order'), id: z.string() }),
  version: z.number().int(),
  occurredAt: z.string(),
  payload: z.object({
    userId: z.string(),
    status,
    transactionRef: z.string().nullable(),
    rejectionReason: z.string().nullable(),
  }),
})
export type OrderEventDto = z.infer<typeof orderEventDto>
