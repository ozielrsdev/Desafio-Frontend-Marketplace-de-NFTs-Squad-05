import { createContext, useContext, type ReactNode } from 'react'
import type { WalletConnector, WalletGateway } from './ports'

interface Deps {
  gateway: WalletGateway
  connector: WalletConnector
}

const DepsContext = createContext<Deps | null>(null)

/** Injeta os adapters (composição em `app/`). */
export function WalletsDepsProvider({ children, ...deps }: Deps & { children: ReactNode }) {
  return <DepsContext.Provider value={deps}>{children}</DepsContext.Provider>
}

export function useWalletDeps(): Deps {
  const deps = useContext(DepsContext)
  if (!deps) throw new Error('WalletsDepsProvider ausente')
  return deps
}
