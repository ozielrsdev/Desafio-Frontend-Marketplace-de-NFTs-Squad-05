import { CircleAlert, Loader2, WifiOff, XCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { isAppError } from '@/shared/http/errors'
import { useOrder, useOrderLive, useOrderSettlement } from '../application'
import { OrderReceipt } from './OrderReceipt'

interface Props {
  userId: string
  orderId: string
  /** Pedido recusado: volta ao checkout (itens preservados no carrinho). */
  onRetry: () => void
  onContinueShopping: () => void
}

/**
 * Rota `/orders/:id/confirmation`: a confirmação só aparece para pedido efetivamente
 * confirmado; pendente e recusado têm telas próprias. Acompanha `order.updated` em tempo real
 * e retoma o pedido após refresh/reconexão sem criar nova compra.
 */
export function OrderStatusView({ userId, orderId, onRetry, onContinueShopping }: Props) {
  const order = useOrder(userId, orderId)
  const { connected } = useOrderLive(userId)
  useOrderSettlement(userId, order.data)

  const status = order.data?.status
  const heading = useRef<HTMLHeadingElement>(null)
  const previous = useRef(status)
  useEffect(() => {
    // Foco no resultado quando o pedido sai de "pendente" (anúncio via região viva abaixo).
    if (previous.current === 'pending' && status && status !== 'pending') heading.current?.focus()
    previous.current = status
  }, [status])

  if (order.isPending) {
    return (
      <Shell>
        <div role="status" aria-busy="true" aria-label="Carregando pedido" className="space-y-4 rounded-card border border-border bg-surface p-6">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      </Shell>
    )
  }

  if (order.isError) {
    const gone = isAppError(order.error) && (order.error.kind === 'not_found' || order.error.kind === 'forbidden')
    return (
      <Shell>
        <div role="alert" className="space-y-3 rounded-card border border-danger bg-danger-bg p-5 text-danger">
          <p className="flex items-center gap-2 font-medium">
            <CircleAlert aria-hidden="true" size={20} />
            {gone ? 'Pedido não encontrado.' : 'Não foi possível carregar o pedido.'}
          </p>
          {gone ? (
            <button type="button" onClick={onContinueShopping} className="min-h-11 cursor-pointer rounded-md border border-danger px-4 font-medium hover:bg-danger/10">Voltar ao início</button>
          ) : (
            <button type="button" onClick={() => void order.refetch()} className="min-h-11 cursor-pointer rounded-md border border-danger px-4 font-medium hover:bg-danger/10">Tentar novamente</button>
          )}
        </div>
      </Shell>
    )
  }

  const data = order.data
  return (
    <Shell>
      {!connected && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-md bg-warning-bg px-3 py-2 text-sm font-medium text-warning">
          <WifiOff aria-hidden="true" size={16} /> Reconectando… o estado do pedido será atualizado automaticamente.
        </p>
      )}

      {data.status === 'confirmed' && (
        <>
          <p role="status" className="sr-only">Pagamento confirmado.</p>
          <OrderReceipt ref={heading} order={data} />
          <button type="button" onClick={onContinueShopping} className="mt-6 min-h-12 w-full cursor-pointer rounded-md bg-primary px-4 font-semibold text-primary-fg hover:opacity-90">
            Continuar explorando
          </button>
        </>
      )}

      {data.status === 'pending' && (
        <section aria-labelledby="pending-title" className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm">
          <h1 id="pending-title" ref={heading} tabIndex={-1} className="flex items-center gap-3 text-xl font-bold outline-offset-4">
            <Loader2 aria-hidden="true" size={24} className="animate-spin motion-reduce:animate-none" />
            Aguardando confirmação do pagamento
          </h1>
          <p role="status" className="text-text-muted">
            Pedido <strong className="text-text">{data.id}</strong> enviado. Não é preciso pagar de novo — se você
            recarregar a página ou perder a conexão, retomamos este mesmo pedido.
          </p>
        </section>
      )}

      {data.status === 'rejected' && (
        <section aria-labelledby="rejected-title" className="space-y-4 rounded-card border border-danger bg-danger-bg p-6 text-danger">
          <p role="status" className="sr-only">Pagamento recusado.</p>
          <h1 id="rejected-title" ref={heading} tabIndex={-1} className="flex items-center gap-3 text-xl font-bold outline-offset-4">
            <XCircle aria-hidden="true" size={24} /> Pagamento recusado
          </h1>
          <p>{data.rejectionReason ?? 'O pagamento não foi aprovado.'} Seus itens continuam no carrinho.</p>
          <button type="button" onClick={onRetry} className="min-h-12 w-full cursor-pointer rounded-md bg-cta px-4 font-semibold text-cta-fg hover:bg-cta-hover">
            Tentar novamente
          </button>
        </section>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
}
