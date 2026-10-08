/** Estado de conexão simulado. Efêmero: nunca persistido entre sessões. */
export type ConnectionState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected' }
  | { status: 'refused'; message: string }

export const DISCONNECTED: ConnectionState = { status: 'disconnected' }

export class ConnectionRefusedError extends Error {
  constructor(message = 'A conexão com a carteira foi recusada.') {
    super(message)
    this.name = 'ConnectionRefusedError'
  }
}

/** Erro de validação do servidor (422 por campo / 409 duplicidade). */
export class WalletValidationError extends Error {
  constructor(readonly fields: Partial<Record<'address' | 'network', string>>) {
    super('Dados da carteira inválidos')
    this.name = 'WalletValidationError'
  }
}
