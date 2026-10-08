import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { walletsScenario } from '@/mocks/wallets-scenario'
import { WalletConnectionProvider, WalletsDepsProvider } from '../application'
import { walletApi, walletConnector } from '../infrastructure'
import { WalletsPage } from './WalletsPage'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  walletsScenario.reset()
})
afterAll(() => server.close())

const A = '0x' + 'a'.repeat(40)
const B = '0x' + 'b'.repeat(40)

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <WalletsDepsProvider gateway={walletApi} connector={walletConnector}>
        <WalletConnectionProvider userId="u1">
          <WalletsPage userId="u1" />
        </WalletConnectionProvider>
      </WalletsDepsProvider>
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

const card = async (name: string) => within(await screen.findByRole('region', { name }))

describe('WalletsPage', () => {
  it('cadastra a principal com erros de validação por campo e persiste após remontar', async () => {
    const user = setup()
    await user.click(await (await card('Carteira principal')).findByRole('button', { name: /Cadastrar principal/ }))

    await user.type(screen.getByLabelText('Endereço da carteira'), '0x123')
    await user.click(screen.getByRole('button', { name: 'Cadastrar carteira' }))
    expect(screen.getByLabelText('Endereço da carteira')).toHaveAccessibleDescription(/Endereço inválido/)
    expect(screen.getByLabelText('Rede')).toHaveAccessibleDescription('Selecione a rede.')

    await user.clear(screen.getByLabelText('Endereço da carteira'))
    await user.type(screen.getByLabelText('Endereço da carteira'), A)
    await user.selectOptions(screen.getByLabelText('Rede'), 'polygon')
    await user.click(screen.getByRole('button', { name: 'Cadastrar carteira' }))
    expect(await (await card('Carteira principal')).findByText('0xaaaa…aaaa')).toBeInTheDocument()

    cleanup()
    setup()
    expect(await (await card('Carteira principal')).findByText('0xaaaa…aaaa')).toBeInTheDocument()
  })

  it('rejeita endereço duplicado na secundária', async () => {
    await walletApi.save({ role: 'primary', address: (await import('../domain')).WalletAddress.parse(A), network: 'ethereum' })
    const user = setup()
    await user.click(await (await card('Carteira secundária')).findByRole('button', { name: /Cadastrar secundária/ }))
    await user.type(screen.getByLabelText('Endereço da carteira'), A.toUpperCase().replace('0X', '0x'))
    await user.selectOptions(screen.getByLabelText('Rede'), 'arbitrum')
    await user.click(screen.getByRole('button', { name: 'Cadastrar carteira' }))
    expect(screen.getByLabelText('Endereço da carteira')).toHaveAccessibleDescription(/já está cadastrado/)
  })

  it('endereço abreviado com opção de ver completo (aria-expanded)', async () => {
    await walletApi.save({ role: 'primary', address: (await import('../domain')).WalletAddress.parse(B), network: 'ethereum' })
    const user = setup()
    const toggle = await (await card('Carteira principal')).findByRole('button', { name: 'Ver endereço completo' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect((await card('Carteira principal')).getByText(B)).toBeInTheDocument()
    expect((await card('Carteira principal')).getByRole('button', { name: 'Ocultar endereço completo' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('conectar → conectada → desconectar; recusa mostra mensagem e permite tentar de novo', async () => {
    await walletApi.save({ role: 'primary', address: (await import('../domain')).WalletAddress.parse(A), network: 'ethereum' })
    walletsScenario.set({ connection: 'refuse' })
    const user = setup()
    const principal = await card('Carteira principal')
    await user.click(await principal.findByRole('button', { name: 'Conectar carteira' }))
    expect(await principal.findByRole('alert')).toHaveTextContent(/recusou a conexão/)

    walletsScenario.set({ connection: 'accept' })
    await user.click(principal.getByRole('button', { name: 'Tentar novamente' }))
    expect(await principal.findByText('Conectada')).toBeInTheDocument()
    await user.click(principal.getByRole('button', { name: 'Desconectar' }))
    expect(await principal.findByText('Desconectada')).toBeInTheDocument()
  })
})
