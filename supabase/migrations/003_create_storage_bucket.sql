-- ============================================
-- WorkSure: Storage Bucket Setup
-- ============================================
-- Create profile-images bucket for user profile pictures
-- ============================================

-- Insert storage bucket (if it doesn't exist)
-- Note: This should be run in Supabase Dashboard or via Supabase CLI
-- SQL Editor doesn't support INSERT INTO storage.buckets directly
-- 
-- Use Supabase Dashboard: Storage > Create Bucket
-- Or use Supabase Management API

-- Bucket Configuration:
-- Name: profile-images
-- Public: true (for public read access)
-- File size limit: 5MB (configure in Dashboard)
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- Storage Policies (RLS for Storage)
-- ============================================

-- Policy 1: Public read access
-- Anyone can view profile images
CREATE POLICY "Public read access for profile images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'profile-images');

-- Policy 2: Authenticated users can upload
-- Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload profile images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 3: Users can update their own images
-- Users can update files in their own folder
CREATE POLICY "Users can update their own profile images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 4: Users can delete their own images
-- Users can delete files in their own folder
CREATE POLICY "Users can delete their own profile images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- Storage Bucket Setup Instructions
-- ============================================
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create Bucket"
-- 3. Configure:
--    - Name: profile-images
--    - Public bucket: YES
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp
-- 4. Save the bucket
-- 5. Run the policies above in SQL Editor
--
-- File path structure: {user_id}/profile.{ext}
-- Example: 123e4567-e89b-12d3-a456-426614174000/profile.jpg
