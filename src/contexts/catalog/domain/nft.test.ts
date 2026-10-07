import { describe, expect, it } from 'vitest'
import { maxQuantity } from './nft'

describe('maxQuantity', () => {
  it('limita pelo estoque', () => {
    expect(maxQuantity({ id: 'a', label: 'a', total: 5, available: 3 })).toBe(3)
  })
  it('limita pelo teto de compra', () => {
    expect(maxQuantity({ id: 'a', label: 'a', total: 100, available: 80 })).toBe(10)
  })
  it('zero quando esgotado', () => {
    expect(maxQuantity({ id: 'a', label: 'a', total: 5, available: 0 })).toBe(0)
  })
})
