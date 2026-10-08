import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Label } from './label'

type FieldControlProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

interface FormFieldProps {
  label: string
  /** Mensagem de erro (local ou da API). Associada ao campo via aria-describedby. */
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  children: ReactElement<FieldControlProps>
}

/**
 * Campo de formulário acessível: label visível, hint persistente e erro abaixo do campo,
 * ligados por `aria-describedby` (form-labels, error-placement, aria-live-errors).
 */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const generatedId = useId()
  const id = children.props.id ?? generatedId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })
    : children

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>
      {control}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-destructive" role="alert">
          <span aria-hidden="true">●</span>
          {error}
        </p>
      )}
    </div>
  )
}
