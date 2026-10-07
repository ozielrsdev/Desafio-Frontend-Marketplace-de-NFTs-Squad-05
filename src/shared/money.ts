import Decimal from 'decimal.js'

/** Value Object imutável: ETH sempre como string decimal, nunca number. */
export class Money {
  private constructor(private readonly value: Decimal) {}

  static eth(raw: string): Money {
    const d = new Decimal(raw)
    if (!d.isFinite() || d.isNegative()) throw new Error(`Valor ETH inválido: ${raw}`)
    return new Money(d)
  }

  static zero() {
    return new Money(new Decimal(0))
  }

  plus(o: Money) { return new Money(this.value.plus(o.value)) }
  minus(o: Money) { return new Money(this.value.minus(o.value)) }
  times(qty: number) { return new Money(this.value.times(qty)) }
  compare(o: Money) { return this.value.comparedTo(o.value) }

  /** String decimal exata, sem notação científica. */
  toString() { return this.value.toFixed() }

  /** Apresentação: sem perder precisão, até 4 casas, mínimo 2. */
  format(locale = 'pt-BR') {
    const fixed = this.value.toDecimalPlaces(4, Decimal.ROUND_DOWN).toFixed()
    const [int, frac = ''] = fixed.split('.')
    const intFmt = new Intl.NumberFormat(locale).format(BigInt(int))
    return `${intFmt},${frac.padEnd(2, '0')} ETH`
  }
}
