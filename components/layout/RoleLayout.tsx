'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import type { Role } from '@/types/enums'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface RoleLayoutProps {
  children: ReactNode
  allowedRoles: Role[]
}

export function RoleLayout({ children, allowedRoles }: RoleLayoutProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace('/unauthorized')
    }
  }, [user, allowedRoles, router])

  if (!user || !allowedRoles.includes(user.role)) return null

  return (
    <div>
      <TopBar />
      <Sidebar />
      <main className="min-h-screen pt-14 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
