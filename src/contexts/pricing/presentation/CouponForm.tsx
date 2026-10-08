import { CircleAlert, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { COUPON_MESSAGES, CouponError } from '../domain'

interface Props {
  appliedCode: string | null
  pending: boolean
  error: unknown
  onApply: (code: string) => void
  onRemove: () => void
}

export function CouponForm({ appliedCode, pending, error, onApply, onRemove }: Props) {
  const id = useId()
  const [value, setValue] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const message =
    localError ??
    (error instanceof CouponError
      ? COUPON_MESSAGES[error.code]
      : error
        ? 'Não foi possível validar o cupom. Tente novamente.'
        : null)

  if (appliedCode) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-surface-muted px-3">
        <p className="text-sm">
          Cupom <strong className="font-semibold">{appliedCode}</strong> aplicado
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover cupom ${appliedCode}`}
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-md px-2 text-sm font-medium hover:bg-border/50"
        >
          <X aria-hidden="true" size={16} /> Remover
        </button>
      </div>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim()) return setLocalError('Informe o código do cupom.')
    setLocalError(null)
    onApply(value)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">Cupom de desconto</label>
      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setLocalError(null)
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : `${id}-hint`}
          className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-base uppercase aria-[invalid=true]:border-danger"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 min-w-24 cursor-pointer items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-fg transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Validando…' : 'Aplicar'}
        </button>
      </div>
      {message ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" size={16} /> {message}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-sm text-text-muted">Digite o código e toque em aplicar.</p>
      )}
    </form>
  )
}
