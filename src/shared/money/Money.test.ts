import { describe, expect, it } from 'vitest'
import { InvalidMoneyError, Money } from './Money'

describe('Money', () => {
  it('soma sem erro de ponto flutuante', () => {
    expect(Money.of('0.1').add(Money.of('0.2')).toString()).toBe('0.3')
  })

  it('preserva precisão de 18 casas', () => {
    const wei = Money.of('0.000000000000000001')
    expect(wei.multiply(3).toString()).toBe('0.000000000000000003')
  })

  it('multiplica apenas por quantidade inteira', () => {
    expect(Money.of('1.25').multiply(4).toString()).toBe('5')
    expect(() => Money.of('1').multiply(1.5)).toThrow(InvalidMoneyError)
  })

  it('rejeita entradas que não são string decimal', () => {
    expect(() => Money.of('1e3')).toThrow(InvalidMoneyError)
    expect(() => Money.of('abc')).toThrow(InvalidMoneyError)
    expect(() => Money.of(1 as unknown as string)).toThrow(InvalidMoneyError)
    expect(() => Money.of('0.0000000000000000001')).toThrow(InvalidMoneyError)
  })

  it('calcula percentual', () => {
    expect(Money.of('2.5').percentage('10').toString()).toBe('0.25')
  })

  it('soma lista e compara', () => {
    const total = Money.sum([Money.of('1'), Money.of('2.5'), Money.of('0.5')])
    expect(total.equals(Money.of('4'))).toBe(true)
    expect(Money.of('1').compare(Money.of('2'))).toBe(-1)
  })

  it('serializa como string canônica', () => {
    expect(JSON.stringify({ price: Money.of('1.500') })).toBe('{"price":"1.5"}')
  })

  it('formata em pt-BR sem passar por number', () => {
    expect(Money.of('1234.5').format()).toBe('1.234,5000 ETH')
    expect(Money.of('0.123456').format({ decimals: 3 })).toBe('0,123 ETH')
    expect(Money.of('-2').format({ withUnit: false, decimals: 2 })).toBe('-2,00')
  })

  it('é imutável', () => {
    const a = Money.of('1')
    a.add(Money.of('1'))
    expect(a.toString()).toBe('1')
    expect(Object.isFrozen(a)).toBe(true)
  })
})
