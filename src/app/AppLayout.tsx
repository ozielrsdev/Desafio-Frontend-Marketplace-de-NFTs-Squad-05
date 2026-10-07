import { useEffect, useRef } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Gem } from 'lucide-react'

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Troca de rota: move o foco ao conteúdo principal (leitores de tela). Não dispara em mudanças de query string.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <>
      <a href="#conteudo" className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">Pular para o conteúdo</a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-display text-lg font-bold">
            <Gem aria-hidden className="size-6 text-primary" /> NFT Market
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-2">
            <Link to="/" className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold hover:bg-surface-2" activeProps={{ 'aria-current': 'page', className: 'text-primary' }} activeOptions={{ exact: true }}>
              Explorar
            </Link>
          </nav>
        </div>
      </header>
      <main id="conteudo" ref={main} tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-border py-8 text-center text-sm text-muted">
        Ambiente de demonstração · dados simulados com MSW
      </footer>
    </>
  )
}
