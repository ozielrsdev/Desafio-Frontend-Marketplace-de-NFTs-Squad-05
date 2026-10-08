/** Value Object `Email`: normalizado (trim + minúsculas) e validado. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Email = string & { readonly __brand: 'Email' }

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isEmail(value: string): value is Email {
  return EMAIL_PATTERN.test(normalizeEmail(value))
}

export function toEmail(value: string): Email {
  const normalized = normalizeEmail(value)
  if (!EMAIL_PATTERN.test(normalized)) throw new Error('E-mail inválido')
  return normalized as Email
}
