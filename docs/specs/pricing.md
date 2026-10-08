# Spec — Pricing (Cotação)

> Seam proposto: **unit do `Quote`/`Money`** (precisão decimal) + **E2E via UI + MSW** para cupom e revalidação.

## Problem Statement

Totais devem ser exatos (ETH com precisão decimal), consistentes com a API e revalidados antes de confirmar a compra, para que o usuário nunca pague um preço desatualizado.

## Solution

Contexto responsável por **cotação**: valida cupom, disponibilidade, descontos, taxas e total. A cotação da API é a referência para finalizar o pedido; mudanças exigem nova confirmação.

## User Stories

1. Como usuário, quero ver subtotal, desconto, taxa de rede e total precisos.
2. Como usuário, quero aplicar um cupom válido e ver o desconto aplicado.
3. Como usuário, quero feedback específico para cupom inválido, expirado ou não aplicável.
4. Como usuário, quero remover o cupom e ver o total recalculado.
5. Como usuário, quero que a cotação seja refeita ao mudar itens/quantidades/cupom/rede.
6. Como usuário, quero ser avisado se a cotação mudou entre revisão e envio, e precisar confirmar de novo.
7. Como usuário, quero que o checkout bloqueie a confirmação com cotação desatualizada (preço/edição alterados).
8. Como usuário, quero ver itens que ficaram indisponíveis destacados na cotação.
9. Como desenvolvedor, quero que nenhum valor monetário use ponto flutuante.
10. Como usuário, quero que a taxa de rede dependa da rede escolhida (conforme Figma/contrato).

## Implementation Decisions

- VO `Money` (string decimal ↔ `Decimal`; soma/subtração/multiplicação por `Quantity`; formatação sem perda), VO `Coupon`, entidade/VO `Quote { id, version/expiresAt, items[], subtotal, discount, networkFee, total, issues[] }`.
- REST: `POST /quotes` (body: itens, cupom, rede) → cotação com `quoteId`/`version`; erros: cupom inválido/expirado (422 com código), conflito de disponibilidade (409).
- Pedido referencia `quoteId`/versão; servidor rejeita (409) cotação obsoleta → UI mostra diff e exige reconfirmação.
- Revalidação obrigatória imediatamente antes do envio do pedido.
- Query key inclui `userId` e hash dos insumos (itens, cupom, rede); `signal` cancela cotações obsoletas.
- Apresentação de ETH: **sem perda** — exibe todas as casas significativas (máx. 18, `ETH_DECIMALS`), mínimo de 2 (`1.50 ETH`); nunca arredonda/trunca na UI. `Money.parse` rejeita > 18 casas.
- `createQuote` valida invariantes (subtotal = Σ linhas; 0 ≤ desconto ≤ subtotal; total = subtotal − desconto + taxa). Cupom é validado por `useApplyCoupon` antes de entrar no estado do carrinho (erro 422 não altera total nem cupom vigente).
- Contrato `POST /quotes` (DTO zod em `infrastructure/dto.ts`): erros `coupon_invalid | coupon_expired | coupon_not_applicable` (422), `stale_quote`/`availability_conflict` (409). Taxas MSW: ethereum 0.003, polygon 0.0005, arbitrum 0.0012 (provisório até o Figma).

## Testing Decisions

- Unit: aritmética de `Money` (casos como 0.1+0.2), arredondamento/truncamento documentado.
- E2E §9.5 (cupom), §9.9 (alteração de preço durante checkout). Cenários MSW: cupom inválido/expirado; preço alterado; edição esgotada.

## Out of Scope

Conversão fiat, gas real, múltiplas moedas, regras promocionais complexas além do cupom.

## Further Notes

Pricing é consumido por Cart (resumo) e Ordering (revalidação).
