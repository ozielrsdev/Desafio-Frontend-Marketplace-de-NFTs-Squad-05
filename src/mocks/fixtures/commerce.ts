import type { MockCoupon } from '../db/schema'
import type { NetworkDto, WalletSetDto } from '@/shared/contracts'

/** Cupons: válido, válido maior e expirado (README §6 "cupom inválido ou expirado"). */
export const couponFixtures: MockCoupon[] = [
  { code: 'BEMVINDO10', percent: '10', expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'COLECAO20', percent: '20', expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRADO5', percent: '5', expiresAt: '2025-01-01T00:00:00.000Z' },
]

export const networkFeeFixtures: Record<NetworkDto, string> = {
  ethereum: '0.0042',
  polygon: '0.0003',
  arbitrum: '0.0008',
}

/** Ana tem carteira principal; Bruno começa sem carteiras. */
export function walletFixtures(createdAt: string): Record<string, WalletSetDto> {
  return {
    usr_ana: {
      primary: {
        id: 'wal_ana_primary',
        role: 'primary',
        label: 'Carteira principal',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        network: 'ethereum',
        createdAt,
        updatedAt: createdAt,
      },
      secondary: null,
    },
    usr_bruno: { primary: null, secondary: null },
  }
}
