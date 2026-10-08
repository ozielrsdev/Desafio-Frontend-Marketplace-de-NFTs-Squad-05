import { createRandom, type Random } from './lib/random'
import { DEFAULT_SCENARIO_ID, findScenario, type FailureRule, type Scenario, type ScenarioFlags } from './scenarios'

/**
 * Estado de execução do mock: cenário ativo, contadores das regras de falha,
 * PRNG determinístico e overrides feitos pela API de controle (testes).
 */
export const SCENARIO_STORAGE_KEY = 'nftm-mock:scenario'
const RANDOM_SEED = 4242

interface RuntimeState {
  scenario: Scenario
  ruleHits: Map<FailureRule, number>
  random: Random
  latencyOverride: { min: number; max: number } | null
  flagOverrides: Partial<ScenarioFlags>
  extraFailures: FailureRule[]
}

function storedScenarioId(): string | null {
  try {
    return window.localStorage.getItem(SCENARIO_STORAGE_KEY)
  } catch {
    return null
  }
}

const runtime: RuntimeState = {
  scenario: findScenario(DEFAULT_SCENARIO_ID),
  ruleHits: new Map(),
  random: createRandom(RANDOM_SEED),
  latencyOverride: null,
  flagOverrides: {},
  extraFailures: [],
}

/** Resolve o cenário inicial: query string > storage > env > default. */
export function resolveInitialScenarioId(envScenario?: string): string {
  const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('scenario') : null
  return fromUrl ?? (typeof window !== 'undefined' ? storedScenarioId() : null) ?? envScenario ?? DEFAULT_SCENARIO_ID
}

export function activateScenario(id: string): Scenario {
  const scenario = findScenario(id)
  runtime.scenario = scenario
  runtime.ruleHits = new Map()
  runtime.random = createRandom(RANDOM_SEED)
  runtime.latencyOverride = null
  runtime.flagOverrides = {}
  runtime.extraFailures = []
  try {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenario.id)
  } catch {
    // sem storage: cenário vale só para esta carga
  }
  return scenario
}

export function currentScenario(): Scenario {
  return runtime.scenario
}

export function flags(): ScenarioFlags {
  return { ...runtime.scenario.flags, ...runtime.flagOverrides }
}

export function setFlags(overrides: Partial<ScenarioFlags>) {
  runtime.flagOverrides = { ...runtime.flagOverrides, ...overrides }
}

export function setLatency(latency: { min: number; max?: number } | null) {
  runtime.latencyOverride = latency ? { min: latency.min, max: latency.max ?? latency.min } : null
}

/** Injeta falhas extras em tempo de execução (testes). */
export function addFailure(rule: FailureRule) {
  runtime.extraFailures.push(rule)
}

export function clearFailures() {
  runtime.extraFailures = []
}

export function nextLatency(): number {
  const { min, max } = runtime.latencyOverride ?? runtime.scenario.latency
  return min === max ? min : runtime.random.int(min, max)
}

function pathMatches(pattern: string, path: string): boolean {
  if (pattern === '*') return true
  const regex = new RegExp(`^${pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
  return regex.test(path)
}

/** Primeira regra que casa com a requisição (considerando `times` e `probability`). */
export function matchFailure(method: string, path: string): FailureRule | null {
  const rules = [...runtime.extraFailures, ...runtime.scenario.failures]
  for (const rule of rules) {
    if (rule.method && rule.method !== method) continue
    if (!pathMatches(rule.path, path)) continue
    const hits = runtime.ruleHits.get(rule) ?? 0
    if (rule.times !== undefined && hits >= rule.times) continue
    if (rule.probability !== undefined && !runtime.random.chance(rule.probability)) continue
    runtime.ruleHits.set(rule, hits + 1)
    return rule
  }
  return null
}

export function random(): Random {
  return runtime.random
}
