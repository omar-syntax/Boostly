-- Test script to verify comment likes fix
-- Run this in Supabase SQL Editor after applying the migration

-- Test 1: Check if the function exists and works
SELECT user_liked_comment('00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID) as test_result;

-- Test 2: Check if RLS policies are applied correctly
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'comment_likes';

-- Test 3: Check if policies exist
SELECT policyname, tablename, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'comment_likes';

-- Test 4: Check if function has proper permissions
SELECT proname, prosecdef, prolang 
FROM pg_proc 
WHERE proname = 'user_liked_comment';

-- Test 5: Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'comment_likes' 
ORDER BY ordinal_position;
