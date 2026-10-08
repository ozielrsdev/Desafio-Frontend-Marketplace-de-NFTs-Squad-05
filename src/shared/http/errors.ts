import { isAxiosError } from 'axios'

/** Erros normalizados (AGENTS.md §4). */
export type AppError =
  | { kind: 'validation'; code: string; message: string }
  | { kind: 'unauthenticated'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'not_found'; message: string }
  | { kind: 'availability_conflict'; code: string; message: string }
  | { kind: 'transient'; message: string }
  | { kind: 'network'; message: string }

export function normalizeHttpError(error: unknown): AppError {
  if (!isAxiosError(error)) return { kind: 'transient', message: 'Erro inesperado' }
  if (!error.response) return { kind: 'network', message: 'Sem conexão com o servidor' }
  const { status, data } = error.response
  const code = typeof data?.code === 'string' ? data.code : 'unknown'
  const message = typeof data?.message === 'string' ? data.message : 'Falha na requisição'
  if (status === 401) return { kind: 'unauthenticated', message }
  if (status === 403) return { kind: 'forbidden', message }
  if (status === 404) return { kind: 'not_found', message }
  if (status === 409) return { kind: 'availability_conflict', code, message }
  if (status === 400 || status === 422) return { kind: 'validation', code, message }
  return { kind: 'transient', message }
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'kind' in value && 'message' in value
}
