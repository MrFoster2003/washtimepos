import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import type { Role } from '@/types/enums'

const roleRoutes: { prefix: string; roles: Role[] }[] = [
  { prefix: '/admin', roles: ['ADMIN'] as Role[] },
  { prefix: '/supervisor', roles: ['ADMIN', 'SUPERVISOR'] as Role[] },
  { prefix: '/cashier', roles: ['ADMIN', 'SUPERVISOR', 'CASHIER'] as Role[] },
  { prefix: '/employee', roles: ['ADMIN', 'SUPERVISOR', 'CASHIER', 'WASHER'] as Role[] },
]

const redirectMap: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  SUPERVISOR: '/supervisor/dashboard',
  CASHIER: '/cashier/pos',
  WASHER: '/employee/dashboard',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isApiRoute = pathname.startsWith('/api')

  // Public routes — always accessible
  if (pathname === '/login' || pathname === '/unauthorized') {
    if (user && pathname === '/login') {
      const redirectTo = await getDashboardRoute(supabase, user.id)
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return supabaseResponse
  }

  // Protected routes — require authentication
  if (!user) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized. Active session required.' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based protection
  const matchedRoute = roleRoutes.find(route => pathname.startsWith(route.prefix))
  if (!matchedRoute) {
    return supabaseResponse
  }

  const role = await getUserRole(supabase, user.id)
  if (!role) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (!matchedRoute.roles.includes(role)) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return supabaseResponse
}

async function getDashboardRoute(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<string> {
  const role = await getUserRole(supabase, userId)
  return redirectMap[role ?? ''] ?? '/unauthorized'
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<Role | null> {
  const { data: userData } = await supabase
    .from('users')
    .select('roles(name)')
    .eq('id', userId)
    .single()

  if (!userData?.roles) return null

  const roles = userData.roles as { name: string } | { name: string }[]
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles.name

  return roleName as Role ?? null
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
