# Spec — Profile (Perfil do colecionador)

> Seam proposto: **E2E via UI + MSW**; unit dos validadores.

## Problem Statement

O colecionador precisa manter seus dados, avatar e senha atualizados, com validações e erros vindos da API, e com alterações persistentes.

## Solution

Tela de Perfil com edição de dados, upload/troca de avatar e alteração de senha; funcional em desktop e mobile.

## User Stories

1. Como colecionador, quero ver meus dados atuais carregados com skeleton.
2. Como colecionador, quero editar nome, e-mail e demais campos do Figma e salvar.
3. Como colecionador, quero ver erros de validação locais e retornados pela API, associados ao campo.
4. Como colecionador, quero que alterações confirmadas persistam após refresh.
5. Como colecionador, quero enviar/trocar avatar com pré-visualização e validação de tipo/tamanho.
6. Como colecionador, quero uma falha de upload tratada com opção de tentar novamente.
7. Como colecionador, quero alterar a senha informando a atual e a nova com confirmação.
8. Como colecionador, quero erro claro para senha atual incorreta ou nova senha fraca.
9. Como colecionador, quero feedback acessível de sucesso/erro (`aria-live`).
10. Como colecionador, quero evitar perder alterações sem salvar (aviso de formulário sujo).
11. Como colecionador, quero usar a tela em 390/768/1440 px.
12. Como colecionador com sessão expirada, quero retomar a edição após novo login.

## Implementation Decisions

- Entidade `CollectorProfile` (id, nome, e-mail, avatarUrl, …); VO `Email`; senha tratada só em formulário/transporte, nunca em cache/log.
- REST: `GET /profile`, `PATCH /profile`, `PUT /profile/avatar` (multipart ou URL simulada), `POST /profile/password`. Erros: 422 por campo, 409 e-mail em uso, 400/422 senha atual incorreta.
- Mutations invalidam/atualizam a query do perfil; atualização de nome/avatar reflete no cabeçalho.
- Validação com schema compartilhado front (UX) e mensagens mapeadas dos erros da API.
- Avatar: limite de tamanho/tipos documentados; armazenado no estado persistido do mock.

## Testing Decisions

- E2E §9.8 (edição de perfil, avatar, senha, erros de validação) e §9.11 (foco/validação).
- Unit: validadores de campos e senha.

## Out of Scope

Exclusão de conta, preferências de notificação, 2FA, verificação de e-mail.

## Further Notes

Os campos exatos do formulário devem ser conferidos no Figma.
