# Arquitetura — NFT Marketplace (Squad 05)

Documento vivo: cada dev atualiza as seções do seu contexto no mesmo PR que muda contrato ou decisão (AGENTS.md §9).

## 1. Visão geral

```
src/
  app/          composição: QueryClient, Router (code-based), layout, bootstrap
  contexts/     bounded contexts (domain → application → infrastructure → presentation)
    identity/   sessão e conta            (Dev 1)
    profile/    perfil do colecionador    (Dev 1)
    favorites/  favoritos otimistas       (Dev 1)
  shared/       kernel: Money, contracts (zod), http (Axios), errors, ids, storage, a11y, ui (shadcn)
  mocks/        backend simulado: db, fixtures, cenários, handlers REST, servidor Socket.IO, API de controle
e2e/            Playwright
design-system/  design system gerado pela skill ui-ux-pro-max (MASTER.md)
```

Regras de dependência verificadas pelo ESLint (`eslint.config.js`):

- `contexts/*/domain` não importa React, Axios, TanStack nem Socket.IO.
- `contexts/**` e `shared/**` não importam `@/mocks` (componentes, hooks e Axios sem respostas fictícias).
- Contextos se falam pela API pública (`index.ts`) e por IDs tipados (`shared/ids`).

## 2. Contratos REST (congelados na Fase 0)

Schemas zod em `src/shared/contracts/`, usados **pelos dois lados**: a infraestrutura do front valida as respostas
(`request(schema, config)` — resposta fora do contrato vira erro `transient`) e os handlers MSW validam os corpos.

Base: `VITE_API_URL` (padrão `/api`). Credencial: `Authorization: Bearer <token>`.

### Envelope de erro

```json
{ "error": { "code": "email_in_use", "message": "…", "fields": { "email": "…" }, "details": … } }
```

| HTTP | `code` | `AppError.kind` |
| --- | --- | --- |
| 400/422 | `validation_error`, `wrong_password`, `avatar_invalid`, `coupon_invalid`, `coupon_expired` | `validation` |
| 401 | `unauthenticated`, `session_expired`, `invalid_credentials` | `unauthenticated` |
| 403 | `forbidden` | `forbidden` |
| 404 | `not_found` | `not_found` |
| 409 | `availability_conflict`, `quote_stale` | `availability_conflict` |
| 409 | `email_in_use`, `wallet_duplicate`, `idempotency_conflict` | `validation` |
| 408/429/5xx | `transient` | `transient` |
| — (sem resposta, timeout) | — | `network` |

### Recursos

| Recurso | Endpoints | Dono |
| --- | --- | --- |
| Sessão | `POST /auth/register` (201) · `POST /auth/login` · `GET /auth/session` · `POST /auth/logout` (204) | Dev 1 |
| Perfil | `GET /profile` · `PATCH /profile` · `PUT /profile/avatar` · `POST /profile/password` (204) | Dev 1 |
| Favoritos | `GET /favorites` · `PUT /favorites/:nftId` · `DELETE /favorites/:nftId` (todos → `{ nftIds }`) | Dev 1 |
| NFTs | `GET /nfts?q&category&minPrice&maxPrice&onlyAvailable&sort&page&pageSize` · `GET /nfts/featured` · `GET /nfts/:id` | Dev 2 |
| Carrinho | `GET /cart` · `POST /cart/items` · `PATCH/DELETE /cart/items/:id` · `POST /cart/merge` | Dev 2 |
| Cotação | `POST /quotes` | Dev 3 |
| Carteiras | `GET /wallets` · `POST /wallets` · `PATCH /wallets/:id` | Dev 3 |
| Pedidos | `POST /orders` (`Idempotency-Key`) · `GET /orders/:id` · `GET /orders?status=pending` | Dev 3 |

Detalhes de cada payload: comentários e schemas em `src/shared/contracts/<contexto>.ts`.

Valores em ETH trafegam como **string decimal**; `Money` (`shared/money`) usa decimal.js e formata em pt-BR com
4 casas por padrão (`ETH_DISPLAY_DECIMALS`), sem passar por `number`.

## 3. Eventos Socket.IO

Envelope (`src/shared/contracts/realtime.ts`):

```ts
{ eventId, type: 'nft.updated' | 'order.updated', resource: { kind, id }, version, occurredAt, payload }
```

- `nft.updated` → `payload: { price, editions: [{ id, available }] }`, público.
- `order.updated` → `payload: OrderDto`, entregue **só ao dono** (o servidor resolve o usuário pelo `auth.token` do handshake).
- `version` é a mesma do recurso no REST: o servidor simulado altera o banco e emite o evento na mesma operação
  (`realtimeServer.publishNftUpdate` / `publishOrderUpdate`).

A infraestrutura do cliente (envelope, dedupe por `eventId`, regra de `version`, reconexão) é do Dev 2.

## 4. Sessão (Identity)

- Login/cadastro devolvem `{ token, expiresAt, user }`. O token opaco fica em `localStorage` (`nftm:session`) para
  recuperar a sessão após refresh; a senha nunca é armazenada no cliente.
