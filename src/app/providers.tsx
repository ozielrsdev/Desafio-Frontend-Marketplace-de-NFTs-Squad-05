import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { OrderingDepsProvider, createOrderEventSource, orderApi, orderLocalStore } from '@/contexts/ordering'
import { PricingGatewayProvider, quoteApi } from '@/contexts/pricing'
import { WalletConnectionProvider, WalletsDepsProvider, walletApi, walletConnector } from '@/contexts/wallets'
import { demoCartPort } from './demo-cart'

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } })
const events = createOrderEventSource()

/**
 * Raiz de composição: liga ports a adapters. `userId` entra como `key` do estado efêmero —
 * trocar de usuário remonta Wallet connection (e Identity deve chamar `queryClient.clear()`).
 */
export function AppProviders({ userId, children }: { userId: string; children: ReactNode }) {
  const orderingDeps = useMemo(
    () => ({ gateway: orderApi, events, quotes: quoteApi, cart: demoCartPort, store: orderLocalStore }),
    [],
  )
  return (
    <QueryClientProvider client={queryClient}>
      <PricingGatewayProvider gateway={quoteApi}>
        <WalletsDepsProvider gateway={walletApi} connector={walletConnector}>
          <WalletConnectionProvider key={userId} userId={userId}>
            <OrderingDepsProvider {...orderingDeps}>{children}</OrderingDepsProvider>
          </WalletConnectionProvider>
        </WalletsDepsProvider>
      </PricingGatewayProvider>
    </QueryClientProvider>
  )
}
