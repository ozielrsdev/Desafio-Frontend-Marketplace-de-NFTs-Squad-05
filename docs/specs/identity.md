# Spec — Identity (Sessão e conta)

> Seams de teste propostos (a confirmar com o time): **E2E Playwright via UI + handlers MSW** (seam principal) e **unit do domínio `Session`**.

## Problem Statement

O colecionador precisa criar conta, entrar, manter a sessão após refresh, e sair com segurança. Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação; sem isso, dados privados podem vazar entre usuários ou a pessoa perde o contexto ao ter a sessão expirada.

## Solution

Fluxos de cadastro, login, consulta da sessão, logout e tratamento de expiração integrados à API simulada. Rotas privadas são protegidas pelo Router, com retorno ao fluxo anterior após login. Logout/troca de usuário limpam cache, subscriptions e storage privado.

## User Stories

1. Como visitante, quero criar uma conta com nome, e-mail e senha, para comprar NFTs.
2. Como visitante, quero ver erros de validação por campo (e-mail inválido, senha fraca), para corrigir rapidamente.
3. Como visitante, quero ser avisado se o e-mail já está cadastrado (conflito), para entrar na conta existente.
4. Como colecionador, quero entrar com e-mail e senha, para acessar minha conta.
5. Como colecionador, quero ver mensagem clara para credenciais inválidas sem revelar qual campo errou.
6. Como colecionador, quero voltar à página/fluxo em que estava (ex.: checkout) após o login, para não perder contexto.
7. Como colecionador, quero continuar logado após refresh, para não reentrar toda hora.
8. Como colecionador, quero que a sessão expirada durante a navegação me leve ao login preservando o destino, para retomar.
9. Como colecionador, quero que a expiração durante o checkout preserve carrinho e dados preenchidos, para retomar o pedido.
10. Como colecionador, quero sair da conta e ter meus dados privados removidos do dispositivo/cache.
11. Como segundo usuário no mesmo navegador, quero não ver nada do usuário anterior.
12. Como visitante, quero ser redirecionado ao login ao acessar rota privada por URL direta.
13. Como usuário de teclado/leitor de tela, quero formulários com labels, foco e erros associados.
14. Como visitante com carrinho, quero que meus itens sejam preservados ao autenticar (ver Cart).
15. Como desenvolvedor, quero credenciais fictícias documentadas (≥ 2 usuários) para avaliar o app.

## Implementation Decisions

- Aggregate `Session` (user id, token/identificador opaco, expiração); VO `Email`; senha nunca trafega em estado persistido nem é armazenada em claro (mock guarda hash).
- Contrato REST: `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`. Erros: 400/422 validação por campo, 409 e-mail em uso, 401 credencial/sessão inválida ou expirada.
- Token em cookie simulado ou storage com expiração; interceptor Axios injeta credencial e, em 401, dispara caso de uso `handleSessionExpired` (não faz lógica de negócio no interceptor além de sinalizar).
- Router: guarda `beforeLoad` nas rotas privadas (checkout, confirmação, perfil, carteiras, pedidos) com `redirect` incluindo `returnTo` validado (apenas caminhos internos — evitar open redirect).
- Troca de sessão: caso de uso `endSession` executa `queryClient.clear()`, desconecta Socket.IO, limpa storage privado; query keys privadas incluem `userId`.
- Expiração em checkout: o rascunho do checkout (campos, carteira escolhida) é persistido por usuário antes de redirecionar.
- Rotas: login, cadastro; ambos redirecionam usuário já autenticado.

## Testing Decisions

- Bom teste: observa UI e resultado (rota, mensagens, presença/ausência de dados de outro usuário), não detalhes internos.
- E2E (README §9.3): cadastro, login, expiração, logout, troca de usuário; validação de formulários e foco (§9.11).
- Unit: regras de `Session` (expiração) e validadores.
- Cenários MSW: sucesso, conflito de cadastro, sessão expirada, não autorizado.

## Out of Scope

Recuperação de senha, OAuth/social login, 2FA, e-mail real, carteiras reais (ver Wallets).

## Further Notes

Dependência: todos os demais contextos consomem `userId` deste contexto via API pública.
