import { Link } from '@tanstack/react-router'
import { Store } from 'lucide-react'
import { UserMenu } from '@/contexts/identity'

/** Cabeçalho global. Carrinho (Dev 2) entra ao lado do menu da conta. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md font-heading text-lg font-bold tracking-wide" aria-label="NFT Marketplace — início">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">NFT Marketplace</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          <Link
            to="/"
            className="hidden min-h-11 items-center rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            activeProps={{ className: 'text-foreground', 'aria-current': 'page' }}
            activeOptions={{ exact: true }}
          >
            Marketplace
          </Link>
        </nav>
        <UserMenu />
      </div>
    </header>
  )
}
