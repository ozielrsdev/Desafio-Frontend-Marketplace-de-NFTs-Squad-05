import type { CartItemDto, NetworkDto, NftDto, OrderDto, QuoteDto, WalletSetDto } from '@/shared/contracts'

/**
 * Estado do backend simulado. Um único "banco" garante consistência entre catálogo,
 * favoritos, carrinho, perfil, carteiras e pedidos (README §6).
 * Mudou o formato? Incremente `MOCK_SCHEMA_VERSION` — o estado persistido antigo é descartado.
 */
export const MOCK_SCHEMA_VERSION = 1

export interface MockUser {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  bio: string
  website: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface MockSession {
  token: string
  userId: string
  expiresAt: string
}

export interface MockCoupon {
  code: string
  /** Percentual como string decimal. */
  percent: string
  expiresAt: string
}

export interface MockQuote extends QuoteDto {
  userId: string
}

export interface MockOrder extends OrderDto {
  userId: string
}

export interface MockIdempotencyRecord {
  userId: string
  bodyHash: string
  orderId: string
}

export interface MockDbState {
  schemaVersion: number
  /** Contador para IDs determinísticos. */
  sequence: number
  users: MockUser[]
  sessions: MockSession[]
  nfts: NftDto[]
  /** userId → NftIds favoritos. */
  favorites: Record<string, string[]>
  /** userId → itens do carrinho. */
  carts: Record<string, CartItemDto[]>
  coupons: MockCoupon[]
  quotes: Record<string, MockQuote>
  orders: MockOrder[]
  /** `${userId}:${Idempotency-Key}` → pedido criado. */
  idempotency: Record<string, MockIdempotencyRecord>
  /** userId → carteiras. */
  wallets: Record<string, WalletSetDto>
  /** Taxa de rede por rede (string decimal ETH). */
  networkFees: Record<NetworkDto, string>
}
