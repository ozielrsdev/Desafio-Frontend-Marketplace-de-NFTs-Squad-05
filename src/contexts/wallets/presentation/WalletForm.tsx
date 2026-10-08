import { CircleAlert } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { NETWORKS, NETWORK_LABEL } from '@/shared/network'
import {
  validateWalletDraft,
  WalletValidationError,
  type Wallet,
  type WalletFieldErrors,
  type WalletRole,
  type WalletSet,
} from '../domain'
import type { SaveWalletCommand } from '../application'

interface Props {
  role: WalletRole
  set: WalletSet
  editing: Wallet | null
  pending: boolean
  serverError: unknown
  onSubmit: (command: SaveWalletCommand) => void
  onCancel?: () => void
}

/** Validação local (domínio) + erros por campo do servidor (422/409), associados via aria-describedby. */
export function WalletForm({ role, set, editing, pending, serverError, onSubmit, onCancel }: Props) {
  const uid = useId()
  const [address, setAddress] = useState(editing?.address.value ?? '')
  const [network, setNetwork] = useState<string>(editing?.network ?? '')
  const [localErrors, setLocalErrors] = useState<WalletFieldErrors>({})

  const serverFields: WalletFieldErrors = serverError instanceof WalletValidationError ? serverError.fields : {}
  const errors = { ...serverFields, ...localErrors }
  const genericError = Boolean(serverError) && !(serverError instanceof WalletValidationError)

  function submit(e: FormEvent) {
    e.preventDefault()
    const result = validateWalletDraft({ address, network }, set, role)
    if (!result.ok) return setLocalErrors(result.errors)
    setLocalErrors({})
    onSubmit({ id: editing?.id, role, address: result.value.address, network: result.value.network })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id={`${uid}-address`} label="Endereço da carteira" error={errors.address}>
        <input
          id={`${uid}-address`}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setLocalErrors((p) => ({ ...p, address: undefined }))
          }}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.address ? true : undefined}
          aria-describedby={describe(`${uid}-address`, errors.address)}
          className="money min-h-11 w-full rounded-md border border-border bg-surface px-3 text-base aria-[invalid=true]:border-danger"
        />
      </Field>

      <Field id={`${uid}-network`} label="Rede" error={errors.network}>
        <select
          id={`${uid}-network`}
          value={network}
          onChange={(e) => {
            setNetwork(e.target.value)
            setLocalErrors((p) => ({ ...p, network: undefined }))
          }}
          aria-invalid={errors.network ? true : undefined}
          aria-describedby={describe(`${uid}-network`, errors.network)}
          className="min-h-11 w-full cursor-pointer rounded-md border border-border bg-surface px-3 text-base aria-[invalid=true]:border-danger"
        >
          <option value="">Selecione…</option>
          {NETWORKS.map((n) => (
            <option key={n} value={n}>{NETWORK_LABEL[n]}</option>
          ))}
        </select>
      </Field>

      {genericError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" size={16} /> Não foi possível salvar a carteira. Tente novamente.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer rounded-md border border-border px-4 font-medium hover:bg-surface-muted">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 cursor-pointer rounded-md bg-primary px-4 font-semibold text-primary-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar carteira'}
        </button>
      </div>
    </form>
  )
}

const describe = (id: string, error?: string) => (error ? `${id}-error` : undefined)

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" size={16} /> {error}
        </p>
      )}
    </div>
  )
}
