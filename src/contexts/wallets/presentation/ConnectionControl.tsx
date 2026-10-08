import { CheckCircle2, CircleAlert, Loader2, Plug, Unplug } from 'lucide-react'
import { useWalletConnection } from '../application'

/** Conexão simulada: conectando/conectado/recusada (com retry)/desconectar. Estado anunciado via aria-live. */
export function ConnectionControl({ walletId }: { walletId: string }) {
  const { state, connect, disconnect } = useWalletConnection(walletId)

  return (
    <div className="space-y-2">
      <p role="status" aria-live="polite" className="flex min-h-6 items-center gap-1.5 text-sm font-medium">
        {state.status === 'connecting' && (
          <>
            <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> Conectando…
          </>
        )}
        {state.status === 'connected' && (
          <span className="flex items-center gap-1.5 text-success">
            <CheckCircle2 aria-hidden="true" size={16} /> Conectada
          </span>
        )}
        {state.status === 'disconnected' && <span className="text-text-muted">Desconectada</span>}
        {state.status === 'refused' && (
          <span className="flex items-center gap-1.5 text-danger" role="alert">
            <CircleAlert aria-hidden="true" size={16} /> {state.message}
          </span>
        )}
      </p>

      {state.status === 'connected' ? (
        <button
          type="button"
          onClick={() => void disconnect()}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 font-medium hover:bg-surface-muted"
        >
          <Unplug aria-hidden="true" size={16} /> Desconectar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void connect()}
          disabled={state.status === 'connecting'}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plug aria-hidden="true" size={16} />
          {state.status === 'refused' ? 'Tentar novamente' : 'Conectar carteira'}
        </button>
      )}
    </div>
  )
}
