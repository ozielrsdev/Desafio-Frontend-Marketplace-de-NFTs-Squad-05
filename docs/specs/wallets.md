# Spec — Wallets (Carteiras)

> Seam proposto: **E2E via UI + MSW**; unit do aggregate `WalletSet` (uma principal, uma secundária) e do validador de endereço.

## Problem Statement

O colecionador precisa cadastrar e editar carteira principal e secundária e usá-las no checkout, com seleção de rede e simulação de conexão/recusa/desconexão, sem integrações reais.

## Solution

Tela de Carteiras para gerenciar as duas carteiras e uma abstração de "provedor de carteira" simulada, usada pelo Ordering.

## User Stories

1. Como colecionador, quero ver minhas carteiras principal e secundária.
2. Como colecionador, quero cadastrar a carteira principal informando endereço e rede.
3. Como colecionador, quero cadastrar/editar a secundária.
4. Como colecionador, quero erros de validação (endereço inválido, duplicado, rede incompatível).
5. Como colecionador, quero que alterações persistam após refresh.
6. Como colecionador, quero escolher carteira e rede no checkout apenas entre as cadastradas.
7. Como colecionador, quero ser direcionado a cadastrar carteira se não tiver nenhuma ao pagar, retornando ao checkout.
8. Como colecionador, quero simular conexão da carteira com estados "conectando/conectado".
9. Como colecionador, quero ver mensagem clara quando a conexão for recusada, e poder tentar novamente.
10. Como colecionador, quero desconectar a carteira e ter a confirmação bloqueada até reconectar.
11. Como colecionador, quero a tela funcional em mobile.
12. Como colecionador, quero que o endereço seja exibido abreviado com opção de ver completo, acessível por leitor de tela.

## Implementation Decisions

- Aggregate `WalletSet { primary, secondary? }`; VO `WalletAddress` (formato 0x + 40 hex, validado), `Network` (lista fechada no contrato). Invariante: principal obrigatória antes de comprar; endereços distintos.
- REST: `GET /wallets`, `POST /wallets` (cadastro), `PATCH /wallets/:id`. Erros 422 por campo, 409 duplicidade.
- Porta `WalletConnector` (application) com adapter simulado (infra) cujo comportamento (conectar/recusar/desconectar) é governado pelo cenário ativo do MSW/config — sem caminhos de negócio alternativos em componentes. Nenhuma extensão de carteira real.
- Estado de conexão é efêmero (não persistir entre sessões; limpar no logout).

## Decisões de implementação (Dev 3)

- Cada carteira tem **uma** rede (registrada no cadastro); no checkout a rede da cotação é a da carteira escolhida.
- Contratos: `GET /wallets` → `{wallets[]}`; `POST /wallets` (`role`, `address`, `network`) e `PATCH /wallets/:id` retornam o conjunto atualizado; 422 `{fields}` por campo; 409 duplicidade → erro no campo `address`. Conexão simulada: `POST|DELETE /wallets/:id/connection` (403 `connection_refused`), governada por `window.__mocks.wallets`.
- Estado de conexão só em memória (`WalletConnectionProvider`, remontado por `userId`).

## Testing Decisions

- E2E §9.8 (carteiras com erros de validação) e parte de §9.6/§9.7 (conexão/recusa no checkout).
- Unit: validação de endereço e invariantes do `WalletSet`.

## Out of Scope

Integração com MetaMask/WalletConnect, assinatura de mensagens, saldo on-chain, mais de duas carteiras.

## Further Notes

Consumido por Ordering via API pública do contexto.
