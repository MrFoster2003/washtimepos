import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { Role } from '@/types/enums'

// Map protected route prefixes to their authorized roles
const routeMap = [
  { prefix: '/admin', roles: [Role.ADMIN] },
  { prefix: '/supervisor', roles: [Role.ADMIN, Role.SUPERVISOR] },
  { prefix: '/cashier', roles: [Role.ADMIN, Role.SUPERVISOR, Role.CASHIER] },
  { prefix: '/employee', roles: [Role.ADMIN, Role.SUPERVISOR, Role.CASHIER, Role.WASHER] },
]

/**
 * Next.js Middleware to intercept requests and enforce role-based access control.
 *
 * @param req - The incoming next request
 * @returns The appropriate redirect, JSON response, or next response
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Skip check for public pages, public assets, and public api paths
  if (
    pathname === '/login' ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') || // Allow authentication endpoints to be public
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // 2. Identify if the current route is protected and get allowed roles
  const matchedRoute = routeMap.find(route => pathname.startsWith(route.prefix))
  
  // If the path does not match any protected prefix, let it pass
  if (!matchedRoute) {
    return NextResponse.next()
  }

  const isApiRoute = pathname.startsWith('/api')

  // 3. Retrieve user session
  const user = await getSessionUser(req)

  // 4. Handle unauthenticated case (No session)
  if (!user) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized. Active session required.' },
        { status: 401 }
      )
    }
    // Redirect web page request to login
    const loginUrl = new URL('/login', req.url)
    // Add original URL as a redirect query param for post-login redirection
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Handle unauthorized case (Wrong role)
  if (!matchedRoute.roles.includes(user.role)) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      )
    }
    // Redirect web page request to unauthorized page
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // 6. User is authenticated and authorized, proceed
  return NextResponse.next()
}

// Configure paths that will trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
