-- Enable RLS on table (safety check)
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own logs
-- (Might already exist, but IF NOT EXISTS isn't standard in generic policy creation without DO block, 
-- but we can safely ignore if duplicate errors or just focus on the missing DELETE one. 
-- For safety, we'll try to drop first to avoid conflicts if they exist with different names, 
-- or just rely on the user running this in SQL editor)

-- DROPPING existing policies to ensure clean state (Optional, but good for debugging)
DROP POLICY IF EXISTS "Users can view own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can insert own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can delete own habit logs" ON habit_logs;

-- 1. SELECT Policy
CREATE POLICY "Users can view own habit logs"
ON habit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT Policy
CREATE POLICY "Users can insert own habit logs"
ON habit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. DELETE Policy (The Missing Link)
CREATE POLICY "Users can delete own habit logs"
ON habit_logs
FOR DELETE
USING (auth.uid() = user_id);
