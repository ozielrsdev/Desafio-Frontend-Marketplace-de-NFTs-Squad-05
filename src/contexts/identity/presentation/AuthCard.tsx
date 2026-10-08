import type { ReactNode } from 'react'

/** Moldura das telas de autenticação (desktop: arte + formulário; mobile: só o formulário). */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:grid-cols-2">
      <div className="relative hidden min-h-[560px] md:block">
        <img
          src="/nfts/nft-07.svg"
          alt=""
          width={560}
          height={560}
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <p className="absolute bottom-8 left-8 right-8 font-heading text-2xl leading-snug text-foreground">
          Descubra, colecione e negocie NFTs raros.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-8 px-5 py-10 sm:px-10">
        <header className="grid gap-2">
          <h1 className="text-2xl sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </header>
        {children}
        <div className="text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  )
}
