import { z } from 'zod'
import { idSchema, isoDateSchema, moneySchema, paginatedSchema } from './common'

/**
 * Catalog — GET /nfts, GET /nfts/featured, GET /nfts/:id (404 not_found).
 * Filtros finais devem ser conferidos no Figma pelo dono do contexto (docs/specs/catalog.md).
 */
export const nftCategories = ['art', 'music', 'gaming', 'photography', 'collectibles', 'virtual-worlds'] as const
export const nftSorts = ['recent', 'price_asc', 'price_desc', 'popular'] as const

export const editionSchema = z.object({
  id: idSchema,
  label: z.string(),
  /** Unidades disponíveis para compra. 0 = esgotada. */
  available: z.number().int().min(0),
  /** Limite por pedido. */
  maxPerOrder: z.number().int().min(1),
})
export type EditionDto = z.infer<typeof editionSchema>

export const creatorSchema = z.object({
  id: idSchema,
  name: z.string(),
  avatarUrl: z.string(),
})

export const nftSchema = z.object({
  id: idSchema,
  title: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  gallery: z.array(z.string()),
  category: z.enum(nftCategories),
  creator: creatorSchema,
  price: moneySchema,
  editions: z.array(editionSchema).min(1),
  featured: z.boolean(),
  likes: z.number().int().min(0),
  createdAt: isoDateSchema,
  /** Versão monotônica do recurso (usada pelo Realtime). */
  version: z.number().int().min(1),
})
export type NftDto = z.infer<typeof nftSchema>

/** Query string de GET /nfts (valores chegam como string na URL). */
export const nftListQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(nftCategories).optional(),
  minPrice: moneySchema.optional(),
  maxPrice: moneySchema.optional(),
  onlyAvailable: z.enum(['true', 'false']).optional(),
  sort: z.enum(nftSorts).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
})
export type NftListQueryDto = z.infer<typeof nftListQuerySchema>

export const nftListResponseSchema = paginatedSchema(nftSchema)
export type NftListResponseDto = z.infer<typeof nftListResponseSchema>

export const featuredResponseSchema = z.object({ items: z.array(nftSchema) })
