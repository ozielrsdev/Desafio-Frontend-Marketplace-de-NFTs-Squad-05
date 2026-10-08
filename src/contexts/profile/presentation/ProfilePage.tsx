import { useBlocker } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Skeleton } from '@/shared/ui/skeleton'
import { useProfile } from '../application/hooks'
import { AvatarUploader } from './AvatarUploader'
import { PasswordForm } from './PasswordForm'
import { ProfileForm } from './ProfileForm'

export function ProfilePage() {
  const profile = useProfile()
  const [dirty, setDirty] = useState({ profile: false, password: false })
  const setProfileDirty = useCallback((value: boolean) => setDirty((d) => ({ ...d, profile: value })), [])
  const setPasswordDirty = useCallback((value: boolean) => setDirty((d) => ({ ...d, password: value })), [])
  const hasUnsavedChanges = dirty.profile || dirty.password

  // Aviso de formulário sujo ao navegar ou fechar a aba (docs/specs/profile.md, história 10).
  const blocker = useBlocker({ shouldBlockFn: () => hasUnsavedChanges, enableBeforeUnload: hasUnsavedChanges, withResolver: true })

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-1">
          <h1 className="text-3xl sm:text-4xl">Meu perfil</h1>
          <p className="text-muted-foreground">Gerencie seus dados, avatar e senha.</p>
        </div>
        {profile.isFetching && !profile.isPending && (
          <p className="text-sm text-muted-foreground" role="status">
            Atualizando…
          </p>
        )}
      </header>

      {profile.isPending && profile.fetchStatus !== 'idle' && <ProfileSkeleton />}

      {profile.isError && !profile.data && (
        <Alert
          variant="error"
          title="Não foi possível carregar seu perfil"
          action={
            <Button variant="outline" size="sm" onClick={() => void profile.refetch()} loading={profile.isFetching}>
              <RotateCcw aria-hidden="true" /> Tentar novamente
            </Button>
          }
        >
          {profile.error.message}
        </Alert>
      )}

      {profile.data && (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <AvatarUploader profile={profile.data} />
          <div className="grid gap-6">
            <ProfileForm key={profile.data.id} profile={profile.data} onDirtyChange={setProfileDirty} />
            <PasswordForm onDirtyChange={setPasswordDirty} />
          </div>
        </div>
      )}

      <Dialog open={blocker.status === 'blocked'} onOpenChange={(open) => !open && blocker.reset?.()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>Você tem alterações não salvas no perfil. Se sair agora, elas serão perdidas.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              Continuar editando
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              Sair sem salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]" aria-busy="true" aria-label="Carregando perfil">
      <Skeleton className="h-[330px] rounded-xl" />
      <div className="grid gap-6">
        <Skeleton className="h-[470px] rounded-xl" />
        <Skeleton className="h-[330px] rounded-xl" />
      </div>
    </div>
  )
}
