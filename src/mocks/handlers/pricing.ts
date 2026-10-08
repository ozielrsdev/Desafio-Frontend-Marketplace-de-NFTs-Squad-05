import Decimal from 'decimal.js'
import { delay, http, HttpResponse } from 'msw'
import { quoteRequestDto, type QuoteResponseDto } from '@/contexts/pricing/infrastructure/dto'
import { pricingScenario } from '../pricing-scenario'

type Network = 'ethereum' | 'polygon' | 'arbitrum'

const CATALOG: Record<string, { title: string; unitPrice: string; available: number }> = {
  'n1:e1': { title: 'Aurora #001', unitPrice: '0.1', available: 5 },
  'n2:e1': { title: 'Bruma #014', unitPrice: '0.2', available: 1 },
  'n3:e1': { title: 'Cinza #230', unitPrice: '1.15', available: 10 },
}

/** Taxa de rede por rede escolhida (contrato). */
const NETWORK_FEE: Record<Network, string> = { ethereum: '0.003', polygon: '0.0005', arbitrum: '0.0012' }

/** Cupons: percentual sobre o subtotal; `onlyNft` restringe a aplicabilidade. */
const COUPONS: Record<string, { percent: string; expired?: boolean; onlyNft?: string }> = {
  PROMO10: { percent: '0.1' },
  METADE: { percent: '0.5' },
  VELHO20: { percent: '0.2', expired: true },
  RARO15: { percent: '0.15', onlyNft: 'n3' },
}

let version = 0

/** Cotações emitidas, para o handler de pedidos validar obsolescência (409 stale_quote). */
const issued = new Map<string, { quote: QuoteResponseDto; stamp: string }>()
const stamp = () => {
  const { priceChanged, soldOut } = pricingScenario.get()
  return `${priceChanged}:${soldOut}`
}
export const getIssuedQuote = (id: string) => issued.get(id)?.quote ?? null
/** Uma cotação é vigente se emitida sob o mesmo estado de preço/disponibilidade de agora. */
export const isQuoteCurrent = (id: string) => issued.get(id)?.stamp === stamp()

export const pricingHandlers = [
  http.post('/api/quotes', async ({ request }) => {
    const scenario = pricingScenario.get()
    if (scenario.latencyMs) await delay(scenario.latencyMs)

    const body = quoteRequestDto.safeParse(await request.json())
    if (!body.success) return HttpResponse.json({ code: 'validation', message: 'Requisição inválida' }, { status: 400 })
    const { items, couponCode, network } = body.data

    // Preço/disponibilidade vigentes (cenários podem alterá-los).
    const issues: QuoteResponseDto['issues'] = []
    const lines = items.map((req) => {
      const base = CATALOG[`${req.nftId}:${req.editionId}`]
      if (!base) return null
      let unit = new Decimal(base.unitPrice)
      let available = base.available
      if (scenario.priceChanged && req.nftId === 'n1') {
        unit = unit.times('1.5')
        issues.push({ type: 'price_changed', nftId: req.nftId, editionId: req.editionId, previousUnitPrice: base.unitPrice })
      }
      if (scenario.soldOut && req.nftId === 'n2') available = 0
      if (req.quantity > available) {
        issues.push({ type: 'item_unavailable', nftId: req.nftId, editionId: req.editionId, availableQuantity: available })
      }
      return { req, title: base.title, unit, available, line: unit.times(req.quantity) }
    })
    if (lines.includes(null)) return HttpResponse.json({ code: 'validation', message: 'Item inexistente' }, { status: 422 })
    const valid = lines as NonNullable<(typeof lines)[number]>[]

    const subtotal = valid.reduce((acc, l) => acc.plus(l.line), new Decimal(0))

    let discount = new Decimal(0)
    if (couponCode) {
      const coupon = COUPONS[couponCode]
      if (!coupon) return HttpResponse.json({ code: 'coupon_invalid' }, { status: 422 })
      if (coupon.expired) return HttpResponse.json({ code: 'coupon_expired' }, { status: 422 })
      if (coupon.onlyNft && !items.some((i) => i.nftId === coupon.onlyNft)) {
        return HttpResponse.json({ code: 'coupon_not_applicable' }, { status: 422 })
      }
      const base = coupon.onlyNft
        ? valid.filter((l) => l.req.nftId === coupon.onlyNft).reduce((a, l) => a.plus(l.line), new Decimal(0))
        : subtotal
      discount = Decimal.min(base.times(coupon.percent), subtotal)
    }

    const fee = new Decimal(NETWORK_FEE[network])
    const total = subtotal.minus(discount).plus(fee)

    version += 1
    const response: QuoteResponseDto = {
      quoteId: `q_${version}`,
      version,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      items: valid.map((l) => ({
        nftId: l.req.nftId,
        editionId: l.req.editionId,
        title: l.title,
        quantity: l.req.quantity,
        unitPrice: l.unit.toFixed(),
        lineTotal: l.line.toFixed(),
        availableQuantity: l.available,
      })),
      subtotal: subtotal.toFixed(),
      discount: discount.toFixed(),
      networkFee: fee.toFixed(),
      total: total.toFixed(),
      appliedCoupon: couponCode,
      issues,
    }
    issued.set(response.quoteId, { quote: response, stamp: stamp() })
    return HttpResponse.json(response)
  }),
]
