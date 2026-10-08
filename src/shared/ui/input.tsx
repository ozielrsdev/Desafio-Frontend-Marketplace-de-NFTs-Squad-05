import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-lg border border-input bg-background/60 px-3 py-2 text-base text-foreground shadow-xs transition-colors duration-200 outline-none',
        'placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-base text-foreground shadow-xs transition-colors duration-200 outline-none',
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
