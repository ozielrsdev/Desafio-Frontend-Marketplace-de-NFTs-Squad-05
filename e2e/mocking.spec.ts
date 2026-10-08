import { expect, test } from '@playwright/test'
import { mocks, openApp } from './support/mocks'

/**
 * Infra do mock (docs/specs/mocking.md): servidor Socket.IO simulado exercitado pelo
 * `socket.io-client` real, REST e evento coerentes, roteamento de `order.updated` por usuário e reset.
 */

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Infra de mocks independe do viewport')
  await openApp(page, '/')
})

test('nft.updated chega pelo socket.io-client real e o REST reflete a mesma versão', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const socket = await window.__mocks!.connectTestClient()
    const received = new Promise<{ type: string; version: number; payload: { price: string } }>((resolve) =>
      socket.on('nft.updated', resolve),
    )
    window.__mocks!.realtime.publishNftUpdate('nft_01', { price: '1.2345' })
    const event = await received
    const replayed = new Promise<string>((resolve) => socket.on('nft.updated', (e: { eventId: string }) => resolve(e.eventId)))
    const replay = window.__mocks!.realtime.replay()
    const duplicateId = await replayed
    socket.disconnect()
    const nft = window.__mocks!.db.read().nfts.find((n) => n.id === 'nft_01')!
    return { event, duplicateId, originalId: replay?.eventId, nftVersion: nft.version, nftPrice: nft.price }
  })

  expect(result.event.type).toBe('nft.updated')
  expect(result.event.payload.price).toBe('1.2345')
  expect(result.event.version).toBe(result.nftVersion)
  expect(result.nftPrice).toBe('1.2345')
  expect(result.duplicateId).toBe(result.originalId)
})

test('order.updated só é entregue ao dono do pedido', async ({ page }) => {
  const got = await page.evaluate(async () => {
    const control = window.__mocks!
    const login = async (email: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Senha@123' }),
      })
      return ((await response.json()) as { token: string }).token
    }
    const connect = async (token: string | null) => {
      const socket = await control.connectTestClient({ token: token ?? undefined })
      // aguarda o servidor processar o handshake com o token
      await new Promise((resolve) => setTimeout(resolve, 100))
      return socket
    }
    const sockets = {
      ana: await connect(await login('ana@nft.test')),
      bruno: await connect(await login('bruno@nft.test')),
      guest: await connect(null),
    }
    const counts = { ana: 0, bruno: 0, guest: 0 }
    for (const key of Object.keys(sockets) as (keyof typeof sockets)[]) {
      sockets[key].on('order.updated', () => counts[key]++)
    }

    const now = new Date().toISOString()
    const order = {
      id: 'ord_e2e',
      status: 'confirmed' as const,
      items: [],
      subtotal: '0',
      discount: '0',
      networkFee: '0',
      total: '0',
      network: 'ethereum' as const,
      walletAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      collector: { name: 'Ana', email: 'ana@nft.test' },
      transactionRef: '0xabc',
      explorerUrl: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      version: 2,
    }
    control.db.mutate((draft) => {
      draft.orders.push({ ...order, userId: 'usr_ana' })
    })
    control.realtime.publishOrderUpdate(order)
    await new Promise((resolve) => setTimeout(resolve, 300))
    Object.values(sockets).forEach((socket) => socket.disconnect())
    return counts
  })

  expect(got).toEqual({ ana: 1, bruno: 0, guest: 0 })
})

test('reset completo restaura o cenário e limpa o storage do app', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('nftm:session', '{"token":"x"}'))
  await mocks(page, (m) => m.realtime.publishNftUpdate('nft_02', { price: '9' }))
  await mocks(page, (m) => m.reset())
  const after = await page.evaluate(() => ({
    price: window.__mocks!.db.read().nfts.find((n) => n.id === 'nft_02')!.price,
    session: localStorage.getItem('nftm:session'),
  }))
  expect(after.price).not.toBe('9')
  expect(after.session).toBeNull()
})
