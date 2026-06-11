'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Role } from '@/types/enums'

const roleRedirect: Record<Role, string> = {
  [Role.ADMIN]: '/admin/dashboard',
  [Role.SUPERVISOR]: '/supervisor/dashboard',
  [Role.CASHIER]: '/cashier/pos',
  [Role.WASHER]: '/employee/dashboard',
}

export default function Home() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    } else {
      router.replace(roleRedirect[user.role])
    }
  }, [user, router])

  return null
}
