import type { NftId } from '@/shared/ids'

/** Aggregate leve `FavoriteSet`: conjunto imutável de NftIds por usuário. */
export type FavoriteSet = ReadonlySet<NftId>

export const emptyFavoriteSet = (): FavoriteSet => new Set<NftId>()

export function toFavoriteSet(ids: readonly string[]): FavoriteSet {
  return new Set(ids as NftId[])
}

export function isFavorite(set: FavoriteSet | undefined, nftId: NftId): boolean {
  return Boolean(set?.has(nftId))
}

/** Aplica a intenção do usuário (marcar/desmarcar) sem mutar o conjunto original. */
export function applyFavorite(set: FavoriteSet, nftId: NftId, favorite: boolean): FavoriteSet {
  if (set.has(nftId) === favorite) return set
  const next = new Set(set)
  if (favorite) next.add(nftId)
  else next.delete(nftId)
  return next
}
