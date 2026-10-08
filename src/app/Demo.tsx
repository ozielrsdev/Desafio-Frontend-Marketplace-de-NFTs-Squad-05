import { useEffect, useState } from 'react'
import { CheckoutPage, OrderStatusView, PendingOrderBanner } from '@/contexts/ordering'
import { Coupon, PricingPanel } from '@/contexts/pricing'
import { WalletsPage } from '@/contexts/wallets'
import { demoCart, useDemoCart } from './demo-cart'
import { DevPanel } from './DevPanel'

/**
 * Harness de desenvolvimento (substituído pelo TanStack Router): rotas por hash.
 * #/cart · #/wallets · #/checkout · #/orders/:id/confirmation
 */
const USER_ID = 'u1'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || '/cart')
  useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1) || '/cart')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [hash, (to: string) => { window.location.hash = to }] as const
}

export function Demo() {
  const [route, go] = useHashRoute()
  const items = useDemoCart()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const orderMatch = /^\/orders\/([^/]+)\/confirmation$/.exec(route)

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3">Pular para o conteúdo</a>
      <nav aria-label="Principal" className="flex flex-wrap gap-1 border-b border-border bg-surface px-4 py-2">
        {[['/cart', 'Carrinho'], ['/wallets', 'Carteiras'], ['/checkout', 'Pagamento']].map(([to, label]) => (
          <a
            key={to}
            href={`#${to}`}
            aria-current={route === to ? 'page' : undefined}
            className="inline-flex min-h-11 items-center rounded-md px-3 font-medium hover:bg-surface-muted aria-[current=page]:bg-surface-muted aria-[current=page]:font-bold"
          >
            {label}
          </a>
        ))}
      </nav>

      <div id="main">
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <PendingOrderBanner userId={USER_ID} onOpen={(id) => go(`/orders/${id}/confirmation`)} />
        </div>

        {route === '/cart' && (
          <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_24rem]">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Carrinho</h1>
              {items.length === 0 && <p className="text-text-muted">Seu carrinho está vazio.</p>}
              <ul className="text-sm text-text-muted">
                {items.map((i) => <li key={i.nftId}>{i.nftId} × {i.quantity}</li>)}
              </ul>
              <button type="button" onClick={() => demoCart.reset()} className="min-h-11 cursor-pointer rounded-md border border-border px-3 text-sm">Restaurar carrinho de demonstração</button>
            </div>
            {items.length > 0 && (
              <PricingPanel userId={USER_ID} items={items} network="ethereum" coupon={coupon} onCouponChange={setCoupon} onProceed={() => go('/checkout')} />
            )}
          </main>
        )}

        {route === '/wallets' && <WalletsPage userId={USER_ID} />}

        {route === '/checkout' && (
          <CheckoutPage
            userId={USER_ID}
            items={items}
            coupon={coupon}
            onOrderCreated={(id) => go(`/orders/${id}/confirmation`)}
            onGoToWallets={() => go('/wallets')}
            onBackToCart={() => go('/cart')}
          />
        )}

        {orderMatch && (
          <OrderStatusView userId={USER_ID} orderId={orderMatch[1]} onRetry={() => go('/checkout')} onContinueShopping={() => go('/cart')} />
        )}
      </div>

      <DevPanel />
    </>
  )
}
