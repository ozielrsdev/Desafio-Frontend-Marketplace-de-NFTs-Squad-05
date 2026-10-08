/** Falhas de negócio de cotação, traduzidas da API (422/409) na infraestrutura. */
export type CouponErrorCode = 'coupon_invalid' | 'coupon_expired' | 'coupon_not_applicable'

export class CouponError extends Error {
  constructor(
    readonly code: CouponErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'CouponError'
  }
}

/** Servidor rejeitou a cotação referenciada (preço/edição mudou): exige reconfirmação. */
export class StaleQuoteError extends Error {
  constructor() {
    super('A cotação está desatualizada')
    this.name = 'StaleQuoteError'
  }
}

export const COUPON_MESSAGES: Record<CouponErrorCode, string> = {
  coupon_invalid: 'Cupom inválido. Confira o código e tente novamente.',
  coupon_expired: 'Este cupom expirou.',
  coupon_not_applicable: 'Este cupom não se aplica aos itens do carrinho.',
}
