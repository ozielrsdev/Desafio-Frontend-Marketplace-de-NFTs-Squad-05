import { useState } from 'react'

/** Painel de desenvolvimento: aciona cenários via `window.__mocks` (API de controle do MSW). */
export function DevPanel() {
  const [open, setOpen] = useState(false)
  const mocks = window.__mocks
  if (!mocks) return null

  const actions: Array<[string, () => void]> = [
    ['Pagamento: confirmar', () => mocks.orders.set({ payment: 'confirm' })],
    ['Pagamento: recusar', () => mocks.orders.set({ payment: 'reject' })],
    ['Pagamento: manter pendente', () => mocks.orders.set({ payment: 'hold' })],
    ['Timeout após criar (1×)', () => mocks.orders.set({ timeoutOnCreate: true })],
    ['Carteira: recusar conexão', () => mocks.wallets.set({ connection: 'refuse' })],
    ['Carteira: aceitar conexão', () => mocks.wallets.set({ connection: 'accept' })],
    ['Preço do n1 sobe 50%', () => mocks.pricing.set({ priceChanged: true })],
    ['Edição n2 esgotada', () => mocks.pricing.set({ soldOut: true })],
    ['Derrubar socket', () => mocks.dropSocketConnections()],
    ['Reset completo', () => { mocks.reset(); window.location.reload() }],
  ]

  return (
    <aside className="fixed right-3 bottom-3 z-40 max-w-[calc(100vw-1.5rem)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 cursor-pointer rounded-md bg-text px-4 text-sm font-semibold text-bg shadow-lg"
      >
        Cenários (dev)
      </button>
      {open && (
        <ul className="mt-2 max-h-[60dvh] space-y-1 overflow-auto rounded-card border border-border bg-surface p-2 shadow-lg">
          {actions.map(([label, run]) => (
            <li key={label}>
              <button type="button" onClick={run} className="min-h-11 w-full cursor-pointer rounded-md px-3 text-left text-sm hover:bg-surface-muted">{label}</button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
