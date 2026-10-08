import { Alert } from '@/shared/ui/alert'

/** Placeholder da rota privada /carteiras até o contexto Wallets (Dev 3) entrar. */
export function WalletsPlaceholderPage() {
  return (
    <section className="mx-auto grid max-w-3xl gap-6" aria-labelledby="wallets-title">
      <h1 id="wallets-title" className="text-3xl sm:text-4xl">
        Carteiras
      </h1>
      <Alert variant="info" title="Em desenvolvimento">
        O cadastro de carteiras principal e secundária ainda não está disponível.
      </Alert>
    </section>
  )
}
