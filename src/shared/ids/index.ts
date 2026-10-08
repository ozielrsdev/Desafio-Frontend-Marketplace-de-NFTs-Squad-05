/**
 * IDs tipados (branded) compartilhados entre contextos.
 * Contextos se comunicam por IDs, nunca por internos (AGENTS.md §3, regra 3).
 */
declare const brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [brand]: B }

export type UserId = Brand<string, 'UserId'>
export type NftId = Brand<string, 'NftId'>
export type EditionId = Brand<string, 'EditionId'>
export type OrderId = Brand<string, 'OrderId'>
export type WalletId = Brand<string, 'WalletId'>

export const UserId = (value: string) => value as UserId
export const NftId = (value: string) => value as NftId
export const EditionId = (value: string) => value as EditionId
export const OrderId = (value: string) => value as OrderId
export const WalletId = (value: string) => value as WalletId
