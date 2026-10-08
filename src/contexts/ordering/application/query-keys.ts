/** Sempre com `userId`: pedidos são dados privados. */
export const orderKeys = {
  all: (userId: string) => ['orders', userId] as const,
  detail: (userId: string, orderId: string) => ['orders', userId, 'detail', orderId] as const,
  pending: (userId: string) => ['orders', userId, 'pending'] as const,
}
