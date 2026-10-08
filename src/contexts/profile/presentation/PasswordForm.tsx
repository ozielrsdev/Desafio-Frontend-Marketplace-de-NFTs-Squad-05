import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { announce } from '@/shared/a11y/announcer'
import { changePasswordRequestSchema, PASSWORD_MIN_LENGTH } from '@/shared/contracts'
import { applyApiErrors } from '@/shared/forms/applyApiErrors'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { FormField } from '@/shared/ui/form-field'
import { PasswordInput } from '@/shared/ui/password-input'
import { toast } from '@/shared/ui/sonner'
import { useChangePassword } from '../application/hooks'

const passwordFormSchema = changePasswordRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a nova senha.') })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não conferem.' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'A nova senha deve ser diferente da atual.' })
type PasswordFormValues = z.infer<typeof passwordFormSchema>

const emptyValues: PasswordFormValues = { currentPassword: '', newPassword: '', confirmPassword: '' }

export function PasswordForm({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const changePassword = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: 'onTouched',
    defaultValues: emptyValues,
  })
  const { errors, isDirty } = form.formState

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  const onSubmit = form.handleSubmit(({ currentPassword, newPassword }) => {
    setFormError(null)
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          form.reset(emptyValues)
          toast.success('Senha alterada.')
          announce('Senha alterada com sucesso.')
        },
        onError: (error) => setFormError(applyApiErrors(error, form, ['currentPassword', 'newPassword'])),
      },
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle id="senha-title">Alterar senha</CardTitle>
        <CardDescription>Informe a senha atual e escolha uma nova.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit} className="grid gap-5" aria-labelledby="senha-title">
          {formError && <Alert variant="error">{formError}</Alert>}
          <FormField label="Senha atual" error={errors.currentPassword?.message} required>
            <PasswordInput autoComplete="current-password" {...form.register('currentPassword')} />
          </FormField>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Nova senha"
              error={errors.newPassword?.message}
              hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`}
              required
            >
              <PasswordInput autoComplete="new-password" {...form.register('newPassword')} />
            </FormField>
            <FormField label="Confirmar nova senha" error={errors.confirmPassword?.message} required>
              <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={changePassword.isPending}>
              {changePassword.isPending ? 'Alterando…' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
