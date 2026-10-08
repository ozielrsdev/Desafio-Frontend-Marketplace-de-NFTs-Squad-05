import type { QueryClient } from '@tanstack/react-query'
import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { sessionQueryOptions } from '../application/session'
import { safeReturnTo } from '../domain/returnTo'

interface GuardArgs {
  context: { queryClient: QueryClient }
  location: ParsedLocation
}

/**
 * `beforeLoad` das rotas privadas (checkout, confirmação, perfil, carteiras, pedidos).
 * Visitante → /login com `returnTo` interno validado.
 */
export async function requireAuth({ context, location }: GuardArgs) {
  const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
  if (!session) {
    throw redirect({ to: '/login', search: { returnTo: safeReturnTo(location.href) } })
  }
  return { session }
}

/** `beforeLoad` de login/cadastro: usuário autenticado volta ao destino. */
export async function redirectIfAuthenticated({ context, location }: GuardArgs) {
  const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
  if (session) {
    const returnTo = (location.search as { returnTo?: string }).returnTo
    throw redirect({ href: safeReturnTo(returnTo) })
  }
}
