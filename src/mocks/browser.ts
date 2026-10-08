import { setupWorker } from 'msw/browser'
import { mockControl } from './control'
import { db } from './db/store'
import { restHandlers } from './handlers'
import { activateScenario, currentScenario, resolveInitialScenarioId } from './runtime'
import { socketHandlers } from './socket/server'

/**
 * Bootstrap da camada de mocks (ativada por `VITE_MOCKS=true`, inclusive no build de demonstração).
 *
 * URL:
 *  - `?scenario=<id>` ativa o cenário (e reseta o estado se for diferente do atual);
 *  - `?mocks-reset=1` restaura o estado conhecido.
 */
export async function startMocks() {
  const params = new URLSearchParams(window.location.search)
  const previousScenario = window.localStorage.getItem('nftm-mock:scenario')
  const scenarioId = resolveInitialScenarioId(import.meta.env.VITE_MOCK_SCENARIO)
  activateScenario(scenarioId)

  const scenarioChanged = previousScenario !== null && previousScenario !== currentScenario().id
  if (params.has('mocks-reset') || scenarioChanged) {
    await mockControl.reset({ keepScenario: true })
  } else {
    await db.init(currentScenario().seed)
  }

  // Remove os parâmetros de controle da URL para não reaplicar em refresh.
  if (params.has('mocks-reset') || params.has('scenario')) {
    params.delete('mocks-reset')
    params.delete('scenario')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }

  const worker = setupWorker(...restHandlers, ...socketHandlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: !import.meta.env.DEV,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
  // Exposta só com o worker ativo: `window.__mocks` presente = mocks prontos (testes aguardam isso).
  window.__mocks = mockControl
}
