import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types/enums'

export interface SessionUser {
  id: string
  name: string
  company_id: string
  role: Role
}

/**
 * Extracts the Supabase access token from the request headers or cookies.
 *
 * @param req - Incoming request object
 * @returns The token string or null if not found
 */
export function extractToken(req: Request | NextRequest): string | null {
  // 1. Try Authorization header
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. Try Cookies via NextRequest helper
  if ('cookies' in req && typeof req.cookies.get === 'function') {
    const cookie = req.cookies.get('sb-access-token')
    if (cookie) return cookie.value
  }

  // 3. Try fallback cookie parsing for standard Request
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const parts = c.trim().split('=')
        return [parts[0], parts.slice(1).join('=')]
      })
    )
    if (cookies['sb-access-token']) {
      return decodeURIComponent(cookies['sb-access-token'])
    }
  }

  return null
}

/**
 * Retrieves the authenticated user session from the request.
 * Verifies the JWT and fetches the user's role and company information from the database.
 *
 * @param req - The incoming request
 * @returns The authenticated user's session data, or null if unauthenticated/invalid
 */
export async function getSessionUser(req: Request | NextRequest): Promise<SessionUser | null> {
  try {
    const token = extractToken(req)
    if (!token) return null

    const supabase = createAdminClient()
    
    // Verify token with Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authUser) {
      return null
    }

    // Fetch user details and join with roles table to get role name
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, name, company_id, active, roles(name)')
      .eq('id', authUser.id)
      .single()

    if (dbError || !dbUser || !dbUser.active) {
      return null
    }

    // Safely extract the role name from the relation
    let roleName: Role | null = null
    if (dbUser.roles) {
      if (Array.isArray(dbUser.roles)) {
        roleName = dbUser.roles[0]?.name as Role
      } else if (typeof dbUser.roles === 'object') {
        roleName = (dbUser.roles as { name: string }).name as Role
      }
    }

    if (!roleName) {
      return null
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      company_id: dbUser.company_id,
      role: roleName,
    }
  } catch (error) {
    console.error('[getSessionUser] Error authenticating session:', error)
    return null
  }
}
