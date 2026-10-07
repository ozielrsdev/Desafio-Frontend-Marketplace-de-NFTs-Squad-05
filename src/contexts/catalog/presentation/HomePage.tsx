import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SlidersHorizontal, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogDescription, DialogTitle, DialogTrigger, DrawerContent } from '@/shared/ui/dialog'
import { EmptyState, ErrorState } from '@/shared/ui/state-views'
import { useDocumentTitle } from '@/shared/lib/use-document-title'
import { catalogSearchSchema, clearFilters, hasActiveFilters, PAGE_SIZE, withSearchChange, type CatalogSearch } from '../domain/catalog-search'
import { totalPages } from '../domain/nft'
import { useFeaturedNfts, useNftList } from '../application/catalog.queries'
import { FilterPanel } from './FilterPanel'
import { NftCard, NftCardSkeleton } from './NftCard'
import { Pagination } from './Pagination'

const skeletons = (n: number) => Array.from({ length: n }, (_, i) => <NftCardSkeleton key={i} />)

function useCatalogSearch() {
  const raw = useSearch({ strict: false })
  const navigate = useNavigate()
  const search = catalogSearchSchema.parse(raw)
  const go = (next: CatalogSearch) => navigate({ to: '/', search: next as never })
  return {
    search,
    change: (patch: Partial<CatalogSearch>) => go(withSearchChange(search, patch)),
    clear: () => go(clearFilters(search)),
    setPage: (page: number) => go({ ...search, page }),
  }
}

function SearchBox({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState(value)
  const last = useRef(value)
  // Sincroniza com a URL (voltar/avançar no histórico).
  useEffect(() => { setText(value); last.current = value }, [value])
  // Debounce: evita uma requisição por tecla.
  useEffect(() => {
    if (text === last.current) return
    const t = setTimeout(() => { last.current = text; onCommit(text) }, 350)
    return () => clearTimeout(t)
  }, [text, onCommit])
  return (
    <form role="search" className="relative w-full max-w-xl" onSubmit={(e) => { e.preventDefault(); last.current = text; onCommit(text) }}>
      <label htmlFor="catalog-search" className="sr-only">Buscar NFTs ou criadores</label>
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
      <Input id="catalog-search" type="search" className="pl-12" placeholder="Buscar NFTs ou criadores" value={text} onChange={(e) => setText(e.target.value)} />
    </form>
  )
}

function FeaturedSection() {
  const { data, isPending, isError } = useFeaturedNfts()
  if (isError) return null
  return (
    <section aria-labelledby="featured-title" className="flex flex-col gap-5">
      <h2 id="featured-title" className="font-display text-2xl font-bold">Destaques</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isPending ? skeletons(4) : data?.slice(0, 4).map((n, i) => <NftCard key={n.id} nft={n} priority={i < 2} />)}
      </div>
    </section>
  )
}

export function HomePage() {
  useDocumentTitle('Início')
  const { search, change, clear, setPage } = useCatalogSearch()
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useNftList(search)
  const [drawer, setDrawer] = useState(false)

  const pages = data ? totalPages(data) : 1
  const filtersActive = hasActiveFilters(search)
  const showHighlights = !filtersActive && search.page === 1

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 md:px-8">
      <section className="flex flex-col items-start gap-5">
        <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">Descubra, colecione e negocie arte digital</h1>
        <p className="max-w-2xl text-lg text-muted">Explore NFTs exclusivos de criadores independentes, com preços em ETH e edições limitadas.</p>
        <SearchBox value={search.q ?? ''} onCommit={(q) => change({ q })} />
      </section>

      {showHighlights && <FeaturedSection />}

      <section aria-labelledby="catalog-title" className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <FilterPanel search={search} onChange={change} onClear={clear} />
        </aside>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="catalog-title" className="font-display text-2xl font-bold">Catálogo</h2>
            <div className="flex items-center gap-3">
              <p role="status" aria-live="polite" className="tabular text-sm text-muted">
                {data && !isError ? `${data.total} ${data.total === 1 ? 'resultado' : 'resultados'}` : ''}
              </p>
              <Dialog open={drawer} onOpenChange={setDrawer}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><SlidersHorizontal aria-hidden className="size-4" /> Filtros</Button>
                </DialogTrigger>
                <DrawerContent aria-describedby="filters-desc">
                  <DialogTitle className="text-xl font-bold">Filtros</DialogTitle>
                  <DialogDescription id="filters-desc" className="sr-only">Refine o catálogo por categoria, preço e disponibilidade.</DialogDescription>
                  <FilterPanel search={search} onChange={change} onClear={clear} />
                  <Button onClick={() => setDrawer(false)}>Ver resultados</Button>
                </DrawerContent>
              </Dialog>
            </div>
          </div>

          {isError && !data ? (
            <ErrorState error={error} onRetry={() => refetch()} retrying={isFetching} />
          ) : isPending ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando NFTs">{skeletons(PAGE_SIZE / 2)}</div>
          ) : data.items.length === 0 ? (
            <EmptyState
              title="Nenhum NFT encontrado"
              description="Tente outros termos ou remova alguns filtros para ver mais resultados."
              action={filtersActive ? <Button variant="outline" onClick={clear}>Limpar filtros</Button> : undefined}
            />
          ) : (
            <>
              <div
                className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${isPlaceholderData ? 'opacity-60' : ''}`}
                aria-busy={isPlaceholderData}
              >
                {data.items.map((n, i) => <NftCard key={n.id} nft={n} priority={!showHighlights && i < 3} />)}
              </div>
              <Pagination page={data.page} totalPages={pages} onPage={setPage} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
