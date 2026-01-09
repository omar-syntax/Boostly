-- Final comprehensive fix for comment likes RLS issues
-- Addresses REST API vs client library authentication differences

-- First, ensure RLS is enabled properly
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON comment_likes;
DROP POLICY IF EXISTS "Enable insert for own likes" ON comment_likes;
DROP POLICY IF EXISTS "Enable update for own likes" ON comment_likes;
DROP POLICY IF EXISTS "Enable delete for own likes" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can create their own comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

-- Create comprehensive policies that work with both REST API and client library
-- Policy 1: Allow authenticated users to read comment likes (with fallback for REST API)
CREATE POLICY "Allow authenticated read access" ON comment_likes
    FOR SELECT USING (
        (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL) OR
        (current_setting('request.jwt.claim.sub', true) IS NOT NULL)
    );

-- Policy 2: Allow users to insert their own likes
CREATE POLICY "Allow insert for own likes" ON comment_likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        current_setting('request.jwt.claim.sub', true) = user_id::text
    );

-- Policy 3: Allow users to delete their own likes
CREATE POLICY "Allow delete for own likes" ON comment_likes
    FOR DELETE USING (
        auth.uid() = user_id OR
        current_setting('request.jwt.claim.sub', true) = user_id::text
    );

-- Grant proper permissions (avoid conflicts with RLS)
GRANT SELECT, INSERT, DELETE ON comment_likes TO authenticated;

-- Add function to safely check if user liked a comment (bypasses RLS issues)
CREATE OR REPLACE FUNCTION user_liked_comment(comment_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user has liked the comment
    RETURN EXISTS (
        SELECT 1 FROM comment_likes 
        WHERE comment_id = comment_uuid 
        AND user_id = user_uuid
    );
END;
$$;

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION user_liked_comment TO authenticated;

-- Validate the fix
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'comment_likes'
    ) THEN
        -- Check if RLS is enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'comment_likes' AND rowsecurity = true
        ) THEN
            RAISE WARNING 'RLS not enabled on comment_likes table';
        END IF;
        
        -- Check if policies exist
        DECLARE policy_count INTEGER;
        SELECT COUNT(*) INTO policy_count 
        FROM pg_policies 
        WHERE tablename = 'comment_likes';
        
        IF policy_count < 3 THEN
            RAISE WARNING 'Not all RLS policies are applied. Found % policies', policy_count;
        ELSE
            RAISE NOTICE 'All comment likes RLS policies applied successfully';
        END IF;
        
        -- Check if function exists
        IF EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'user_liked_comment'
        ) THEN
            RAISE NOTICE 'user_liked_comment function created successfully';
        ELSE
            RAISE WARNING 'user_liked_comment function not found';
        END IF;
    ELSE
        RAISE EXCEPTION 'comment_likes table does not exist';
    END IF;
END $$;

-- Test the function with a safe query
DO $$
BEGIN
    -- Test the function exists and is callable
    DECLARE test_result BOOLEAN;
    
    BEGIN
        SELECT user_liked_comment('00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID) INTO test_result;
        RAISE NOTICE 'user_liked_comment function test executed successfully (result: %)', test_result;
    EXCEPTION
        WHEN OTHERS THEN
        RAISE WARNING 'Function test failed: %', SQLERRM;
    END;
END $$;
