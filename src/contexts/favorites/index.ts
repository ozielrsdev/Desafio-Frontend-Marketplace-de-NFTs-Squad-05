/** API pública do contexto Favorites. Catalog usa `FavoriteButton` e/ou `useIsFavorite`. */
export type { FavoriteSet } from './domain/favoriteSet'
export { favoritesKeys, favoritesQueryOptions, useFavorites, useIsFavorite, useToggleFavorite } from './application/hooks'
export { FavoriteButton } from './presentation/FavoriteButton'
