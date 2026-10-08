import type { Quote, QuoteInput } from '../domain'

/** Port implementado pela infraestrutura (REST `POST /quotes`). */
export interface QuoteGateway {
  /**
   * @throws CouponError (422) | StaleQuoteError (409 por cotação obsoleta)
   * | AppError normalizado para demais falhas (inclui availability_conflict).
   */
  quote(input: QuoteInput, options?: { signal?: AbortSignal }): Promise<Quote>
}
