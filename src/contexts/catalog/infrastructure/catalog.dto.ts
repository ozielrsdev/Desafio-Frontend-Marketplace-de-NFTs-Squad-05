import { z } from 'zod'
import { CATEGORIES } from '../domain/nft'

const decimal = z.string().regex(/^\d+(\.\d+)?$/)

export const nftDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  creator: z.object({ name: z.string(), avatarUrl: z.string() }),
  category: z.enum(CATEGORIES),
  price: decimal,
  images: z.array(z.object({ src: z.string(), alt: z.string() })).min(1),
  editions: z.array(z.object({ id: z.string(), label: z.string(), total: z.number().int(), available: z.number().int() })),
  featured: z.boolean(),
  version: z.number().int(),
})
export type NftDto = z.infer<typeof nftDtoSchema>

export const nftPageDtoSchema = z.object({
  items: z.array(nftDtoSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
})
export type NftPageDto = z.infer<typeof nftPageDtoSchema>
