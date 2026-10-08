import type { ErrorCode } from '@/shared/contracts'
import type { MockDbState } from '../db/schema'

/**
 * Cenários determinísticos (README §6 / docs/specs/mocking.md).
 * Cenário = comportamento de rede (latência + falhas) + flags de negócio + ajuste do seed.
 * Selecione por `VITE_MOCK_SCENARIO`, `?scenario=<id>`, painel de mocks ou `window.__mocks.setScenario(id)`.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface FailureRule {
  /** Método HTTP (omitido = qualquer). */
  method?: HttpMethod
  /** Caminho relativo à base da API, com `*` como curinga. Ex.: `/nfts*`, `/favorites/*`. */
  path: string
  /** `status`: responde erro HTTP; `network`: falha de conexão; `timeout`: segura a resposta além do timeout do cliente. */
  type: 'status' | 'network' | 'timeout'
  status?: number
  code?: ErrorCode
  message?: string
  /** Aplica apenas nas N primeiras requisições que casarem (depois volta ao normal). Omitido = sempre. */
  times?: number
  /** Probabilidade (0–1) com PRNG determinístico. Omitido = 1. */
  probability?: number
}

export interface ScenarioFlags {
  /** Validade de sessões novas. */
  sessionTtlMs: number
  /** Resultado do pagamento simulado (Ordering). */
  paymentResult: 'confirmed' | 'rejected'
  /** Atraso até o pedido sair de `pending` (Ordering). */
  paymentDelayMs: number
  /** Primeira criação de pedido grava o pedido mas responde após o timeout do cliente (Ordering). */
  orderTimeoutOnce: boolean
  /** Preço muda entre a cotação e o pedido (Pricing/Ordering). */
  priceChangeOnCheckout: boolean
  /** Edição esgota entre a cotação e o pedido (Pricing/Ordering). */
  soldOutOnCheckout: boolean
  /** Carteira recusa a conexão simulada (Wallets). */
  walletRejects: boolean
}

export interface Scenario {
  id: string
  label: string
  description: string
  /** Latência em ms (min = max → fixa). Sorteio com PRNG determinístico. */
  latency: { min: number; max: number }
  failures: FailureRule[]
  flags: ScenarioFlags
  /** Ajustes no estado inicial aplicados no reset. */
  seed?: (state: MockDbState) => void
}

const SESSION_TTL_DEFAULT = 30 * 60_000

export const defaultFlags: ScenarioFlags = {
  sessionTtlMs: SESSION_TTL_DEFAULT,
  paymentResult: 'confirmed',
  paymentDelayMs: 2000,
  orderTimeoutOnce: false,
  priceChangeOnCheckout: false,
  soldOutOnCheckout: false,
  walletRejects: false,
}

const define = (scenario: Omit<Scenario, 'flags' | 'failures'> & { flags?: Partial<ScenarioFlags>; failures?: FailureRule[] }): Scenario => ({
  ...scenario,
  failures: scenario.failures ?? [],
  flags: { ...defaultFlags, ...scenario.flags },
})

export const scenarios: Scenario[] = [
  define({
    id: 'default',
    label: 'Padrão',
    description: 'Sucesso em tudo, latência fixa curta. Usado por Lighthouse e regressão visual.',
    latency: { min: 150, max: 150 },
  }),
  define({
    id: 'empty',
    label: 'Catálogo vazio',
    description: 'Nenhum NFT cadastrado (resultado vazio).',
    latency: { min: 150, max: 150 },
    seed: (state) => {
      state.nfts = []
      state.favorites = {}
    },
  }),
  define({
    id: 'slow',
    label: 'Rede lenta',
    description: 'Latência fixa de 2,5 s (skeletons visíveis).',
    latency: { min: 2500, max: 2500 },
  }),
  define({
    id: 'variable-latency',
    label: 'Latência variável',
    description: 'Latência entre 100 ms e 2,5 s: provoca respostas fora de ordem.',
    latency: { min: 100, max: 2500 },
  }),
  define({
    id: 'offline',
    label: 'Sem conexão',
    description: 'Toda requisição REST falha por conexão.',
    latency: { min: 100, max: 100 },
    failures: [{ path: '*', type: 'network' }],
  }),
  define({
    id: 'server-error',
    label: 'Erro 500 recuperável',
    description: 'As 3 primeiras leituras do catálogo e do perfil respondem 500; depois voltam ao normal (retry).',
    latency: { min: 150, max: 150 },
    failures: [
      { method: 'GET', path: '/nfts*', type: 'status', status: 500, code: 'transient', times: 3 },
      { method: 'GET', path: '/profile', type: 'status', status: 500, code: 'transient', times: 3 },
    ],
  }),
  define({
    id: 'flaky',
    label: 'Instável (503)',
    description: '30% das requisições respondem 503 (sequência determinística).',
    latency: { min: 100, max: 600 },
    failures: [{ path: '*', type: 'status', status: 503, code: 'transient', probability: 0.3 }],
  }),
  define({
    id: 'session-expired',
    label: 'Sessão curta',
    description: 'Sessões expiram 20 s após o login (expiração durante navegação/checkout).',
    latency: { min: 150, max: 150 },
    flags: { sessionTtlMs: 20_000 },
  }),
  define({
    id: 'forbidden',
    label: 'Acesso não autorizado',
    description: 'Perfil e carteiras respondem 403.',
    latency: { min: 150, max: 150 },
    failures: [
      { path: '/profile*', type: 'status', status: 403, code: 'forbidden' },
      { path: '/wallets*', type: 'status', status: 403, code: 'forbidden' },
    ],
  }),
  define({
    id: 'favorites-fail',
    label: 'Falha em favoritos',
    description: 'Favoritar/desfavoritar responde 500 (rollback otimista).',
    latency: { min: 300, max: 300 },
    failures: [
      { method: 'PUT', path: '/favorites/*', type: 'status', status: 500, code: 'transient' },
      { method: 'DELETE', path: '/favorites/*', type: 'status', status: 500, code: 'transient' },
    ],
  }),
  define({
    id: 'price-change',
    label: 'Preço alterado no checkout',
    description: 'O preço muda entre a cotação e a confirmação do pedido.',
    latency: { min: 150, max: 150 },
    flags: { priceChangeOnCheckout: true },
  }),
  define({
    id: 'sold-out',
    label: 'Edição esgotada no checkout',
    description: 'A edição esgota entre a cotação e a confirmação do pedido.',
    latency: { min: 150, max: 150 },
    flags: { soldOutOnCheckout: true },
  }),
  define({
    id: 'order-timeout',
    label: 'Timeout após criar pedido',
    description: 'O primeiro POST /orders grava o pedido e responde depois do timeout; o reenvio com a mesma chave recupera o mesmo pedido.',
    latency: { min: 150, max: 150 },
    flags: { orderTimeoutOnce: true },
  }),
  define({
    id: 'payment-rejected',
    label: 'Pagamento recusado',
    description: 'Pedidos terminam como recusados.',
    latency: { min: 150, max: 150 },
    flags: { paymentResult: 'rejected' },
  }),
  define({
    id: 'wallet-rejects',
    label: 'Carteira recusa conexão',
    description: 'A conexão simulada da carteira é recusada.',
    latency: { min: 150, max: 150 },
    flags: { walletRejects: true },
  }),
]

export const DEFAULT_SCENARIO_ID = 'default'

export function findScenario(id: string | null | undefined): Scenario {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0]!
}
