# Spec — Ordering (Pagamento, pedidos e confirmação)

> Seam proposto: **E2E via UI + MSW + socket.io-client real** (compra completa e falhas); unit da máquina de estados `Order` e da chave de idempotência.

## Problem Statement

Finalizar a compra de forma segura: sem pedidos duplicados em cliques repetidos ou timeouts, com recuperação após refresh/queda de conexão, e com recibo imutável exibido apenas para pedidos realmente confirmados.

## Solution

Tela de Pagamento (dados do colecionador, carteira e rede, revisão, envio) e Confirmação (resultado, transação, itens, taxas, total). Pedido criado de forma idempotente; estado acompanhado por REST e `order.updated`.

## User Stories

1. Como colecionador, quero preencher/validar meus dados no checkout com erros claros.
2. Como colecionador, quero escolher uma das minhas carteiras e a rede.
3. Como colecionador, quero simular conexão, recusa e desconexão da carteira, com feedback.
4. Como colecionador, quero revisar itens, taxas e total antes de enviar.
5. Como colecionador, quero que preço, disponibilidade, cupom e taxas sejam revalidados ao confirmar, e ser avisado de mudanças pedindo nova confirmação.
6. Como colecionador, quero que cliques repetidos em "Confirmar" criem um único pedido.
7. Como colecionador, quero que, após timeout, ao reenviar eu recupere o mesmo pedido (mesma chave de idempotência).
8. Como colecionador, quero ver o pedido como pendente, confirmado ou recusado.
9. Como colecionador, quero que a tela de confirmação só apareça para pedido confirmado.
10. Como colecionador, quero ver mensagem e opção de tentar de novo quando o pagamento for recusado, mantendo meus itens no carrinho.
11. Como colecionador, quero recuperar o pedido pendente após refresh ou reconexão, sem criar nova compra.
12. Como colecionador, quero receber a atualização do pedido em tempo real (`order.updated`).
13. Como colecionador, quero um recibo com identificação da transação (simulada), itens, taxas e total, imutável mesmo se o catálogo mudar.
14. Como colecionador, quero que, após confirmação, só os itens/quantidades comprados saiam do carrinho.
15. Como colecionador, quero que a sessão expirada no checkout preserve o contexto para retomada.
16. Como colecionador, quero o fluxo completo em mobile (390 px) e desktop.
17. Como colecionador, quero acessar a confirmação por URL do pedido (acesso direto) autenticado e só do meu usuário.
18. Como avaliador, quero reproduzir pagamento confirmado/recusado e timeout via cenários MSW.

## Implementation Decisions

- Aggregate `Order` (id, userId, `status: pending | confirmed | rejected`, snapshot de itens/valores, `transactionRef`, `version`); transições só `pending→confirmed|rejected`; terminais imutáveis; eventos antigos/duplicados ignorados por `version`.
- VO `IdempotencyKey` (UUID gerado por tentativa de checkout, persistido por usuário até estado terminal).
- REST: `POST /orders` (header `Idempotency-Key`; body: `quoteId`, carteira, rede, dados) → 201/200 com pedido; mesma chave + mesmo conteúdo → mesmo pedido; mesma chave + conteúdo diferente → 409. `GET /orders/:id` (estado + recibo), `GET /orders?status=pending` para recuperação.
- Erros: 401/403 (pedido de outro usuário → 403/404), 409 cotação obsoleta/disponibilidade, 5xx/timeout transitório.
- Estado do checkout: rascunho persistido por usuário; botão com `isPending` + guarda lógica contra duplo envio.
- Recuperação: ao montar app/checkout, consultar pedido pendente; assinar `order.updated` e reconciliar via REST após reconexão.
- Recibo renderizado do snapshot do pedido, nunca do catálogo atual.
- Remoção do carrinho executada pelo caso de uso após confirmação, apenas dos itens/quantidades comprados.
- Rotas: `/checkout`, `/orders/:id/confirmation` (privadas).

## Testing Decisions

- E2E §9.6 (compra completa), §9.7 (recusa, clique repetido, timeout+idempotência), §9.9, §9.10 (eventos duplicados/antigos, desconexão, retomada).
- Controlar relógio/latência; eventos via servidor MSW Socket.IO, nunca via UI.
- Unit: transições da máquina de estados, geração/reuso de chave.
- Regressão visual: pagamento (e confirmação se estável).

## Out of Scope

Pagamento real, blockchain real, reembolso/cancelamento, histórico completo de pedidos (a menos que no Figma).

## Further Notes

Depende de Pricing, Cart, Wallets, Identity e Realtime.
