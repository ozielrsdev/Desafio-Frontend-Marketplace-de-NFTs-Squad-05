import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { isRetryable } from '@/shared/http/errors'
import type { CatalogSearch } from '../domain/catalog-search'
import type { NftId } from '../domain/nft'
import { fetchFeaturedNfts, fetchNft, fetchNfts } from '../infrastructure/catalog.api'

/** Catálogo é público: sem userId na chave. Dados privados (favoritos) vivem em outro contexto. */
export const catalogKeys = {
  all: ['catalog'] as const,
  list: (s: CatalogSearch) => ['catalog', 'list', s] as const,
  featured: () => ['catalog', 'featured'] as const,
  detail: (id: NftId) => ['catalog', 'detail', id] as const,
}

const retry = (count: number, err: unknown) => isRetryable(err) && count < 2

export const nftListOptions = (s: CatalogSearch) =>
  queryOptions({
    queryKey: catalogKeys.list(s),
    queryFn: ({ signal }) => fetchNfts(s, signal),
    placeholderData: keepPreviousData,
    retry,
  })

export const featuredOptions = () =>
  queryOptions({ queryKey: catalogKeys.featured(), queryFn: ({ signal }) => fetchFeaturedNfts(signal), retry })

export const nftDetailOptions = (id: NftId) =>
  queryOptions({ queryKey: catalogKeys.detail(id), queryFn: ({ signal }) => fetchNft(id, signal), retry })

export const useNftList = (s: CatalogSearch) => useQuery(nftListOptions(s))
export const useFeaturedNfts = () => useQuery(featuredOptions())
export const useNft = (id: NftId) => useQuery(nftDetailOptions(id))
