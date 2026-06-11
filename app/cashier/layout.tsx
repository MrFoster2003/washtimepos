import type { ReactNode } from 'react'
import { RoleLayout } from '@/components/layout/RoleLayout'
import { Role } from '@/types/enums'

export default function CashierLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout allowedRoles={[Role.ADMIN, Role.SUPERVISOR, Role.CASHIER]}>
      {children}
    </RoleLayout>
  )
}
