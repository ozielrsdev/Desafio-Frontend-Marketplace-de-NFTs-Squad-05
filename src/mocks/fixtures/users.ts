/**
 * Usuários fictícios (≥ 2, README §6). Credenciais documentadas no README da solução.
 * Os salts são fixos para o seed ser determinístico; o hash é calculado no seed.
 */
export const FIXTURE_PASSWORD = 'Senha@123'

export const userFixtures = [
  {
    id: 'usr_ana',
    name: 'Ana Colecionadora',
    email: 'ana@nft.test',
    password: FIXTURE_PASSWORD,
    salt: 'a1f0c3d9e2b84a7f9c1d2e3f4a5b6c7d',
    bio: 'Coleciono arte generativa desde 2021.',
    website: 'https://ana.example.com',
  },
  {
    id: 'usr_bruno',
    name: 'Bruno Trader',
    email: 'bruno@nft.test',
    password: FIXTURE_PASSWORD,
    salt: 'b2e1d4c0f3a95b8e0d2c3f4e5d6c7b8a',
    bio: '',
    website: '',
  },
] as const

export const FIXTURE_CREATED_AT = '2026-01-15T12:00:00.000Z'
