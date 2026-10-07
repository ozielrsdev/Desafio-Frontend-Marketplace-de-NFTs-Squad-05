/** Import dinâmico: o MSW só entra no bundle carregado quando os mocks estão ativos. */
export async function enableMocking() {
  if (import.meta.env.VITE_MOCKS === 'false') return
  const [{ setupWorker }, { handlers }] = await Promise.all([import('msw/browser'), import('./handlers')])
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } })
}
