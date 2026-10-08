import { useMutation, useQuery } from '@tanstack/react-query'
import type { LoginRequestDto, RegisterRequestDto } from '@/shared/contracts'
import type { AppError } from '@/shared/errors'
import type { UserId } from '@/shared/ids'
import type { Session } from '../domain/session'
import { identityApi } from '../infrastructure/identityApi'
import { endSession, sessionQueryOptions, startSession } from './session'

export function useSession() {
  const query = useQuery(sessionQueryOptions())
  const session = query.data ?? null
  return {
    session,
    user: session?.user ?? null,
    userId: (session?.user.id ?? null) as UserId | null,
    isAuthenticated: Boolean(session),
    isLoading: query.isPending,
    error: query.error,
  }
}

/** `userId` atual — use em query keys privadas: `['favorites', userId]`. */
export function useCurrentUserId(): UserId | null {
  return useSession().userId
}

export function useLogin() {
  return useMutation<Session, AppError, LoginRequestDto>({
    mutationKey: ['identity', 'login'],
    mutationFn: (body) => identityApi.login(body),
    onSuccess: (session) => startSession(session),
  })
}

export function useRegister() {
  return useMutation<Session, AppError, RegisterRequestDto>({
    mutationKey: ['identity', 'register'],
    mutationFn: (body) => identityApi.register(body),
    onSuccess: (session) => startSession(session),
  })
}

export function useLogout() {
  return useMutation<void, AppError, void>({
    mutationKey: ['identity', 'logout'],
    mutationFn: () => endSession('logout'),
  })
}
