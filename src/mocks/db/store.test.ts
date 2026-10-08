import { describe, expect, it } from 'vitest'
import { FIXTURE_PASSWORD } from '../fixtures/users'
import { verifyPassword } from '../lib/password'
import { findScenario } from '../scenarios'
import { createSeedState, db } from './store'

describe('mock db', () => {
  it('seed é determinístico', async () => {
    expect(await createSeedState()).toEqual(await createSeedState())
  })

  it('tem variedade para filtros/paginação e ≥ 2 usuários sem senha em claro', async () => {
    const seed = await createSeedState()
    expect(seed.users.length).toBeGreaterThanOrEqual(2)
    expect(seed.nfts.length).toBeGreaterThanOrEqual(48)
    expect(new Set(seed.nfts.map((n) => n.category)).size).toBeGreaterThan(3)
    expect(seed.nfts.some((n) => n.editions.every((e) => e.available === 0))).toBe(true)
    for (const user of seed.users) {
      expect(JSON.stringify(user)).not.toContain(FIXTURE_PASSWORD)
      expect(await verifyPassword(FIXTURE_PASSWORD, user.salt, user.passwordHash)).toBe(true)
    }
  })

  it('reset restaura integralmente o estado conhecido', async () => {
    await db.reset()
    const pristine = structuredClone(db.read())
    db.write((draft) => {
      draft.favorites.usr_ana = []
      draft.nfts[0]!.price = '999'
    })
    db.nextId('ord')
    await db.reset()
    expect(db.read()).toEqual(pristine)
  })

  it('aplica o ajuste de seed do cenário', async () => {
    await db.reset(findScenario('empty').seed)
    expect(db.read().nfts).toEqual([])
  })
})
