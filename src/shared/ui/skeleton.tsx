import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * Skeleton com shimmer (README §8). Dê sempre as dimensões do conteúdo real (CLS ≈ 0).
 * Com `prefers-reduced-motion`, o shimmer é desligado pelo CSS global.
 */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--shimmer-base)_25%,var(--shimmer-highlight)_50%,var(--shimmer-base)_75%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
