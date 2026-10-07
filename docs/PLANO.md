# Plano de Execução — Squad 05

Divisão do trabalho entre 3 pessoas, por bounded context (ver `AGENTS.md` e `docs/specs/`).

## 1. Distribuição

Pesos de complexidade: 1 (leve) a 5 (pesado).

| Spec | Peso | Dono |
| --- | :-: | --- |
| mocking | 4 | Dev 1 |
| identity | 3 | Dev 1 |
| profile | 2 | Dev 1 |
| favorites | 1 | Dev 1 |
| catalog | 3 | Dev 2 |
| cart | 3 | Dev 2 |
| realtime | 4 | Dev 2 |
| pricing | 3 | Dev 3 |
| wallets | 2 | Dev 3 |
| ordering | 5 | Dev 3 |

### Dev 1(Gustavo) — Fundação e Conta (10)
`mocking`, `identity`, `profile`, `favorites`

- Base de todo o resto: sessão, `userId` nas query keys, isolamento de dados e motor do MSW.
- Responsável pelo scaffold (Vite, Tailwind, shadcn, Router, Query, Axios) e por `shared/Money`.
- Dono do servidor Socket.IO do mock e da API de controle (cenários, reset, emissão de eventos).

### Dev 2(Oziel) — Descoberta, Carrinho e Tempo real (10)
`catalog`, `cart`, `realtime`

- O `nft.updated` atinge catálogo, detalhe e carrinho: quem constrói as telas integra o evento.
- Dono da infraestrutura do cliente Socket.IO (envelope, dedupe por `eventId`, regra de `version`, reconexão, hooks).

### Dev 3(Samuel) — Compra (10)
`pricing`, `wallets`, `ordering`

- Cadeia crítica: cotação → carteira → pedido.
- Implementa o `order.updated` usando a infraestrutura de Realtime do Dev 2.

## 2. Ordem de execução

```
Fase 0 (Dev 1, 1–2 dias)
  Scaffold + shared/Money + núcleo do MSW (db, handlers, reset, cenários)
  + contratos congelados (DTOs/zod e tipos de erro por contexto)
        │
Fase 1 (paralelo)
  Dev 1: identity
  Dev 2: catalog
  Dev 3: Money/Quote em unit + wallets
        │
Fase 2 (paralelo)
  Dev 1: profile + favorites (depende de catalog)
  Dev 2: cart (depende de catalog; merge depende de identity)
  Dev 3: pricing (consome cart; começa contra o contrato)
        │
Fase 3
  Dev 2: realtime (nft.updated em catálogo, detalhe e carrinho)
  Dev 1: servidor Socket.IO do mock e cenários finais
  Dev 3: ordering (precisa de pricing, wallets e cart)
        │
Fase 4 (todos, em pares)
  order.updated + retomada de pedido pendente, E2E dos 12 cenários,
  regressão visual, a11y, Lighthouse, documentação e deploy
```

### Dependências
- mocking e identity antes de qualquer fluxo autenticado.
- catalog → cart, favorites.
- cart → pricing → ordering.
- wallets → ordering.
- Infra de realtime (Dev 2) antes do `order.updated` (Dev 3).

## 3. Evitando bloqueios

1. Contratos primeiro: na Fase 0, congelar DTOs e erros de cada contexto.
2. Cada dev escreve os handlers MSW do próprio contexto usando o motor do Dev 1.
3. Dev 3 adianta `Money`, `Quote` e a máquina de estados de `Order` em testes unitários, sem UI.
4. Cada dev escreve os E2E dos seus fluxos; os de integração (compra completa, tempo real no checkout) ficam para a Fase 4, em pares.

## 4. Fluxo Git

Branches no mesmo repositório, com PR para `main` (sem fork: o squad tem acesso de escrita e precisa integrar dependências continuamente; previews da Vercel funcionam por branch/PR).

1. Proteger a `main`: exigir PR, ao menos 1 aprovação e CI verde (`typecheck`, `lint`, testes unitários).
2. Branches curtas, por spec: `feat/<contexto>-<assunto>` (ex.: `feat/cart-merge-guest`, `feat/ordering-idempotency`). Também `fix/`, `docs/`, `test/`, `chore/`.
3. PRs pequenos (1–2 dias de trabalho). Evitar branch longa por dev.
4. Fase 0 entra primeiro na `main`; os demais partem dela e fazem `rebase` da `main` com frequência.
5. Commits no padrão `feat(cart): ...` (Conventional Commits).
6. Revisão cruzada entre contextos vizinhos: Dev 2 revisa Dev 3 (cart/ordering), Dev 3 revisa Dev 1 (identity/wallets), Dev 1 revisa Dev 2 (catalog/realtime).
7. PR só é mergeado com a spec do contexto atualizada, se alguma decisão mudou, e com os testes do fluxo afetado passando.
8. Mudou contrato REST/evento? Atualizar tipos, handlers MSW, `ARCHITECTURE.md` e testes no mesmo PR.

## 5. Marcos

| Marco | Critério de pronto |
| --- | --- |
| M0 — Fundação | App sobe com mocks, `Money` testado, reset de cenário funcionando |
| M1 — Conta e catálogo | Login/cadastro e listagem/detalhe com filtros na URL |
| M2 — Carrinho e cotação | Carrinho persistente, merge de visitante, cupom e totais da API |
| M3 — Compra | Checkout, idempotência, recibo e carteiras |
| M4 — Tempo real | `nft.updated` e `order.updated`, reconexão e retomada de pedido |
| M5 — Qualidade | 12 E2E, regressão visual, Lighthouse nas metas |
| M6 — Entrega | Deploy público, `README.md` da solução e `ARCHITECTURE.md` |
