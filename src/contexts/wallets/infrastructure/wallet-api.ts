import { isAxiosError } from 'axios'
import { http } from '@/shared/http/client'
import { normalizeHttpError } from '@/shared/http/errors'
import {
  ConnectionRefusedError,
  WalletAddress,
  WalletValidationError,
  type Wallet,
  type WalletSet,
} from '../domain'
import type { SaveWalletCommand, WalletConnector, WalletGateway } from '../application/ports'
import { walletErrorDto, walletsResponseDto, type WalletDto } from './dto'

const toWallet = (dto: WalletDto): Wallet => ({
  id: dto.id,
  role: dto.role,
  address: WalletAddress.parse(dto.address),
  network: dto.network,
})

function toWalletSet(data: unknown): WalletSet {
  const { wallets } = walletsResponseDto.parse(data)
  const mapped = wallets.map(toWallet)
  return {
    primary: mapped.find((w) => w.role === 'primary') ?? null,
    secondary: mapped.find((w) => w.role === 'secondary') ?? null,
  }
}

function translate(error: unknown): never {
  if (isAxiosError(error) && error.response) {
    const { status, data } = error.response
    const parsed = walletErrorDto.safeParse(data)
    if (parsed.success && (status === 422 || status === 409)) {
      const fields = (parsed.data.fields ?? {}) as WalletValidationError['fields']
      if (status === 409 && !fields.address) {
        fields.address = 'Este endereço já está cadastrado.'
      }
      throw new WalletValidationError(fields)
    }
  }
  throw isAxiosError(error) ? normalizeHttpError(error) : error
}

export const walletApi: WalletGateway = {
  async list(options) {
    try {
      const { data } = await http.get('/wallets', { signal: options?.signal })
      return toWalletSet(data)
    } catch (error) {
      return translate(error)
    }
  },

  async save(command: SaveWalletCommand) {
    const body = { address: command.address.value, network: command.network }
    try {
      const { data } = command.id
        ? await http.patch(`/wallets/${command.id}`, body)
        : await http.post('/wallets', { ...body, role: command.role })
      return toWalletSet(data)
    } catch (error) {
      return translate(error)
    }
  },
}

export const walletConnector: WalletConnector = {
  async connect(walletId, options) {
    try {
      await http.post(`/wallets/${walletId}/connection`, null, { signal: options?.signal })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        const message = typeof error.response.data?.message === 'string' ? error.response.data.message : undefined
        throw new ConnectionRefusedError(message)
      }
      throw error
    }
  },
  async disconnect(walletId) {
    await http.delete(`/wallets/${walletId}/connection`)
  },
}
