import type { FieldValues, Path, UseFormSetError, UseFormSetFocus } from 'react-hook-form'
import { isAppError } from '@/shared/errors'

/**
 * Mapeia erros por campo da API (422/409) para o react-hook-form e foca o primeiro campo inválido
 * (focus-management). Retorna a mensagem geral quando o erro não é de campo.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  form: { setError: UseFormSetError<T>; setFocus: UseFormSetFocus<T> },
  knownFields: readonly Path<T>[],
): string | null {
  if (!isAppError(error)) return 'Algo deu errado. Tente novamente.'
  const matched = knownFields.filter((field) => error.fields[field])
  matched.forEach((field) => form.setError(field, { type: 'server', message: error.fields[field] }))
  if (matched[0]) {
    form.setFocus(matched[0])
    return null
  }
  return error.message
}
