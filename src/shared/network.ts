/** Redes suportadas. A taxa de rede depende da escolha (conforme contrato/Figma). */
export const NETWORKS = ['ethereum', 'polygon', 'arbitrum'] as const
export type Network = (typeof NETWORKS)[number]

export const NETWORK_LABEL: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
}
