/** Envelope de evento (realtime.md): identidade estável, recurso afetado e versão monotônica. */
export interface EventEnvelope<P = unknown> {
  eventId: string
  type: string
  resource: { kind: string; id: string }
  version: number
  occurredAt: string
  payload: P
}

export type GateDecision = 'apply' | 'duplicate' | 'stale'

/**
 * Regra de aplicação: descarta se `eventId` já visto (LRU) ou `version` ≤ versão conhecida do
 * recurso; caso contrário aplica e registra. Estado por sessão — `clear()` ao encerrar.
 */
export class EventGate {
  private readonly seen = new Set<string>()
  private readonly versions = new Map<string, number>()

  constructor(private readonly maxSeen = 500) {}

  /** Versão já conhecida via REST (ex.: pedido buscado), para que eventos antigos sejam descartados. */
  seed(resource: { kind: string; id: string }, version: number) {
    const key = `${resource.kind}:${resource.id}`
    if (version > (this.versions.get(key) ?? -Infinity)) this.versions.set(key, version)
  }

  decide(event: Pick<EventEnvelope, 'eventId' | 'resource' | 'version'>): GateDecision {
    if (this.seen.has(event.eventId)) return 'duplicate'
    this.remember(event.eventId)
    const key = `${event.resource.kind}:${event.resource.id}`
    const known = this.versions.get(key)
    if (known !== undefined && event.version <= known) return 'stale'
    this.versions.set(key, event.version)
    return 'apply'
  }

  clear() {
    this.seen.clear()
    this.versions.clear()
  }

  private remember(id: string) {
    this.seen.add(id)
    if (this.seen.size > this.maxSeen) {
      const oldest = this.seen.values().next().value
      if (oldest !== undefined) this.seen.delete(oldest)
    }
  }
}
