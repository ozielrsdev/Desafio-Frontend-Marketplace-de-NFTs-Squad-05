import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { ConnectionRefusedError, DISCONNECTED, type ConnectionState } from '../domain'
import { useWalletDeps } from './deps'

type State = Record<string, ConnectionState>
type Action = { walletId: string; state: ConnectionState } | { reset: true }

function reducer(state: State, action: Action): State {
  if ('reset' in action) return {}
  return { ...state, [action.walletId]: action.state }
}

interface Value {
  stateOf: (walletId: string) => ConnectionState
  connect: (walletId: string) => Promise<boolean>
  disconnect: (walletId: string) => Promise<void>
}

const ConnectionContext = createContext<Value | null>(null)

/**
 * Estado de conexão efêmero (só memória). Remonte/troque `userId` no logout: tudo é limpo
 * e requisições de conexão em andamento são abortadas.
 */
export function WalletConnectionProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { connector } = useWalletDeps()
  const [state, dispatch] = useReducer(reducer, {})
  const controllers = useRef(new Map<string, AbortController>())

  useEffect(() => {
    const active = controllers.current
    return () => {
      active.forEach((c) => c.abort())
      active.clear()
      dispatch({ reset: true })
    }
  }, [userId])

  const connect = useCallback(
    async (walletId: string) => {
      controllers.current.get(walletId)?.abort()
      const controller = new AbortController()
      controllers.current.set(walletId, controller)
      dispatch({ walletId, state: { status: 'connecting' } })
      try {
        await connector.connect(walletId, { signal: controller.signal })
        dispatch({ walletId, state: { status: 'connected' } })
        return true
      } catch (error) {
        if (controller.signal.aborted) return false
        const message =
          error instanceof ConnectionRefusedError
            ? error.message
            : 'Não foi possível conectar à carteira. Tente novamente.'
        dispatch({ walletId, state: { status: 'refused', message } })
        return false
      }
    },
    [connector],
  )

  const disconnect = useCallback(
    async (walletId: string) => {
      controllers.current.get(walletId)?.abort()
      await connector.disconnect(walletId).catch(() => undefined)
      dispatch({ walletId, state: DISCONNECTED })
    },
    [connector],
  )

  const value = useMemo<Value>(
    () => ({ stateOf: (id) => state[id] ?? DISCONNECTED, connect, disconnect }),
    [state, connect, disconnect],
  )
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}

export function useWalletConnection(walletId: string | null) {
  const ctx = useContext(ConnectionContext)
  if (!ctx) throw new Error('WalletConnectionProvider ausente')
  return {
    state: walletId ? ctx.stateOf(walletId) : DISCONNECTED,
    connect: () => (walletId ? ctx.connect(walletId) : Promise.resolve(false)),
    disconnect: () => (walletId ? ctx.disconnect(walletId) : Promise.resolve()),
  }
}
