import { expect, test } from '@playwright/test'
import { expectSignedInAs, login, logout, mocks, openApp, users } from './support/mocks'

/** README §9.3 — cadastro, login, expiração de sessão, logout e troca de usuário. */

test.describe('Identity', () => {
  test('cadastro valida campos, trata conflito e cria a conta', async ({ page }) => {
    await openApp(page, '/cadastro')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Informe ao menos 2 caracteres.')).toBeVisible()
    await expect(page.getByLabel('Nome')).toBeFocused()

    await page.getByLabel('Nome').fill('Carla Nova')
    await page.getByLabel('E-mail').fill(users.ana.email)
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('fraca')
    await page.getByLabel('Confirmar senha').fill('fraca')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('textbox', { name: 'Senha', exact: true })).toHaveAccessibleDescription(/ao menos 8 caracteres/)

    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('Segura123')
    await page.getByLabel('Confirmar senha').fill('Segura123')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    // 409 da API associado ao campo e-mail.
    await expect(page.getByLabel('E-mail')).toHaveAccessibleDescription('Este e-mail já está cadastrado. Entre na sua conta.')
    await expect(page.getByRole('link', { name: 'Entrar com este e-mail' })).toBeVisible()

    await page.getByLabel('E-mail').fill('carla@nft.test')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expectSignedInAs(page, 'Carla Nova')
    await expect(page).toHaveURL('/')

    // Conta persistida: sobrevive a refresh.
    await page.reload()
    await expectSignedInAs(page, 'Carla Nova')
  })

  test('login com credenciais inválidas mostra mensagem genérica', async ({ page }) => {
    await openApp(page, '/login')
    await login(page, { email: users.ana.email, password: 'errada123' })
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Senha', exact: true })).toHaveValue('')
  })

  test('rota privada redireciona ao login e retorna ao destino; sessão sobrevive a refresh', async ({ page }) => {
    await openApp(page, '/perfil')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fperfil/)
    await login(page, users.ana)
    await expect(page).toHaveURL('/perfil')
    await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Nome')).toHaveValue(users.ana.name)
  })

  test('returnTo externo é ignorado (sem open redirect)', async ({ page }) => {
    await openApp(page, '/login?returnTo=https://evil.example')
    await login(page, users.ana)
    await expect(page).toHaveURL('/')
  })

  test('expiração durante a navegação leva ao login preservando o destino', async ({ page }) => {
    await openApp(page, '/login?returnTo=/perfil')
    await login(page, users.ana)
    await expect(page.getByLabel('Nome')).toHaveValue(users.ana.name)

    await mocks(page, (m) => m.expireSessions())
    // Próxima requisição autenticada recebe 401 session_expired.
    await page.getByLabel('Nome').fill('Ana Teste')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(page).toHaveURL(/\/login\?.*reason=expired/)
    await expect(page.getByText('Sua sessão expirou')).toBeVisible()
    await login(page, users.ana)
    await expect(page).toHaveURL('/perfil')
    // Edição não salva é retomada após o novo login.
    await expect(page.getByLabel('Nome')).toHaveValue('Ana Teste')
    await expect(page.getByText('Alterações restauradas')).toBeVisible()
  })

  test('logout e troca de usuário não deixam dados do anterior', async ({ page }) => {
    await openApp(page, '/login?returnTo=/perfil')
    await login(page, users.ana)
    await expect(page.getByLabel('Site')).toHaveValue('https://ana.example.com')

    await logout(page, users.ana.name)
    await expect(page.getByRole('link', { name: /Criar conta|Entrar/ }).first()).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Você saiu da sua conta.' })).toBeAttached()
    const storage = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('nftm:') && key !== 'nftm:last-user'))
    expect(storage).toEqual([])

    await page.goto('/login?returnTo=/perfil')
    await login(page, users.bruno)
    await expectSignedInAs(page, users.bruno.name)
    await expect(page.getByLabel('Nome')).toHaveValue(users.bruno.name)
    await expect(page.getByLabel('Site')).toHaveValue('')
    await expect(page.getByText('https://ana.example.com')).toHaveCount(0)
  })
})
