import { cn } from '@/shared/lib/utils'

type Tone = 'neutral' | 'success' | 'danger' | 'warning'
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-foreground',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
}

export function Badge({ tone = 'neutral', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', tones[tone], className)} {...props} />
}
