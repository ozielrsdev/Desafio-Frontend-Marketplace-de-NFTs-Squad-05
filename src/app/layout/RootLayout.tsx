import { HeadContent, Outlet, useRouterState } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { LiveRegion } from '@/shared/a11y/announcer'
import { Toaster } from '@/shared/ui/sonner'
import { Footer } from './Footer'
import { Header } from './Header'

const MockPanel = import.meta.env.VITE_MOCKS === 'true' ? lazy(() => import('@/mocks/devtools/MockPanel')) : null

export function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const mainRef = useRef<HTMLElement>(null)
  const previousPathname = useRef(pathname)

  // Ao trocar de rota, o foco vai para o conteúdo principal (focus-on-route-change).
  // Compara com o caminho anterior (e não "primeiro render") para funcionar com o StrictMode.
  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="conteudo" ref={mainRef} tabIndex={-1} className="flex-1 px-4 py-8 outline-none sm:px-6 lg:py-12">
          <Outlet />
        </main>
        <Footer />
      </div>
      <LiveRegion />
      <Toaster />
      {MockPanel && (
        <Suspense fallback={null}>
          <MockPanel />
        </Suspense>
      )}
    </>
  )
}
