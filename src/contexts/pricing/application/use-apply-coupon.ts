import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Coupon, type QuoteInput } from '../domain'
import { useQuoteGateway } from './gateway-context'
import { pricingKeys } from './query-keys'

/**
 * Valida o cupom antes de confirmá-lo no estado do carrinho: se a API recusar
 * (CouponError), o cupom anterior e o total atual permanecem intactos. Em sucesso a
 * cotação já fica no cache sob a key do novo cupom (sem requisição extra).
 */
export function useApplyCoupon(userId: string, input: QuoteInput) {
  const gateway = useQuoteGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (raw: string) => {
      const coupon = Coupon.parse(raw)
      const next: QuoteInput = { ...input, coupon }
      await queryClient.fetchQuery({
        queryKey: pricingKeys.quote(userId, next),
        queryFn: ({ signal }) => gateway.quote(next, { signal }),
        staleTime: 15_000,
      })
      return coupon
    },
  })
}
