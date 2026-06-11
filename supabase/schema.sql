-- ============================================================
-- WashTimePOS — Database Schema
-- ============================================================
-- This file is the single source of truth for the database.
-- Run via: npx supabase db push
-- ============================================================

-- ============================================================
-- RLS Policies — Login & Authentication Flow
-- ============================================================

-- Users: each user can read their own record
-- Needed by login page to fetch profile after signInWithPassword()
CREATE POLICY "Users can read own record"
ON users FOR SELECT
USING (id = auth.uid());

-- Roles: any authenticated user can read role names
-- Needed by the roles!inner() join in the login query
CREATE POLICY "Authenticated users can read roles"
ON roles FOR SELECT
USING (true);
