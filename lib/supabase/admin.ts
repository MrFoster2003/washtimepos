import { createClient } from '@supabase/supabase-js'

// WARNING: Never import this file outside of /app/api/
export const createAdminClient = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )