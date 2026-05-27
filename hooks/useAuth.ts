import { useAuthStore } from '@/store/auth.store'
import type { SessionUser } from '@/store/auth.store'

export function useAuth(): SessionUser | null {
  return useAuthStore((s) => s.user)
}
