import { Money } from '@/shared/money'
import type { Order } from '../domain'
import type { OrderEvent } from '../application/ports'
import type { OrderDto, OrderEventDto } from './dto'

export function toOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    userId: dto.userId,
    status: dto.status,
    version: dto.version,
    items: dto.items.map((i) => ({
      nftId: i.nftId,
      editionId: i.editionId,
      title: i.title,
      quantity: i.quantity,
      unitPrice: Money.parse(i.unitPrice),
      lineTotal: Money.parse(i.lineTotal),
    })),
    subtotal: Money.parse(dto.subtotal),
    discount: Money.parse(dto.discount),
    networkFee: Money.parse(dto.networkFee),
    total: Money.parse(dto.total),
    appliedCoupon: dto.appliedCoupon,
    walletAddress: dto.walletAddress,
    network: dto.network,
    transactionRef: dto.transactionRef,
    rejectionReason: dto.rejectionReason,
    createdAt: new Date(dto.createdAt),
  }
}

export function toOrderEvent(dto: OrderEventDto): OrderEvent {
  return {
    eventId: dto.eventId,
    orderId: dto.resource.id,
    userId: dto.payload.userId,
    version: dto.version,
    occurredAt: dto.occurredAt,
    status: dto.payload.status,
    transactionRef: dto.payload.transactionRef,
    rejectionReason: dto.payload.rejectionReason,
  }
}
