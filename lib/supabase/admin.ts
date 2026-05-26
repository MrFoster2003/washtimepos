import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// WARNING: Never import this file outside of /app/api/
// Doing so will leak the highly privileged service role key or bypass Row-Level Security on the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

/**
 * Creates a typed Supabase admin client for use ONLY in backend API routes (/app/api/*).
 * Bypasses Row-Level Security (RLS). Always manually filter queries by company_id.
 */
export const createAdminClient = () =>
  createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })