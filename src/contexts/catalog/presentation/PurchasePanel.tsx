import { useEffect, useId, useState } from 'react'
import { Heart, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { type Nft, maxQuantity } from '../domain/nft'

/**
 * Ações de compra dependem dos contextos Cart e Favorites (outros devs).
 * Até lá ficam visíveis porém desabilitadas e explicadas: não aparentam sucesso funcional.
 */
export function PurchasePanel({ nft }: { nft: Nft }) {
  const id = useId()
  const firstAvailable = nft.editions.find((e) => e.available > 0) ?? nft.editions[0]
  const [editionId, setEditionId] = useState(firstAvailable.id)
  const [qty, setQty] = useState(1)

  const edition = nft.editions.find((e) => e.id === editionId) ?? firstAvailable
  const max = maxQuantity(edition)
  const unavailable = max === 0

  // Atualização em tempo real pode reduzir o estoque: mantém a quantidade dentro do limite.
  useEffect(() => { setQty((q) => Math.max(unavailable ? 0 : 1, Math.min(q, max))) }, [max, unavailable])

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">Edição</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {nft.editions.map((e) => {
            const out = e.available === 0
            const selected = e.id === editionId
            return (
              <label
                key={e.id}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border-2 p-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring',
                  selected ? 'border-primary bg-primary/10' : 'border-border',
                  out && 'opacity-60',
                )}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name={`${id}-edition`} className="size-5 accent-primary" checked={selected} onChange={() => { setEditionId(e.id); setQty(1) }} />
                  <span className="font-semibold">{e.label}</span>
                </span>
                {out ? <Badge tone="danger">Esgotada</Badge> : <span className="tabular text-sm text-muted">{e.available} de {e.total}</span>}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span id={`${id}-qty`} className="text-sm font-semibold">Quantidade</span>
        <div role="group" aria-labelledby={`${id}-qty`} className="flex items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Diminuir quantidade" disabled={unavailable || qty <= 1} onClick={() => setQty((q) => q - 1)}>
            <Minus aria-hidden className="size-4" />
          </Button>
          <output aria-live="polite" className="tabular min-w-10 text-center text-lg font-semibold">{unavailable ? 0 : qty}</output>
          <Button variant="outline" size="icon" aria-label="Aumentar quantidade" disabled={unavailable || qty >= max} onClick={() => setQty((q) => q + 1)}>
            <Plus aria-hidden className="size-4" />
          </Button>
        </div>
        <p className="text-sm text-muted" role="status">
          {unavailable ? 'Esta edição está esgotada.' : qty >= max ? `Limite de ${max} ${max === 1 ? 'unidade' : 'unidades'} atingido.` : `Até ${max} por compra.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled aria-describedby={`${id}-soon`} className="flex-1"><ShoppingCart aria-hidden className="size-5" /> Adicionar ao carrinho</Button>
        <Button variant="outline" size="icon" disabled aria-label="Favoritar (indisponível)" aria-describedby={`${id}-soon`}><Heart aria-hidden className="size-5" /></Button>
      </div>
      <p id={`${id}-soon`} className="text-sm text-muted">Carrinho e favoritos serão habilitados quando esses módulos forem integrados.</p>
    </div>
  )
}
