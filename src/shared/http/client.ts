import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ZodType } from 'zod'
import { apiErrorSchema } from '@/shared/contracts'
import { AppError, defaultErrorMessages, kindFromStatus } from '@/shared/errors'

/**
 * Instância Axios única (AGENTS.md §4). Interceptors fazem apenas:
 *  - injeção da credencial da sessão;
 *  - normalização de erros para `AppError`;
 *  - sinalização de 401 (quem decide o que fazer é o caso de uso de Identity).
 * Proibido: respostas fictícias ou caminhos de negócio aqui.
 */
export const REQUEST_TIMEOUT_MS = 10_000

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

type TokenProvider = () => string | null
type UnauthorizedListener = (error: AppError, hadCredential: boolean) => void

let tokenProvider: TokenProvider = () => null
const unauthorizedListeners = new Set<UnauthorizedListener>()

/** Identity registra de onde vem o token atual. */
export function setAuthTokenProvider(provider: TokenProvider) {
  tokenProvider = provider
}

/** Identity assina 401 para tratar expiração de sessão. Retorna a função de cancelamento. */
export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

http.interceptors.request.use((config) => {
  const token = tokenProvider()
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const appError = normalizeError(error)
    if (appError.kind === 'unauthenticated') {
      const config = (error as AxiosError).config
      const hadCredential = Boolean(config?.headers?.has?.('Authorization'))
      unauthorizedListeners.forEach((listener) => listener(appError, hadCredential))
    }
    return Promise.reject(appError)
  },
)

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (axios.isCancel(error)) {
    return new AppError({ kind: 'network', message: 'Requisição cancelada.' })
  }
  if (error instanceof AxiosError) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return new AppError({ kind: 'network', message: 'A requisição demorou demais. Tente novamente.', timedOut: true })
    }
    const response = error.response
    if (!response) {
      return new AppError({ kind: 'network', message: defaultErrorMessages.network })
    }
    const parsed = apiErrorSchema.safeParse(response.data)
    const code = parsed.success ? parsed.data.error.code : undefined
    const kind = kindFromStatus(response.status, code)
    return new AppError({
      kind,
      code,
      status: response.status,
      message: parsed.success ? parsed.data.error.message : defaultErrorMessages[kind],
      fields: parsed.success ? parsed.data.error.fields : undefined,
      details: parsed.success ? parsed.data.error.details : undefined,
    })
  }
  return new AppError({ kind: 'network', message: defaultErrorMessages.network })
}

/**
 * Requisição tipada: valida a resposta com o schema do contrato.
 * Resposta fora do contrato vira `transient` (não deixa DTO inválido vazar para o domínio).
 */
export async function request<T>(schema: ZodType<T>, config: AxiosRequestConfig): Promise<T> {
  const response = await http.request(config)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) {
    if (import.meta.env.DEV) console.error('[http] resposta fora do contrato', config.url, parsed.error)
    throw new AppError({ kind: 'transient', message: 'Resposta inesperada do servidor.', status: response.status })
  }
  return parsed.data
}

/** Requisição sem corpo de resposta (204). */
export async function requestVoid(config: AxiosRequestConfig): Promise<void> {
  await http.request(config)
}
