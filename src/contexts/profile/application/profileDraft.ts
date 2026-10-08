import { updateProfileRequestSchema, type UpdateProfileRequestDto } from '@/shared/contracts'
import type { UserId } from '@/shared/ids'
import { privateStorage } from '@/shared/storage'

/**
 * Rascunho do formulário de perfil por usuário: salvo quando a sessão expira com edição em curso,
 * restaurado após o novo login (docs/specs/profile.md, história 12). Logout limpa o storage privado.
 */
const KEY = 'profile-draft'

export const profileDraft = {
  save(userId: UserId, values: UpdateProfileRequestDto) {
    privateStorage(userId).set(KEY, values)
  },
  read(userId: UserId): Partial<UpdateProfileRequestDto> | null {
    const raw = privateStorage(userId).get<unknown>(KEY)
    const parsed = updateProfileRequestSchema.partial().safeParse(raw)
    return parsed.success && raw ? parsed.data : null
  },
  discard(userId: UserId) {
    privateStorage(userId).remove(KEY)
  },
}
