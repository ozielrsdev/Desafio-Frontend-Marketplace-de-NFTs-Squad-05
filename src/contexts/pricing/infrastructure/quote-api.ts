import { isAxiosError } from 'axios'
import { http } from '@/shared/http/client'
import { normalizeHttpError } from '@/shared/http/errors'
import { COUPON_MESSAGES, CouponError, StaleQuoteError, type QuoteInput } from '../domain'
import type { QuoteGateway } from '../application/ports'
import { quoteErrorDto, quoteResponseDto } from './dto'
import { toQuote, toRequestDto } from './mapper'

/** Adapter REST do port `QuoteGateway`: anti-corruption layer DTO ↔ domínio. */
export const quoteApi: QuoteGateway = {
  async quote(input: QuoteInput, options) {
    try {
      const { data } = await http.post('/quotes', toRequestDto(input), { signal: options?.signal })
      return toQuote(quoteResponseDto.parse(data))
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const parsed = quoteErrorDto.safeParse(error.response.data)
        if (parsed.success) {
          const { code } = parsed.data
          if (code === 'stale_quote') throw new StaleQuoteError()
          if (code.startsWith('coupon_')) {
            const couponCode = code as keyof typeof COUPON_MESSAGES
            throw new CouponError(couponCode, COUPON_MESSAGES[couponCode])
          }
        }
      }
      throw isAxiosError(error) ? normalizeHttpError(error) : error
    }
  },
}
