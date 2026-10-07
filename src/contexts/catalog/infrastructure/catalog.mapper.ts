import { Money } from '@/shared/money'
import { NftId, type Nft, type Page } from '../domain/nft'
import type { NftDto, NftPageDto } from './catalog.dto'

export const toNft = (dto: NftDto): Nft => ({ ...dto, id: NftId(dto.id), price: Money.eth(dto.price) })

export const toNftPage = (dto: NftPageDto): Page<Nft> => ({ ...dto, items: dto.items.map(toNft) })
