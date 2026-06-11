'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
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
  const setUser = useAuthStore((s) => s.setUser)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    if (user) {
      if (!allowedRoles.includes(user.role)) {
        router.replace('/unauthorized')
      }
      return
    }

    let cancelled = false
    setIsRestoring(true)

    async function restore() {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session?.user) {
        setIsRestoring(false)
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id, name, company_id, roles!inner(name)')
        .eq('id', session.user.id)
        .single()

      if (cancelled) return

      if (profile) {
        let roleName: Role | null = null
        if (profile.roles) {
          if (Array.isArray(profile.roles)) {
            roleName = profile.roles[0]?.name as Role
          } else if (typeof profile.roles === 'object') {
            roleName = (profile.roles as { name: string }).name as Role
          }
        }

        if (roleName && allowedRoles.includes(roleName)) {
          setUser({
            id: profile.id,
            name: profile.name,
            role: roleName,
            company_id: profile.company_id,
          })
        } else {
          router.replace('/unauthorized')
        }
      } else {
        router.replace('/unauthorized')
      }

      setIsRestoring(false)
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [user, allowedRoles, router, setUser])

  if (!user || !allowedRoles.includes(user.role)) {
    if (isRestoring) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return null
  }

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
