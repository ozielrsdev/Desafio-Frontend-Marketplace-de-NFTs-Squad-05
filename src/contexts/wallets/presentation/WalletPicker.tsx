import { useId } from 'react'
import { NETWORK_LABEL } from '@/shared/network'
import { listWallets, type Wallet } from '../domain'
import { useWallets } from '../application'
import { ConnectionControl } from './ConnectionControl'

interface Props {
  userId: string
  selectedId: string | null
  onSelect: (wallet: Wallet) => void
  /** Sem carteiras: direciona ao cadastro (o chamador guarda o retorno ao checkout). */
  onRegister: () => void
}

/** Seleção de carteira/rede no checkout — somente entre as cadastradas; cada carteira tem sua rede. */
export function WalletPicker({ userId, selectedId, onSelect, onRegister }: Props) {
  const wallets = useWallets(userId)
  const name = useId()

  if (wallets.isPending) {
    return <div aria-busy="true" className="skeleton h-28 w-full" role="status" aria-label="Carregando carteiras" />
  }
  if (wallets.isError) {
    return (
      <p role="alert" className="text-sm font-medium text-danger">
        Não foi possível carregar suas carteiras.{' '}
        <button type="button" className="min-h-11 cursor-pointer underline" onClick={() => void wallets.refetch()}>Tentar novamente</button>
      </p>
    )
  }

  const list = listWallets(wallets.data)
  if (list.length === 0) {
    return (
      <div className="space-y-3 rounded-md bg-warning-bg p-4 text-warning">
        <p className="text-sm font-medium">Você ainda não tem carteira cadastrada. Cadastre uma para pagar.</p>
        <button type="button" onClick={onRegister} className="min-h-11 cursor-pointer rounded-md bg-primary px-4 font-semibold text-primary-fg hover:opacity-90">
          Cadastrar carteira
        </button>
      </div>
    )
  }

  const selected = list.find((w) => w.id === selectedId) ?? null
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Carteira e rede</legend>
      {list.map((w) => (
        <label
          key={w.id}
          className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary"
        >
          <input type="radio" name={name} checked={w.id === selectedId} onChange={() => onSelect(w)} className="mt-1 size-5 cursor-pointer" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{w.role === 'primary' ? 'Principal' : 'Secundária'} · {NETWORK_LABEL[w.network]}</span>
            <span className="money block text-sm break-all text-text-muted">{w.address.abbreviated()}</span>
          </span>
        </label>
      ))}
      {selected && <ConnectionControl walletId={selected.id} />}
    </fieldset>
  )
}
