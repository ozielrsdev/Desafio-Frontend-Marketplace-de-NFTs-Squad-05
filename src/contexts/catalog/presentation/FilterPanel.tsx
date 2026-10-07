import { useId } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { type CatalogSearch, hasActiveFilters, SORT_LABEL, SORT_OPTIONS } from '../domain/catalog-search'
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../domain/nft'

interface Props {
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
  onClear: () => void
}

export function FilterPanel({ search, onChange, onClear }: Props) {
  const id = useId()
  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()} aria-label="Filtros do catálogo">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-sort`} className="text-sm font-semibold">Ordenar por</label>
        <Select id={`${id}-sort`} value={search.sort} onChange={(e) => onChange({ sort: e.target.value as CatalogSearch['sort'] })}>
          {SORT_OPTIONS.map((o) => <option key={o} value={o}>{SORT_LABEL[o]}</option>)}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-cat`} className="text-sm font-semibold">Categoria</label>
        <Select id={`${id}-cat`} value={search.category ?? ''} onChange={(e) => onChange({ category: (e.target.value || undefined) as Category | undefined })}>
          <option value="">Todas</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </Select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Faixa de preço (ETH)</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-min`} className="text-xs text-muted">Mínimo</label>
            <Input id={`${id}-min`} inputMode="decimal" placeholder="0" defaultValue={search.minPrice ?? ''} key={`min-${search.minPrice ?? ''}`}
              onBlur={(e) => onChange({ minPrice: /^\d+(\.\d+)?$/.test(e.target.value) ? e.target.value : undefined })} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-max`} className="text-xs text-muted">Máximo</label>
            <Input id={`${id}-max`} inputMode="decimal" placeholder="5" defaultValue={search.maxPrice ?? ''} key={`max-${search.maxPrice ?? ''}`}
              onBlur={(e) => onChange({ maxPrice: /^\d+(\.\d+)?$/.test(e.target.value) ? e.target.value : undefined })} />
          </div>
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" className="size-5 accent-primary" checked={search.available === true}
          onChange={(e) => onChange({ available: e.target.checked ? true : undefined })} />
        Somente disponíveis
      </label>

      <Button variant="outline" type="button" onClick={onClear} disabled={!hasActiveFilters(search)}>Limpar filtros</Button>
    </form>
  )
}
