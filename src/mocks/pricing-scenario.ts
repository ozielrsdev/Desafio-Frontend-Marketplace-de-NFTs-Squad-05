/**
 * Cenários do contexto Pricing. Quando o motor de cenários do Mocking (Dev 1) entrar,
 * este módulo vira um override registrado nele; a API de controle permanece a mesma.
 */
export interface PricingScenario {
  /** Preço do item n1 sobe 50% e a API sinaliza `price_changed`. */
  priceChanged: boolean
  /** Edição do item n2 esgotada (disponível = 0). */
  soldOut: boolean
  /** Latência artificial (ms) das cotações. */
  latencyMs: number
}

const DEFAULT: PricingScenario = { priceChanged: false, soldOut: false, latencyMs: 0 }
let current: PricingScenario = { ...DEFAULT }

export const pricingScenario = {
  get: (): PricingScenario => current,
  set: (patch: Partial<PricingScenario>) => {
    current = { ...current, ...patch }
  },
  reset: () => {
    current = { ...DEFAULT }
  },
}
