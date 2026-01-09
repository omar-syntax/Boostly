-- Comprehensive fix for comment likes RLS issues
-- This addresses multiple potential causes of 406 errors

-- First, ensure RLS is enabled properly
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can create their own comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

-- Create policies with explicit auth checks and proper syntax
-- Policy 1: Allow authenticated users to view comment likes
CREATE POLICY "Enable read access for authenticated users" ON comment_likes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to insert their own likes
CREATE POLICY "Enable insert for own likes" ON comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own likes (if needed)
CREATE POLICY "Enable update for own likes" ON comment_likes
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Allow users to delete their own likes
CREATE POLICY "Enable delete for own likes" ON comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON comment_likes TO authenticated;

-- Validate the fix
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
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
        
        IF policy_count < 4 THEN
            RAISE WARNING 'Not all RLS policies are applied. Found % policies', policy_count;
        ELSE
            RAISE NOTICE 'All comment likes RLS policies applied successfully';
        END IF;
    ELSE
        RAISE EXCEPTION 'comment_likes table does not exist';
    END IF;
END $$;

-- Test query to ensure it works
-- This should return 406 if RLS is working, or data if user is authenticated
DO $$
BEGIN
    -- Test a simple select that should work
    DECLARE test_result RECORD;
    
    BEGIN
        SELECT * INTO test_result 
        FROM comment_likes 
        LIMIT 1;
        
        RAISE NOTICE 'RLS test query executed successfully';
    EXCEPTION
        WHEN OTHERS THEN
        RAISE WARNING 'RLS test failed: %', SQLERRM;
    END;
END $$;
