import type { NftDto } from '@/contexts/catalog/infrastructure/catalog.dto'
import { CATEGORIES } from '@/contexts/catalog/domain/nft'

const CREATORS = ['Aurora Vega', 'Kenji Mori', 'Lúcia Andrade', 'Orion Labs', 'Nadia Rahman', 'Tomás Reis']
const ADJ = ['Cósmico', 'Neon', 'Etéreo', 'Quântico', 'Lunar', 'Prismático', 'Abissal', 'Solar', 'Holográfico', 'Sereno']
const NOUN = ['Horizonte', 'Fragmento', 'Eco', 'Portal', 'Delta', 'Pulso', 'Mirage', 'Vórtice', 'Santuário', 'Cometa']

/** Determinístico: mesmo seed sempre gera o mesmo catálogo (regressão visual estável). */
export function buildNftFixtures(count = 40): NftDto[] {
  return Array.from({ length: count }, (_, idx) => {
    const n = idx + 1
    const id = `nft-${String(n).padStart(2, '0')}`
    const total = 3 + ((n * 7) % 28)
    const available = n % 9 === 0 ? 0 : Math.max(1, total - ((n * 5) % total))
    const priceCents = 5 + ((n * 37) % 480) // 0.05 .. 4.84 ETH
    const price = `${Math.floor(priceCents / 100)}.${String(priceCents % 100).padStart(2, '0')}`
    const creator = CREATORS[n % CREATORS.length]
    const title = `${NOUN[n % NOUN.length]} ${ADJ[(n * 3) % ADJ.length]} #${n}`
    return {
      id,
      title,
      description: `${title} é uma obra digital de edição limitada criada por ${creator}. Cada edição é única e registrada na rede simulada do marketplace.`,
      creator: { name: creator, avatarUrl: `/avatars/creator-${(n % 6) + 1}.svg` },
      category: CATEGORIES[n % CATEGORIES.length],
      price,
      images: [1, 2, 3].map((v) => ({ src: `/nfts/nft-${String(n).padStart(2, '0')}-${v}.svg`, alt: `${title}, vista ${v} de 3` })),
      editions: [
        { id: `${id}-standard`, label: 'Padrão', total, available },
        { id: `${id}-rare`, label: 'Rara', total: 2, available: n % 4 === 0 ? 0 : 2 },
      ],
      featured: n <= 4 || n === 17,
      version: 1,
    }
  })
}
