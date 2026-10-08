import type { ErrorCode } from '@/shared/contracts'

/**
 * Erro normalizado (AGENTS.md §4). Toda falha de rede/API chega à aplicação neste formato,
 * para que casos de uso e UI decidam por `kind`, nunca por status HTTP ou mensagens cruas.
 */
export type AppErrorKind =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'availability_conflict'
  | 'transient'
  | 'network'

export interface AppErrorInit {
  kind: AppErrorKind
  message: string
  code?: ErrorCode
  status?: number
  fields?: Record<string, string>
  details?: unknown
  /** `true` quando a requisição expirou no cliente (timeout). */
  timedOut?: boolean
}

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly code?: ErrorCode
  readonly status?: number
  readonly fields: Record<string, string>
  readonly details?: unknown
  readonly timedOut: boolean

  constructor(init: AppErrorInit) {
    super(init.message)
    this.name = 'AppError'
    this.kind = init.kind
    this.code = init.code
    this.status = init.status
    this.fields = init.fields ?? {}
    this.details = init.details
    this.timedOut = init.timedOut ?? false
  }

  /** Falhas que podem ser repetidas com segurança (mesma operação, mesma chave de idempotência). */
  get retryable(): boolean {
    return this.kind === 'transient' || this.kind === 'network'
  }

  hasFieldErrors(): boolean {
    return Object.keys(this.fields).length > 0
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/** Converte status HTTP + código do contrato no `kind` do domínio. */
export function kindFromStatus(status: number, code?: ErrorCode): AppErrorKind {
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409 && (code === 'availability_conflict' || code === 'quote_stale')) return 'availability_conflict'
  if (status === 408 || status === 429 || status >= 500) return 'transient'
  return 'validation'
}

/** Mensagens padrão em pt-BR para quando a API não envia uma mensagem utilizável. */
export const defaultErrorMessages: Record<AppErrorKind, string> = {
  validation: 'Revise os dados informados.',
  unauthenticated: 'Sua sessão expirou. Entre novamente para continuar.',
  forbidden: 'Você não tem permissão para acessar este recurso.',
  not_found: 'Não encontramos o que você procurava.',
  availability_conflict: 'A disponibilidade mudou. Revise os itens.',
  transient: 'O serviço está instável no momento. Tente novamente.',
  network: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error
  return new AppError({ kind: 'network', message: defaultErrorMessages.network })
}
