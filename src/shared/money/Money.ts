import Decimal from 'decimal.js'

/**
 * Value Object monetário em ETH.
 *
 * - Trafega como string decimal (nunca `number`) — README §3 "Carrinho".
 * - Aritmética com decimal.js, sem perda de precisão.
 * - Imutável: toda operação devolve uma nova instância.
 */

/** Casas decimais aceitas no contrato (wei = 18). */
export const ETH_SCALE = 18
/** Casas exibidas por padrão na UI (definido no contrato e documentado em ARCHITECTURE.md). */
export const ETH_DISPLAY_DECIMALS = 4

const D = Decimal.clone({ precision: 64, rounding: Decimal.ROUND_HALF_UP })

const DECIMAL_STRING = /^-?\d+(\.\d+)?$/

export class InvalidMoneyError extends Error {
  constructor(value: unknown) {
    super(`Valor monetário inválido: ${String(value)}`)
    this.name = 'InvalidMoneyError'
  }
}

export class Money {
  private readonly value: Decimal

  private constructor(value: Decimal) {
    this.value = value
    Object.freeze(this)
  }

  /** Cria a partir de string decimal (`"0.125"`). Rejeita `number` para não aceitar float por engano. */
  static of(amount: string): Money {
    if (typeof amount !== 'string' || !DECIMAL_STRING.test(amount.trim())) {
      throw new InvalidMoneyError(amount)
    }
    const decimal = new D(amount.trim())
    if (decimal.decimalPlaces() > ETH_SCALE) throw new InvalidMoneyError(amount)
    return new Money(decimal)
  }

  static zero(): Money {
    return new Money(new D(0))
  }

  static isValid(amount: unknown): amount is string {
    try {
      Money.of(amount as string)
      return true
    } catch {
      return false
    }
  }

  static sum(values: readonly Money[]): Money {
    return values.reduce((acc, m) => acc.add(m), Money.zero())
  }

  add(other: Money): Money {
    return new Money(this.value.plus(other.value))
  }

  subtract(other: Money): Money {
    return new Money(this.value.minus(other.value))
  }

  /** Multiplica por uma quantidade inteira (ver `Quantity`). */
  multiply(quantity: number): Money {
    if (!Number.isInteger(quantity)) throw new InvalidMoneyError(quantity)
    return new Money(this.value.times(quantity))
  }

  /** Percentual (ex.: desconto de cupom). `percent` como string decimal, ex.: "10". */
  percentage(percent: string): Money {
    return new Money(this.value.times(new D(percent)).dividedBy(100).toDecimalPlaces(ETH_SCALE))
  }

  equals(other: Money): boolean {
    return this.value.equals(other.value)
  }

  compare(other: Money): -1 | 0 | 1 {
    return this.value.comparedTo(other.value) as -1 | 0 | 1
  }

  isZero(): boolean {
    return this.value.isZero()
  }

  isNegative(): boolean {
    return this.value.isNegative()
  }

  /** Representação canônica para o contrato (sem notação científica, sem zeros à direita). */
  toString(): string {
    return this.value.toFixed()
  }

  toJSON(): string {
    return this.toString()
  }

  /**
   * Formatação para exibição, sem passar por `number`.
   * Ex.: `Money.of("1234.5").format()` → `"1.234,5000 ETH"` (pt-BR).
   */
  format(options: { decimals?: number; withUnit?: boolean } = {}): string {
    const decimals = options.decimals ?? ETH_DISPLAY_DECIMALS
    const fixed = this.value.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toFixed(decimals)
    const negative = fixed.startsWith('-')
    const [intPart = '0', fracPart] = (negative ? fixed.slice(1) : fixed).split('.')
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const body = fracPart ? `${grouped},${fracPart}` : grouped
    const text = `${negative ? '-' : ''}${body}`
    return options.withUnit === false ? text : `${text} ETH`
  }
}
