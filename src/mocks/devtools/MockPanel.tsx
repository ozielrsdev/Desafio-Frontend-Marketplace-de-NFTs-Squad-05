import { FlaskConical, RotateCcw, Timer, Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { mockControl } from '../control'

/**
 * Painel de mocks (dev e demonstração): troca de cenário, reset completo e ações de controle.
 * Não faz parte do produto; aciona apenas a API de controle do servidor simulado.
 */
export default function MockPanel() {
  const [scenario, setScenario] = useState(mockControl.scenario())
  const [busy, setBusy] = useState(false)
  const scenarios = mockControl.scenarios()
  const current = scenarios.find((s) => s.id === scenario)

  const run = async (action: () => Promise<unknown> | unknown, reload = true) => {
    setBusy(true)
    try {
      await action()
      if (reload) window.location.assign('/')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-4 left-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/95 px-4 text-sm font-semibold shadow-lg backdrop-blur transition-colors hover:border-brand-soft"
          aria-label={`Cenário de mocks: ${current?.label ?? scenario}. Abrir painel de mocks`}
        >
          <FlaskConical className="size-4 text-accent" aria-hidden="true" />
          <span className="hidden sm:inline">Mocks:</span> {current?.label ?? scenario}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cenários simulados</DialogTitle>
          <DialogDescription>
            Ferramenta de demonstração: altera o comportamento da API simulada (MSW). Trocar o cenário restaura os dados
            iniciais e encerra a sessão.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="mock-scenario">Cenário</Label>
          <select
            id="mock-scenario"
            className="h-11 rounded-lg border border-input bg-background px-3 text-base"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">{scenarios.find((s) => s.id === scenario)?.description}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button loading={busy} onClick={() => run(() => mockControl.setScenario(scenario))}>
            Aplicar cenário
          </Button>
          <Button variant="outline" loading={busy} onClick={() => run(() => mockControl.reset())}>
            <RotateCcw aria-hidden="true" /> Resetar dados
          </Button>
          <Button variant="secondary" onClick={() => run(() => mockControl.expireSessions(), false)}>
            <Timer aria-hidden="true" /> Expirar sessões
          </Button>
          <Button variant="secondary" onClick={() => run(() => mockControl.realtime.disconnectAll(), false)}>
            <Zap aria-hidden="true" /> Derrubar socket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
