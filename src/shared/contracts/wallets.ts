import { z } from 'zod'
import { idSchema, isoDateSchema } from './common'

/** Wallets — GET /wallets, POST /wallets, PATCH /wallets/:id. 422 por campo, 409 wallet_duplicate. */
export const networks = ['ethereum', 'polygon', 'arbitrum'] as const
export type NetworkDto = (typeof networks)[number]

export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido')

export const walletSchema = z.object({
  id: idSchema,
  role: z.enum(['primary', 'secondary']),
  label: z.string(),
  address: walletAddressSchema,
  network: z.enum(networks),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})
export type WalletDto = z.infer<typeof walletSchema>

export const walletSetSchema = z.object({
  primary: walletSchema.nullable(),
  secondary: walletSchema.nullable(),
})
export type WalletSetDto = z.infer<typeof walletSetSchema>

export const createWalletRequestSchema = z.object({
  role: z.enum(['primary', 'secondary']),
  label: z.string().trim().min(1).max(40),
  address: walletAddressSchema,
  network: z.enum(networks),
})
export type CreateWalletRequestDto = z.infer<typeof createWalletRequestSchema>

export const updateWalletRequestSchema = createWalletRequestSchema.omit({ role: true }).partial()
export type UpdateWalletRequestDto = z.infer<typeof updateWalletRequestSchema>
