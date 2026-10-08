import { z } from 'zod'
import { idSchema, isoDateSchema, moneySchema } from './common'
import { orderSchema } from './ordering'

/**
 * Realtime (Socket.IO). Envelope comum a todos os eventos (docs/specs/realtime.md).
 * Conexão autenticada: `auth: { token }` no handshake; `order.updated` só chega ao dono do pedido.
 * `nft.updated` é público (visitantes também recebem).
 */
export const SOCKET_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

const envelope = <Type extends string, Kind extends string, P extends z.ZodType>(type: Type, kind: Kind, payload: P) =>
  z.object({
    eventId: idSchema,
    type: z.literal(type),
    resource: z.object({ kind: z.literal(kind), id: idSchema }),
    version: z.number().int().min(1),
    occurredAt: isoDateSchema,
    payload,
  })

export const nftUpdatedPayloadSchema = z.object({
  price: moneySchema,
  editions: z.array(z.object({ id: idSchema, available: z.number().int().min(0) })),
})
export const nftUpdatedEventSchema = envelope(SOCKET_EVENTS.nftUpdated, 'nft', nftUpdatedPayloadSchema)
export type NftUpdatedEventDto = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = envelope(SOCKET_EVENTS.orderUpdated, 'order', orderSchema)
export type OrderUpdatedEventDto = z.infer<typeof orderUpdatedEventSchema>

export type RealtimeEventDto = NftUpdatedEventDto | OrderUpdatedEventDto
