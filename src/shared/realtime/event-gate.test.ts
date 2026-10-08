import { describe, expect, it } from 'vitest'
import { EventGate } from './event-gate'

const ev = (eventId: string, version: number, id = 'o1') => ({
  eventId,
  resource: { kind: 'order', id },
  version,
})

describe('EventGate', () => {
  it('aplica o primeiro evento e descarta duplicata pelo eventId', () => {
    const gate = new EventGate()
    expect(gate.decide(ev('e1', 2))).toBe('apply')
    expect(gate.decide(ev('e1', 2))).toBe('duplicate')
  })

  it('descarta evento antigo (version ≤ conhecida), mesmo com novo eventId', () => {
    const gate = new EventGate()
    gate.decide(ev('e1', 3))
    expect(gate.decide(ev('e2', 2))).toBe('stale')
    expect(gate.decide(ev('e3', 3))).toBe('stale')
    expect(gate.decide(ev('e4', 4))).toBe('apply')
  })

  it('versões são independentes por recurso', () => {
    const gate = new EventGate()
    gate.decide(ev('e1', 5, 'o1'))
    expect(gate.decide(ev('e2', 1, 'o2'))).toBe('apply')
  })

  it('seed() torna antigos os eventos anteriores à versão buscada por REST', () => {
    const gate = new EventGate()
    gate.seed({ kind: 'order', id: 'o1' }, 4)
    expect(gate.decide(ev('e1', 3))).toBe('stale')
  })

  it('LRU limita a memória de eventIds', () => {
    const gate = new EventGate(2)
    gate.decide(ev('a', 1, 'x'))
    gate.decide(ev('b', 1, 'y'))
    gate.decide(ev('c', 1, 'z'))
    // 'a' saiu do LRU: reaparece como "novo" id (a versão ainda o barra)
    expect(gate.decide(ev('a', 1, 'x'))).toBe('stale')
  })

  it('clear() esquece tudo (logout / troca de usuário)', () => {
    const gate = new EventGate()
    gate.decide(ev('e1', 3))
    gate.clear()
    expect(gate.decide(ev('e1', 1))).toBe('apply')
  })
})
