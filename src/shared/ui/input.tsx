import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('min-h-11 w-full rounded-full border border-border bg-surface px-4 text-base placeholder:text-muted', className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
