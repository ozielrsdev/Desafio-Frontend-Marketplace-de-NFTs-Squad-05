import { z } from 'zod'
import { idSchema } from './common'

/**
 * Favorites — GET /favorites, PUT /favorites/:nftId (idempotente), DELETE /favorites/:nftId.
 * Todas respondem 200 com o conjunto atualizado. 404 not_found para NFT inexistente.
 */
export const favoritesSchema = z.object({
  nftIds: z.array(idSchema),
})
export type FavoritesDto = z.infer<typeof favoritesSchema>
