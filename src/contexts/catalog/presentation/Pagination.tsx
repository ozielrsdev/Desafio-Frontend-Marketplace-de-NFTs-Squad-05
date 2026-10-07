import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface Props { page: number; totalPages: number; onPage: (p: number) => void }

export function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-3">
      <Button variant="outline" size="icon" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
        <ChevronLeft aria-hidden className="size-5" />
      </Button>
      <p className="tabular min-w-28 text-center text-sm" aria-current="page">Página {page} de {totalPages}</p>
      <Button variant="outline" size="icon" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Próxima página">
        <ChevronRight aria-hidden className="size-5" />
      </Button>
    </nav>
  )
}
