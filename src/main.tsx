import '@fontsource-variable/exo-2'
import '@fontsource/orbitron/600.css'
import '@fontsource/orbitron/700.css'
import './app/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

async function bootstrap() {
  // Mocks ativados por configuração (README §6), inclusive no build de demonstração.
  if (import.meta.env.VITE_MOCKS === 'true') {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
