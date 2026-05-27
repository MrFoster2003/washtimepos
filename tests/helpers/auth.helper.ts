import { vi } from 'vitest'
import type { SessionUser } from '@/lib/auth'
import { Role } from '@/types/enums'

export function mockSession(user?: Partial<SessionUser>): SessionUser {
  return {
    id: 'user-1',
    name: 'Test User',
    role: Role.CASHIER,
    company_id: 'company-1',
    ...user,
  }
}

export function mockAuth(user: SessionUser | null = mockSession()) {
  const getSessionUser = vi.fn().mockResolvedValue(user)
  vi.mock('@/lib/auth', () => ({ getSessionUser }))
  return { getSessionUser }
}
