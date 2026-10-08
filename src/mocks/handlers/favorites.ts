import type { FavoritesDto } from '@/shared/contracts'
import { db } from '../db/store'
import { apiError, ok } from '../engine/respond'
import { authedRoute } from '../engine/route'

/** Favorites — docs/specs/favorites.md. PUT/DELETE são idempotentes. */

function favoritesOf(userId: string): FavoritesDto {
  return { nftIds: [...(db.read().favorites[userId] ?? [])] }
}

const nftExists = (nftId: string) => db.read().nfts.some((nft) => nft.id === nftId)

export const favoritesHandlers = [
  authedRoute('GET', '/favorites', ({ user }) => ok(favoritesOf(user.id))),

  authedRoute<{ nftId: string }>('PUT', '/favorites/:nftId', ({ params, user }) => {
    if (!nftExists(params.nftId)) return apiError(404, 'not_found', 'NFT não encontrado.')
    db.write((draft) => {
      const current = draft.favorites[user.id] ?? []
      if (!current.includes(params.nftId)) draft.favorites[user.id] = [...current, params.nftId]
    })
    return ok(favoritesOf(user.id))
  }),

  authedRoute<{ nftId: string }>('DELETE', '/favorites/:nftId', ({ params, user }) => {
    db.write((draft) => {
      draft.favorites[user.id] = (draft.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    })
    return ok(favoritesOf(user.id))
  }),
]
