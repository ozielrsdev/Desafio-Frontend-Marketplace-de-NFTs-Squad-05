import type { Money } from '@/shared/money'

/** Apresentação em ETH: sem perda (todas as casas significativas, mínimo 2). */
export const formatEth = (m: Money) => `${m.format()} ETH`
