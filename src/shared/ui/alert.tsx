import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

const alertVariants = cva('relative flex gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      info: 'border-border bg-secondary/60 text-foreground',
      error: 'border-destructive/60 bg-destructive/10 text-red-200',
      success: 'border-success/60 bg-success/10 text-green-200',
    },
  },
  defaultVariants: { variant: 'info' },
})

const icons = { info: Info, error: AlertCircle, success: CheckCircle2 }

/** Alerta com ícone + texto (estado nunca só por cor). */
function Alert({
  className,
  variant = 'info',
  title,
  children,
  action,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants> & { title?: string; action?: ReactNode }) {
  const Icon = icons[variant ?? 'info']
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid flex-1 gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-current/90">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

export { Alert }
