import { ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { MoneyChange, QuoteDiff } from '../domain'
import { formatEth } from './format'

const FIELD_LABEL: Record<MoneyChange['field'], string> = {
  subtotal: 'Subtotal',
  discount: 'Desconto',
  networkFee: 'Taxa de rede',
  total: 'Total',
}
const REASON_LABEL = {
  price: 'preço alterado',
  quantity: 'quantidade ajustada',
  added: 'item adicionado',
  removed: 'item removido',
} as const

interface Props {
  diff: QuoteDiff | null
  blocked: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Cotação mudou entre revisão e envio: exige nova confirmação. `<dialog>` modal nativo
 * (focus trap, Esc e inert no fundo). Com itens indisponíveis, confirmar fica desabilitado.
 */
export function QuoteChangedDialog({ diff, blocked, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = diff !== null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="quote-changed-title"
      aria-describedby="quote-changed-desc"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-0 text-text backdrop:bg-black/50"
    >
      {diff && (
        <div className="space-y-4 p-6">
          <h2 id="quote-changed-title" className="text-xl font-bold">O valor do seu pedido mudou</h2>
          <p id="quote-changed-desc" className="text-sm text-text-muted">
            {blocked
              ? 'Alguns itens ficaram indisponíveis. Volte ao carrinho para ajustar o pedido.'
              : 'Revise as alterações abaixo e confirme para continuar com o novo valor.'}
          </p>

          {diff.items.length > 0 && (
            <ul className="space-y-1 text-sm">
              {diff.items.map((i) => (
                <li key={`${i.nftId}:${i.editionId}:${i.reason}`}>
                  <strong>{i.title}</strong> — {REASON_LABEL[i.reason]}
                </li>
              ))}
            </ul>
          )}

          <table className="w-full text-sm">
            <caption className="sr-only">Valores antes e depois da atualização</caption>
            <thead className="sr-only">
              <tr>
                <th>Campo</th>
                <th>Antes</th>
                <th>Depois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {diff.money.map((c) => (
                <tr key={c.field}>
                  <th scope="row" className="py-2 pr-2 text-left font-medium">{FIELD_LABEL[c.field]}</th>
                  <td className="money py-2 text-right text-text-muted line-through">{formatEth(c.from)}</td>
                  <td className="px-1 py-2" aria-hidden="true"><ArrowRight size={14} /></td>
                  <td className="money py-2 text-right font-semibold">{formatEth(c.to)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 cursor-pointer rounded-md border border-border px-4 font-medium hover:bg-surface-muted"
            >
              Voltar ao carrinho
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={blocked}
              className="min-h-11 cursor-pointer rounded-md bg-cta px-4 font-semibold text-cta-fg hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirmar novo valor
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
