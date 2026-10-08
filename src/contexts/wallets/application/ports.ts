import type { Network } from '@/shared/network'
import type { WalletAddress, WalletRole, WalletSet } from '../domain'

export interface SaveWalletCommand {
  /** Presente ao editar (PATCH); ausente ao cadastrar (POST). */
  id?: string
  role: WalletRole
  address: WalletAddress
  network: Network
}

/** Port REST (`GET/POST /wallets`, `PATCH /wallets/:id`). Lança WalletValidationError em 422/409. */
export interface WalletGateway {
  list(options?: { signal?: AbortSignal }): Promise<WalletSet>
  save(command: SaveWalletCommand): Promise<WalletSet>
}

/**
 * Provedor de carteira simulado. O comportamento (aceitar/recusar) vem do cenário do MSW,
 * nunca de ramificações em componentes. Lança ConnectionRefusedError quando recusado.
 */
export interface WalletConnector {
  connect(walletId: string, options?: { signal?: AbortSignal }): Promise<void>
  disconnect(walletId: string): Promise<void>
}
