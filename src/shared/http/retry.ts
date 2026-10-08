import { isAppError } from '@/shared/errors'

export const MAX_QUERY_RETRIES = 2

/** Política de retry das queries: só falhas transitórias/rede, no máximo 2 vezes. */
export function queryRetry(failureCount: number, error: unknown): boolean {
  return isAppError(error) && error.retryable && failureCount < MAX_QUERY_RETRIES
}
