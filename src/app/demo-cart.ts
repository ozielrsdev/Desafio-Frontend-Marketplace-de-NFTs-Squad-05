import { useSyncExternalStore } from 'react'
import type { CartPort } from '@/contexts/ordering'

/**
 * Carrinho provisório do harness (substituído pelo contexto Cart/Dev 2). Implementa a mesma
 * porta `CartPort` que Ordering usa para remover só o que foi comprado.
 */
export interface DemoItem {
  nftId: string
  editionId: string
  quantity: number
}

const INITIAL: DemoItem[] = [
  { nftId: 'n1', editionId: 'e1', quantity: 3 },
  { nftId: 'n2', editionId: 'e1', quantity: 1 },
]

let items: readonly DemoItem[] = INITIAL
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const demoCart = {
  get: () => items,
  reset: () => {
    items = INITIAL
    emit()
  },
}

export const demoCartPort: CartPort = {
  removePurchased(_userId, purchased) {
    items = items
      .map((i) => {
        const bought = purchased.find((p) => p.nftId === i.nftId && p.editionId === i.editionId)
        return bought ? { ...i, quantity: i.quantity - bought.quantity } : i
      })
      .filter((i) => i.quantity > 0)
    emit()
  },
}

export function useDemoCart(): readonly DemoItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => items,
  )
}
