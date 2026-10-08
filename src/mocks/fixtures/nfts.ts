import { nftCategories, type NftDto } from '@/shared/contracts'
import { createRandom } from '../lib/random'

/**
 * 48 NFTs determinísticos (seed fixa) — variedade para filtros, ordenação e paginação.
 * Inclui: edições esgotadas, NFT totalmente esgotado, limites por pedido diferentes e destaques.
 */
export const NFT_FIXTURE_SEED = 20261007
export const NFT_FIXTURE_COUNT = 48

const adjectives = ['Cosmic', 'Neon', 'Silent', 'Golden', 'Quantum', 'Lunar', 'Electric', 'Hidden', 'Crystal', 'Velvet', 'Solar', 'Digital']
const nouns = ['Dreams', 'Voyager', 'Garden', 'Pulse', 'Echo', 'Horizon', 'Spirit', 'Machine', 'Bloom', 'Signal', 'Odyssey', 'Prism']

export const creatorFixtures = [
  { id: 'crt_1', name: 'Mira Okafor' },
  { id: 'crt_2', name: 'Theo Lindqvist' },
  { id: 'crt_3', name: 'Yuna Sato' },
  { id: 'crt_4', name: 'Rafael Moreira' },
  { id: 'crt_5', name: 'Isla Fontaine' },
  { id: 'crt_6', name: 'Kofi Mensah' },
  { id: 'crt_7', name: 'Lena Kowalski' },
  { id: 'crt_8', name: 'Diego Navarro' },
].map((creator, index) => ({ ...creator, avatarUrl: `/creators/creator-${index + 1}.svg` }))

const BASE_DATE = Date.UTC(2026, 8, 30, 12, 0, 0)
const DAY = 86_400_000

function price(random: ReturnType<typeof createRandom>): string {
  // 0.01 a 5.00 ETH com até 3 casas, como string decimal.
  const thousandths = random.int(10, 5000)
  return (thousandths / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export function buildNftFixtures(): NftDto[] {
  const random = createRandom(NFT_FIXTURE_SEED)
  return Array.from({ length: NFT_FIXTURE_COUNT }, (_, i) => {
    const index = i + 1
    const code = String(index).padStart(2, '0')
    const title = `${random.pick(adjectives)} ${random.pick(nouns)} #${code}`
    const category = nftCategories[i % nftCategories.length]!
    const creator = creatorFixtures[i % creatorFixtures.length]!
    const editionCount = random.int(1, 3)
    const soldOutEverything = index % 11 === 0
    const editions = Array.from({ length: editionCount }, (_, e) => ({
      id: `ed_${code}_${e + 1}`,
      label: e === 0 ? 'Edição padrão' : e === 1 ? 'Edição colecionador' : 'Edição rara',
      available: soldOutEverything ? 0 : e === 1 && index % 4 === 0 ? 0 : random.int(1, 25),
      maxPerOrder: random.int(1, 5),
    }))
    const gallery = [index, ((index + 6) % NFT_FIXTURE_COUNT) + 1, ((index + 12) % NFT_FIXTURE_COUNT) + 1].map(
      (n) => `/nfts/nft-${String(n).padStart(2, '0')}.svg`,
    )
    return {
      id: `nft_${code}`,
      title,
      description: `${title} é uma obra digital de ${creator.name}, parte da coleção ${category}. Cada edição é única e registrada em rede simulada.`,
      imageUrl: gallery[0]!,
      gallery,
      category,
      creator,
      price: price(random),
      editions,
      featured: index <= 6,
      likes: random.int(0, 900),
      createdAt: new Date(BASE_DATE - i * DAY).toISOString(),
      version: 1,
    }
  })
}
