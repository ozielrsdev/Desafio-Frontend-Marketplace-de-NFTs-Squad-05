import { expect, test } from '@playwright/test'
import { openApp, users } from './support/mocks'

/** README §9.11 (parte Identity/Profile) — teclado, foco e validação de formulários. */

test('login operável só pelo teclado, com skip link e menu da conta', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Fluxo de teclado validado no desktop')
  await openApp(page, '/login')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')

  await page.getByLabel('E-mail').focus()
  await page.keyboard.type(users.ana.email)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('textbox', { name: 'Senha', exact: true })).toBeFocused()
  await page.keyboard.type(users.ana.password)
  await page.keyboard.press('Enter')

  const menu = page.getByRole('button', { name: `Menu da conta de ${users.ana.name}` })
  await expect(menu).toBeVisible()
  await menu.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Meu perfil' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
})

test('dialog de alterações não salvas prende o foco e fecha com Esc', async ({ page }) => {
  await openApp(page, '/login?returnTo=/perfil')
  await page.getByLabel('E-mail').fill(users.ana.email)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(users.ana.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByLabel('Bio').fill('alterado')
  await page.goBack()

  const dialog = page.getByRole('dialog', { name: 'Descartar alterações?' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL('/perfil')
})

test('rota inexistente mostra 404 com caminho de volta', async ({ page }) => {
  await openApp(page, '/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
})
