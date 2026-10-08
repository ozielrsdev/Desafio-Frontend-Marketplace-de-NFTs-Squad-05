import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWalletDeps } from './deps'
import type { SaveWalletCommand } from './ports'
import { walletKeys } from './query-keys'

export function useWallets(userId: string) {
  const { gateway } = useWalletDeps()
  return useQuery({
    queryKey: walletKeys.list(userId),
    queryFn: ({ signal }) => gateway.list({ signal }),
  })
}

/** Cadastro/edição. Em sucesso o conjunto retornado vira o cache (persistência vem da API). */
export function useSaveWallet(userId: string) {
  const { gateway } = useWalletDeps()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (command: SaveWalletCommand) => gateway.save(command),
    onSuccess: (set) => queryClient.setQueryData(walletKeys.list(userId), set),
  })
}
