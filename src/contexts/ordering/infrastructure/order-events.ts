import { io } from 'socket.io-client'
import type { OrderEventSource } from '../application/ports'
import { orderEventDto } from './dto'
import { toOrderEvent } from './mapper'

/**
 * Adapter Socket.IO (cliente real). Transporte: apenas WebSocket. Em ambiente simulado o
 * servidor é o MSW (`@mswjs/socket.io-binding`), que não suporta rooms/namespaces/auth:
 * por isso o filtro por usuário também é feito no cliente (application).
 * Um socket por assinatura; `unsubscribe` remove listeners e desconecta.
 */
export function createOrderEventSource(url: string = window.location.origin): OrderEventSource {
  return {
    subscribe(userId, handlers) {
      const socket = io(url, {
        path: '/socket.io',
        transports: ['websocket'],
        auth: { userId },
        reconnectionDelay: 500,
        reconnectionDelayMax: 3000,
      })

      let dropped = false
      socket.on('connect', () => {
        handlers.onConnectionChange(true)
        if (dropped) {
          dropped = false
          handlers.onReconnect()
        }
      })
      socket.on('disconnect', () => {
        dropped = true
        handlers.onConnectionChange(false)
      })
      socket.on('order.updated', (raw: unknown) => {
        const parsed = orderEventDto.safeParse(raw)
        if (parsed.success) handlers.onEvent(toOrderEvent(parsed.data))
      })

      return () => {
        socket.off()
        socket.disconnect()
      }
    },
  }
}
