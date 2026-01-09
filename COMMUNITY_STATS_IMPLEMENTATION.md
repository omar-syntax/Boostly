# Community Statistics Implementation

## Overview

This implementation replaces the mock data in the community dashboard with real, database-driven statistics. The system calculates metrics from actual user activity and provides a production-ready solution for community engagement tracking.

## Features Implemented

### 1. Active Members
- **Definition**: Users who performed any meaningful action in the last 24 hours
- **Actions tracked**: Login, creating posts, commenting, liking, sharing, focus sessions
- **Implementation**: Uses `last_active_at` timestamp in profiles table
- **Auto-update**: Database triggers automatically update `last_active_at` on user actions

### 2. Posts Today
- **Definition**: Number of posts created during the current day
- **Time zone handling**: Uses `CURRENT_DATE` for proper time zone support
- **Implementation**: Direct count from `community_posts` table

### 3. Achievements Shared
- **Definition**: Number of achievements explicitly shared to the community
- **Implementation**: Counts achievement-type posts with `shared = true`
- **Tracking**: New `shared` and `shared_at` fields in `community_posts` table

### 4. Engagement Rate
- **Formula**: `(Total interactions ÷ Active Members) × 100`
- **Interactions included**: Posts, likes, comments, shares, focus sessions
- **Edge case handling**: Returns 0 when no active members exist
- **Calculation**: Performed in backend for accuracy

## Database Schema Changes

### New Fields Added

#### profiles table
```sql
last_active_at TIMESTAMPTZ DEFAULT NOW()
```
- Tracks when user was last active
- Indexed for performance
- Auto-updated by triggers

#### community_posts table
```sql
shared BOOLEAN DEFAULT FALSE,
shared_at TIMESTAMPTZ
```
- Tracks if achievement was explicitly shared
- Optional timestamp for sharing analytics
- Indexed for efficient queries

### Database Triggers

Automatic triggers update `last_active_at` when users:
- Create posts
- Add comments  
- Like posts
- Share posts
- Complete focus sessions

### Performance Indexes

- `idx_profiles_last_active_at` for fast active member queries
- `idx_community_posts_shared` for achievement sharing queries
- `idx_focus_sessions_*` for activity tracking

## API Implementation

### Service Function
```typescript
export async function getCommunityStats(): Promise<{ data: CommunityStats | null; error: any }>
```

### Response Format
```typescript
interface CommunityStats {
  activeMembers: number
  postsToday: number
  achievementsShared: number
  engagementRate: number
}
```

### Fallback Strategy
- Primary: Uses optimized `community_stats` database view
- Fallback: Manual calculation if view unavailable
- Error handling: Graceful degradation with logging

## Frontend Integration

### Component Updates
- Replaced hardcoded values in `Community.tsx`
- Added loading states with spinners
- Auto-refresh every 5 minutes
- Proper error handling and fallbacks

### User Experience
- Loading indicators during data fetch
- Real-time updates every 5 minutes
- Formatted numbers with locale support
- Percentage display for engagement rate

## Production Considerations

### Performance
- Database views for optimized queries
- Strategic indexing for fast lookups
- Efficient pagination for large datasets
- Caching through 5-minute refresh intervals

### Scalability
- Time-based partitioning ready (last_active_at)
- View-based calculations for query optimization
- Minimal database overhead through triggers
- Async operations to prevent blocking

### Edge Cases Handled
- Zero active users (engagement rate = 0%)
- Time zone differences (database-level date handling)
- Database view unavailability (fallback calculation)
- Network errors (graceful degradation)

### Security
- Row Level Security (RLS) policies maintained
- No additional privileged access required
- Safe trigger implementations
- Input validation in service functions

## Usage Instructions

### 1. Run Database Migration
```sql
-- Apply the migration file
\i supabase/migrations/20260109_add_community_stats_fields.sql
```

### 2. Deploy Frontend Changes
- The updated `Community.tsx` component is ready
- No additional configuration required
- Automatic data loading on component mount

### 3. Monitor Performance
- Check query performance on `community_stats` view
- Monitor trigger execution times
- Track API response times
- Watch for database connection limits

## Testing

### Manual Testing Steps
1. Create a test post → Verify active members count updates
2. Add a comment → Verify engagement rate changes
3. Like a post → Verify interaction tracking
4. Share an achievement → Verify achievement count
5. Wait 24 hours → Verify active member rollover

### Automated Testing
- Unit tests for service functions
- Integration tests for database operations
- Performance tests for view queries
- Load testing for concurrent users

## Future Enhancements

### Potential Improvements
1. **Historical Trends**: Track stats over time with time-series data
2. **Granular Time Windows**: Support different active periods (1h, 6h, 12h, 24h)
3. **Caching Layer**: Redis caching for high-traffic scenarios
4. **Real-time Updates**: WebSocket integration for live stats
5. **Advanced Metrics**: Sentiment analysis, topic trends, user growth

### Analytics Extensions
- Daily/weekly/monthly trend reports
- User segment analysis
- Content performance metrics
- Community health scoring

## Troubleshooting

### Common Issues
1. **Stats not updating**: Check if triggers are enabled
2. **Slow queries**: Verify indexes are properly created
3. **Incorrect counts**: Check time zone settings
4. **Permission errors**: Ensure RLS policies allow view access

### Debug Queries
```sql
-- Check active members calculation
SELECT COUNT(*) FROM profiles WHERE last_active_at >= NOW() - INTERVAL '24 hours';

-- Verify posts today count
SELECT COUNT(*) FROM community_posts WHERE DATE(created_at) = CURRENT_DATE;

-- Check achievement sharing
SELECT COUNT(*) FROM community_posts WHERE type = 'achievement' AND shared = true;
```

## Migration Notes

### Breaking Changes
- None - fully backward compatible
- Existing posts default to `shared = FALSE`
- Existing profiles get `last_active_at = NOW()`

### Rollback Plan
- Migration can be safely rolled back
- No data loss during rollback
- Frontend gracefully handles missing fields
