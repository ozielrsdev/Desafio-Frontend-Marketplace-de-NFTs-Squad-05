import { createContext, useContext, type ReactNode } from 'react'
import type { QuoteGateway } from '@/contexts/pricing'
import type { CartPort, OrderEventSource, OrderGateway, OrderLocalStore } from './ports'

export interface OrderingDeps {
  gateway: OrderGateway
  events: OrderEventSource
  quotes: QuoteGateway
  cart: CartPort
  store: OrderLocalStore
}

const DepsContext = createContext<OrderingDeps | null>(null)

export function OrderingDepsProvider({ children, ...deps }: OrderingDeps & { children: ReactNode }) {
  return <DepsContext.Provider value={deps}>{children}</DepsContext.Provider>
}

export function useOrderingDeps(): OrderingDeps {
  const deps = useContext(DepsContext)
  if (!deps) throw new Error('OrderingDepsProvider ausente')
  return deps
}
