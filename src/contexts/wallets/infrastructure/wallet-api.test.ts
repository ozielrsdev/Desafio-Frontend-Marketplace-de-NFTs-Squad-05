import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { walletsScenario } from '@/mocks/wallets-scenario'
import { ConnectionRefusedError, WalletAddress, WalletValidationError } from '../domain'
import { walletApi, walletConnector } from './wallet-api'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  localStorage.clear()
  walletsScenario.reset()
})
afterAll(() => server.close())

const A = WalletAddress.parse('0x' + 'a'.repeat(40))
const B = WalletAddress.parse('0x' + 'b'.repeat(40))

describe('walletApi', () => {
  it('cadastra principal e secundária e persiste (lista após "refresh")', async () => {
    await walletApi.save({ role: 'primary', address: A, network: 'ethereum' })
    await walletApi.save({ role: 'secondary', address: B, network: 'polygon' })
    const set = await walletApi.list()
    expect(set.primary?.address.equals(A)).toBe(true)
    expect(set.secondary?.network).toBe('polygon')
  })

  it('edita a carteira existente', async () => {
    const created = await walletApi.save({ role: 'primary', address: A, network: 'ethereum' })
    const set = await walletApi.save({ id: created.primary!.id, role: 'primary', address: B, network: 'arbitrum' })
    expect(set.primary).toMatchObject({ network: 'arbitrum' })
    expect(set.primary?.address.equals(B)).toBe(true)
  })

  it('endereço duplicado → WalletValidationError no campo address (409)', async () => {
    await walletApi.save({ role: 'primary', address: A, network: 'ethereum' })
    const err = await walletApi.save({ role: 'secondary', address: A, network: 'polygon' }).catch((e) => e)
    expect(err).toBeInstanceOf(WalletValidationError)
    expect(err.fields.address).toBeTruthy()
  })
})

describe('walletConnector', () => {
  it('conecta quando o cenário aceita', async () => {
    await expect(walletConnector.connect('w_primary')).resolves.toBeUndefined()
  })
  it('recusa conforme o cenário (ConnectionRefusedError) e permite tentar de novo', async () => {
    walletsScenario.set({ connection: 'refuse' })
    await expect(walletConnector.connect('w_primary')).rejects.toBeInstanceOf(ConnectionRefusedError)
    walletsScenario.set({ connection: 'accept' })
    await expect(walletConnector.connect('w_primary')).resolves.toBeUndefined()
  })
  it('desconecta', async () => {
    await expect(walletConnector.disconnect('w_primary')).resolves.toBeUndefined()
  })
})
