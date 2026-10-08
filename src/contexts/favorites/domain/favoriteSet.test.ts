import { describe, expect, it } from 'vitest'
import { NftId } from '@/shared/ids'
import { applyFavorite, isFavorite, toFavoriteSet } from './favoriteSet'

describe('FavoriteSet', () => {
  const a = NftId('nft_01')
  const b = NftId('nft_02')

  it('marca e desmarca sem mutar o original', () => {
    const original = toFavoriteSet([a])
    const added = applyFavorite(original, b, true)
    const removed = applyFavorite(added, a, false)
    expect([...original]).toEqual([a])
    expect(isFavorite(added, b)).toBe(true)
    expect(isFavorite(removed, a)).toBe(false)
  })

  it('é idempotente: repetir a mesma intenção devolve o mesmo conjunto', () => {
    const set = toFavoriteSet([a])
    expect(applyFavorite(set, a, true)).toBe(set)
    expect(applyFavorite(set, b, false)).toBe(set)
  })

  it('trata conjunto ausente como vazio', () => {
    expect(isFavorite(undefined, a)).toBe(false)
  })
})
