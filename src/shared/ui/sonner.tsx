import { Toaster as Sonner, type ToasterProps } from 'sonner'

/** Toasts: não roubam foco, anunciados via aria-live pelo próprio sonner (toast-accessibility). */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      duration={4000}
      closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-card! text-card-foreground! border-border! font-sans',
          description: 'text-muted-foreground!',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'
