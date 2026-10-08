import { favoritesHandlers } from './favorites'
import { identityHandlers } from './identity'
import { profileHandlers } from './profile'

/**
 * Handlers REST por contexto. Cada dev adiciona os do seu contexto aqui, usando o motor
 * (`route`/`authedRoute` em ../engine/route) e os contratos de `@/shared/contracts`.
 */
export const restHandlers = [
  ...identityHandlers,
  ...profileHandlers,
  ...favoritesHandlers,
  // catalog, cart (Dev 2) · pricing, wallets, ordering (Dev 3)
]
