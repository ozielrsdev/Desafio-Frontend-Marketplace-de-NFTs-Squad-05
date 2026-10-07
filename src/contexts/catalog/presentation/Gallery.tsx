import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'
import type { Nft } from '../domain/nft'

export function Gallery({ images }: { images: Nft['images'] }) {
  const [index, setIndex] = useState(0)
  const current = images[index] ?? images[0]
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-lg border border-border bg-surface-2">
        <img src={current.src} alt={current.alt} width={800} height={800} fetchPriority="high" className="size-full object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3" aria-label="Miniaturas">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Mostrar vista ${i + 1} de ${images.length}`}
                aria-pressed={i === index}
                className={cn('block aspect-square w-full overflow-hidden rounded-md border-2 transition-colors', i === index ? 'border-primary' : 'border-transparent')}
              >
                <img src={img.src} alt="" width={200} height={200} loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function GallerySkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="aspect-square rounded-lg" />
      <div className="grid grid-cols-4 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square" />)}</div>
    </div>
  )
}
