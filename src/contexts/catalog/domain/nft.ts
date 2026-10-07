import { Money } from '@/shared/money'

export type NftId = string & { readonly __brand: 'NftId' }
export const NftId = (v: string) => v as NftId

export const CATEGORIES = ['arte', 'fotografia', 'musica', 'jogos', 'colecionaveis'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  arte: 'Arte',
  fotografia: 'Fotografia',
  musica: 'Música',
  jogos: 'Jogos',
  colecionaveis: 'Colecionáveis',
}

export interface Edition {
  id: string
  label: string
  total: number
  available: number
}

export interface Nft {
  id: NftId
  title: string
  description: string
  creator: { name: string; avatarUrl: string }
  category: Category
  price: Money
  images: { src: string; alt: string }[]
  editions: Edition[]
  featured: boolean
  version: number
}

export const MAX_QUANTITY_PER_PURCHASE = 10

export const totalAvailable = (nft: Nft) => nft.editions.reduce((s, e) => s + e.available, 0)
export const isSoldOut = (nft: Nft) => totalAvailable(nft) === 0

/** Quantidade máxima compravel de uma edição: limitada por estoque e por teto de compra. */
export const maxQuantity = (edition: Edition) => Math.min(edition.available, MAX_QUANTITY_PER_PURCHASE)

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const totalPages = (p: Page<unknown>) => Math.max(1, Math.ceil(p.total / p.pageSize))
