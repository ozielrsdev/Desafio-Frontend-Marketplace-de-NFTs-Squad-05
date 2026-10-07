import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Select nativo estilizado: melhor a11y e UX mobile que um listbox custom. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('min-h-11 w-full rounded-full border border-border bg-surface px-4 text-base', className)}
      {...props}
    />
  ),
)
Select.displayName = 'Select'
