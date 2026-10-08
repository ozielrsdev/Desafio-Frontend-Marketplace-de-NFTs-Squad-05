/** Value Object: inteiro ≥ 1. */
export class Quantity {
  private constructor(readonly value: number) {}

  static of(value: number): Quantity {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(`Quantidade inválida: ${value}`)
    }
    return new Quantity(value)
  }
}
