import { describe, expect, it } from 'vitest'
import { Money } from './money'
import { Quantity } from './quantity'

describe('Money', () => {
  it('soma 0.1 + 0.2 exatamente (sem ponto flutuante)', () => {
    const sum = Money.parse('0.1').add(Money.parse('0.2'))
    expect(sum.toString()).toBe('0.3')
    expect(sum.equals(Money.parse('0.3'))).toBe(true)
  })

  it('subtrai sem perda de precisão', () => {
    expect(Money.parse('1').subtract(Money.parse('0.000000000000000001')).toString()).toBe(
      '0.999999999999999999',
    )
  })

  it('multiplica por quantidade inteira', () => {
    expect(Money.parse('0.1').times(Quantity.of(3).value).toString()).toBe('0.3')
    expect(Money.parse('1.15').times(3).toString()).toBe('3.45')
  })

  it('rejeita quantidade não inteira', () => {
    expect(() => Money.parse('1').times(1.5)).toThrow(RangeError)
  })

  it('rejeita formatos inválidos e mais de 18 casas', () => {
    for (const bad of ['', 'abc', '1e3', '1,5', '.5', '1.', '0.0000000000000000001']) {
      expect(() => Money.parse(bad)).toThrow(RangeError)
    }
  })

  it('format() não trunca nem arredonda; mínimo de 2 casas', () => {
    expect(Money.parse('1.5').format()).toBe('1.50')
    expect(Money.parse('2').format()).toBe('2.00')
    expect(Money.parse('0.123456789012345678').format()).toBe('0.123456789012345678')
  })

  it('toString é canônico (sem zeros à direita)', () => {
    expect(Money.parse('1.500').toString()).toBe('1.5')
    expect(Money.parse('0').toString()).toBe('0')
  })

  it('min limita o desconto ao subtotal', () => {
    expect(Money.parse('2').min(Money.parse('1.5')).toString()).toBe('1.5')
  })

  it('é imutável', () => {
    const a = Money.parse('1')
    a.add(Money.parse('1'))
    expect(a.toString()).toBe('1')
  })
})

describe('Quantity', () => {
  it('aceita inteiros ≥ 1', () => expect(Quantity.of(2).value).toBe(2))
  it('rejeita 0, negativos e frações', () => {
    for (const bad of [0, -1, 1.5, NaN]) expect(() => Quantity.of(bad)).toThrow(RangeError)
  })
})
