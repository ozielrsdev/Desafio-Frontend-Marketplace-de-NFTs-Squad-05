import { useSyncExternalStore } from 'react'

/**
 * Anúncios para leitores de tela (aria-live) — mutations e eventos em tempo real.
 * `announce()` pode ser chamado de qualquer camada de aplicação; `<LiveRegion />` fica no layout raiz.
 */
type Politeness = 'polite' | 'assertive'
type State = Record<Politeness, string>

let state: State = { polite: '', assertive: '' }
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function announce(message: string, politeness: Politeness = 'polite') {
  // Limpa antes para que a mesma mensagem repetida seja anunciada de novo.
  state = { ...state, [politeness]: '' }
  emit()
  setTimeout(() => {
    state = { ...state, [politeness]: message }
    emit()
  }, 50)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function LiveRegion() {
  const current = useSyncExternalStore(subscribe, () => state, () => state)
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-polite">
        {current.polite}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only" data-testid="live-assertive">
        {current.assertive}
      </div>
    </>
  )
}
