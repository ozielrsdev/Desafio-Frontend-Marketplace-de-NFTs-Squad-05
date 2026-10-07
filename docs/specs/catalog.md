# Spec — Catalog (NFTs: início e detalhe)

> Seam proposto: **E2E via UI + MSW** (busca/filtros/paginação/detalhe); unit para mapeamento de search params e `NftAvailability`.

## Problem Statement

O visitante precisa descobrir NFTs (destaques e catálogo) com busca, filtros combinados, ordenação e paginação, e abrir o detalhe — com estado compartilhável por URL, resiliente a refresh, histórico, falhas e respostas fora de ordem.

## Solution

Tela Início (destaques + catálogo) e Detalhe do NFT (galeria, informações, edição, quantidade, favoritos, compra). Todo estado de consulta vive na URL e é refletido nos parâmetros enviados à API.

## User Stories

1. Como visitante, quero ver destaques e catálogo ao abrir o app.
2. Como visitante, quero buscar por texto e ver resultados atualizarem.
3. Como visitante, quero combinar filtros (ex.: categoria, faixa de preço, disponibilidade — conforme Figma), para refinar.
4. Como visitante, quero ordenar (preço, recente etc.), para comparar.
5. Como visitante, quero paginar e voltar à página anterior pelo histórico do navegador, mantendo filtros.
6. Como visitante, quero que mudar um filtro reinicie a paginação para a página 1.
7. Como visitante, quero compartilhar a URL e ver o mesmo resultado, inclusive após refresh.
8. Como visitante, quero ver estado vazio claro com ação "limpar filtros".
9. Como visitante, quero ver erro com botão "tentar novamente" quando a API falhar.
10. Como visitante, quero skeletons com shimmer enquanto carrega, sem pular o layout.
11. Como visitante, quero que respostas antigas não sobrescrevam a busca mais recente.
12. Como visitante, quero abrir o detalhe diretamente por URL.
13. Como visitante, quero uma página de "NFT não encontrado" para ID inexistente.
14. Como visitante, quero ver galeria, preço em ETH, descrição, criador, edições disponíveis.
15. Como visitante, quero escolher edição e quantidade respeitando disponibilidade e limite máximo.
16. Como visitante, quero ver "edição indisponível/esgotada" e a ação de compra desabilitada com explicação.
17. Como visitante, quero ver preço/disponibilidade atualizados em tempo real (ver Realtime).
18. Como visitante, quero adicionar ao carrinho e comprar agora a partir do detalhe.
19. Como usuário de teclado/leitor de tela, quero navegar filtros, cards e galeria com foco visível e semântica correta.
20. Como usuário mobile, quero filtros em drawer com focus trap, e layout adaptado (390/768/1440).

## Implementation Decisions

- Entidade `Nft` (id, título, mídia, criador, categoria, `Money` preço, `Edition[]` com `available`, `version`); VO `NftId`, `Money`, `Quantity`.
- Contrato REST: `GET /nfts?q&filters&sort&page&pageSize` → `{ items, page, pageSize, total }`; `GET /nfts/:id`; destaques via `GET /nfts/featured` (ou flag em listagem — decidir no contrato). 404 para inexistente.
- Search params do Router tipados/validados (schema); normalização de valores inválidos para defaults; `page` reseta em mudança de filtro/busca/ordem.
- Query keys: `['catalog','list', params]` e `['catalog','detail', id]`; `placeholderData: keepPreviousData` na paginação; debounce da busca; `signal` cancela requisições obsoletas.
- `nft.updated` atualiza listas e detalhe respeitando `version` (ver Realtime).
- Preços como string decimal; apresentação formatada via `Money`.
- Imagens: dimensões explícitas, `loading` lazy abaixo da dobra, LCP priorizado (hero/primeiro card).
- SEO básico: títulos/meta por rota para a meta Lighthouse ≥ 90.

## Testing Decisions

- E2E §9.1 (busca/filtros/ordenação/paginação/histórico), §9.2 (detalhe direto e 404), §9.12 (skeleton/lento/erro/retry).
- Cenários MSW: sucesso, vazio, latência variável/fora de ordem, 4xx/5xx, falha de conexão.
- Unit: parse/serialização de search params; regras de quantidade vs disponibilidade.
- Regressão visual: início e detalhe com dados estáveis.

## Out of Scope

Páginas editoriais, atividade, ofertas, downloads; mint/venda de NFT; leilões.

## Further Notes

Os filtros exatos devem ser extraídos do Figma e registrados aqui antes da implementação.
