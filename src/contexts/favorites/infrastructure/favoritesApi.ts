import { favoritesSchema } from '@/shared/contracts'
import { request } from '@/shared/http'
import type { NftId } from '@/shared/ids'
import { toFavoriteSet, type FavoriteSet } from '../domain/favoriteSet'

export const favoritesApi = {
  async list(signal?: AbortSignal): Promise<FavoriteSet> {
    const dto = await request(favoritesSchema, { method: 'GET', url: '/favorites', signal })
    return toFavoriteSet(dto.nftIds)
  },
  async set(nftId: NftId, favorite: boolean): Promise<FavoriteSet> {
    const dto = await request(favoritesSchema, {
      method: favorite ? 'PUT' : 'DELETE',
      url: `/favorites/${encodeURIComponent(nftId)}`,
    })
    return toFavoriteSet(dto.nftIds)
  },
}
