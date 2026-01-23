-- ============================================
-- WorkSure: Profiles Table Migration
-- ============================================
-- This table stores user profile information
-- Created after email OTP verification
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    nid TEXT NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on nid for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nid ON public.profiles(nid);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comment to table
COMMENT ON TABLE public.profiles IS 'User profiles created after email OTP verification';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id - one profile per user';
COMMENT ON COLUMN public.profiles.nid IS 'National ID - must be unique';
COMMENT ON COLUMN public.profiles.profile_image_url IS 'Public URL from Supabase Storage bucket: profile-images';
