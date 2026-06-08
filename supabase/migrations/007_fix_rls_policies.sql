-- Fix RLS policy issues found in migrations 005 and 006
-- This migration addresses:
-- 1. Projects table: Anyone can view projects allows unauthenticated access (security risk)
-- 2. work_records: Redundant "Leaders can update work_records weight" policy (already covered by existing policy)

-- Issue 1: Fix projects table SELECT policy to require authentication
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;

CREATE POLICY "Authenticated users can view projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Issue 2: Remove redundant work_records weight policy
-- The existing "Leaders can update any records" policy in migration 001 already grants full UPDATE access to leaders
DROP POLICY IF EXISTS "Leaders can update work_records weight" ON public.work_records;