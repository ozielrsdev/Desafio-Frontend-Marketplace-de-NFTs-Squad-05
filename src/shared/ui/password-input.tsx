import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'
import { Input } from './input'

/** Campo de senha com mostrar/ocultar (password-toggle). */
function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  )
}

export { PasswordInput }
