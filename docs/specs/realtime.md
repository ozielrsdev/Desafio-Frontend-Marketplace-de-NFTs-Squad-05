# Spec — Realtime (Socket.IO) — contexto transversal

> Seam proposto: **E2E via UI com `socket.io-client` real e servidor MSW**; unit da função de reconciliação por versão.

## Problem Statement

Preço, disponibilidade e estado de pedidos mudam enquanto o usuário navega. A UI precisa refletir isso sem regredir estado mais novo, tolerando duplicatas, desconexões e troca de usuário.

## Solution

Cliente Socket.IO único e por sessão, que traduz eventos `nft.updated` e `order.updated` em atualizações do cache (via casos de uso), com reconciliação por REST após reconexão.

## User Stories

1. Como usuário, quero ver preço/disponibilidade atualizados no catálogo e detalhe sem recarregar.
2. Como usuário com NFT no carrinho, quero ser informado da mudança e ver o resumo atualizado.
3. Como usuário em checkout, quero ser impedido de confirmar com cotação desatualizada.
4. Como usuário, quero ver o pedido passar de pendente a confirmado/recusado em tempo real.
5. Como usuário, quero que eventos duplicados não reapliquem efeitos (ex.: toasts repetidos).
6. Como usuário, quero que eventos antigos não sobrescrevam dados mais novos.
7. Como usuário, quero que, após reconexão, as telas ativas sejam reconciliadas com a API.
8. Como usuário com pedido pendente, quero recuperar o estado após queda de conexão ou reload.
9. Como usuário, quero que eventos de outra sessão/usuário nunca atualizem minha UI.
10. Como usuário, quero indicação discreta e acessível de "reconectando".
11. Como desenvolvedor, quero listeners liberados ao desmontar/ao sair da conta.
12. Como avaliador, quero disparar eventos pelo servidor mockado e ver a UI reagir.

## Implementation Decisions

- Envelope de evento: `{ eventId, type, resource: { kind, id }, version, occurredAt, payload }`. Identidade estável (`eventId`) e `version` monotônica por recurso.
- Eventos: `nft.updated` (preço, disponibilidade) → atualiza detalhe, listas, carrinho e invalida cotação; `order.updated` (status, transactionRef) → atualiza pedido; terminal nunca regride.
- Regra de aplicação: descartar se `eventId` já visto (cache LRU) ou `version ≤` versão local; caso contrário aplicar e registrar.
- Conexão autenticada com credencial da sessão; rooms/canais por usuário para `order.updated`; ao encerrar sessão: `disconnect()`, remover listeners, limpar tabela de versões.
- Reconexão: no `connect` após queda, invalidar/refetch queries ativas (catálogo visível, carrinho, cotação, pedido pendente).
- Anúncio acessível via região `aria-live` para mudanças relevantes.
- Adapter na camada infra; presentation usa hooks de aplicação (`useNftLive`, `useOrderLive`), nunca o socket direto.
- Mocks: servidor Socket.IO simulado com `@mswjs/socket.io-binding`; mudanças em dados simulados geram REST e evento consistentes (ver mocking.md). Documentar limitações do transporte (ex.: apenas polling/WebSocket simulado, sem escalonamento real).

## Testing Decisions

- E2E §9.9 (mudança durante checkout), §9.10 (duplicados/antigos, desconexão, retomada).
- Unit: reconciliação (duplicado, antigo, terminal).
- Proibido substituir socket por setters/callbacks.

## Out of Scope

Presença de usuários, chat, notificações push, múltiplas abas sincronizadas via BroadcastChannel.

## Further Notes

Decidir e documentar em `ARCHITECTURE.md` o transporte e eventuais limites do binding no ambiente de build de demonstração.
