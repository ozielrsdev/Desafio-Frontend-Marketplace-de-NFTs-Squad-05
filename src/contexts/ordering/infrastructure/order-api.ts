import { isAxiosError } from 'axios'
import { StaleQuoteError } from '@/contexts/pricing'
import { http } from '@/shared/http/client'
import { normalizeHttpError } from '@/shared/http/errors'
import type { OrderGateway } from '../application/ports'
import { orderDto, orderErrorDto, pendingOrdersDto } from './dto'
import { toOrder } from './mapper'

/** Timeout da criação do pedido: após estourar, o reenvio com a mesma chave recupera o pedido. */
const CREATE_TIMEOUT_MS = Number(import.meta.env.VITE_ORDER_TIMEOUT_MS ?? 8000)

function translate(error: unknown): never {
  if (isAxiosError(error) && error.response?.status === 409) {
    const parsed = orderErrorDto.safeParse(error.response.data)
    if (parsed.success && parsed.data.code === 'stale_quote') throw new StaleQuoteError()
  }
  throw isAxiosError(error) ? normalizeHttpError(error) : error
}

export const orderApi: OrderGateway = {
  async create(request, idempotencyKey, options) {
    try {
      const { data } = await http.post('/orders', request, {
        headers: { 'Idempotency-Key': idempotencyKey },
        signal: options?.signal,
        timeout: CREATE_TIMEOUT_MS,
      })
      return toOrder(orderDto.parse(data))
    } catch (error) {
      return translate(error)
    }
  },

  async get(orderId, options) {
    try {
      const { data } = await http.get(`/orders/${orderId}`, { signal: options?.signal })
      return toOrder(orderDto.parse(data))
    } catch (error) {
      return translate(error)
    }
  },

  async listPending(options) {
    try {
      const { data } = await http.get('/orders', { params: { status: 'pending' }, signal: options?.signal })
      return pendingOrdersDto.parse(data).orders.map(toOrder)
    } catch (error) {
      return translate(error)
    }
  },
}
