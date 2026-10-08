# AGENTS.md — NFT Marketplace (Desafio Frontend, Squad 05)

Instruções para agentes e desenvolvedores. O enunciado completo está em `docs/ENUNCIADO.md` (antigo `README.md`); as specs por domínio estão em `docs/specs/`. Em caso de conflito, o enunciado prevalece.

## 1. Objetivo

Implementar o **NFT Marketplace** (descoberta, compra e conta do colecionador) em React + TypeScript, fiel ao Figma, com APIs/autenticação/carteiras/pagamentos **simulados via MSW**. Deploy público obrigatório.

Eliminatórios (nunca violar): não usar a stack de verdade; fluxos só visuais; compra confirmada sem resposta da simulação; vazamento de dados entre usuários; eventos simulados direto na UI; ausência de E2E executáveis.

## 2. Stack obrigatória

React · TypeScript · TanStack Router · TanStack Query · Axios · REST · Socket.IO (`socket.io-client`) · Tailwind CSS · shadcn/ui · MSW (+ `@mswjs/socket.io-binding`) · Playwright · Lighthouse. Build tool (sugestão: Vite) e libs complementares (ex.: Zod, react-hook-form, decimal.js) são livres.

## 3. Abordagem DDD

Cada **bounded context** é um módulo independente, com linguagem ubíqua própria (termos em inglês no código, UI em pt-BR conforme Figma).

| Contexto | Spec | Núcleo |
| --- | --- | --- |
| Identity (sessão e conta) | `docs/specs/identity.md` | Cadastro, login, sessão, expiração |
| Catalog (NFTs) | `docs/specs/catalog.md` | Listagem, filtros, detalhe |
| Favorites | `docs/specs/favorites.md` | Favoritos otimistas |
| Cart | `docs/specs/cart.md` | Itens, quantidades, merge visitante |
| Pricing (cotação) | `docs/specs/pricing.md` | Cupom, taxas, total, revalidação |
| Ordering (pedidos) | `docs/specs/ordering.md` | Checkout, idempotência, recibo |
| Profile | `docs/specs/profile.md` | Dados, avatar, senha |
| Wallets | `docs/specs/wallets.md` | Carteiras principal/secundária, rede |
| Realtime (transversal) | `docs/specs/realtime.md` | `nft.updated`, `order.updated`, reconciliação |
| Mocking (transversal) | `docs/specs/mocking.md` | MSW, cenários, reset, socket |

### Camadas por contexto (regra de dependência: de fora para dentro)

```
src/
  contexts/<contexto>/
    domain/          # Entidades, Value Objects, regras puras, tipos. SEM React, Axios, Query, Router.
    application/     # Casos de uso, query keys, hooks de Query/Mutation, orquestração. Depende só de domain + ports.
    infrastructure/  # Adapters: clientes Axios, DTOs, mappers DTO<->domain, handlers de socket. Implementa ports.
    presentation/    # Componentes React, páginas, formulários. Consome application.
  shared/            # Kernel compartilhado: Money/Decimal, http client, errors, ids, ui (shadcn), utils
  app/               # Composição: providers, router, rotas, bootstrap do MSW
  mocks/             # Camada de rede simulada (ver mocking.md) — fora de contexts/
e2e/                 # Playwright
```

Regras:

1. `domain` é TypeScript puro e testável sem DOM. Nada de `fetch`/Axios/React ali.
2. **Anti-corruption layer**: DTOs da API nunca vazam para `domain`/`presentation`; mappers convertem na `infrastructure`.
3. Contextos se comunicam só por **API pública** (`index.ts`) e por IDs (ex.: `NftId`, `UserId`), nunca importando internos de outro contexto. Dependências: Cart→Catalog, Pricing→Cart, Ordering→Pricing/Wallets/Cart, Favorites→Catalog.
4. **Value Objects imutáveis**: `Money` (ETH como string decimal, aritmética com decimal.js, nunca `number`), `Quantity` (inteiro ≥ 1), `NftId`, `IdempotencyKey`, `Version`, `Email`.
5. **Aggregates**: `Cart` (raiz; itens), `Order` (raiz; máquina de estados `pending → confirmed | rejected`, terminais), `Session`, `WalletSet`. Invariantes vivem na raiz.
6. **Domain events** do backend simulado (`nft.updated`, `order.updated`) entram pela camada de infraestrutura de Realtime e são traduzidos em atualizações de cache via casos de uso.
7. Presentation não calcula regra de negócio (totais, disponibilidade, transições de pedido): usa domain/application.

## 4. Convenções de estado e dados

