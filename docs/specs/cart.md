# Spec — Cart (Carrinho de NFTs)

> Seam proposto: **E2E via UI + MSW**; unit do aggregate `Cart` (invariantes de quantidade/disponibilidade, merge visitante→usuário).

## Problem Statement

O usuário precisa montar um carrinho que sobreviva a refresh e login, respeite a disponibilidade por NFT/edição, reflita mudanças de preço em tempo real e mostre valores coerentes com a API.

## Solution

Carrinho com adicionar/alterar/remover, cupom, e resumo (subtotal, desconto, taxa de rede, total) vindo da cotação (Pricing). Visitante tem carrinho local; ao autenticar, é mesclado ao carrinho do usuário.

## User Stories

1. Como visitante, quero adicionar NFTs ao carrinho sem login.
2. Como usuário, quero alterar a quantidade respeitando o máximo disponível.
3. Como usuário, quero remover um item.
4. Como usuário, quero que o carrinho persista após refresh.
5. Como visitante, quero que meus itens sejam preservados ao fazer login/cadastro, mesclados ao carrinho existente sem exceder disponibilidade.
6. Como usuário, quero aplicar e remover cupom e ver o desconto.
7. Como usuário, quero mensagem clara para cupom inválido ou expirado.
8. Como usuário, quero ver subtotal, desconto, taxa de rede e total coerentes com a API.
9. Como usuário, quero ser avisado (aria-live) quando preço/disponibilidade de um item mudar com o carrinho aberto, e ver o resumo atualizado.
10. Como usuário, quero ver item indisponível sinalizado e impedido de seguir ao checkout.
11. Como usuário, quero skeleton no resumo enquanto a cotação carrega.
12. Como usuário, quero estado de carrinho vazio com link para o catálogo.
13. Como usuário, quero um contador de itens no cabeçalho sempre sincronizado.
14. Como usuário, quero seguir ao checkout (exige login, com retorno).
15. Como usuário mobile, quero o carrinho utilizável em 390 px sem overflow.
16. Como outro usuário no mesmo navegador, quero não ver o carrinho de quem saiu.

## Implementation Decisions

- Aggregate `Cart` (`CartItem{ nftId, editionId, Quantity, unitPrice snapshot informativo }`). Invariantes: quantidade inteira ≥ 1 e ≤ disponibilidade; sem duplicar (nftId, editionId).
- REST: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`. Conflito de disponibilidade → 409 com detalhes.
- Carrinho do visitante em storage local versionado; caso de uso `mergeGuestCart` no login (`POST /cart/merge` ou sequência idempotente de adds).
- Valores monetários **não** são calculados no cliente: usa resposta de Pricing (`quote`). Cart só envia itens/cupom.
- `nft.updated` invalida/atualiza itens afetados por `version`; notificação acessível + atualização do resumo.
- Optimistic opcional para quantidade; rollback em 409.
- Query key inclui `userId` (ou `guest`).

## Testing Decisions

- E2E §9.5: quantidades, remoção, cupom, persistência após refresh/login (merge); §9.9: alteração de preço durante o carrinho.
- Unit: invariantes e merge.
- Regressão visual do carrinho.

## Out of Scope

Reserva de estoque com expiração, carrinho multi-dispositivo em tempo real, salvar para depois.

## Further Notes

Cart → Catalog (leitura de disponibilidade) e Cart → Pricing (cotação) via APIs públicas.
