import { QueryClient } from '@tanstack/react-query'
import { queryRetry } from '@/shared/http'

/**
 * Política de cache/retries (documentar em ARCHITECTURE.md):
 * - staleTime 30 s; refetch ao focar a janela e ao reconectar;
 * - retry só em falhas transitórias/rede (máx. 2, backoff exponencial do Query);
 * - mutations nunca repetem automaticamente (pedido usa idempotência explícita).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: queryRetry,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  })
}
