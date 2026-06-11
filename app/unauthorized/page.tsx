'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'

const roleRedirect: Record<Role, string> = {
  [Role.ADMIN]: '/admin/dashboard',
  [Role.SUPERVISOR]: '/supervisor/dashboard',
  [Role.CASHIER]: '/cashier/pos',
  [Role.WASHER]: '/employee/dashboard',
}

export default function UnauthorizedPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user, router])

  if (!user) return null

  const dashboardUrl = roleRedirect[user.role]

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <ShieldAlert className="size-12 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role (<strong>{user.role}</strong>) does not have permission to
          access this page. Contact your administrator if you believe this is a
          mistake.
        </p>
        <Button onClick={() => router.replace(dashboardUrl)}>
          Go to my dashboard
        </Button>
      </div>
    </div>
  )
}
