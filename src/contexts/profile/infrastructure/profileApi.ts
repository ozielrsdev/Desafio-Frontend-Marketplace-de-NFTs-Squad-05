import {
  profileSchema,
  type ChangePasswordRequestDto,
  type ProfileDto,
  type UpdateAvatarRequestDto,
  type UpdateProfileRequestDto,
} from '@/shared/contracts'
import { request, requestVoid } from '@/shared/http'
import { UserId } from '@/shared/ids'
import type { CollectorProfile } from '../domain/profile'

function toProfile(dto: ProfileDto): CollectorProfile {
  return { ...dto, id: UserId(dto.id), updatedAt: new Date(dto.updatedAt) }
}

export const profileApi = {
  async get(signal?: AbortSignal): Promise<CollectorProfile> {
    return toProfile(await request(profileSchema, { method: 'GET', url: '/profile', signal }))
  },
  async update(body: UpdateProfileRequestDto): Promise<CollectorProfile> {
    return toProfile(await request(profileSchema, { method: 'PATCH', url: '/profile', data: body }))
  },
  async updateAvatar(body: UpdateAvatarRequestDto): Promise<CollectorProfile> {
    return toProfile(await request(profileSchema, { method: 'PUT', url: '/profile/avatar', data: body }))
  },
  async changePassword(body: ChangePasswordRequestDto): Promise<void> {
    await requestVoid({ method: 'POST', url: '/profile/password', data: body })
  },
}

/** Lê o arquivo como data URL (upload simulado: o mock persiste a imagem localmente). */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}
