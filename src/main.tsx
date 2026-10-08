import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import { Demo } from '@/app/Demo'
import './index.css'

async function enableMocks() {
  if (import.meta.env.VITE_MOCKS === 'false') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders userId="u1">
        <Demo />
      </AppProviders>
    </StrictMode>,
  )
})
