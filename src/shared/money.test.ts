import { describe, expect, it } from 'vitest'
import { Money } from './money'

describe('Money', () => {
  it('soma sem erro de ponto flutuante', () => {
    expect(Money.eth('0.1').plus(Money.eth('0.2')).toString()).toBe('0.3')
  })
  it('multiplica por quantidade inteira', () => {
    expect(Money.eth('1.25').times(3).toString()).toBe('3.75')
  })
  it('formata em pt-BR com mínimo de 2 casas', () => {
    expect(Money.eth('2').format()).toBe('2,00 ETH')
    expect(Money.eth('0.12345').format()).toBe('0,1234 ETH')
  })
  it('rejeita valores inválidos', () => {
    expect(() => Money.eth('abc')).toThrow()
    expect(() => Money.eth('-1')).toThrow()
  })
})
