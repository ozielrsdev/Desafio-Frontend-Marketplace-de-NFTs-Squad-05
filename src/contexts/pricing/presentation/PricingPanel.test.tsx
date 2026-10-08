import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { pricingScenario } from '@/mocks/pricing-scenario'
import { PricingGatewayProvider } from '../application'
import { quoteApi } from '../infrastructure'
import type { Coupon } from '../domain'
import { PricingPanel } from './PricingPanel'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  pricingScenario.reset()
})
afterAll(() => server.close())

const ITEMS = [
  { nftId: 'n1', editionId: 'e1', quantity: 3 },
  { nftId: 'n2', editionId: 'e1', quantity: 1 },
]

function Harness() {
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  return (
    <PricingPanel
      userId="u1"
      items={ITEMS}
      network="ethereum"
      coupon={coupon}
      onCouponChange={setCoupon}
      onProceed={() => {}}
    />
  )
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <PricingGatewayProvider gateway={quoteApi}>
        <Harness />
      </PricingGatewayProvider>
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

describe('PricingPanel', () => {
  it('mostra subtotal, desconto, taxa e total exatos', async () => {
    setup()
    expect(await screen.findByTestId('quote-total')).toHaveTextContent('0.503 ETH')
    expect(screen.getByText('Subtotal').nextSibling).toHaveTextContent('0.50 ETH')
  })

  it('aplica e remove cupom recalculando o total', async () => {
    const user = setup()
    await screen.findByTestId('quote-total')
    await user.type(screen.getByLabelText('Cupom de desconto'), 'promo10')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    await waitFor(() => expect(screen.getByTestId('quote-total')).toHaveTextContent('0.453 ETH'))

    await user.click(screen.getByRole('button', { name: /Remover cupom PROMO10/ }))
    await waitFor(() => expect(screen.getByTestId('quote-total')).toHaveTextContent('0.503 ETH'))
  })

  it.each([
    ['NAOEXISTE', /inválido/i],
    ['VELHO20', /expirou/i],
    ['RARO15', /não se aplica/i],
  ])('feedback específico para cupom %s, sem alterar o total', async (code, message) => {
    const user = setup()
    await screen.findByTestId('quote-total')
    await user.type(screen.getByLabelText('Cupom de desconto'), code)
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(message)
    expect(screen.getByLabelText('Cupom de desconto')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByTestId('quote-total')).toHaveTextContent('0.503 ETH')
  })

  it('destaca item indisponível e bloqueia o checkout', async () => {
    pricingScenario.set({ soldOut: true })
    setup()
    expect(await screen.findByText(/Indisponível/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para o pagamento' })).toBeDisabled()
  })
})
