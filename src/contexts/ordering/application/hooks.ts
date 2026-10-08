import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isAppError } from '@/shared/http/errors'
import { EventGate } from '@/shared/realtime'
import { applyOrderUpdate, isTerminal, type Order } from '../domain'
import { useOrderingDeps } from './deps'
import { orderKeys } from './query-keys'
import { submitCheckout, type CheckoutResult, type SubmitCheckoutParams } from './submit-checkout'

/**
 * Confirmar compra. Guarda lógica contra duplo envio (além do `isPending` do botão):
 * cliques enquanto há um envio em andamento reaproveitam a mesma promise.
 */
export function useCheckout(userId: string) {
  const deps = useOrderingDeps()
  const queryClient = useQueryClient()
  const inFlight = useRef<Promise<CheckoutResult> | null>(null)

  const mutation = useMutation({
    mutationKey: [...orderKeys.all(userId), 'checkout'],
    mutationFn: (params: SubmitCheckoutParams) => {
      if (inFlight.current) return inFlight.current
      const promise = submitCheckout(deps, params).finally(() => {
        inFlight.current = null
      })
      inFlight.current = promise
      return promise
    },
    onSuccess: (result) => {
      if (result.kind === 'created') {
        queryClient.setQueryData(orderKeys.detail(userId, result.order.id), result.order)
        void queryClient.invalidateQueries({ queryKey: orderKeys.pending(userId) })
      }
    },
  })
  return mutation
}

export function useOrder(userId: string, orderId: string) {
  const { gateway } = useOrderingDeps()
  return useQuery({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: ({ signal }) => gateway.get(orderId, { signal }),
    // Pedido de outro usuário (403/404) não deve ser reenviado em loop.
    retry: (count, error) => count < 2 && (!isAppError(error) || error.kind === 'transient' || error.kind === 'network'),
  })
}

/** Recuperação: pedidos pendentes do usuário (após refresh/reconexão). */
export function usePendingOrders(userId: string) {
  const { gateway } = useOrderingDeps()
  return useQuery({
    queryKey: orderKeys.pending(userId),
    queryFn: ({ signal }) => gateway.listPending({ signal }),
  })
}

/**
 * Assina `order.updated` enquanto montado. Descarta duplicados/antigos (EventGate + máquina
 * de estados), ignora eventos de outro usuário e reconcilia via REST após reconexão.
 * Libera subscription e tabela de versões ao desmontar / trocar de usuário.
 */
export function useOrderLive(userId: string) {
  const { events } = useOrderingDeps()
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(true)
  const gate = useMemo(() => new EventGate(), [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = events.subscribe(userId, {
      onConnectionChange: setConnected,
      onReconnect: () => {
        void queryClient.invalidateQueries({ queryKey: orderKeys.all(userId) })
      },
      onEvent: (event) => {
        if (event.userId !== userId) return
        const decision = gate.decide({
          eventId: event.eventId,
          resource: { kind: 'order', id: event.orderId },
          version: event.version,
        })
        if (decision !== 'apply') return

        const key = orderKeys.detail(userId, event.orderId)
        const current = queryClient.getQueryData<Order>(key)
        if (!current) {
          void queryClient.invalidateQueries({ queryKey: orderKeys.all(userId) })
          return
        }
        const next = applyOrderUpdate(current, event)
        if (next === current) return
        queryClient.setQueryData(key, next)
        if (isTerminal(next.status)) {
          queryClient.setQueryData<Order[]>(orderKeys.pending(userId), (old) => old?.filter((o) => o.id !== next.id))
        }
      },
    })
    return () => {
      unsubscribe()
      gate.clear()
    }
  }, [events, gate, queryClient, userId])

  return { connected }
}

/**
 * Liquidação do pedido terminal, uma única vez (persistida): em `confirmed`, remove do carrinho
 * só os itens/quantidades comprados; em qualquer terminal, encerra a tentativa de checkout
 * (chave de idempotência). Em `rejected` os itens permanecem no carrinho.
 */
export function useOrderSettlement(userId: string, order: Order | undefined) {
  const { cart, store } = useOrderingDeps()
  const settle = useCallback(
    (o: Order) => {
      if (!isTerminal(o.status) || store.isSettled(userId, o.id)) return
      store.markSettled(userId, o.id)
      store.clearAttempt(userId)
      if (o.status === 'confirmed') {
        cart.removePurchased(
          userId,
          o.items.map((i) => ({ nftId: i.nftId, editionId: i.editionId, quantity: i.quantity })),
        )
      }
    },
    [cart, store, userId],
  )
  useEffect(() => {
    if (order) settle(order)
  }, [order, settle])
}
