/** API pública do contexto Pricing (outros contextos importam só daqui). */
export { Coupon, CouponError, StaleQuoteError, canCheckout, diffQuotes, unavailableItems, NETWORKS, NETWORK_LABEL } from './domain'
export type { Quote, QuoteInput, QuoteDiff, Network, QuoteItem } from './domain'
export {
  useQuote,
  useRevalidateQuote,
  useApplyCoupon,
  revalidateQuote,
  isStaleQuoteError,
  pricingKeys,
  hashQuoteInput,
  PricingGatewayProvider,
} from './application'
export type { QuoteGateway } from './application'
export { quoteApi } from './infrastructure'
export { PricingPanel, QuoteSummary, CouponForm, QuoteChangedDialog } from './presentation'
