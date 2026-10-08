import { z } from 'zod'
import { Money } from '@/shared/money'

/**
 * Contratos REST/eventos compartilhados entre a infraestrutura do front e os handlers MSW.
 * CONGELADOS na Fase 0 (docs/PLANO.md): mudanças exigem PR atualizando tipos, handlers,
 * ARCHITECTURE.md e testes juntos (AGENTS.md §9.3).
 */

/** ETH como string decimal (nunca number). */
export const moneySchema = z.string().refine(Money.isValid, 'Valor monetário inválido')
export const isoDateSchema = z.iso.datetime({ offset: true })
export const idSchema = z.string().min(1)

/** Códigos de erro do contrato, por contexto. */
export const errorCodes = [
  // comuns
  'validation_error',
  'unauthenticated',
  'session_expired',
  'forbidden',
  'not_found',
  'transient',
  // identity
  'email_in_use',
  'invalid_credentials',
  // profile
  'wrong_password',
  'avatar_invalid',
  // cart / pricing / ordering
  'availability_conflict',
  'coupon_invalid',
  'coupon_expired',
  'quote_stale',
  'idempotency_conflict',
  // wallets
  'wallet_duplicate',
  'wallet_rejected',
] as const
export type ErrorCode = (typeof errorCodes)[number]

/** Envelope de erro de toda resposta 4xx/5xx. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(errorCodes),
    message: z.string(),
    /** Erros por campo (422 e 409 de formulário). Chave = nome do campo no request. */
    fields: z.record(z.string(), z.string()).optional(),
    /** Detalhes estruturados (ex.: itens em conflito de disponibilidade). */
    details: z.unknown().optional(),
  }),
})
export type ApiErrorDto = z.infer<typeof apiErrorSchema>

export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  })
