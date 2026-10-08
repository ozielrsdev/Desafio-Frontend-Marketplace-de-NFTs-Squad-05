import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { dropSocketConnections, emitOrderEvent } from './handlers/orders'
import { ordersScenario } from './orders-scenario'
import { pricingScenario } from './pricing-scenario'
import { clearMockStorage } from './support'
import { walletsScenario } from './wallets-scenario'

export const worker = setupWorker(...handlers)

/** API de controle para E2E/dev (sem tocar na UI). */
export const mockControl = {
  pricing: pricingScenario,
  wallets: walletsScenario,
  orders: ordersScenario,
  /** Emite um envelope `order.updated` arbitrário (duplicado, antigo, de outro usuário…). */
  emitOrderEvent,
  /** Derruba o socket; o cliente reconecta e reconcilia via REST. */
  dropSocketConnections,
  /** Reset completo: cenários + storage persistido dos mocks. */
  reset: () => {
    pricingScenario.reset()
    walletsScenario.reset()
    ordersScenario.reset()
    clearMockStorage()
  },
}

declare global {
  interface Window {
    __mocks?: typeof mockControl
  }
}
window.__mocks = mockControl
