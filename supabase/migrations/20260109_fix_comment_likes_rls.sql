-- Fix comment likes RLS policies
-- This migration ensures proper RLS policies are applied to comment_likes table

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can create their own comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

-- Recreate RLS policies with proper syntax
-- Policy: Anyone can view comment likes
CREATE POLICY "Anyone can view comment likes"
ON comment_likes FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can create their own likes
CREATE POLICY "Users can create their own comment likes"
ON comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes  
CREATE POLICY "Users can delete their own comment likes"
ON comment_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Validate policies are applied
DO $$
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Anyone can view comment likes'
    ) THEN
        RAISE WARNING 'View policy for comment_likes not found';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Users can create their own comment likes'
    ) THEN
        RAISE WARNING 'Insert policy for comment_likes not found';
    END IF;
    
    RAISE NOTICE 'Comment likes RLS policies fixed successfully';
END $$;
