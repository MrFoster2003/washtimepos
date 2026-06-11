'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Wrench,
  DollarSign,
  Percent,
  Package,
  Settings,
  Receipt,
  BarChart3,
  Cog,
  ShoppingCart,
  Clock,
  ClipboardList,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Role } from '@/types/enums'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
}

const navItems: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.SUPERVISOR, Role.CASHIER, Role.WASHER],
  },
  { href: '/admin/employees', label: 'Employees', icon: Users, roles: [Role.ADMIN, Role.SUPERVISOR] },
  { href: '/admin/services', label: 'Services', icon: Wrench, roles: [Role.ADMIN] },
  { href: '/admin/commissions', label: 'Commissions', icon: DollarSign, roles: [Role.ADMIN] },
  { href: '/supervisor/commissions', label: 'Commissions', icon: DollarSign, roles: [Role.SUPERVISOR] },
  { href: '/admin/promotions', label: 'Promotions', icon: Percent, roles: [Role.ADMIN] },
  { href: '/admin/inventory', label: 'Inventory', icon: Package, roles: [Role.ADMIN, Role.SUPERVISOR] },
  { href: '/admin/equipment', label: 'Equipment', icon: Settings, roles: [Role.ADMIN, Role.SUPERVISOR] },
  { href: '/admin/costs', label: 'Costs', icon: Receipt, roles: [Role.ADMIN, Role.SUPERVISOR] },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, roles: [Role.ADMIN, Role.SUPERVISOR] },
  { href: '/admin/config', label: 'Config', icon: Cog, roles: [Role.ADMIN] },
  { href: '/cashier/pos', label: 'POS', icon: ShoppingCart, roles: [Role.CASHIER] },
  { href: '/cashier/shift', label: 'Shift', icon: Clock, roles: [Role.CASHIER] },
  { href: '/cashier/attendance', label: 'Attendance', icon: Users, roles: [Role.CASHIER] },
  { href: '/cashier/sales', label: 'Sales', icon: ClipboardList, roles: [Role.CASHIER] },
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.WASHER] },
]

function NavLink({ item, mobile }: { item: NavItem; mobile?: boolean }) {
  const pathname = usePathname()
  const Icon = item.icon
  const isActive = pathname.startsWith(item.href)

  const link = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )

  if (mobile) {
    return <SheetClose asChild>{link}</SheetClose>
  }

  return link
}

function NavLinks({ mobile }: { mobile?: boolean }) {
  const user = useAuth()
  if (!user) return null

  const allowedItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <nav className="flex flex-col gap-1 px-3">
      {allowedItems.map((item) => (
        <NavLink key={item.href} item={item} mobile={mobile} />
      ))}
    </nav>
  )
}

function SidebarContent({ mobile }: { mobile?: boolean }) {
  return (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="px-6">
        <h1 className="text-lg font-bold tracking-tight">WashTime</h1>
      </div>
      <Separator />
      <NavLinks mobile={mobile} />
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-sidebar">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent mobile />
      </SheetContent>
    </Sheet>
  )
}
