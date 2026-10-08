/** API pública do contexto Wallets. */
export { canPurchase, listWallets, WalletAddress } from './domain'
export type { Wallet, WalletSet, WalletRole } from './domain'
export {
  useWallets,
  useSaveWallet,
  useWalletConnection,
  walletKeys,
  WalletsDepsProvider,
  WalletConnectionProvider,
} from './application'
export { walletApi, walletConnector } from './infrastructure'
export { WalletsPage, WalletPicker, ConnectionControl, WalletAddressText } from './presentation'
