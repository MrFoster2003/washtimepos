import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for browser client')
}

let client: SupabaseClient<Database> | null = null

/**
 * Creates a typed Supabase client for use in browser contexts (hooks, services).
 * Uses @supabase/ssr for proper cookie-based session handling in Next.js 15 App Router.
 * Uses a singleton pattern to avoid multiple GoTrueClient instances.
 */
export const createBrowserClient = () => {
  if (client) return client
  client = createSSRBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return client
}
