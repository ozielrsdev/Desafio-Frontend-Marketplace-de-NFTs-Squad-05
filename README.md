# NFT Marketplace — Squad 05

Marketplace de NFTs em React + TypeScript com APIs, autenticação, carteiras e pagamentos **simulados via MSW** (REST + Socket.IO).
O enunciado do desafio está em [`docs/ENUNCIADO.md`](docs/ENUNCIADO.md); a divisão do trabalho, em [`docs/PLANO.md`](docs/PLANO.md);
as decisões técnicas, em [`ARCHITECTURE.md`](ARCHITECTURE.md).

> Estado atual: **Fase 0 + Identity/Profile/Favorites (Dev 1)**. Catálogo, carrinho, cotação, carteiras e pedidos entram nas próximas fases.

## Requisitos

- Node.js 22+ e npm 10+
- Para E2E: `npx playwright install chromium`

## Setup

```bash
npm install
cp .env.example .env   # mocks ligados por padrão
npm run dev            # http://localhost:5173
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_MOCKS` | `true` | Liga a camada MSW (REST + Socket.IO). Também no build de demonstração. |
| `VITE_API_URL` | `/api` | Base das chamadas REST (interceptadas pelo MSW). |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial dos mocks. |

## Credenciais fictícias

| Usuário | E-mail | Senha | Observação |
| --- | --- | --- | --- |
| Ana Colecionadora | `ana@nft.test` | `Senha@123` | Tem favoritos e carteira principal |
| Bruno Trader | `bruno@nft.test` | `Senha@123` | Conta sem favoritos e sem carteiras |

As senhas são guardadas apenas como hash (SHA-256 com salt) no banco simulado.

## Cenários e reset dos mocks

Três formas equivalentes de controlar o backend simulado:

1. **URL**: `?scenario=<id>` ativa o cenário (e restaura os dados); `?mocks-reset=1` restaura o estado conhecido.
   Ex.: `http://localhost:5173/perfil?scenario=server-error`.
2. **Painel de mocks**: botão "Mocks" no canto inferior esquerdo (dev e demonstração).
3. **API de controle** (testes/console): `window.__mocks` — `setScenario(id)`, `reset()`, `expireSessions()`,
   `setLatency({ min, max })`, `addFailure(rule)`, `clock.advance(ms)`, `realtime.publishNftUpdate(...)`, `realtime.disconnectAll()` etc.

O reset limpa o banco simulado, a sessão, o storage do app, o relógio e as conexões de socket.

| Cenário | O que simula |
| --- | --- |
| `default` | Tudo com sucesso, latência fixa de 150 ms (base para Lighthouse e regressão visual) |
| `empty` | Catálogo vazio |
| `slow` | Latência de 2,5 s (skeletons) |
| `variable-latency` | Latência entre 100 ms e 2,5 s (respostas fora de ordem) |
| `offline` | Falha de conexão em todo REST |
| `server-error` | 3 primeiras leituras de catálogo/perfil com 500, depois normal (retry) |
| `flaky` | 30% de 503 (sequência determinística) |
| `session-expired` | Sessões expiram 20 s após o login |
| `forbidden` | Perfil e carteiras respondem 403 |
| `favorites-fail` | Favoritar/desfavoritar responde 500 (rollback) |
| `price-change` · `sold-out` | Preço muda / edição esgota no checkout *(Pricing/Ordering)* |
| `order-timeout` | 1º pedido responde após o timeout; reenvio recupera o mesmo pedido *(Ordering)* |
| `payment-rejected` | Pagamento recusado *(Ordering)* |
| `wallet-rejects` | Carteira recusa a conexão *(Wallets)* |

### Reproduzindo falhas (contas e perfil)

| Falha | Como reproduzir |
| --- | --- |
| Conflito de cadastro | Cadastre-se com `ana@nft.test` |
| Validação por campo | Envie cadastro/perfil/senha com campos inválidos (ex.: senha sem número) |
| Credencial inválida | Entre com senha errada |
| Sessão expirada | Logado, use "Expirar sessões" no painel (ou `window.__mocks.expireSessions()`) e faça qualquer ação; ou use `?scenario=session-expired` |
| Acesso não autorizado | `?scenario=forbidden` e abra `/perfil` |
| Erro 500 + retry | `?scenario=server-error` e abra `/perfil` |
| Carregamento lento | `?scenario=slow` |
| Falha ao favoritar | `?scenario=favorites-fail` |
| Troca de usuário | Entre como Ana, saia, entre como Bruno: nada da Ana permanece |

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Typecheck + build de produção (mocks incluídos se `VITE_MOCKS=true`) |
| `npm run preview` | Serve o build |
| `npm run typecheck` | TypeScript (app + testes) |
| `npm run lint` | ESLint (inclui regras de dependência entre camadas) |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Playwright (Chromium, desktop 1440 px e mobile 390 px) com relatório HTML e traces |
| `E2E_PREVIEW=1 npx playwright test` | E2E contra o build de demonstração (rode `npm run build` antes) |
| `npm run test:visual` | Regressão visual (testes marcados com `@visual`) |
| `npm run generate:art` | Regenera as artes SVG locais das fixtures |

Relatório do Playwright: `npx playwright show-report`.

## Deploy

Vercel com rewrite SPA em [`vercel.json`](vercel.json) (o `mockServiceWorker.js` e os assets ficam fora do rewrite).
Defina `VITE_MOCKS=true` no projeto da Vercel.
