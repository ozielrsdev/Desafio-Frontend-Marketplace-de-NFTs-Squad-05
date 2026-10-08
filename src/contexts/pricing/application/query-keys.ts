import type { QuoteInput } from '../domain'
import { hashQuoteInput } from './input-hash'

/** `userId` sempre presente: cotação é dado privado (AGENTS.md §4). */
export const pricingKeys = {
  all: (userId: string) => ['pricing', userId] as const,
  quote: (userId: string, input: QuoteInput) =>
    ['pricing', userId, 'quote', hashQuoteInput(input)] as const,
}
