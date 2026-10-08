/**
 * Dados do colecionador no checkout. Campos assumidos (nome e e-mail) — confirmar com o
 * frame de Pagamento do Figma e ajustar aqui (ver "Further Notes" da spec).
 */
export interface CollectorDetails {
  fullName: string
  email: string
}

export type CollectorErrors = Partial<Record<keyof CollectorDetails, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCollector(details: CollectorDetails): CollectorErrors {
  const errors: CollectorErrors = {}
  const name = details.fullName.trim()
  if (!name) errors.fullName = 'Informe seu nome completo.'
  else if (name.split(/\s+/).length < 2) errors.fullName = 'Informe nome e sobrenome.'
  if (!details.email.trim()) errors.email = 'Informe seu e-mail.'
  else if (!EMAIL.test(details.email.trim())) errors.email = 'E-mail inválido.'
  return errors
}

export const hasErrors = (e: CollectorErrors) => Object.keys(e).length > 0
