import { describe, expect, it } from 'vitest'
import { activateScenario, matchFailure, nextLatency } from './runtime'

describe('runtime de cenários', () => {
  it('falha com `times` deixa de valer após N requisições (recuperação por retry)', () => {
    activateScenario('server-error')
    const hits = Array.from({ length: 4 }, () => matchFailure('GET', '/nfts'))
    expect(hits.map((rule) => rule?.status ?? null)).toEqual([500, 500, 500, null])
    expect(matchFailure('POST', '/nfts')).toBeNull()
  })

  it('latência variável é reproduzível após reativar o cenário', () => {
    activateScenario('variable-latency')
    const first = Array.from({ length: 5 }, nextLatency)
    activateScenario('variable-latency')
    expect(Array.from({ length: 5 }, nextLatency)).toEqual(first)
    expect(new Set(first).size).toBeGreaterThan(1)
  })

  it('curinga casa caminhos aninhados', () => {
    activateScenario('favorites-fail')
    expect(matchFailure('PUT', '/favorites/nft_01')?.status).toBe(500)
    expect(matchFailure('GET', '/favorites')).toBeNull()
  })

  it('cenário desconhecido cai no padrão', () => {
    expect(activateScenario('nao-existe').id).toBe('default')
  })
})
