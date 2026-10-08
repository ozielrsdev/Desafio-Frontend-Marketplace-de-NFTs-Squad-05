import { z } from 'zod'

const walletDto = z.object({
  id: z.string(),
  role: z.enum(['primary', 'secondary']),
  address: z.string(),
  network: z.enum(['ethereum', 'polygon', 'arbitrum']),
})
export type WalletDto = z.infer<typeof walletDto>

/** `GET /wallets`, e resposta de `POST /wallets` / `PATCH /wallets/:id` (conjunto atualizado). */
export const walletsResponseDto = z.object({ wallets: z.array(walletDto) })

export const saveWalletRequestDto = z.object({
  role: z.enum(['primary', 'secondary']).optional(),
  address: z.string(),
  network: z.string(),
})
export type SaveWalletRequestDto = z.infer<typeof saveWalletRequestDto>

/** 422: erros por campo. 409: endereço duplicado. */
export const walletErrorDto = z.object({
  code: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
})
