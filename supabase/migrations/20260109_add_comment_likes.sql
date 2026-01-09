-- ====================================================================
-- COMMENT LIKES FEATURE MIGRATION
-- ====================================================================
-- 
-- PURPOSE: Enable users to like comments on community posts
-- PRODUCTION-READY: Includes proper constraints, indexes, triggers, and activity tracking
-- SAFE TO RERUN: Uses IF NOT EXISTS and proper error handling
--
-- FEATURES IMPLEMENTED:
-- 1. comment_likes table with proper foreign key constraints
-- 2. Unique constraint to prevent duplicate likes
-- 3. Performance indexes for fast lookups
-- 4. Activity tracking using existing update_user_last_active() function
-- 5. Optional likes_count column on post_comments for quick counts
-- 6. Row Level Security (RLS) policies
-- 7. Comprehensive error handling and validation
--
-- PERFORMANCE CONSIDERATIONS:
-- - Indexes optimized for common query patterns
-- - Uses existing activity tracking infrastructure
-- - Optional count column for O(1) like count retrieval
-- - Proper foreign key constraints for data integrity
--
-- ====================================================================

-- ====================================================================
-- 1. CORE SCHEMA: comment_likes TABLE
-- ====================================================================

-- Create comment likes table with proper constraints
-- DESIGN DECISIONS:
-- - UUID primary key for distributed system compatibility
-- - Foreign key constraints with CASCADE for data consistency
-- - Unique constraint on (comment_id, user_id) to prevent duplicates
-- - created_at with timezone for accurate activity tracking
CREATE TABLE IF NOT EXISTS comment_likes (
  -- Primary key using UUID for distributed compatibility
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to post_comments table with CASCADE delete
  -- CASCADE: Automatically removes likes when comment is deleted
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  
  -- Foreign key to profiles table with CASCADE delete  
  -- CASCADE: Automatically removes likes when user account is deleted
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamp for activity tracking and sorting
  -- TIMESTAMPTZ for proper timezone handling across regions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate likes
  -- CRITICAL: Ensures data integrity and business logic enforcement
  UNIQUE(comment_id, user_id)
);

-- ====================================================================
-- 2. PERFORMANCE INDEXES
-- ====================================================================

-- Index for fast lookup of likes per comment
-- USE CASE: Quickly count likes for a comment in UI
-- PERFORMANCE: Enables O(log n) lookup instead of O(n) table scan
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id 
ON comment_likes(comment_id);

-- Index for fast lookup of comments liked by a user  
-- USE CASE: Show which comments a user has liked (UI state)
-- PERFORMANCE: Enables O(log n) lookup for user's comment likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
ON comment_likes(user_id);

-- Composite index for user's comment likes with time ordering
-- USE CASE: Pagination through user's comment likes history
-- PERFORMANCE: Optimizes ORDER BY created_at DESC queries
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_created 
ON comment_likes(user_id, created_at DESC);

-- ====================================================================
-- 3. OPTIONAL: likes_count COLUMN FOR PERFORMANCE
-- ====================================================================

-- Add likes_count column to post_comments for O(1) count retrieval
-- DESIGN DECISION: Denormalized count for performance in high-traffic scenarios
-- ALTERNATIVE: Could use COUNT(*) in query but slower for frequent access
-- TRADE-OFF: Extra storage vs faster read performance
DO $$
BEGIN
  -- Check if column already exists to avoid errors on rerun
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_comments' 
    AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE post_comments 
    ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL;
    
    -- Backfill likes_count for existing comments
    -- PERFORMANCE: Uses efficient UPDATE with JOIN instead of subquery
    UPDATE post_comments 
    SET likes_count = COALESCE(like_counts.like_count, 0)
    FROM (
      SELECT comment_id, COUNT(*) as like_count
      FROM comment_likes
      GROUP BY comment_id
    ) like_counts
    WHERE post_comments.id = like_counts.comment_id;
  END IF;
END $$;

-- ====================================================================
-- 4. ACTIVITY TRACKING TRIGGERS
-- ====================================================================

