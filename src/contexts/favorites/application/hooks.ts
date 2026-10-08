import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUserId } from '@/contexts/identity'
import { announce } from '@/shared/a11y/announcer'
import type { AppError } from '@/shared/errors'
import type { NftId, UserId } from '@/shared/ids'
import { applyFavorite, emptyFavoriteSet, isFavorite, type FavoriteSet } from '../domain/favoriteSet'
import { favoritesApi } from '../infrastructure/favoritesApi'

export const favoritesKeys = {
  all: ['favorites'] as const,
  list: (userId: UserId | null) => [...favoritesKeys.all, userId] as const,
}

const TOGGLE_MUTATION_KEY = ['favorites', 'toggle'] as const

export const favoritesQueryOptions = (userId: UserId | null) =>
  queryOptions({
    queryKey: favoritesKeys.list(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

export function useFavorites() {
  const userId = useCurrentUserId()
  return useQuery(favoritesQueryOptions(userId))
}

/** Catalog consome só isto: o estado de favorito de um NFT (docs/specs/favorites.md). */
export function useIsFavorite(nftId: NftId): boolean {
  const { data } = useFavorites()
  return isFavorite(data, nftId)
}

interface ToggleVariables {
  favorite: boolean
  /** Nome exibido nos anúncios acessíveis. */
  title: string
}

/**
 * Favoritar/desfavoritar com atualização otimista e rollback (README §4, mínimo obrigatório).
 * - `scope` serializa as mutations do mesmo NFT: cliques rápidos são aplicados em ordem, sem corrida.
 * - O snapshot é desfeito apenas para o NFT afetado, preservando outros toggles em voo.
 */
export function useToggleFavorite(nftId: NftId) {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  const key = favoritesKeys.list(userId)

  return useMutation<FavoriteSet, AppError, ToggleVariables, { previous: boolean }>({
    mutationKey: TOGGLE_MUTATION_KEY,
    scope: { id: `favorite:${nftId}` },
    mutationFn: ({ favorite }) => favoritesApi.set(nftId, favorite),
    onMutate: async ({ favorite, title }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const current = queryClient.getQueryData<FavoriteSet>(key) ?? emptyFavoriteSet()
      queryClient.setQueryData<FavoriteSet>(key, applyFavorite(current, nftId, favorite))
      announce(favorite ? `${title} adicionado aos favoritos.` : `${title} removido dos favoritos.`)
      return { previous: isFavorite(current, nftId) }
    },
    onError: (_error, { title, favorite }, context) => {
      if (context) {
        queryClient.setQueryData<FavoriteSet>(key, (set) => applyFavorite(set ?? emptyFavoriteSet(), nftId, context.previous))
      }
      announce(`${favoriteErrorMessage(favorite, title)} O estado anterior foi restaurado.`, 'assertive')
    },
    onSettled: () => {
      // Só sincroniza com o servidor quando não há outro toggle pendente (evita piscar estados intermediários).
      if (queryClient.isMutating({ mutationKey: TOGGLE_MUTATION_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function favoriteErrorMessage(favorite: boolean, title: string) {
  return favorite ? `Não foi possível favoritar ${title}.` : `Não foi possível remover ${title} dos favoritos.`
}
