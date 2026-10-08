/** Value Object: chave de idempotência (UUID) por tentativa de checkout. */
export class IdempotencyKey {
  private constructor(readonly value: string) {}

  static generate(): IdempotencyKey {
    return new IdempotencyKey(crypto.randomUUID())
  }

  static parse(raw: string): IdempotencyKey {
    if (!/^[0-9a-f-]{36}$/i.test(raw)) throw new RangeError('Chave de idempotência inválida')
    return new IdempotencyKey(raw)
  }
}

export interface StoredAttempt {
  key: string
  fingerprint: string
}

/**
 * Reutiliza a chave persistida enquanto a tentativa for a MESMA (mesmo conteúdo): é o que
 * permite recuperar o mesmo pedido após timeout. Conteúdo diferente exige chave nova
 * (a mesma chave com outro corpo seria 409 no servidor).
 */
export function resolveIdempotencyKey(stored: StoredAttempt | null, fingerprint: string): StoredAttempt {
  if (stored && stored.fingerprint === fingerprint) return stored
  return { key: IdempotencyKey.generate().value, fingerprint }
}
