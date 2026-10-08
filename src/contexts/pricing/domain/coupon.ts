/** Value Object: código de cupom normalizado (trim + maiúsculas). */
export class Coupon {
  private constructor(readonly code: string) {}

  static parse(raw: string): Coupon {
    const code = raw.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      throw new RangeError('Cupom deve ter de 3 a 32 caracteres (letras, números, - ou _)')
    }
    return new Coupon(code)
  }

  /** Validação não-lançadora para formulários. */
  static tryParse(raw: string): Coupon | null {
    try {
      return Coupon.parse(raw)
    } catch {
      return null
    }
  }

  equals(other: Coupon): boolean {
    return this.code === other.code
  }
}
