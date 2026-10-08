import { CircleAlert, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { NETWORK_LABEL } from '@/shared/network'
import { useSaveWallet, useWallets } from '../application'
import type { Wallet, WalletRole, WalletSet } from '../domain'
import { ConnectionControl } from './ConnectionControl'
import { WalletAddressText } from './WalletAddressText'
import { WalletForm } from './WalletForm'

const ROLE_LABEL: Record<WalletRole, string> = { primary: 'Carteira principal', secondary: 'Carteira secundária' }

export function WalletsPage({ userId }: { userId: string }) {
  const wallets = useWallets(userId)

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Carteiras</h1>
      {wallets.isPending ? (
        <WalletsSkeleton />
      ) : wallets.isError ? (
        <div role="alert" className="rounded-card border border-danger bg-danger-bg p-4 text-danger">
          <p className="flex items-center gap-2 font-medium">
            <CircleAlert aria-hidden="true" size={20} /> Não foi possível carregar suas carteiras.
          </p>
          <button type="button" onClick={() => void wallets.refetch()} className="mt-3 min-h-11 cursor-pointer rounded-md border border-danger px-4 font-medium hover:bg-danger/10">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <WalletCard userId={userId} role="primary" set={wallets.data} />
          <WalletCard userId={userId} role="secondary" set={wallets.data} />
        </div>
      )}
    </main>
  )
}

function WalletCard({ userId, role, set }: { userId: string; role: WalletRole; set: WalletSet }) {
  const wallet: Wallet | null = set[role]
  const [open, setOpen] = useState(false)
  const save = useSaveWallet(userId)
  const headingId = `wallet-${role}`

  return (
    <section aria-labelledby={headingId} className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-sm">
      <h2 id={headingId} className="text-lg font-semibold">{ROLE_LABEL[role]}</h2>

      {open || !wallet ? (
        open || role === 'primary' || set.primary ? (
          open ? (
            <WalletForm
              role={role}
              set={set}
              editing={wallet}
              pending={save.isPending}
              serverError={save.error}
              onCancel={() => { save.reset(); setOpen(false) }}
              onSubmit={(command) => save.mutate(command, { onSuccess: () => setOpen(false) })}
            />
          ) : (
            <Empty role={role} onStart={() => setOpen(true)} />
          )
        ) : (
          <p className="text-sm text-text-muted">Cadastre primeiro a carteira principal.</p>
        )
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Rede: <strong className="text-text">{NETWORK_LABEL[wallet.network]}</strong></p>
          <WalletAddressText address={wallet.address} />
          <ConnectionControl walletId={wallet.id} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium text-primary hover:bg-surface-muted"
          >
            <Pencil aria-hidden="true" size={16} /> Editar {role === 'primary' ? 'principal' : 'secundária'}
          </button>
        </div>
      )}
    </section>
  )
}

function Empty({ role, onStart }: { role: WalletRole; onStart: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        {role === 'primary' ? 'Nenhuma carteira principal cadastrada. Ela é necessária para comprar.' : 'Opcional: cadastre uma segunda carteira.'}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-fg hover:opacity-90"
      >
        <Plus aria-hidden="true" size={16} /> Cadastrar {role === 'primary' ? 'principal' : 'secundária'}
      </button>
    </div>
  )
}

function WalletsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando carteiras" role="status" className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="h-60 space-y-4 rounded-card border border-border bg-surface p-5">
          <div className="skeleton h-6 w-44" />
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-11 w-40" />
        </div>
      ))}
    </div>
  )
}
