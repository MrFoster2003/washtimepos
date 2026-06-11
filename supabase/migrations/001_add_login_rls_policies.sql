-- ============================================================
-- Migration 001: Add RLS policies for login flow
-- ============================================================
-- Apply via: Supabase Dashboard → SQL Editor
-- Or: npx supabase db push (if linked)
-- ============================================================

-- Users table: each user can read their own record
CREATE POLICY "Users can read own record"
ON users FOR SELECT
USING (id = auth.uid());

-- Roles table: any authenticated user can read role names
CREATE POLICY "Authenticated users can read roles"
ON roles FOR SELECT
USING (true);
