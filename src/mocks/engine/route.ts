import { delay, http, HttpResponse, type DefaultBodyType, type HttpResponseResolver, type PathParams } from 'msw'
import { REQUEST_TIMEOUT_MS } from '@/shared/http'
import { matchFailure, nextLatency } from '../runtime'
import type { HttpMethod } from '../scenarios'
import type { MockUser } from '../db/schema'
import { authenticate } from './auth'
import { apiError } from './respond'

/**
 * Motor dos handlers: toda rota passa por latência + injeção de falhas do cenário ativo
 * antes de chegar ao resolver do contexto. Cada dev escreve seus handlers com `route()`/`authedRoute()`.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

const methods = {
  GET: http.get,
  POST: http.post,
  PUT: http.put,
  PATCH: http.patch,
  DELETE: http.delete,
} as const

type ResolverInfo<Params extends PathParams> = Parameters<HttpResponseResolver<Params, DefaultBodyType>>[0]
type Resolver<Params extends PathParams> = (info: ResolverInfo<Params>) => Response | Promise<Response>
type AuthedResolver<Params extends PathParams> = (
  info: ResolverInfo<Params> & { user: MockUser; token: string },
) => Response | Promise<Response>

/** Executa latência e falhas do cenário. Retorna uma resposta de falha ou `null` para seguir. */
export async function applyNetworkConditions(method: string, path: string): Promise<Response | null> {
  await delay(nextLatency())
  const failure = matchFailure(method, path)
  if (!failure) return null
  if (failure.type === 'network') return HttpResponse.error()
  if (failure.type === 'timeout') {
    await delay(REQUEST_TIMEOUT_MS + 2000)
    return apiError(504, 'transient', 'Tempo de resposta excedido.')
  }
  return apiError(
    failure.status ?? 500,
    failure.code ?? 'transient',
    failure.message ?? 'Falha simulada pelo cenário ativo.',
  )
}

export function route<Params extends PathParams = PathParams>(method: HttpMethod, path: string, resolver: Resolver<Params>) {
  return methods[method]<Params>(`${API_BASE}${path}`, async (info) => {
    const relativePath = new URL(info.request.url).pathname.replace(API_BASE, '') || '/'
    const failure = await applyNetworkConditions(method, relativePath)
    if (failure) return failure
    return resolver(info)
  })
}

/** Rota privada: resolve a sessão (401 unauthenticated | session_expired) antes do resolver. */
export function authedRoute<Params extends PathParams = PathParams>(method: HttpMethod, path: string, resolver: AuthedResolver<Params>) {
  return route<Params>(method, path, (info) => {
    const auth = authenticate(info.request)
    if (!auth.ok) return auth.response
    return resolver({ ...info, user: auth.user, token: auth.token })
  })
}

/** Lê e faz parse do JSON do corpo; corpo inválido vira `undefined` (handler responde 422). */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.clone().json()
  } catch {
    return undefined
  }
}
