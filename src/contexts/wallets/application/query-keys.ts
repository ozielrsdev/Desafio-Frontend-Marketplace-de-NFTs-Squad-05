export const walletKeys = {
  all: (userId: string) => ['wallets', userId] as const,
  list: (userId: string) => ['wallets', userId, 'list'] as const,
}
