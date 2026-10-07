import { z } from 'zod'
import { CATEGORIES } from './nft'

export const SORT_OPTIONS = ['recent', 'price-asc', 'price-desc', 'name'] as const
export const SORT_LABEL: Record<(typeof SORT_OPTIONS)[number], string> = {
  recent: 'Mais recentes',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A–Z)',
}

export const PAGE_SIZE = 12

// O Router faz JSON.parse dos valores da URL ("1.5" vira number): coerce devolve string decimal.
const decimal = z.coerce.string().regex(/^\d+(\.\d+)?$/)

/**
 * Estado de busca vivendo na URL. Valores inválidos caem para o default (`catch`),
 * então URLs adulteradas nunca quebram a tela.
 */
export const catalogSearchSchema = z.object({
  q: z.coerce.string().trim().max(80).optional().catch(undefined),
  category: z.enum(CATEGORIES).optional().catch(undefined),
  minPrice: decimal.optional().catch(undefined),
  maxPrice: decimal.optional().catch(undefined),
  available: z.boolean().optional().catch(undefined),
  sort: z.enum(SORT_OPTIONS).catch('recent'),
  page: z.coerce.number().int().min(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const FILTER_KEYS = ['category', 'minPrice', 'maxPrice', 'available'] as const

export const hasActiveFilters = (s: CatalogSearch) =>
  Boolean(s.q) || FILTER_KEYS.some((k) => s[k] !== undefined)

/** Qualquer mudança de busca/filtro/ordenação reinicia a paginação. */
export function withSearchChange(current: CatalogSearch, patch: Partial<CatalogSearch>): CatalogSearch {
  const next = { ...current, ...patch, page: 1 }
  for (const k of Object.keys(next) as (keyof CatalogSearch)[]) {
    if (next[k] === undefined || next[k] === '') delete next[k]
  }
  return next as CatalogSearch
}

export const clearFilters = (s: CatalogSearch): CatalogSearch => ({ sort: s.sort, page: 1 })
