import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { installSessionLifecycle } from '@/contexts/identity'
import { createQueryClient } from './queryClient'
import { createAppRouter } from './router'

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

// Instalado antes do primeiro render: token no Axios e tratamento de expiração já valem para as guards.
installSessionLifecycle({
  queryClient,
  onExpired: (reason) => {
    const returnTo = router.state.location.href
    // Expiração não pode ser barrada pelo aviso de formulário sujo; rascunhos já foram salvos por usuário.
    void router.navigate({ to: '/login', search: { returnTo, reason }, ignoreBlocker: true })
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
