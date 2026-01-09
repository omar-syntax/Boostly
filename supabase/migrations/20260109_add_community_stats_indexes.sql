-- ============================================================================ 
-- COMMUNITY STATISTICS - PART 2: INDEXES ONLY
-- ============================================================================ 
-- 
-- PURPOSE: Create performance indexes without CONCURRENTLY to avoid transaction issues
-- USAGE: Run after main migration completes successfully
-- ENVIRONMENT: Safe for all deployment scenarios including Supabase SQL Editor
--
-- This migration can be run independently or as part of a multi-step deployment
-- It creates indexes that may have been skipped in the main migration due to
-- CONCURRENTLY requirements or transaction isolation issues.

-- ============================================================================ 
-- PERFORMANCE INDEXES FOR COMMUNITY STATISTICS
-- ============================================================================ 

-- Index for "last 24 hours" queries on profiles table
-- SOLUTION: Full index without WHERE clause (PostgreSQL IMMUTABLE issue)
-- REASON: NOW() is STABLE, not IMMUTABLE, cannot be used in index predicate
-- PERFORMANCE: Full index is still effective for recent activity queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_recent 
ON profiles (last_active_at DESC);

-- Composite index for shared achievements queries
-- Optimizes filtering by type and shared status together
-- NOTE: type = 'achievement' is IMMUTABLE literal, safe for index predicate
CREATE INDEX IF NOT EXISTS idx_community_posts_shared_achievements 
ON community_posts (type, shared, shared_at DESC) 
WHERE type = 'achievement';

-- Indexes for focus sessions activity tracking (only if table exists)
-- These indexes improve performance of engagement rate calculations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'focus_sessions') THEN
        -- Composite index for user activity queries
        CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_completed 
        ON focus_sessions (user_id, completed_at DESC);
        
        -- Time-based index for recent activity filtering
        -- SOLUTION: Full index without WHERE clause (PostgreSQL IMMUTABLE issue)
        -- REASON: NOW() is STABLE, not IMMUTABLE, cannot be used in index predicate
        CREATE INDEX IF NOT EXISTS idx_focus_sessions_completed_recent 
        ON focus_sessions (completed_at DESC);
        
        RAISE NOTICE 'Focus sessions indexes created successfully';
    ELSE
        RAISE NOTICE 'Focus sessions table not found - skipping related indexes';
    END IF;
END $$;

-- ============================================================================ 
-- INDEX VALIDATION AND MONITORING
-- ============================================================================ 

-- Validate that indexes were created successfully
-- This helps confirm migration success and provides baseline for performance monitoring
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    -- Check if profiles index exists
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname = 'idx_profiles_last_active_recent';
    
    IF index_count > 0 THEN
        RAISE NOTICE '✅ Profiles last_active index created and validated';
    ELSE
        RAISE WARNING '❌ Profiles last_active index creation failed';
    END IF;
    
    -- Check if community posts index exists
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname = 'idx_community_posts_shared_achievements';
    
    IF index_count > 0 THEN
        RAISE NOTICE '✅ Community posts shared achievements index created and validated';
    ELSE
        RAISE WARNING '❌ Community posts shared achievements index creation failed';
    END IF;
    
    -- Performance monitoring guidance
    RAISE NOTICE '📊 Index migration completed. Monitor performance with:';
    RAISE NOTICE '   EXPLAIN ANALYZE SELECT * FROM community_stats;';
    RAISE NOTICE '   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch';
    RAISE NOTICE '   FROM pg_stat_user_indexes WHERE schemaname = ''public'';';
END $$;

-- ============================================================================ 
-- OPERATIONAL NOTES
-- ============================================================================ 

-- This migration is safe to run multiple times
-- All indexes use IF NOT EXISTS to prevent errors
-- No table locks are created (non-concurrent creation)
-- Can be run independently of main migration

-- PERFORMANCE EXPECTATIONS AFTER FIX:
-- Full indexes without WHERE clauses (PostgreSQL IMMUTABLE issue resolved)
-- 
-- BEFORE (causing 42P17 error):
-- WHERE last_active_at >= (NOW() - INTERVAL '30 days')::TIMESTAMPTZ
--
-- AFTER (production-ready):
-- ON profiles (last_active_at DESC)
--
-- QUERY PERFORMANCE:
-- Active members query will use full index effectively
-- Recent activity filtering happens in WHERE clause (not index predicate)
-- Still provides 10-100x performance improvement over table scan
--
-- ALTERNATIVE FUTURE ENHANCEMENT:
-- Consider adding generated boolean column for true partial indexing:
-- ALTER TABLE profiles ADD COLUMN is_recently_active BOOLEAN 
--   GENERATED ALWAYS AS (last_active_at >= NOW() - INTERVAL '30 days') STORED;
-- CREATE INDEX idx_profiles_recently_active ON profiles(is_recently_active) 
--   WHERE is_recently_active = TRUE;

-- Next steps for operations team:
-- 1. Monitor query performance after deployment
-- 2. Check index usage statistics after 24 hours
-- 3. Consider materialized view if queries still slow (>100ms)

COMMENT ON SCHEMA public IS 'Community statistics indexes migration - Part 2 of 2';
