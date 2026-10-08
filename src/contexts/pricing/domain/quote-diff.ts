import type { Money } from '@/shared/money'
import type { Quote } from './quote'

export interface MoneyChange {
  field: 'subtotal' | 'discount' | 'networkFee' | 'total'
  from: Money
  to: Money
}

export interface ItemChange {
  nftId: string
  editionId: string
  title: string
  reason: 'price' | 'quantity' | 'added' | 'removed'
}

export interface QuoteDiff {
  changed: boolean
  money: MoneyChange[]
  items: ItemChange[]
}

const key = (i: { nftId: string; editionId: string }) => `${i.nftId}:${i.editionId}`
const pick = (i: { nftId: string; editionId: string; title: string }) => ({
  nftId: i.nftId,
  editionId: i.editionId,
  title: i.title,
})

/** Compara a cotação revisada pelo usuário com a revalidada antes do envio. */
export function diffQuotes(previous: Quote, next: Quote): QuoteDiff {
  const money: MoneyChange[] = []
  for (const field of ['subtotal', 'discount', 'networkFee', 'total'] as const) {
    if (!previous[field].equals(next[field])) {
      money.push({ field, from: previous[field], to: next[field] })
    }
  }

  const prev = new Map(previous.items.map((i) => [key(i), i]))
  const nxt = new Map(next.items.map((i) => [key(i), i]))
  const items: ItemChange[] = []
  for (const [k, n] of nxt) {
    const p = prev.get(k)
    if (!p) items.push({ ...pick(n), reason: 'added' })
    else if (!p.unitPrice.equals(n.unitPrice)) items.push({ ...pick(n), reason: 'price' })
    else if (p.quantity !== n.quantity) items.push({ ...pick(n), reason: 'quantity' })
  }
  for (const [k, p] of prev) if (!nxt.has(k)) items.push({ ...pick(p), reason: 'removed' })

  return { changed: money.length > 0 || items.length > 0, money, items }
}
