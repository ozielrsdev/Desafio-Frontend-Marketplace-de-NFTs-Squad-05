import { NETWORKS, type Network } from '@/shared/network'
import { WalletAddress } from './wallet-address'

export type WalletRole = 'primary' | 'secondary'

export interface Wallet {
  readonly id: string
  readonly role: WalletRole
  readonly address: WalletAddress
  readonly network: Network
}

/** Aggregate: no máximo uma principal e uma secundária, com endereços distintos. */
export interface WalletSet {
  readonly primary: Wallet | null
  readonly secondary: Wallet | null
}

export const emptyWalletSet: WalletSet = { primary: null, secondary: null }

export const listWallets = (set: WalletSet): Wallet[] =>
  [set.primary, set.secondary].filter((w): w is Wallet => w !== null)

/** Invariante: principal obrigatória antes de comprar. */
export const canPurchase = (set: WalletSet): boolean => set.primary !== null

export type WalletFieldErrors = Partial<Record<'address' | 'network', string>>

export type DraftValidation =
  | { ok: true; value: { address: WalletAddress; network: Network } }
  | { ok: false; errors: WalletFieldErrors }

/**
 * Valida o rascunho de cadastro/edição de uma carteira contra o conjunto atual:
 * formato do endereço, rede suportada e endereço duplicado (exceto a própria carteira).
 */
export function validateWalletDraft(
  draft: { address: string; network: string },
  set: WalletSet,
  role: WalletRole,
): DraftValidation {
  const errors: WalletFieldErrors = {}
  const address = draft.address.trim()

  if (!address) errors.address = 'Informe o endereço da carteira.'
  else if (!WalletAddress.isValid(address)) {
    errors.address = 'Endereço inválido. Use o formato 0x seguido de 40 caracteres hexadecimais.'
  }

  if (!draft.network) errors.network = 'Selecione a rede.'
  else if (!(NETWORKS as readonly string[]).includes(draft.network)) {
    errors.network = 'Rede não suportada.'
  }

  if (!errors.address) {
    const parsed = WalletAddress.parse(address)
    const other = role === 'primary' ? set.secondary : set.primary
    if (other && other.address.equals(parsed)) {
      errors.address = 'Este endereço já está cadastrado em outra carteira.'
    }
  }

  if (errors.address || errors.network) return { ok: false, errors }
  return { ok: true, value: { address: WalletAddress.parse(address), network: draft.network as Network } }
}
