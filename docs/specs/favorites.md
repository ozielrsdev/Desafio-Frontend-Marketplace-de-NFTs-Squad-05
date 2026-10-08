# Spec — Favorites

> Seam proposto: **E2E via UI + MSW** (toggle, falha, rollback); unit do reducer/otimismo opcional.

## Problem Statement

O colecionador quer marcar NFTs como favoritos de forma persistente e imediata, sem perder consistência quando a API falha.

## Solution

Toggle de favorito em cards e detalhe, com **atualização otimista** e rollback em caso de erro. Favoritos persistem por usuário autenticado.

## User Stories

1. Como colecionador, quero favoritar um NFT e ver o coração preenchido imediatamente.
2. Como colecionador, quero desfavoritar, com resposta imediata.
3. Como colecionador, quero que favoritos persistam após refresh e novo login.
4. Como colecionador, quero que, se a API falhar, o estado volte ao anterior e eu veja mensagem de erro.
5. Como colecionador, quero poder tentar novamente após a falha.
6. Como visitante, quero ser levado ao login ao tentar favoritar, retornando ao NFT depois (e a ação ser concluída ou reapresentada).
7. Como colecionador, quero que cliques rápidos repetidos não gerem estados inconsistentes.
8. Como usuário de leitor de tela, quero botão com `aria-pressed` e anúncio do resultado (`aria-live`).
9. Como colecionador, quero que outro usuário no mesmo navegador não veja meus favoritos.
10. Como colecionador, quero ver o estado de favorito consistente entre lista e detalhe.

## Implementation Decisions

- Aggregate leve `FavoriteSet` por usuário (conjunto de `NftId`).
- REST: `GET /favorites`, `PUT /favorites/:nftId` (idempotente), `DELETE /favorites/:nftId`.
- Mutation com `onMutate` (cancelar queries, snapshot, atualizar cache), `onError` (rollback + toast acessível), `onSettled` (invalidate). Serializar mutations por `nftId` para evitar corrida.
- Query key inclui `userId`; limpar no logout.
- Catalog consome apenas `isFavorite(nftId)` via API pública do contexto.

## Testing Decisions

- E2E §9.4: favoritar/desfavoritar, falha de mutation (cenário 5xx do MSW) com rollback e recuperação.
- Verificar UI e resultado após refresh; não inspecionar cache.

## Out of Scope

Listas/coleções nomeadas, compartilhamento de favoritos, página dedicada de favoritos (a menos que esteja no Figma).

## Further Notes

Esta é a interação otimista mínima exigida pelo enunciado (§4).

### Decisões da implementação (Dev 1)

- API pública para o Catalog: `<FavoriteButton nftId nftTitle variant="icon|labeled" />` e `useIsFavorite(nftId)`.
- Visitante que clica em favoritar vai ao login com `returnTo` e volta ao mesmo lugar para refazer a ação ("reapresentada").
- Cenário MSW `favorites-fail` para o E2E §9.4. O E2E completo entra quando houver cards ou detalhe na UI (Catalog).
