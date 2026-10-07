import { Link } from '@tanstack/react-router'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { CATEGORY_LABEL, isSoldOut, type Nft } from '../domain/nft'

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const soldOut = isSoldOut(nft)
  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-surface transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none">
      <div className="aspect-square overflow-hidden bg-surface-2">
        <img
          src={nft.images[0].src}
          alt={nft.images[0].alt}
          width={800}
          height={800}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <img src={nft.creator.avatarUrl} alt="" width={24} height={24} className="size-6 rounded-full" />
          <span className="truncate text-sm text-muted">{nft.creator.name}</span>
        </div>
        <h3 className="text-lg font-semibold leading-snug">
          {/* Link esticado: o card inteiro é clicável sem aninhar interativos */}
          <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="after:absolute after:inset-0 focus-visible:after:rounded-lg">
            {nft.title}
          </Link>
        </h3>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted">Preço</p>
            <p className="tabular whitespace-nowrap font-semibold">{nft.price.format()}</p>
          </div>
          {soldOut ? <Badge tone="danger">Esgotado</Badge> : <Badge>{CATEGORY_LABEL[nft.category]}</Badge>}
        </div>
      </div>
    </article>
  )
}

/** Mesmas dimensões do card real para evitar CLS. */
export function NftCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface" aria-hidden="true">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-4/5" />
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
