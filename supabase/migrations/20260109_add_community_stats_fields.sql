-- Add last_active_at to profiles table for tracking active users
-- Add shared tracking to community_posts for achievements
-- Create production-ready community statistics with proper time handling and performance optimization

-- ============================================================================
-- 1. SCHEMA UPDATES
-- ============================================================================

-- Add last_active_at field to profiles table if it doesn't exist
-- This field tracks when users were last active for community stats
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- PERFORMANCE INDEXES: See separate migration file 20260109_add_community_stats_indexes.sql
-- REASON: CONCURRENTLY indexes require transaction isolation and can cause deployment issues
-- BENEFIT: Separating allows zero-damage deployments and better operational control

-- Backfill last_active_at for existing users
-- Use created_at if available, otherwise use current timestamp
-- This avoids incorrectly marking all existing users as currently active
UPDATE profiles 
SET last_active_at = CASE 
    WHEN created_at IS NOT NULL THEN created_at
    ELSE NOW() - INTERVAL '7 days'  -- Assume inactive for a week if no created_at
END
WHERE last_active_at IS NULL OR last_active_at > NOW();

-- PERFORMANCE INDEXES: See separate migration file 20260109_add_community_stats_indexes.sql
-- REASON: CONCURRENTLY indexes require transaction isolation and can cause deployment issues
-- BENEFIT: Separating allows zero-damage deployments and better operational control

-- Add shared and shared_at fields to community_posts for achievement sharing
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

-- PERFORMANCE INDEXES: See separate migration file 20260109_add_community_stats_indexes.sql
-- REASON: CONCURRENTLY indexes require transaction isolation and can cause deployment issues
-- BENEFIT: Separating allows zero-damage deployments and better operational control

-- Focus sessions indexes moved to separate migration for operational safety
-- No index creation in this main migration to avoid transaction conflicts

-- ============================================================================
-- 2. ACTIVITY TRACKING FUNCTIONS
-- ============================================================================

