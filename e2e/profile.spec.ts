import { expect, test, type Page } from '@playwright/test'
import { expectSignedInAs, login, openApp, users } from './support/mocks'

/** README §9.8 (perfil, avatar, senha, validação) e §9.12 (skeleton, falha e retry) — parte de Profile. */

async function openProfileAs(page: Page, scenario = 'default') {
  await openApp(page, '/login?returnTo=/perfil', scenario)
  await login(page, users.ana)
  await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
}

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Profile', () => {
  test('edita dados com validação local e da API; alteração persiste e reflete no cabeçalho', async ({ page }) => {
    await openProfileAs(page)
    const name = page.getByLabel('Nome')
    await expect(name).toHaveValue(users.ana.name)

    await page.getByLabel('Site').fill('nao-e-url')
    await page.getByLabel('Site').blur()
    await expect(page.getByLabel('Site')).toHaveAccessibleDescription(/Informe uma URL válida/)

    await page.getByLabel('Site').fill('https://ana.dev')
    // E-mail de outro usuário → 409 associado ao campo.
    await page.getByLabel('E-mail').fill(users.bruno.email)
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByLabel('E-mail')).toHaveAccessibleDescription(/já pertence a outra conta/)
    await expect(page.getByLabel('E-mail')).toBeFocused()

    await page.getByLabel('E-mail').fill(users.ana.email)
    await name.fill('Ana Maria')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await expectSignedInAs(page, 'Ana Maria')

    await page.reload()
    await expect(name).toHaveValue('Ana Maria')
    await expect(page.getByLabel('Site')).toHaveValue('https://ana.dev')
  })

  test('avisa sobre alterações não salvas ao sair da página', async ({ page }) => {
    await openProfileAs(page)
    await page.getByLabel('Bio').fill('Rascunho não salvo')
    await page.getByRole('link', { name: /NFT Marketplace/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Descartar alterações?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Continuar editando' }).click()
    await expect(page).toHaveURL('/perfil')
    await expect(page.getByLabel('Bio')).toHaveValue('Rascunho não salvo')
  })

  test('envia avatar, rejeita formato inválido e mostra no cabeçalho', async ({ page }) => {
    await openProfileAs(page)
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles({ name: 'doc.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') })
    await expect(page.getByText('Formato não suportado. Use PNG, JPG ou WEBP.')).toBeVisible()

    await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: `Avatar de ${users.ana.name}` })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('img', { name: `Avatar de ${users.ana.name}` })).toBeVisible()
  })

  test('altera a senha: erro de senha atual e login com a nova', async ({ page }) => {
    await openProfileAs(page)
    await page.getByLabel('Senha atual').fill('errada000')
    await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('NovaSenha9')
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha9')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByLabel('Senha atual')).toHaveAccessibleDescription('A senha atual está incorreta.')

    await page.getByLabel('Senha atual').fill(users.ana.password)
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada.')).toBeVisible()

    await page.getByRole('button', { name: `Menu da conta de ${users.ana.name}` }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await page.goto('/login')
    await login(page, { email: users.ana.email, password: 'NovaSenha9' })
    await expectSignedInAs(page, users.ana.name)
  })

  test('falha ao carregar mostra erro com nova tentativa (cenário server-error)', async ({ page }) => {
    await openProfileAs(page, 'server-error')
    await expect(page.getByText('Não foi possível carregar seu perfil')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByLabel('Nome')).toHaveValue(users.ana.name)
  })

  test('mostra skeleton durante carregamento lento', async ({ page }) => {
    await openProfileAs(page, 'slow')
    await page.reload()
    await expect(page.getByLabel('Carregando perfil')).toBeVisible()
    await expect(page.getByLabel('Nome')).toHaveValue(users.ana.name, { timeout: 15_000 })
  })
})
