import { AlertTriangle, SearchX } from 'lucide-react'
import type { ApiError } from '@/shared/http/errors'
import { Button } from './button'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <SearchX aria-hidden className="size-10 text-muted" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-muted">{description}</p>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying?: boolean }) {
  const message = (error as ApiError | undefined)?.message ?? 'Algo deu errado.'
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/40 bg-danger/10 px-6 py-12 text-center">
      <AlertTriangle aria-hidden className="size-10 text-danger" />
      <h2 className="text-xl font-semibold">Não foi possível carregar</h2>
      <p className="max-w-md text-muted">{message}</p>
      <Button onClick={onRetry} disabled={retrying}>{retrying ? 'Tentando…' : 'Tentar novamente'}</Button>
    </div>
  )
}
