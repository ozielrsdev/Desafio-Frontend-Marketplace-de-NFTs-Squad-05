import { createContext, useContext, type ReactNode } from 'react'
import type { QuoteGateway } from './ports'

const GatewayContext = createContext<QuoteGateway | null>(null)

/** Injeta o adapter (composição em `app/`); mantém `application` sem importar `infrastructure`. */
export function PricingGatewayProvider({ gateway, children }: { gateway: QuoteGateway; children: ReactNode }) {
  return <GatewayContext.Provider value={gateway}>{children}</GatewayContext.Provider>
}

export function useQuoteGateway(): QuoteGateway {
  const gateway = useContext(GatewayContext)
  if (!gateway) throw new Error('PricingGatewayProvider ausente')
  return gateway
}