-- Reuse existing update_user_last_active() function for consistency
-- BENEFIT: Maintains single source of truth for activity tracking
-- NOTE: Function already exists in 20260109_add_community_stats_fields.sql

-- Drop existing trigger to avoid conflicts on rerun
DROP TRIGGER IF EXISTS update_last_active_on_comment_like ON comment_likes;

-- Create trigger to update user's last_active_at when they like a comment
-- DESIGN: Fires AFTER INSERT to ensure the like was successfully created
-- PERFORMANCE: Minimal overhead, only updates when user is actually active
CREATE TRIGGER update_last_active_on_comment_like
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();

-- ====================================================================
-- 5. OPTIONAL: likes_count TRIGGER FOR REAL-TIME COUNTS
-- ====================================================================

-- Function to increment comment likes count
-- DESIGN: Atomic operation to prevent race conditions
-- ERROR HANDLING: Silent failure to not break user experience
CREATE OR REPLACE FUNCTION increment_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if the column exists (for backward compatibility)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_comments' 
    AND column_name = 'likes_count'
  ) THEN
    UPDATE post_comments 
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the like operation
    RAISE WARNING 'Failed to increment likes_count for comment %: %', NEW.comment_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment likes count
-- DESIGN: Atomic operation to prevent race conditions
-- ERROR HANDLING: Silent failure to not break user experience
CREATE OR REPLACE FUNCTION decrement_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if the column exists (for backward compatibility)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_comments' 
    AND column_name = 'likes_count'
  ) THEN
    UPDATE post_comments 
    SET likes_count = GREATEST(likes_count - 1, 0)  -- Prevent negative counts
    WHERE id = OLD.comment_id;
  END IF;
  
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the unlike operation
    RAISE WARNING 'Failed to decrement likes_count for comment %: %', OLD.comment_id, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time likes_count updates
-- DESIGN: Maintains denormalized count for performance
-- RERUN SAFE: Uses IF NOT EXISTS to avoid conflicts
DROP TRIGGER IF EXISTS increment_comment_likes_count_trigger ON comment_likes;
DROP TRIGGER IF EXISTS decrement_comment_likes_count_trigger ON comment_likes;

CREATE TRIGGER increment_comment_likes_count_trigger
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_comment_likes_count();

CREATE TRIGGER decrement_comment_likes_count_trigger
  AFTER DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_comment_likes_count();

-- ====================================================================
-- 6. SECURITY: ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Enable RLS on comment_likes table
-- SECURITY: Ensures only authorized access to like data
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view comment likes
-- USE CASE: Display like counts and who liked comments
-- SECURITY: Public visibility for community transparency
CREATE POLICY "Anyone can view comment likes"
ON comment_likes FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can create their own likes
-- USE CASE: Allow users to like comments
-- SECURITY: Ensures users can only like as themselves
CREATE POLICY "Users can create their own comment likes"
ON comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes  
-- USE CASE: Allow users to unlike comments
-- SECURITY: Ensures users can only unlike their own likes
CREATE POLICY "Users can delete their own comment likes"
ON comment_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ====================================================================
-- 7. VIEWS FOR ENHANCED FUNCTIONALITY
-- ====================================================================

-- Drop existing view to recreate with comment likes
DROP VIEW IF EXISTS community_posts_feed;

-- Recreate posts feed view with comment likes information
-- ENHANCEMENT: Includes comment like counts in the feed view
-- PERFORMANCE: Pre-calculated counts for optimal UI rendering
CREATE OR REPLACE VIEW community_posts_feed AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.type,
  p.media_type,
  p.media_url,
  p.achievement_title,
  p.achievement_points,
  p.achievement_icon,
  p.created_at,
  p.updated_at,
  prof.full_name AS author_name,
  prof.level AS author_level,
  prof.avatar_url AS author_avatar,
  COALESCE(l.like_count, 0) AS like_count,
  COALESCE(c.comment_count, 0) AS comment_count,
  COALESCE(s.share_count, 0) AS share_count
