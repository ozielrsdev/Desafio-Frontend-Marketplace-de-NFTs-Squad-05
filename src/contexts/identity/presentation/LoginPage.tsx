import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { announce } from '@/shared/a11y/announcer'
import { loginRequestSchema, type LoginRequestDto } from '@/shared/contracts'
import { applyApiErrors } from '@/shared/forms/applyApiErrors'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { useLogin } from '../application/hooks'
import { safeReturnTo } from '../domain/returnTo'
import { AuthCard } from './AuthCard'

interface LoginPageProps {
  returnTo?: string
  reason?: 'expired'
}

export function LoginPage({ returnTo, reason }: LoginPageProps) {
  const router = useRouter()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const destination = safeReturnTo(returnTo)
  const errorRef = useRef<HTMLDivElement>(null)

  const form = useForm<LoginRequestDto>({
    resolver: zodResolver(loginRequestSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  useEffect(() => {
    if (formError) errorRef.current?.focus()
  }, [formError])

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: (session) => {
        announce(`Bem-vindo de volta, ${session.user.name}.`)
        router.history.push(destination)
      },
      onError: (error) => {
        setFormError(applyApiErrors(error, form, ['email', 'password']))
        form.resetField('password', { keepError: true })
      },
    })
  })

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse sua conta para favoritar, comprar e acompanhar seus pedidos."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" search={{ returnTo: returnTo ? destination : undefined }} className="font-semibold text-brand-soft underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {reason === 'expired' && (
        <Alert variant="info" title="Sua sessão expirou">
          Entre novamente para continuar de onde parou.
        </Alert>
      )}
      <form noValidate onSubmit={onSubmit} className="grid gap-5" aria-label="Entrar na conta">
        {formError && (
          <div ref={errorRef} tabIndex={-1} className="outline-none">
            <Alert variant="error">{formError}</Alert>
          </div>
        )}
        <FormField label="E-mail" error={errors.email?.message} required>
          <Input type="email" autoComplete="email" inputMode="email" placeholder="voce@exemplo.com" {...form.register('email')} />
        </FormField>
        <FormField label="Senha" error={errors.password?.message} required>
          <PasswordInput autoComplete="current-password" {...form.register('password')} />
        </FormField>
        <Button type="submit" size="lg" loading={login.isPending} className="w-full">
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthCard>
  )
}
