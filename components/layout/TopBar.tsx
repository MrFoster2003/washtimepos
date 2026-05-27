'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types/enums'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MobileSidebar } from './Sidebar'

const roleBadgeVariant: Record<Role, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [Role.ADMIN]: 'default',
  [Role.SUPERVISOR]: 'secondary',
  [Role.CASHIER]: 'outline',
  [Role.WASHER]: 'outline',
}

export function TopBar() {
  const user = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4 lg:left-64">
      <MobileSidebar />

      <div className="flex flex-1 items-center gap-2">
        <span className="hidden font-semibold sm:inline">WashTime</span>
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <span className="text-sm text-muted-foreground">
          {user?.name ?? 'Not logged in'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <Badge variant={roleBadgeVariant[user.role]}>
            {user.role}
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  )
}
