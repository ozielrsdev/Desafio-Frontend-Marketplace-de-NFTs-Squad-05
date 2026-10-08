/** API pública do contexto Ordering. */
export {
  OrderingDepsProvider,
  useCheckout,
  useOrder,
  usePendingOrders,
  useOrderLive,
  orderKeys,
  type CartPort,
  type OrderEventSource,
  type OrderGateway,
  type OrderLocalStore,
} from './application'
export type { Order, OrderStatus } from './domain'
export { orderApi, createOrderEventSource, orderLocalStore } from './infrastructure'
export { CheckoutPage, OrderStatusView, OrderReceipt, PendingOrderBanner } from './presentation'
