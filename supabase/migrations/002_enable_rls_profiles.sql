-- ============================================
-- WorkSure: Row Level Security (RLS) Policies
-- ============================================
-- CRITICAL: Enable RLS to ensure users can only
-- access their own profile data
-- ============================================

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY 1: INSERT
-- ============================================
-- Users can only create their own profile
-- Must be authenticated and id must match auth.uid()
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICY 2: SELECT
-- ============================================
-- Users can only read their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- ============================================
-- POLICY 3: UPDATE
-- ============================================
-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICY 4: DELETE
-- ============================================
-- DELETE is disabled for security
-- Profiles are automatically deleted via CASCADE
-- when auth.users record is deleted
-- 
-- If you need admin delete capability, create a service role function
-- DO NOT allow users to delete their own profiles directly
