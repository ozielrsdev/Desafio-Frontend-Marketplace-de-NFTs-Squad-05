import { HttpResponse } from 'msw'
import type { ApiErrorDto, ErrorCode } from '@/shared/contracts'

/** Respostas no formato do contrato (`apiErrorSchema`). */
export function ok<T extends object>(body: T, status = 200) {
  return HttpResponse.json(body as never, { status })
}

export function noContent() {
  return new HttpResponse(null, { status: 204 })
}

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  extra: { fields?: Record<string, string>; details?: unknown } = {},
) {
  const body: ApiErrorDto = { error: { code, message, ...extra } }
  return HttpResponse.json(body, { status })
}

/** Converte issues do zod em erros por campo (422). */
export function validationError(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
  message = 'Revise os campos destacados.',
) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_'
    fields[key] ??= issue.message
  }
  return apiError(422, 'validation_error', message, { fields })
}
