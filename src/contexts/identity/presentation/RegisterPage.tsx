import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { announce } from '@/shared/a11y/announcer'
import { PASSWORD_MIN_LENGTH, registerRequestSchema } from '@/shared/contracts'
import { isAppError } from '@/shared/errors'
import { applyApiErrors } from '@/shared/forms/applyApiErrors'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { useRegister } from '../application/hooks'
import { safeReturnTo } from '../domain/returnTo'
import { AuthCard } from './AuthCard'

const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a senha.') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
type RegisterFormValues = z.infer<typeof registerFormSchema>

export function RegisterPage({ returnTo }: { returnTo?: string }) {
  const router = useRouter()
  const registerMutation = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const [emailInUse, setEmailInUse] = useState(false)
  const destination = safeReturnTo(returnTo)
  const errorRef = useRef<HTMLDivElement>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors } = form.formState

  useEffect(() => {
    if (formError) errorRef.current?.focus()
  }, [formError])

  const onSubmit = form.handleSubmit(({ name, email, password }) => {
    setFormError(null)
    setEmailInUse(false)
    registerMutation.mutate(
      { name, email, password },
      {
        onSuccess: (session) => {
          announce(`Conta criada. Bem-vindo, ${session.user.name}!`)
          router.history.push(destination)
        },
        onError: (error) => {
          setEmailInUse(isAppError(error) && error.code === 'email_in_use')
          setFormError(applyApiErrors(error, form, ['name', 'email', 'password']))
        },
      },
    )
  })

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Cadastre-se para começar sua coleção."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" search={{ returnTo: returnTo ? destination : undefined }} className="font-semibold text-brand-soft underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="grid gap-5" aria-label="Criar conta">
        {formError && (
          <div ref={errorRef} tabIndex={-1} className="outline-none">
            <Alert variant="error">{formError}</Alert>
          </div>
        )}
        <FormField label="Nome" error={errors.name?.message} required>
          <Input autoComplete="name" placeholder="Seu nome" {...form.register('name')} />
        </FormField>
        <FormField label="E-mail" error={errors.email?.message} required>
          <Input type="email" autoComplete="email" inputMode="email" placeholder="voce@exemplo.com" {...form.register('email')} />
        </FormField>
        {emailInUse && (
          <p className="-mt-3 text-sm">
            <Link to="/login" search={{ returnTo: returnTo ? destination : undefined }} className="font-semibold text-brand-soft underline-offset-4 hover:underline">
              Entrar com este e-mail
            </Link>
          </p>
        )}
        <FormField
          label="Senha"
          error={errors.password?.message}
          hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`}
          required
        >
          <PasswordInput autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField label="Confirmar senha" error={errors.confirmPassword?.message} required>
          <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
        </FormField>
        <Button type="submit" size="lg" loading={registerMutation.isPending} className="w-full">
          {registerMutation.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
    </AuthCard>
  )
}
