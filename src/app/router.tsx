import { createRootRoute, createRoute, createRouter, Link, stripSearchParams } from '@tanstack/react-router'
import { HomePage, NftDetailPage, catalogSearchSchema, type CatalogSearch } from '@/contexts/catalog'
import { NotFoundNft } from '@/contexts/catalog/presentation/NftDetailPage'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { AppLayout } from './AppLayout'

const rootRoute = createRootRoute({
  component: AppLayout,
  notFoundComponent: () => (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Página não encontrada</h1>
      <Link to="/" className={cn(buttonVariants())}>Voltar ao início</Link>
    </div>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Entrada solta (URL arbitrária) → saída tipada e normalizada.
  validateSearch: (raw: Record<string, unknown>): Partial<CatalogSearch> => catalogSearchSchema.parse(raw),
  // URLs limpas: defaults (ordenar por recentes, página 1) não vão para a query string.
  search: { middlewares: [stripSearchParams({ sort: 'recent', page: 1 })] },
  component: HomePage,
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailPage,
  notFoundComponent: NotFoundNft,
})

const routeTree = rootRoute.addChildren([indexRoute, nftRoute])

export const router = createRouter({ routeTree, scrollRestoration: true, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
