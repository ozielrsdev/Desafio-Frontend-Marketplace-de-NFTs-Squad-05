import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginPage, redirectIfAuthenticated, RegisterPage, requireAuth } from '@/contexts/identity'
import { ProfilePage } from '@/contexts/profile'
import { RootLayout } from './layout/RootLayout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { WalletsPlaceholderPage } from './pages/WalletsPlaceholderPage'

export interface RouterContext {
  queryClient: QueryClient
}

const title = (page: string) => ({ meta: [{ title: `${page} · NFT Marketplace` }] })

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [{ title: 'NFT Marketplace' }],
  }),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  head: () => title('Início'),
})

/** `returnTo` só é usado depois de `safeReturnTo` (sem open redirect). Valores inválidos são descartados. */
const authSearchSchema = z.object({
  returnTo: z.string().optional().catch(undefined),
  reason: z.enum(['expired']).optional().catch(undefined),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfAuthenticated,
  head: () => title('Entrar'),
  component: function LoginRoute() {
    const { returnTo, reason } = loginRoute.useSearch()
    return <LoginPage returnTo={returnTo} reason={reason} />
  },
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastro',
  validateSearch: authSearchSchema.pick({ returnTo: true }),
  beforeLoad: redirectIfAuthenticated,
  head: () => title('Criar conta'),
  component: function RegisterRoute() {
    const { returnTo } = registerRoute.useSearch()
    return <RegisterPage returnTo={returnTo} />
  },
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  beforeLoad: requireAuth,
  head: () => title('Meu perfil'),
  component: ProfilePage,
})

// Wallets é do Dev 3 (docs/PLANO.md): rota privada já registrada para o menu da conta.
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carteiras',
  beforeLoad: requireAuth,
  head: () => title('Carteiras'),
  component: WalletsPlaceholderPage,
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, registerRoute, profileRoute, walletsRoute])

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    // Dados vêm do TanStack Query; o cache do loader do Router fica desligado.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