- `GET /auth/session` valida o token salvo no boot (`sessionQueryOptions`). 401 → visitante.
- **Expiração**: (a) timer local em `expiresAt`; (b) qualquer 401 em requisição com credencial. Ambos chamam
  `endSession('expired')` e redirecionam para `/login?returnTo=<rota>&reason=expired`. Esse redirecionamento ignora o aviso
  de formulário sujo. Antes de limpar, `identityEvents.onBeforeSessionEnd` permite salvar rascunhos por usuário
  (o Perfil restaura a edição após o novo login; o Checkout deve fazer o mesmo).
- **Logout**: cancela queries, `queryClient.clear()`, limpa `nftm:u:*` (storage privado), dispara
  `identityEvents.onSessionEnded` (o Realtime deve desconectar o socket aqui) e revoga o token no servidor (best effort).
- **Troca de usuário**: no login de um usuário diferente do último, o cache e o storage privado são limpos antes.
- Rotas privadas usam `requireAuth` no `beforeLoad`; `returnTo` passa por `safeReturnTo` (somente caminhos internos,
  sem `//`, sem rotas de auth) para evitar open redirect.
- Query keys privadas sempre incluem `userId` (`['profile', userId]`, `['favorites', userId]`).

## 5. Cache, retries e sincronização

- `staleTime` 30 s; refetch ao focar a janela e ao reconectar.
- Retry automático só para `transient`/`network`, no máximo 2 vezes (`shared/http/retry.ts`). Mutations não repetem sozinhas.
- Cancelamento: todas as queries repassam o `signal` do TanStack Query ao Axios.
- **Favoritos (otimista)**: `onMutate` cancela a query, aplica a intenção e guarda o estado anterior do NFT;
  `onError` restaura só aquele NFT e anuncia via `aria-live`; `scope` por NFT serializa cliques rápidos;
  `invalidateQueries` quando não há outro toggle pendente.
- Perfil: mutations escrevem a resposta no cache e atualizam o usuário da sessão (cabeçalho).

## 6. Mocks (MSW)

- `src/mocks/db`: estado único em memória persistido em `localStorage` (`nftm-mock:db`) com `schemaVersion`.
  Seed determinístico (48 NFTs, 2 usuários, cupons, carteiras).
- `src/mocks/engine/route.ts`: toda rota passa por latência + regras de falha do cenário antes do resolver
  (`route()` / `authedRoute()`). Cada dev escreve os handlers do seu contexto com esse motor.
- `src/mocks/scenarios`: cenários = latência + falhas (`status` | `network` | `timeout`, com `times`/`probability`)
  + flags de negócio + ajuste do seed. PRNG com seed fixa (reproduzível).
- `src/mocks/control.ts`: `window.__mocks` exposto **depois** de o worker iniciar (testes aguardam essa propriedade).

### Transporte Socket.IO simulado e limitações

- `@mswjs/socket.io-binding` sobre o interceptador de WebSocket do MSW (thread principal, não o Service Worker).
- O cliente deve usar **`transports: ['websocket']`**: não há long-polling simulado.
- O MSW remove o prefixo `/socket.io/` antes de casar o handler; por isso o link é a origem do app (`ws(s)://<host>/`).
- O binding faz o handshake (`0{…}` / `40{…}`) e não suporta rooms/namespaces: o servidor simulado roteia por usuário.
- O servidor envia ping do Engine.IO a cada 20 s (o cliente reconecta se ficar sem ping).
- `realtime.disconnectAll()` / `setOnline(false)` simulam queda de conexão; `replay()` / `emitRaw()` geram duplicatas e eventos antigos.

## 7. UI e design system

- Sem acesso ao Figma na Fase 0, os tokens vieram da skill **ui-ux-pro-max**
  (`design-system/nft-marketplace/MASTER.md`): paleta "NFT/Web3 Platform" em tema escuro, fontes Orbitron (títulos) e
  Exo 2 (texto), servidas localmente via Fontsource.
- Ajustes de acessibilidade: primary `#7C3AED` (no lugar de `#8B5CF6`) para contraste AA com texto branco;
  `muted-foreground` `#A1AEC2`.
- Componentes shadcn/ui (Radix) em `src/shared/ui`, só com tokens semânticos.
- **Desvio do Figma (pendente)**: telas de Login, Cadastro e Perfil ainda não foram conferidas com os frames. Os campos do
  perfil (nome, e-mail, site, bio, avatar) precisam ser confirmados. As artes dos NFTs são SVGs gerados (`npm run generate:art`)
  até os assets do Figma serem exportados.

## 8. Decisões de UX (Dev 1)

- Validação no blur (`mode: 'onTouched'`), erros abaixo do campo ligados por `aria-describedby`, foco no primeiro campo
  inválido (inclusive em erro da API) e alerta geral focado quando o erro não é de campo.
- Mensagem única para credencial inválida (não revela se o e-mail existe).
- Conflito de cadastro oferece "Entrar com este e-mail".
- Perfil: aviso de alterações não salvas (dialog + `beforeunload`), descarte explícito e restauração do rascunho após a sessão expirar.
- Avatar: validação de tipo e tamanho no cliente e na API, pré-visualização imediata e "Tentar novamente" em falha.
- Foco vai para o `<main>` ao trocar de rota; skip link "Pular para o conteúdo".
