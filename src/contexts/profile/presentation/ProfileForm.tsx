import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { identityEvents } from '@/contexts/identity'
import { useForm, useWatch } from 'react-hook-form'
import { announce } from '@/shared/a11y/announcer'
import { BIO_MAX_LENGTH, updateProfileRequestSchema, type UpdateProfileRequestDto } from '@/shared/contracts'
import { applyApiErrors } from '@/shared/forms/applyApiErrors'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { FormField } from '@/shared/ui/form-field'
import { Input, Textarea } from '@/shared/ui/input'
import { toast } from '@/shared/ui/sonner'
import { useUpdateProfile } from '../application/hooks'
import { profileDraft } from '../application/profileDraft'
import type { CollectorProfile } from '../domain/profile'

const toFormValues = (profile: CollectorProfile): UpdateProfileRequestDto => ({
  name: profile.name,
  email: profile.email,
  bio: profile.bio,
  website: profile.website,
})

export function ProfileForm({ profile, onDirtyChange }: { profile: CollectorProfile; onDirtyChange: (dirty: boolean) => void }) {
  const update = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<UpdateProfileRequestDto>({
    resolver: zodResolver(updateProfileRequestSchema),
    mode: 'onTouched',
    defaultValues: toFormValues(profile),
  })
  const { errors, isDirty } = form.formState
  const bioLength = useWatch({ control: form.control, name: 'bio' }).length

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  // Sessão expirou com edição em curso: guarda o rascunho para retomar após o novo login.
  useEffect(
    () =>
      identityEvents.onBeforeSessionEnd(({ userId, reason }) => {
        if (reason === 'expired' && form.formState.isDirty && userId === profile.id) {
          profileDraft.save(userId, form.getValues())
        }
      }),
    [form, profile.id],
  )

  // Rascunho salvo na expiração da sessão: reaplicado como edição pendente (dirty) e descartado do storage.
  const [restoredDraft] = useState(() => profileDraft.read(profile.id))
  useEffect(() => {
    if (!restoredDraft) return
    for (const [field, value] of Object.entries(restoredDraft) as [keyof UpdateProfileRequestDto, string][]) {
      form.setValue(field, value, { shouldDirty: true })
    }
    profileDraft.discard(profile.id)
    announce('Restauramos as alterações que você não tinha salvado.')
  }, [form, profile.id, restoredDraft])

  // Atualização vinda do servidor (refetch/avatar) só substitui o formulário se não houver edição em curso.
  const lastProfile = useRef(profile)
  useEffect(() => {
    if (lastProfile.current === profile) return
    lastProfile.current = profile
    if (!form.formState.isDirty) form.reset(toFormValues(profile))
  }, [profile, form])

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    update.mutate(values, {
      onSuccess: (updated) => {
        form.reset(toFormValues(updated))
        toast.success('Perfil atualizado.')
        announce('Perfil atualizado com sucesso.')
      },
      onError: (error) => setFormError(applyApiErrors(error, form, ['name', 'email', 'bio', 'website'])),
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle id="dados-title">Dados pessoais</CardTitle>
        <CardDescription>Essas informações aparecem no seu perfil de colecionador.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit} className="grid gap-5" aria-labelledby="dados-title">
          {restoredDraft && isDirty && (
            <Alert variant="info" title="Alterações restauradas">
              Recuperamos as edições que você fez antes da sessão expirar. Revise e salve.
            </Alert>
          )}
          {formError && <Alert variant="error">{formError}</Alert>}
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Nome" error={errors.name?.message} required>
              <Input autoComplete="name" {...form.register('name')} />
            </FormField>
            <FormField label="E-mail" error={errors.email?.message} required>
              <Input type="email" autoComplete="email" inputMode="email" {...form.register('email')} />
            </FormField>
          </div>
          <FormField label="Site" error={errors.website?.message} hint="Opcional. Ex.: https://seusite.com">
            <Input type="url" inputMode="url" autoComplete="url" placeholder="https://" {...form.register('website')} />
          </FormField>
          <FormField
            label="Bio"
            error={errors.bio?.message}
            hint={
              <span className="tabular-nums">
                {bioLength}/{BIO_MAX_LENGTH} caracteres
              </span>
            }
          >
            <Textarea rows={4} {...form.register('bio')} />
          </FormField>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={!isDirty || update.isPending} onClick={() => form.reset(toFormValues(profile))}>
              Descartar alterações
            </Button>
            <Button type="submit" loading={update.isPending} disabled={!isDirty}>
              {update.isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
