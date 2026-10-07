import axios from 'axios'

export type AppError =
  | { kind: 'validation'; message: string; fields?: Record<string, string> }
  | { kind: 'unauthenticated'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'not_found'; message: string }
  | { kind: 'availability_conflict'; message: string }
  | { kind: 'transient'; message: string }
  | { kind: 'network'; message: string }

export class ApiError extends Error {
  constructor(public readonly detail: AppError) {
    super(detail.message)
  }
  get kind() { return this.detail.kind }
}

export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (axios.isAxiosError(err)) {
    if (axios.isCancel(err)) return new ApiError({ kind: 'transient', message: 'Requisição cancelada.' })
    const status = err.response?.status
    const msg = (err.response?.data as { message?: string } | undefined)?.message
    if (!err.response) return new ApiError({ kind: 'network', message: 'Sem conexão com o servidor. Verifique sua rede.' })
    if (status === 401) return new ApiError({ kind: 'unauthenticated', message: msg ?? 'Sessão inválida.' })
    if (status === 403) return new ApiError({ kind: 'forbidden', message: msg ?? 'Sem permissão.' })
    if (status === 404) return new ApiError({ kind: 'not_found', message: msg ?? 'Recurso não encontrado.' })
    if (status === 409) return new ApiError({ kind: 'availability_conflict', message: msg ?? 'Conflito de disponibilidade.' })
    if (status === 400 || status === 422) return new ApiError({ kind: 'validation', message: msg ?? 'Dados inválidos.' })
    return new ApiError({ kind: 'transient', message: msg ?? 'Falha temporária. Tente novamente.' })
  }
  return new ApiError({ kind: 'transient', message: 'Erro inesperado.' })
}

/** Só erros transitórios/rede merecem retry automático. */
export const isRetryable = (err: unknown) => err instanceof ApiError && (err.kind === 'transient' || err.kind === 'network')
