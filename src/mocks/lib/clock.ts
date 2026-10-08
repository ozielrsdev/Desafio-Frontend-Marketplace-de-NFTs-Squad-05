/**
 * Relógio do servidor simulado. Testes podem avançar o tempo (ex.: expirar sessão)
 * via `window.__mocks.clock.advance(ms)` sem depender do relógio real.
 */
let offsetMs = 0

export const clock = {
  now: () => Date.now() + offsetMs,
  nowIso: () => new Date(Date.now() + offsetMs).toISOString(),
  advance: (ms: number) => {
    offsetMs += ms
  },
  reset: () => {
    offsetMs = 0
  },
  get offset() {
    return offsetMs
  },
}
