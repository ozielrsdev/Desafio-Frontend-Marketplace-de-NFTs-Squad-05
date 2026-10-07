# Spec — Mocking (MSW) — contexto transversal

> Seam proposto: **os próprios handlers MSW exercitados por E2E** (alto nível); unit só para utilitários de cenário/reset.

## Problem Statement

Sem backend, o app precisa de uma camada de rede simulada realista, determinística e reutilizável em dev, demo (build de produção) e testes, mantendo consistência entre REST e eventos.

## Solution

Mocks na camada de rede com MSW (REST + Socket.IO), estado em memória persistido localmente, fixtures variadas, cenários configuráveis e reset completo.

## User Stories

1. Como dev, quero rodar o app com mocks via configuração (`VITE_MOCKS`/equivalente).
2. Como avaliador, quero os mocks ativos no deploy de demonstração.
3. Como dev, quero escolher o cenário por variável de ambiente, query string ou painel de dev.
4. Como dev, quero resetar para um estado conhecido (inclusive o storage persistido).
5. Como avaliador, quero ≥ 2 usuários fictícios e credenciais documentadas.
6. Como dev, quero fixtures suficientes para exercitar filtros e paginação.
7. Como dev, quero cenários determinísticos: sucesso, vazio, latência variável/fora de ordem, falha de conexão, 4xx/5xx.
8. Como dev, quero cenários de sessão expirada e não autorizado.
9. Como dev, quero conflito de cadastro e erros de validação por campo.
10. Como dev, quero cupom inválido/expirado.
11. Como dev, quero preço alterado/edição esgotada durante a compra.
12. Como dev, quero timeout após criação do pedido, recuperável por idempotência.
13. Como dev, quero pagamento confirmado e recusado.
14. Como dev, quero que alterações de dados gerem resposta REST e evento Socket.IO coerentes.
15. Como dev de teste, quero acionar eventos e falhas por uma API de controle do mock (sem tocar na UI).
16. Como dev, quero latência/relógio controláveis nos testes.
17. Como dev, quero estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos.

## Implementation Decisions

- Estrutura em `src/mocks/`: `db` (repositórios em memória + persistência em localStorage/IndexedDB com versão de schema), `fixtures`, `handlers` por contexto (reaproveitando tipos/DTOs de contrato), `scenarios`, `socket` (servidor Socket.IO), `control` (API de controle: setScenario, reset, emitEvent, setLatency).
- Contratos (DTOs/zod) compartilhados entre handlers e infra do front, garantindo aderência.
- Browser: `setupWorker`; testes Playwright usam o worker no navegador com controle via `window.__mocks` ou endpoints de controle protegidos por flag.
- Cenários = conjunto de overrides de comportamento + seed; "default" reproduz o catálogo estável usado por Lighthouse e regressão visual.
- Senhas guardadas como hash no mock; tokens opacos com expiração.
- Idempotência de pedidos implementada no handler (chave → pedido + hash do corpo).
- Componentes, hooks e Axios não contêm dados fictícios nem bifurcações de negócio.
- Seed/ID/relógio determinísticos para baselines visuais estáveis.
- Service worker servido corretamente no deploy (rewrite SPA não pode interceptar `mockServiceWorker`).

## Testing Decisions

- Validados indiretamente pelos 12 E2E; checagem unit de reset e de determinismo do seed.
- Cada cenário listado deve ter ao menos um E2E que o utilize.

## Out of Scope

Backend real, banco de dados real, autenticação real, mock de blockchain.

## Further Notes

Documentar no README: seleção/reset de cenários, credenciais, e como reproduzir cada falha.
