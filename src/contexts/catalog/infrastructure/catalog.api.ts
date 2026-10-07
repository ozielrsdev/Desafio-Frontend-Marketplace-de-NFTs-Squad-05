import { http } from '@/shared/http/client'
import { PAGE_SIZE, type CatalogSearch } from '../domain/catalog-search'
import type { NftId } from '../domain/nft'
import { nftDtoSchema, nftPageDtoSchema } from './catalog.dto'
import { toNft, toNftPage } from './catalog.mapper'

export async function fetchNfts(search: CatalogSearch, signal?: AbortSignal) {
  const { data } = await http.get('/nfts', { params: { ...search, pageSize: PAGE_SIZE }, signal })
  return toNftPage(nftPageDtoSchema.parse(data))
}

export async function fetchFeaturedNfts(signal?: AbortSignal) {
  const { data } = await http.get('/nfts/featured', { signal })
  return nftPageDtoSchema.shape.items.parse(data).map(toNft)
}

export async function fetchNft(id: NftId, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(id)}`, { signal })
  return toNft(nftDtoSchema.parse(data))
}
