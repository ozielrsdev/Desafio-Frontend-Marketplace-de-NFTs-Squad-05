/**
 * Hash de senha do mock (SHA-256 com salt por usuário via WebCrypto).
 * Senhas nunca são guardadas em claro (README §3 "Conta e sessão"). Não é um KDF de produção:
 * suficiente para a simulação, sem segredos reais.
 */
async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  return (await hashPassword(password, salt)) === hash
}

export function createSalt(): string {
  return crypto.randomUUID().replaceAll('-', '')
}
