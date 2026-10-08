import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { CollectorDetails, CollectorErrors } from '../domain'

interface Props {
  value: CollectorDetails
  errors: CollectorErrors
  onChange: (value: CollectorDetails) => void
}

/** Dados do colecionador: labels visíveis, erro junto do campo e associado via aria-describedby. */
export function CollectorForm({ value, errors, onChange }: Props) {
  const uid = useId()
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-lg font-semibold">Dados do colecionador</legend>
      <Field id={`${uid}-name`} label="Nome completo" error={errors.fullName}>
        <input
          id={`${uid}-name`}
          value={value.fullName}
          onChange={(e) => onChange({ ...value, fullName: e.target.value })}
          autoComplete="name"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? `${uid}-name-error` : undefined}
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-base aria-[invalid=true]:border-danger"
        />
      </Field>
      <Field id={`${uid}-email`} label="E-mail" error={errors.email}>
        <input
          id={`${uid}-email`}
          type="email"
          inputMode="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${uid}-email-error` : undefined}
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-base aria-[invalid=true]:border-danger"
        />
      </Field>
    </fieldset>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" size={16} /> {error}
        </p>
      )}
    </div>
  )
}
