import { describe, expect, it } from 'vitest'
import { catalogSearchSchema, clearFilters, withSearchChange } from './catalog-search'

describe('catalogSearchSchema', () => {
  it('aplica defaults', () => {
    expect(catalogSearchSchema.parse({})).toEqual({ sort: 'recent', page: 1 })
  })
  it('normaliza valores inválidos sem lançar', () => {
    const s = catalogSearchSchema.parse({ sort: 'x', page: '-3', category: 'nada', minPrice: 'abc' })
    expect(s).toEqual({ sort: 'recent', page: 1 })
  })
  it('converte page numérica de string', () => {
    expect(catalogSearchSchema.parse({ page: '4' }).page).toBe(4)
  })
})

describe('withSearchChange', () => {
  it('reinicia a página ao mudar filtro', () => {
    const cur = catalogSearchSchema.parse({ page: 5, q: 'a' })
    expect(withSearchChange(cur, { category: 'arte' }).page).toBe(1)
  })
  it('remove chaves vazias', () => {
    const cur = catalogSearchSchema.parse({ q: 'a' })
    expect(withSearchChange(cur, { q: '' })).not.toHaveProperty('q')
  })
  it('clearFilters mantém a ordenação', () => {
    const cur = catalogSearchSchema.parse({ q: 'a', sort: 'name', category: 'arte' })
    expect(clearFilters(cur)).toEqual({ sort: 'name', page: 1 })
  })
})
