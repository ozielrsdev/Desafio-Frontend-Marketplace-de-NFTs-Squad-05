import { useRouter, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useSession } from '@/contexts/identity'
import type { NftId } from '@/shared/ids'
import { cn } from '@/shared/lib/utils'
import { toast } from '@/shared/ui/sonner'
import { favoriteErrorMessage, useIsFavorite, useToggleFavorite } from '../application/hooks'

interface FavoriteButtonProps {
  nftId: NftId
  /** Título do NFT para rótulos e anúncios acessíveis. */
  nftTitle: string
  className?: string
  /** `icon`: só o coração (cards). `labeled`: coração + texto (detalhe). */
  variant?: 'icon' | 'labeled'
}

/**
 * Toggle de favorito para cards e detalhe (Catalog importa via API pública do contexto).
 * Visitante é levado ao login e volta ao mesmo lugar para refazer a ação.
 */
export function FavoriteButton({ nftId, nftTitle, className, variant = 'icon' }: FavoriteButtonProps) {
  const { isAuthenticated } = useSession()
  const favorite = useIsFavorite(nftId)
  const toggle = useToggleFavorite(nftId)
  const router = useRouter()
  const href = useRouterState({ select: (state) => state.location.href })

  const onClick = (event: React.MouseEvent) => {
    // Cards costumam ser links: o botão não deve navegar para o detalhe.
    event.preventDefault()
    event.stopPropagation()
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para favoritar NFTs.')
      void router.navigate({ to: '/login', search: { returnTo: href } })
      return
    }
    const next = !favorite
    toggle.mutate(
      { favorite: next, title: nftTitle },
      {
        onError: (error) =>
          toast.error(favoriteErrorMessage(next, nftTitle), {
            description: error.message,
            action: { label: 'Tentar novamente', onClick: () => toggle.mutate({ favorite: next, title: nftTitle }) },
          }),
      },
    )
  }

  const label = favorite ? `Remover ${nftTitle} dos favoritos` : `Favoritar ${nftTitle}`

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorite}
      aria-label={variant === 'icon' ? label : undefined}
      title={label}
      data-testid={`favorite-${nftId}`}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-border bg-background/70 px-3 text-sm font-semibold backdrop-blur transition-colors duration-200',
        'hover:border-brand-soft hover:text-brand-soft focus-visible:ring-[3px] focus-visible:ring-ring/60',
        favorite && 'border-primary/70 text-brand-soft',
        className,
      )}
    >
      <Heart className={cn('size-5 transition-transform duration-200', favorite && 'scale-110 fill-current')} aria-hidden="true" />
      {variant === 'labeled' && <span>{favorite ? 'Favoritado' : 'Favoritar'}</span>}
    </button>
  )
}
