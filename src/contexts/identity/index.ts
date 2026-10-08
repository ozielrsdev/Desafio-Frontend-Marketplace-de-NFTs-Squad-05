/** API pública do contexto Identity. Outros contextos importam apenas daqui. */
export type { Session, SessionUser } from './domain/session'
export { safeReturnTo } from './domain/returnTo'
export {
  getCurrentSession,
  getCurrentUserId,
  identityEvents,
  identityKeys,
  installSessionLifecycle,
  sessionQueryOptions,
} from './application/session'
export { useCurrentUserId, useLogin, useLogout, useRegister, useSession } from './application/hooks'
export { updateSessionUser } from './application/updateSessionUser'
export { redirectIfAuthenticated, requireAuth } from './presentation/guards'
export { LoginPage } from './presentation/LoginPage'
export { RegisterPage } from './presentation/RegisterPage'
export { UserMenu } from './presentation/UserMenu'
