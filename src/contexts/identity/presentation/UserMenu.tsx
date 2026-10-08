import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronDown, LogOut, User, Wallet } from 'lucide-react'
import { announce } from '@/shared/a11y/announcer'
import { Avatar, AvatarFallback, AvatarImage, initials } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { useLogout, useSession } from '../application/hooks'

/** Ações de conta no cabeçalho: visitante vê Entrar/Criar conta; autenticado vê o menu. */
export function UserMenu() {
  const { user, isLoading } = useSession()
  const logout = useLogout()
  const router = useRouter()
  const href = useRouterState({ select: (state) => state.location.href })

  if (isLoading) return <Skeleton className="h-11 w-36 rounded-lg" />

  if (!user) {
    const onAuthPage = href.startsWith('/login') || href.startsWith('/cadastro')
    const returnTo = onAuthPage ? undefined : href
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link to="/login" search={{ returnTo }}>
            Entrar
          </Link>
        </Button>
        <Button asChild>
          <Link to="/cadastro" search={{ returnTo }}>
            <User aria-hidden="true" />
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Criar conta</span>
          </Link>
        </Button>
      </div>
    )
  }

  const onLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        announce('Você saiu da sua conta.')
        void router.navigate({ to: '/' })
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 px-2" aria-label={`Menu da conta de ${user.name}`} data-testid="user-menu">
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 truncate md:inline">{user.name}</span>
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block truncate font-semibold">{user.name}</span>
          <span className="block truncate text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">
            <User aria-hidden="true" /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/carteiras">
            <Wallet aria-hidden="true" /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLogout} disabled={logout.isPending}>
          <LogOut aria-hidden="true" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
