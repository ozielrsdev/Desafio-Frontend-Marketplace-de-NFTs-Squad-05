import Decimal from 'decimal.js'

/** ETH tem 18 casas decimais (wei). Nada acima disso é representável. */
export const ETH_DECIMALS = 18
/** Casas mínimas exibidas (ex.: "1.50"). A apresentação nunca trunca: ver `format`. */
export const ETH_MIN_DISPLAY_DECIMALS = 2

const MoneyDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_DOWN })

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/

/**
 * Value Object imutável para valores em ETH. Trafega como string decimal e
 * toda aritmética usa decimal.js — nunca `number`.
 */
export class Money {
  private constructor(private readonly value: Decimal) {}

  static zero(): Money {
    return new Money(new MoneyDecimal(0))
  }

  static parse(raw: string): Money {
    if (typeof raw !== 'string' || !DECIMAL_PATTERN.test(raw.trim())) {
      throw new RangeError(`Valor monetário inválido: ${String(raw)}`)
    }
    const value = new MoneyDecimal(raw.trim())
    if (value.decimalPlaces() > ETH_DECIMALS) {
      throw new RangeError(`Valor excede ${ETH_DECIMALS} casas decimais: ${raw}`)
    }
    return new Money(value)
  }

  add(other: Money): Money {
    return new Money(this.value.plus(other.value))
  }

  subtract(other: Money): Money {
    return new Money(this.value.minus(other.value))
  }

  /** Multiplica por uma quantidade inteira (`Quantity`) — preserva exatidão. */
  times(quantity: number): Money {
    if (!Number.isInteger(quantity)) throw new RangeError('Quantidade deve ser inteira')
    return new Money(this.value.times(quantity))
  }

  equals(other: Money): boolean {
    return this.value.equals(other.value)
  }

  isZero(): boolean {
    return this.value.isZero()
  }

  isNegative(): boolean {
    return this.value.isNegative() && !this.value.isZero()
  }

  /** Menor entre dois valores (útil para limitar desconto ao subtotal). */
  min(other: Money): Money {
    return this.value.lessThanOrEqualTo(other.value) ? this : other
  }

  /** String decimal canônica, sem notação científica e sem zeros à direita. */
  toString(): string {
    return this.value.toFixed()
  }

  /**
   * Formatação para apresentação, **sem perda**: mostra todas as casas
   * significativas (até 18), mantendo no mínimo 2 ("1.50", "0.30000000000000004" não existe aqui).
   */
  format(): string {
    const places = Math.max(this.value.decimalPlaces(), ETH_MIN_DISPLAY_DECIMALS)
    return this.value.toFixed(places)
  }

  toJSON(): string {
    return this.toString()
  }
}