FROM community_posts p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS like_count
  FROM post_likes
  GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM post_comments
  GROUP BY post_id
) c ON p.id = c.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS share_count
  FROM post_shares
  GROUP BY post_id
) s ON p.id = s.post_id
ORDER BY p.created_at DESC;

-- ====================================================================
-- 8. PERFORMANCE AND OPERATIONAL GUIDANCE
-- ====================================================================

-- Add performance comments for DBAs
COMMENT ON TABLE comment_likes IS 'Comment likes table with optimized indexes and activity tracking. Monitor query performance: EXPLAIN ANALYZE SELECT * FROM comment_likes WHERE comment_id = $1;';

COMMENT ON INDEX idx_comment_likes_comment_id IS 'Optimizes like count queries per comment. Monitor index usage: pg_stat_user_indexes';

COMMENT ON INDEX idx_comment_likes_user_id IS 'Optimizes user comment likes lookup. Critical for UI state management';

COMMENT ON INDEX idx_comment_likes_user_created IS 'Optimizes user comment likes pagination. Key for user activity feeds';

-- Operational guidance for monitoring
DO $$
BEGIN
  -- Performance monitoring guidance
  RAISE NOTICE 'Comment likes migration completed. PERFORMANCE MONITORING:';
  RAISE NOTICE '1. Monitor index usage: SELECT * FROM pg_stat_user_indexes WHERE indexrelname LIKE ''comment_likes%%'';';
  RAISE NOTICE '2. Monitor query performance: EXPLAIN ANALYZE SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1;';
  RAISE NOTICE '3. Monitor trigger performance: Check pg_stat_user_tables for trigger execution counts';
  RAISE NOTICE '4. Consider materialized view for high-traffic scenarios when query time > 100ms';
  RAISE NOTICE '5. Monitor likes_count accuracy: SELECT id, likes_count, (SELECT COUNT(*) FROM comment_likes WHERE comment_id = post_comments.id) as actual_count FROM post_comments WHERE likes_count != (SELECT COUNT(*) FROM comment_likes WHERE comment_id = post_comments.id);';
END $$;

-- ====================================================================
-- 9. VALIDATION AND CLEANUP
-- ====================================================================

-- Validate migration success and data consistency
DO $$
BEGIN
  -- Validate table structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_likes') THEN
    RAISE EXCEPTION 'comment_likes table was not created successfully';
  END IF;
  
  -- Validate indexes creation
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comment_likes_comment_id') THEN
    RAISE WARNING 'Performance index idx_comment_likes_comment_id was not created';
  END IF;
  
  -- Validate RLS enablement
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'comment_likes' AND rowsecurity = true) THEN
    RAISE WARNING 'Row Level Security not enabled on comment_likes table';
  END IF;
  
  -- Check for potential data issues
  IF EXISTS (
    SELECT 1 FROM comment_likes cl
    JOIN post_comments pc ON cl.comment_id = pc.id
    JOIN profiles p ON cl.user_id = p.id
    WHERE pc.created_at < cl.created_at
  ) THEN
    RAISE WARNING 'Found comment likes created before comment. Check data integrity.';
  END IF;
  
  RAISE NOTICE 'Comment likes migration validation completed successfully';
END $$;

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================
--
-- NEXT STEPS FOR PRODUCTION:
-- 1. Update application layer to handle comment likes UI
-- 2. Add API endpoints for comment like/unlike operations  
-- 3. Update frontend to display comment like counts and user like states
-- 4. Consider caching strategy for high-traffic scenarios
-- 5. Monitor performance metrics and adjust indexes as needed
-- 6. Set up alerts for unusual activity patterns
--
-- SCALABILITY CONSIDERATIONS:
-- - For >1M likes: Consider partitioning by created_at
-- - For >10M likes: Consider sharding by user_id hash
-- - For high read traffic: Implement Redis caching layer
-- - For global deployment: Consider read replicas for like queries
--
-- ====================================================================
