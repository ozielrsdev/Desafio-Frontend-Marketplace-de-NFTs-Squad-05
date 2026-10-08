import { ImageUp, RotateCcw } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { announce } from '@/shared/a11y/announcer'
import { isAppError } from '@/shared/errors'
import { Alert } from '@/shared/ui/alert'
import { Avatar, AvatarFallback, AvatarImage, initials } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { toast } from '@/shared/ui/sonner'
import { useUpdateAvatar } from '../application/hooks'
import { validateAvatarFile, type CollectorProfile } from '../domain/profile'

/** Envio/troca de avatar com pré-visualização, validação e nova tentativa em falha. */
export function AvatarUploader({ profile }: { profile: CollectorProfile }) {
  const upload = useUpdateAvatar()
  const inputId = useId()
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ file: File; previewUrl: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.previewUrl)
  }, [pending])

  const send = (file: File) => {
    setError(null)
    upload.mutate(file, {
      onSuccess: () => {
        setPending(null)
        toast.success('Avatar atualizado.')
        announce('Avatar atualizado com sucesso.')
      },
      onError: (err) => {
        const message = isAppError(err) ? (err.fields.avatar ?? err.message) : 'Não foi possível enviar a imagem.'
        setError(message)
        announce(`Falha ao enviar avatar: ${message}`, 'assertive')
      },
    })
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validation = validateAvatarFile(file)
    if (!validation.ok) {
      setPending(null)
      setError(validation.message)
      return
    }
    setPending({ file, previewUrl: URL.createObjectURL(file) })
    send(file)
  }

  const preview = pending?.previewUrl ?? profile.avatarUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>PNG, JPG ou WEBP de até 1 MB.</CardDescription>
      </CardHeader>
      <CardContent className="grid justify-items-center gap-5">
        <Avatar className="size-32 border-2 border-primary">
          {preview && <AvatarImage src={preview} alt={`Avatar de ${profile.name}`} />}
          <AvatarFallback className="text-3xl">{initials(profile.name)}</AvatarFallback>
        </Avatar>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={onFileChange}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          tabIndex={-1}
        />
        <Button type="button" variant="outline" className="w-full" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
          {!upload.isPending && <ImageUp aria-hidden="true" />}
          {upload.isPending ? 'Enviando…' : profile.avatarUrl ? 'Trocar avatar' : 'Enviar avatar'}
        </Button>
        {error && (
          <Alert
            id={errorId}
            variant="error"
            className="w-full"
            action={
              pending && !upload.isPending ? (
                <Button type="button" size="sm" variant="outline" onClick={() => send(pending.file)}>
                  <RotateCcw aria-hidden="true" /> Tentar novamente
                </Button>
              ) : undefined
            }
          >
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
