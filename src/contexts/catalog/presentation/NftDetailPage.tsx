import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { buttonVariants } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/state-views'
import { Skeleton } from '@/shared/ui/skeleton'
import { ApiError } from '@/shared/http/errors'
import { useDocumentTitle } from '@/shared/lib/use-document-title'
import { cn } from '@/shared/lib/utils'
import { useNft } from '../application/catalog.queries'
import { CATEGORY_LABEL, NftId, isSoldOut } from '../domain/nft'
import { Gallery, GallerySkeleton } from './Gallery'
import { PurchasePanel } from './PurchasePanel'

const Back = () => (
  <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-muted hover:text-foreground">
    <ArrowLeft aria-hidden className="size-4" /> Voltar ao catálogo
  </Link>
)

export function NotFoundNft() {
  useDocumentTitle('NFT não encontrado')
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">NFT não encontrado</h1>
      <p className="text-muted">O item que você procura não existe ou foi removido.</p>
      <Link to="/" className={cn(buttonVariants())}>Ir para o catálogo</Link>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2" aria-busy="true" aria-label="Carregando detalhes do NFT">
      <GallerySkeleton />
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-12 w-4/5" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

export function NftDetailPage() {
  const { nftId } = useParams({ strict: false }) as { nftId: string }
  const { data: nft, isPending, isError, error, refetch, isFetching } = useNft(NftId(nftId))
  useDocumentTitle(nft?.title ?? 'NFT')

  if (isError && error instanceof ApiError && error.kind === 'not_found') return <NotFoundNft />

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <Back />
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isFetching} />
      ) : isPending ? (
        <DetailSkeleton />
      ) : (
        <article className="grid gap-10 lg:grid-cols-2">
          <Gallery images={nft.images} />
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{CATEGORY_LABEL[nft.category]}</Badge>
              {isSoldOut(nft) && <Badge tone="danger">Esgotado</Badge>}
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{nft.title}</h1>
            <div className="flex items-center gap-3">
              <img src={nft.creator.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full" />
              <div>
                <p className="text-xs text-muted">Criador</p>
                <p className="font-semibold">{nft.creator.name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted">Preço atual</p>
              <p className="tabular font-display text-3xl font-bold">{nft.price.format()}</p>
            </div>
            <p className="max-w-prose text-muted">{nft.description}</p>
            <PurchasePanel key={nft.id} nft={nft} />
          </div>
        </article>
      )}
    </div>
  )
}