- **TanStack Query** é a única fonte de estado remoto. Query keys fabricadas em um módulo por contexto, **sempre incluindo `userId`** para dados privados.
- URL é fonte de verdade de busca/filtros/ordenação/paginação (search params tipados e validados no Router). Mudar filtro reinicia `page`.
- Axios: uma instância compartilhada; interceptors só para auth/erros normalizados. **Proibido** respostas fictícias ou caminhos alternativos de negócio em componentes, hooks ou Axios.
- Usar `signal` do Query para cancelar/descartar respostas obsoletas.
- Erros normalizados em tipo discriminado: `validation`, `unauthenticated`, `forbidden`, `not_found`, `availability_conflict`, `transient`, `network`.
- Mutations de pedido enviam `Idempotency-Key`; retry só em falhas transitórias e sempre com a mesma chave.
- Atualização otimista com rollback: obrigatória em Favoritos (mínimo).
- Logout/troca de usuário: `queryClient.clear()`, encerrar socket e subscriptions, limpar storage privado.
- Segurança: nunca guardar senha em claro (mock armazena hash); sem segredos reais; credenciais só fictícias.

## 5. UI, acessibilidade e responsividade

- Fidelidade ao Figma (https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1). Frames desktop e mobile; validar em 390, 768 e 1440 px. Perfil, Carteiras e Confirmação também em mobile.
- shadcn/ui adaptado à identidade (tokens no Tailwind). Fontes e imagens servidas localmente.
- **Skeletons com shimmer** em catálogo, detalhe e resumo do carrinho, com dimensões do conteúdo (CLS ≈ 0) e `prefers-reduced-motion` respeitado.
- Teclado completo, foco visível, focus trap em dialogs/drawers, labels, erros associados (`aria-describedby`), `aria-live` para mutations e eventos em tempo real, alt text, sem informação só por cor, sem overflow horizontal e com zoom.
- Estados obrigatórios em toda tela dependente de dados: loading, vazio, erro (com retry), sucesso, refetch em background.
- Ações fora do escopo (editoriais, suporte, atividade, ofertas, downloads) não podem aparentar sucesso funcional.

## 6. Testes

- **Playwright** (Chromium; desktop e mobile): os 12 cenários do README §9, estado isolado por teste, relógio/latência/eventos controlados, relatório HTML + traces. Regressão visual: início, detalhe, carrinho, pagamento (baselines versionadas, dados estáveis).
- REST passa pelos handlers MSW; tempo real passa pelo `socket.io-client` real. Nunca setar cache/setters para simular eventos.
- Testes unitários (Vitest) para `domain` e `application` (Money, Cart, Order state machine, reconciliação de versões). Testar comportamento externo, não implementação.
- **Lighthouse**: início e detalhe, mobile e desktop, 3 execuções, mediana. Metas: Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 90. Registrar LCP/CLS/TBT; sem simplificações só para pontuar.

## 7. Scripts esperados (`package.json`)

`dev` (com mocks) · `build` · `preview` · `typecheck` · `lint` · `test` (unit) · `test:e2e` · `test:visual` · `lighthouse` · `mocks:reset` (ou equivalente via UI/URL). Checkout limpo deve rodar sem serviços privados.

## 8. Documentação a entregar

- `README.md` da solução: setup, env vars, credenciais fictícias, seleção/reset de cenários, comandos, como reproduzir falhas. (Atenção: o `README.md` atual é o enunciado; mover para `docs/ENUNCIADO.md` ao iniciar a solução.)
- `ARCHITECTURE.md`: contratos REST e eventos, política de sessão, estado do carrinho, cache/retries, reconciliação REST × Socket.IO, limitações, decisões de UX, desvios do Figma.
- Deploy (Vercel recomendado) com rewrite SPA para refresh/acesso direto, mocks e socket funcionando.

## 9. Fluxo de trabalho para agentes

1. Ler a spec do contexto antes de codar; atualizar a spec se uma decisão mudar.
2. Implementar de dentro para fora: `domain` → `application` → `infrastructure` (+ handlers MSW) → `presentation` → E2E.
3. Mudou contrato REST/evento? Atualizar tipos compartilhados, handlers MSW, `ARCHITECTURE.md` e testes no mesmo commit.
4. Antes de concluir: `typecheck`, `lint`, unit e o E2E do fluxo afetado devem passar.
5. Commits pequenos e por contexto (ex.: `feat(cart): ...`). Não commitar `node_modules`, relatórios gerados ou segredos.
6. Não inventar requisitos; dúvidas sobre o Figma ou o enunciado vão para "Further Notes" da spec.

## 10. Ordem sugerida de implementação

1. Fundação: Vite + TS, Tailwind, shadcn, Router, Query, Axios, `shared/Money`, tokens do Figma.
2. Mocking base: MSW, fixtures, estado persistido, reset, seletor de cenário.
3. Identity → Catalog → Favorites → Cart → Pricing → Wallets → Profile → Ordering.
4. Realtime (Socket.IO + binding MSW) e reconciliação.
5. A11y, responsividade, skeletons, polimento visual.
6. Playwright (E2E + visual), Lighthouse, documentação, deploy.
