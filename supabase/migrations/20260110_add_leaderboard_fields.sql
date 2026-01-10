-- Add leaderboard fields to profiles table
-- This migration adds points, streak, and other stats needed for the leaderboard system

-- Add points and level fields if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS focus_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_rank INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_points ON profiles(weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level DESC);

-- Add comment explaining the new fields
COMMENT ON COLUMN profiles.points IS 'Total points accumulated by the user for leaderboard ranking';
COMMENT ON COLUMN profiles.weekly_points IS 'Points earned in the current week';
COMMENT ON COLUMN profiles.streak IS 'Current streak of consecutive days with activity';
COMMENT ON COLUMN profiles.tasks_completed IS 'Total number of tasks completed';
COMMENT ON COLUMN profiles.focus_hours IS 'Total focus hours accumulated';
COMMENT ON COLUMN profiles.previous_rank IS 'Previous rank for trend calculation';

-- Create a function to calculate weekly points
CREATE OR REPLACE FUNCTION calculate_weekly_points()
RETURNS TRIGGER AS $$
BEGIN
  -- This function should be called by triggers on task completion, focus sessions, etc.
  -- For now, it's a placeholder that can be extended
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a view for leaderboard rankings
DROP VIEW IF EXISTS leaderboard_view;
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.level,
  p.points,
  p.weekly_points,
  p.streak,
  p.tasks_completed,
  p.focus_hours,
  p.previous_rank,
  ROW_NUMBER() OVER (ORDER BY p.points DESC) as current_rank,
  p.created_at,
  p.last_active_at,
  -- Calculate rank change
  CASE 
    WHEN p.previous_rank = 0 THEN NULL -- New user
    WHEN ROW_NUMBER() OVER (ORDER BY p.points DESC) < p.previous_rank THEN 'up'
    WHEN ROW_NUMBER() OVER (ORDER BY p.points DESC) > p.previous_rank THEN 'down'
    ELSE 'same'
  END as rank_trend
FROM profiles p
WHERE p.full_name IS NOT NULL
ORDER BY p.points DESC;

-- Grant access to view
GRANT SELECT ON leaderboard_view TO authenticated;

-- Note: Views don't support RLS policies
-- Access control is handled by the underlying tables' RLS policies
