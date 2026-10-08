import { useMutation, useQuery } from '@tanstack/react-query'
import { isAppError } from '@/shared/http/errors'
import { CouponError, type Quote, type QuoteInput } from '../domain'
import { useQuoteGateway } from './gateway-context'
import { pricingKeys } from './query-keys'
import { revalidateQuote } from './revalidate-quote'

const isAppErrorOfKind = (e: unknown, kind: string) => isAppError(e) && e.kind === kind

/**
 * Cotação reativa: refeita ao mudar itens, quantidades, cupom ou rede (a key inclui o hash
 * dos insumos). O `signal` do Query cancela cotações obsoletas. Cupom inválido não é retentado.
 */
export function useQuote(userId: string, input: QuoteInput) {
  const gateway = useQuoteGateway()
  return useQuery({
    queryKey: pricingKeys.quote(userId, input),
    queryFn: ({ signal }) => gateway.quote(input, { signal }),
    enabled: input.items.length > 0,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
    retry: (count, error) =>
      count < 2 && !(error instanceof CouponError) && !isAppErrorOfKind(error, 'availability_conflict'),
  })
}

/** Revalidação imediata antes do envio do pedido (consumida por Ordering). */
export function useRevalidateQuote(userId: string) {
  const gateway = useQuoteGateway()
  return useMutation({
    mutationKey: [...pricingKeys.all(userId), 'revalidate'],
    mutationFn: ({ reviewed, input }: { reviewed: Quote; input: QuoteInput }) =>
      revalidateQuote(gateway, reviewed, input),
  })
}
