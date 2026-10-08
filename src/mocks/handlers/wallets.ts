import { delay, http, HttpResponse } from 'msw'
import { saveWalletRequestDto } from '@/contexts/wallets/infrastructure/dto'
import { loadJson, saveJson, userOf } from '../support'
import { walletsScenario } from '../wallets-scenario'

interface StoredWallet {
  id: string
  role: 'primary' | 'secondary'
  address: string
  network: 'ethereum' | 'polygon' | 'arbitrum'
}

const NETWORKS = ['ethereum', 'polygon', 'arbitrum']
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const storageKey = (userId: string) => `mock:wallets:${userId}`
const read = (userId: string) => loadJson<StoredWallet[]>(storageKey(userId), [])
const write = (userId: string, wallets: StoredWallet[]) => saveJson(storageKey(userId), wallets)

function fieldErrors(address: string, network: string, others: StoredWallet[]) {
  const fields: Record<string, string> = {}
  if (!ADDRESS.test(address)) fields.address = 'Endereço inválido.'
  if (!NETWORKS.includes(network)) fields.network = 'Rede não suportada.'
  if (!fields.address && others.some((w) => w.address.toLowerCase() === address.toLowerCase())) {
    return { duplicate: true as const, fields }
  }
  return { duplicate: false as const, fields }
}

export const walletHandlers = [
  http.get('/api/wallets', ({ request }) => HttpResponse.json({ wallets: read(userOf(request)) })),

  http.post('/api/wallets', async ({ request }) => {
    const user = userOf(request)
    const body = saveWalletRequestDto.safeParse(await request.json())
    if (!body.success || !body.data.role) {
      return HttpResponse.json({ code: 'validation', fields: { address: 'Requisição inválida.' } }, { status: 422 })
    }
    const wallets = read(user)
    if (wallets.some((w) => w.role === body.data.role)) {
      return HttpResponse.json({ code: 'validation', fields: { address: 'Esta carteira já está cadastrada.' } }, { status: 422 })
    }
    const check = fieldErrors(body.data.address, body.data.network, wallets)
    if (check.duplicate) return HttpResponse.json({ code: 'duplicate_address' }, { status: 409 })
    if (Object.keys(check.fields).length) return HttpResponse.json({ code: 'validation', fields: check.fields }, { status: 422 })

    wallets.push({
      id: `w_${body.data.role}`,
      role: body.data.role,
      address: body.data.address,
      network: body.data.network as StoredWallet['network'],
    })
    write(user, wallets)
    return HttpResponse.json({ wallets }, { status: 201 })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const user = userOf(request)
    const body = saveWalletRequestDto.safeParse(await request.json())
    const wallets = read(user)
    const target = wallets.find((w) => w.id === params.id)
    if (!target) return HttpResponse.json({ code: 'not_found', message: 'Carteira inexistente' }, { status: 404 })
    if (!body.success) return HttpResponse.json({ code: 'validation', fields: { address: 'Requisição inválida.' } }, { status: 422 })

    const check = fieldErrors(body.data.address, body.data.network, wallets.filter((w) => w.id !== target.id))
    if (check.duplicate) return HttpResponse.json({ code: 'duplicate_address' }, { status: 409 })
    if (Object.keys(check.fields).length) return HttpResponse.json({ code: 'validation', fields: check.fields }, { status: 422 })

    target.address = body.data.address
    target.network = body.data.network as StoredWallet['network']
    write(user, wallets)
    return HttpResponse.json({ wallets })
  }),

  http.post('/api/wallets/:id/connection', async () => {
    const { connection, latencyMs } = walletsScenario.get()
    await delay(latencyMs || 400)
    if (connection === 'refuse') {
      return HttpResponse.json(
        { code: 'connection_refused', message: 'A carteira recusou a conexão. Aprove a solicitação e tente novamente.' },
        { status: 403 },
      )
    }
    return HttpResponse.json({ status: 'connected' })
  }),

  http.delete('/api/wallets/:id/connection', () => new HttpResponse(null, { status: 204 })),
]
