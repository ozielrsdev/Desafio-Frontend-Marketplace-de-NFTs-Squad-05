import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PricingGatewayProvider, quoteApi } from '@/contexts/pricing'
import {
  WalletAddress,
  WalletConnectionProvider,
  WalletsDepsProvider,
  walletApi,
  walletConnector,
} from '@/contexts/wallets'
import { server } from '@/mocks/server'
import { ordersScenario } from '@/mocks/orders-scenario'
import { pricingScenario } from '@/mocks/pricing-scenario'
import { walletsScenario } from '@/mocks/wallets-scenario'
import { OrderingDepsProvider } from '../application'
import { orderApi, orderLocalStore } from '../infrastructure'
import { CheckoutPage } from './CheckoutPage'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  pricingScenario.reset()
  ordersScenario.reset()
  walletsScenario.reset()
})
afterAll(() => server.close())

const ITEMS = [
  { nftId: 'n1', editionId: 'e1', quantity: 3 },
  { nftId: 'n2', editionId: 'e1', quantity: 1 },
]

function setup() {
  const onOrderCreated = vi.fn()
  const onGoToWallets = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <PricingGatewayProvider gateway={quoteApi}>
        <WalletsDepsProvider gateway={walletApi} connector={walletConnector}>
          <WalletConnectionProvider userId="u1">
            <OrderingDepsProvider
              gateway={orderApi}
              quotes={quoteApi}
              events={{ subscribe: () => () => undefined }}
              cart={{ removePurchased: () => undefined }}
              store={orderLocalStore}
            >
              <CheckoutPage
                userId="u1"
                items={ITEMS}
                coupon={null}
                onOrderCreated={onOrderCreated}
                onGoToWallets={onGoToWallets}
                onBackToCart={() => undefined}
              />
            </OrderingDepsProvider>
          </WalletConnectionProvider>
        </WalletsDepsProvider>
      </PricingGatewayProvider>
    </QueryClientProvider>,
  )
  return { onOrderCreated, onGoToWallets, user: userEvent.setup() }
}

const registerWallet = () =>
  walletApi.save({ role: 'primary', address: WalletAddress.parse('0x' + 'a'.repeat(40)), network: 'polygon' })

async function fillAndConnect(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Nome completo'), 'Ana Souza')
  await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
  await user.click(await screen.findByRole('button', { name: 'Conectar carteira' }))
  await screen.findByText('Conectada')
  await waitFor(() => expect(screen.getByTestId('quote-total')).toHaveTextContent('0.5005 ETH')) // taxa polygon
}

describe('CheckoutPage', () => {
  it('sem carteira: direciona ao cadastro', async () => {
    const { onGoToWallets, user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Cadastrar carteira' }))
    expect(onGoToWallets).toHaveBeenCalled()
  })

  it('a taxa de rede segue a rede da carteira escolhida', async () => {
    await registerWallet()
    setup()
    await waitFor(() => expect(screen.getByTestId('quote-total')).toHaveTextContent('0.5005 ETH'))
  })

  it('confirmação bloqueada até conectar a carteira; recusa permite tentar de novo', async () => {
    await registerWallet()
    walletsScenario.set({ connection: 'refuse' })
    const { user } = setup()
    expect(await screen.findByText('Conecte a carteira para confirmar.')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Conectar carteira' }))
    expect(await screen.findByText(/recusou a conexão/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('valida os dados do colecionador com erros associados aos campos', async () => {
    await registerWallet()
    const { onOrderCreated, user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Conectar carteira' }))
    await screen.findByText('Conectada')
    await waitFor(() => expect(screen.getByTestId('quote-total')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    const name = screen.getByLabelText('Nome completo')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Informe seu nome completo.')
    await waitFor(() => expect(name).toHaveFocus())
    expect(onOrderCreated).not.toHaveBeenCalled()
  })

  it('cliques repetidos em Confirmar criam um único pedido', async () => {
    await registerWallet()
    const { onOrderCreated, user } = setup()
    await fillAndConnect(user)
    const button = screen.getByRole('button', { name: 'Confirmar compra' })
    await Promise.all([user.click(button), user.click(button), user.click(button)])
    await waitFor(() => expect(onOrderCreated).toHaveBeenCalled())
    expect((await orderApi.listPending()).length).toBe(1)
  })

  it('preço alterado entre revisão e envio: mostra o diff e só cria após nova confirmação', async () => {
    await registerWallet()
    const { onOrderCreated, user } = setup()
    await fillAndConnect(user)

    pricingScenario.set({ priceChanged: true })
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    const dialog = await screen.findByRole('dialog', { name: 'O valor do seu pedido mudou' })
    expect(dialog).toHaveTextContent('Aurora #001')
    expect(dialog).toHaveTextContent('preço alterado')
    expect(onOrderCreated).not.toHaveBeenCalled()
    expect((await orderApi.listPending()).length).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Confirmar novo valor' }))
    await waitFor(() => expect(onOrderCreated).toHaveBeenCalledTimes(1))
  })

  it('item esgotado: bloqueia a confirmação na tela', async () => {
    await registerWallet()
    pricingScenario.set({ soldOut: true })
    setup()
    expect(await screen.findByText(/itens indisponíveis/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toHaveAttribute('aria-disabled', 'true')
  })
})
