import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

/**
 * Política de cache: dados do catálogo ficam "frescos" por 30s (navegar entre páginas não refaz request);
 * retries só para erros transitórios (ver catalog.queries); sem refetch ao focar a janela para não competir
 * com as atualizações em tempo real.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false } },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
