const PATTERN = /^0x[0-9a-fA-F]{40}$/

/** Value Object: endereço no formato 0x + 40 hex. Comparação case-insensitive. */
export class WalletAddress {
  private constructor(readonly value: string) {}

  static parse(raw: string): WalletAddress {
    const value = raw.trim()
    if (!PATTERN.test(value)) throw new RangeError('Endereço inválido')
    return new WalletAddress(value)
  }

  static isValid(raw: string): boolean {
    return PATTERN.test(raw.trim())
  }

  equals(other: WalletAddress): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase()
  }

  /** `0x1234…abcd` para exibição compacta. */
  abbreviated(): string {
    return `${this.value.slice(0, 6)}…${this.value.slice(-4)}`
  }

  toString(): string {
    return this.value
  }
}
