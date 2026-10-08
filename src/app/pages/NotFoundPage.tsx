import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <section className="mx-auto grid max-w-xl justify-items-center gap-5 py-16 text-center" aria-labelledby="nf-title">
      <p className="font-heading text-6xl font-bold text-brand-soft" aria-hidden="true">
        404
      </p>
      <h1 id="nf-title" className="text-2xl sm:text-3xl">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}
