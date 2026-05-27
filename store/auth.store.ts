import { create } from 'zustand'
import type { Role } from '@/types/enums'

export interface SessionUser {
  id: string
  name: string
  role: Role
  company_id: string
}

interface AuthState {
  user: SessionUser | null
  setUser: (user: SessionUser) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
