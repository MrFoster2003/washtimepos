import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for browser client')
}

/**
 * Creates a typed Supabase client for use in browser contexts (hooks, services).
 * Authenticated calls inherit the active user session JWT, enforcing RLS policies.
 */
export const createBrowserClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey)