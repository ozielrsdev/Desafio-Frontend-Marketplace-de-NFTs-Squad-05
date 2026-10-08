import { expect, type Page } from '@playwright/test'

/** Credenciais fictícias das fixtures (src/mocks/fixtures/users.ts). */
export const users = {
  ana: { name: 'Ana Colecionadora', email: 'ana@nft.test', password: 'Senha@123' },
  bruno: { name: 'Bruno Trader', email: 'bruno@nft.test', password: 'Senha@123' },
} as const

/** Abre a rota com o cenário pedido e estado restaurado (isolamento por teste). */
export async function openApp(page: Page, path = '/', scenario = 'default') {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(`${path}${separator}scenario=${scenario}&mocks-reset=1`)
  await page.waitForFunction(() => Boolean(window.__mocks))
}

/** Executa uma ação na API de controle do mock (sem tocar na UI). */
export async function mocks<T>(page: Page, action: (control: NonNullable<Window['__mocks']>) => T | Promise<T>): Promise<T> {
  return page.evaluate(`(${action.toString()})(window.__mocks)`) as Promise<T>
}

export async function login(page: Page, user: { email: string; password: string }) {
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

export async function expectSignedInAs(page: Page, name: string) {
  await expect(page.getByRole('button', { name: `Menu da conta de ${name}` })).toBeVisible()
}

export async function logout(page: Page, name: string) {
  await page.getByRole('button', { name: `Menu da conta de ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
}
