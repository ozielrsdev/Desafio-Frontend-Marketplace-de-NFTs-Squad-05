import { delay, http, HttpResponse } from 'msw'
import { buildNftFixtures } from './fixtures'
import { getScenario } from './scenarios'
import type { NftDto } from '@/contexts/catalog/infrastructure/catalog.dto'

const db: NftDto[] = buildNftFixtures()
let flakyCalls = 0

const num = (v: string) => Number(v)

/** Aplica latência/falhas do cenário ativo. Retorna uma Response de falha ou null para seguir. */
async function applyScenario(): Promise<Response | null> {
  const scenario = getScenario()
  switch (scenario) {
    case 'slow':
      await delay(2500)
      return null
    case 'jittery':
      await delay(200 + Math.floor(Math.random() * 2200))
      return null
    case 'server-error':
      await delay(300)
      return HttpResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 })
    case 'offline':
      return HttpResponse.error()
    case 'flaky':
      flakyCalls += 1
      await delay(300)
      return flakyCalls % 3 === 0 ? null : HttpResponse.json({ message: 'Serviço indisponível.' }, { status: 503 })
    default:
      await delay(250)
      return null
  }
}

function filterAndSort(params: URLSearchParams) {
  const q = params.get('q')?.toLowerCase().trim()
  const category = params.get('category')
  const min = params.get('minPrice')
  const max = params.get('maxPrice')
  const onlyAvailable = params.get('available') === 'true'
  const sort = params.get('sort') ?? 'recent'

  let items = db.filter((n) => {
    if (q && !`${n.title} ${n.creator.name}`.toLowerCase().includes(q)) return false
    if (category && n.category !== category) return false
    if (min && num(n.price) < num(min)) return false
    if (max && num(n.price) > num(max)) return false
    if (onlyAvailable && n.editions.every((e) => e.available === 0)) return false
    return true
  })
  const byPrice = (a: NftDto, b: NftDto) => num(a.price) - num(b.price)
  items = [...items].sort(
    sort === 'price-asc' ? byPrice : sort === 'price-desc' ? (a, b) => byPrice(b, a) : sort === 'name' ? (a, b) => a.title.localeCompare(b.title, 'pt-BR') : (a, b) => b.id.localeCompare(a.id),
  )
  return items
}

export const handlers = [
  http.get('/api/nfts/featured', async () => {
    const fail = await applyScenario()
    if (fail) return fail
    if (getScenario() === 'empty') return HttpResponse.json([])
    return HttpResponse.json(db.filter((n) => n.featured))
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    const fail = await applyScenario()
    if (fail) return fail
    const nft = db.find((n) => n.id === params.id)
    return nft ? HttpResponse.json(nft) : HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
  }),

  http.get('/api/nfts', async ({ request }) => {
    const fail = await applyScenario()
    if (fail) return fail
    const params = new URL(request.url).searchParams
    const pageSize = Math.min(48, Math.max(1, Number(params.get('pageSize') ?? 12)))
    const all = getScenario() === 'empty' ? [] : filterAndSort(params)
    const pages = Math.max(1, Math.ceil(all.length / pageSize))
    const page = Math.min(Math.max(1, Number(params.get('page') ?? 1)), pages)
    return HttpResponse.json({ items: all.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: all.length })
  }),
]
