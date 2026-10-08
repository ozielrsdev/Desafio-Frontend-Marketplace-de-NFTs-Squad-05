import { orderHandlers } from './orders'
import { pricingHandlers } from './pricing'
import { walletHandlers } from './wallets'

export const handlers = [...pricingHandlers, ...walletHandlers, ...orderHandlers]
