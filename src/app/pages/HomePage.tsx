import { Link } from '@tanstack/react-router'
import { useSession } from '@/contexts/identity'
import { Button } from '@/shared/ui/button'

/**
 * Início provisório da Fase 0. O dono do Catalog (Dev 2) substitui por destaques + catálogo.
 */
export function HomePage() {
  const { isAuthenticated, user } = useSession()
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2" aria-labelledby="hero-title">
      <div className="grid gap-6">
        <h1 id="hero-title" className="text-4xl leading-tight sm:text-5xl">
          Descubra NFTs digitais e colecione obras raras
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Explore coleções de artistas independentes, favorite suas obras preferidas e compre com carteiras simuladas.
        </p>
        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Button asChild size="lg">
              <Link to="/perfil">Olá, {user?.name.split(' ')[0]} — ver perfil</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/cadastro" search={{}}>
                Criar conta
              </Link>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">O catálogo completo chega na próxima fase.</p>
      </div>
      <img
        src="/nfts/nft-03.svg"
        alt="Arte digital abstrata em tons de roxo e dourado"
        width={560}
        height={560}
        fetchPriority="high"
        className="aspect-square w-full max-w-xl justify-self-center rounded-2xl border border-border object-cover shadow-xl"
      />
    </section>
  )
}