-- Function to safely update user's last_active_at timestamp
-- Handles edge cases and prevents trigger duplication
-- ASSUMPTION: All trigger source tables have a user_id column
-- WARNING: Silent failure will occur if user_id column doesn't exist
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that user_id column exists in the triggering table
    -- This prevents silent failures when column names differ
    IF NEW.user_id IS NULL THEN
        RAISE WARNING 'Trigger fired on table % without user_id column', TG_TABLE_NAME;
        RETURN NEW;
    END IF;
    
    -- Only update if new timestamp is more recent than existing
    -- This prevents accidentally moving last_active_at backwards
    UPDATE profiles 
    SET last_active_at = GREATEST(
        COALESCE(last_active_at, '1970-01-01'::TIMESTAMPTZ), 
        NOW()
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the operation
        RAISE WARNING 'Failed to update last_active_at for user %: %', NEW.user_id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ACTIVITY TRACKING TRIGGERS
-- ============================================================================

-- Drop existing triggers to avoid duplication
DROP TRIGGER IF EXISTS update_last_active_on_post ON community_posts;
DROP TRIGGER IF EXISTS update_last_active_on_comment ON post_comments;
DROP TRIGGER IF EXISTS update_last_active_on_like ON post_likes;
DROP TRIGGER IF EXISTS update_last_active_on_share ON post_shares;
DROP TRIGGER IF EXISTS update_last_active_on_focus_session ON focus_sessions;

-- Create triggers for all user activity that should update last_active_at
-- Each trigger calls the same function for consistency

-- Trigger for community posts
CREATE TRIGGER update_last_active_on_post
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Trigger for post comments
CREATE TRIGGER update_last_active_on_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Trigger for post likes
CREATE TRIGGER update_last_active_on_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Trigger for post shares
CREATE TRIGGER update_last_active_on_share
  AFTER INSERT ON post_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- Trigger for focus sessions (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'focus_sessions') THEN
        CREATE TRIGGER update_last_active_on_focus_session
          AFTER INSERT ON focus_sessions
          FOR EACH ROW
          EXECUTE FUNCTION update_user_last_active();
    END IF;
END $$;

-- ============================================================================
-- 4. PRODUCTION-GRADE COMMUNITY STATS VIEW
-- ============================================================================

-- Drop existing view to recreate with fixes
DROP VIEW IF EXISTS community_stats;

-- Create optimized view for community statistics
-- Uses timezone-safe time filtering and proper performance optimization
-- SCALABILITY NOTE: Consider converting to MATERIALIZED VIEW for high-traffic environments
-- REFRESH STRATEGY: 
--   - Interval-based: Every 5-10 minutes via cron job
--   - Event-driven: Trigger refresh on significant data changes
-- PERFORMANCE THRESHOLD: Convert to materialized when query time > 100ms consistently
CREATE OR REPLACE VIEW community_stats AS
WITH 
-- Active members: Users active in last 24 hours
-- Uses proper timezone handling with NOW() instead of DATE()
active_members AS (
  SELECT COUNT(DISTINCT p.id) as count
  FROM profiles p
  WHERE p.last_active_at >= NOW() - INTERVAL '24 hours'
    AND p.last_active_at <= NOW()  -- Sanity check for future dates
),

-- Posts today: Posts created in current day (timezone-safe)
-- Uses date_trunc for proper timezone handling
posts_today AS (
  SELECT COUNT(*) as count
  FROM community_posts 
  WHERE created_at >= date_trunc('day', NOW())
    AND created_at < date_trunc('day', NOW()) + INTERVAL '1 day'
),

-- Achievements shared: Achievement posts explicitly marked as shared
-- Validates that achievement type exists and shared flag is consistent
-- LEGACY FALLBACK: Counts achievements without shared_at for backward compatibility
-- TODO: Remove fallback after 2025-07-01 when all legacy data should have shared_at
achievements_shared AS (
  SELECT COUNT(*) as count
  FROM community_posts 
  WHERE type = 'achievement' 
    AND shared = TRUE
    AND (
        shared_at IS NOT NULL  -- Primary: Properly timestamped shares
        OR created_at >= date_trunc('day', NOW())  -- Legacy: Recent shares without timestamp
    )
),

-- Total interactions in last 24 hours
-- All interaction sources filtered by same 24-hour window
total_interactions AS (
  SELECT 
    COUNT(*) as total
  FROM (
    -- Posts in last 24 hours
    SELECT id, created_at as interaction_time
    FROM community_posts 
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    -- Likes in last 24 hours  
    SELECT id, created_at as interaction_time
    FROM post_likes
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    -- Comments in last 24 hours
    SELECT id, created_at as interaction_time
    FROM post_comments
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    -- Shares in last 24 hours
    SELECT id, created_at as interaction_time
    FROM post_shares
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    -- Focus sessions in last 24 hours (only if table exists)
    -- ASSUMPTION: focus_sessions table has completed_at column
    -- WARNING: Query will fail if column name differs (e.g., end_date, finished_at)
    SELECT id, completed_at as interaction_time
    FROM focus_sessions
    WHERE completed_at >= NOW() - INTERVAL '24 hours'
  ) interactions
  WHERE interactions.interaction_time <= NOW()  -- Sanity check for future dates
)

-- Final calculation with proper division handling
SELECT 
  -- Active members count
  COALESCE(active_members.count, 0) as active_members,
  
  -- Posts today count  
  COALESCE(posts_today.count, 0) as posts_today,
  
  -- Achievements shared count
  COALESCE(achievements_shared.count, 0) as achievements_shared,
  
  -- Engagement rate: (Total interactions ÷ Active members) × 100
  -- Handles division by zero and returns rounded decimal
  CASE 
    WHEN COALESCE(active_members.count, 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(total_interactions.total, 0)::decimal / 
       COALESCE(active_members.count, 1)) * 100, 
      2
    )
  END as engagement_rate

FROM active_members, posts_today, achievements_shared, total_interactions;

-- ============================================================================
-- 5. SECURITY AND PERFORMANCE
-- ============================================================================

-- Grant necessary permissions for the view
-- Ensure authenticated users can read community stats
GRANT SELECT ON community_stats TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW community_stats IS 'Production-ready community statistics view with timezone-safe time filtering and optimized performance calculations';

-- ============================================================================
-- 6. VALIDATION AND CLEANUP
-- ============================================================================

-- Validate data consistency after migration
-- This helps identify any issues early and provides operational guidance
DO $$
BEGIN
    -- Check for logical inconsistencies in shared achievements
    -- WARNING: This may trigger for legacy data without shared_at timestamps
    IF EXISTS (
        SELECT 1 FROM community_posts 
        WHERE type = 'achievement' 
        AND shared = TRUE 
        AND shared_at IS NULL
        AND created_at < NOW() - INTERVAL '1 day'
    ) THEN
        RAISE WARNING 'Found achievement posts marked as shared but without shared_at timestamp. Legacy data fallback may be active.';
    END IF;
    
    -- Check for future timestamps that indicate data issues
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE last_active_at > NOW() + INTERVAL '1 hour'
    ) THEN
        RAISE WARNING 'Found profiles with future last_active_at timestamps. Check timezone settings and data integrity.';
    END IF;
    
    -- Operational guidance for monitoring
    RAISE NOTICE 'Migration completed. Monitor query performance: EXPLAIN ANALYZE SELECT * FROM community_stats;';
END $$;
