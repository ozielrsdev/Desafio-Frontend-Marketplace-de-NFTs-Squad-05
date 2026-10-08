import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import type { WalletAddress } from '../domain'

/** Endereço abreviado com opção de ver completo; acessível por leitor de tela. */
export function WalletAddressText({ address }: { address: WalletAddress }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const full = address.value
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code
        id={id}
        className="money min-w-0 rounded bg-surface-muted px-2 py-1 text-sm break-all"
        aria-label={
          expanded ? `Endereço completo: ${full.split('').join(' ')}` : `Endereço abreviado, começa com ${full.slice(0, 6)} e termina com ${full.slice(-4)}`
        }
      >
        {expanded ? full : address.abbreviated()}
      </code>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:bg-surface-muted"
      >
        {expanded ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
        {expanded ? 'Ocultar endereço completo' : 'Ver endereço completo'}
      </button>
    </div>
  )
}
