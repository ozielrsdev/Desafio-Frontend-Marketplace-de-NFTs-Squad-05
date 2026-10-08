import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateSessionUser, useCurrentUserId } from '@/contexts/identity'
import type { AVATAR_MIME_TYPES, ChangePasswordRequestDto, UpdateProfileRequestDto } from '@/shared/contracts'
import type { AppError } from '@/shared/errors'
import type { UserId } from '@/shared/ids'
import type { CollectorProfile } from '../domain/profile'
import { profileApi, readFileAsDataUrl } from '../infrastructure/profileApi'

/** Query keys privadas sempre com `userId` (AGENTS.md §4). */
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: UserId | null) => [...profileKeys.all, userId] as const,
}

export const profileQueryOptions = (userId: UserId | null) =>
  queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: Boolean(userId),
  })

export function useProfile() {
  const userId = useCurrentUserId()
  return useQuery(profileQueryOptions(userId))
}

function useProfileCacheWriter() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  return (profile: CollectorProfile) => {
    queryClient.setQueryData(profileKeys.detail(userId), profile)
    updateSessionUser(queryClient, { name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl })
  }
}

export function useUpdateProfile() {
  const write = useProfileCacheWriter()
  return useMutation<CollectorProfile, AppError, UpdateProfileRequestDto>({
    mutationKey: ['profile', 'update'],
    mutationFn: (body) => profileApi.update(body),
    onSuccess: write,
  })
}

export function useUpdateAvatar() {
  const write = useProfileCacheWriter()
  return useMutation<CollectorProfile, AppError, File>({
    mutationKey: ['profile', 'avatar'],
    mutationFn: async (file) =>
      profileApi.updateAvatar({
        dataUrl: await readFileAsDataUrl(file),
        mimeType: file.type as (typeof AVATAR_MIME_TYPES)[number],
        size: file.size,
      }),
    onSuccess: write,
  })
}

export function useChangePassword() {
  return useMutation<void, AppError, ChangePasswordRequestDto>({
    mutationKey: ['profile', 'password'],
    mutationFn: (body) => profileApi.changePassword(body),
  })
}
