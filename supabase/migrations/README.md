# Community Database Migration

This migration sets up the database tables for the community feature.

## Tables Created

1. **community_posts** - Stores all community posts
2. **post_comments** - Stores comments on posts
3. **post_likes** - Tracks which users liked which posts
4. **post_shares** - Tracks post shares

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://idndwnskpzqvjhxpgmmu.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `20260105_community_tables.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd d:\Boostly\web-app

# Link to your Supabase project (if not already linked)
supabase link --project-ref idndwnskpzqvjhxpgmmu

# Run the migration
supabase db push
```

## Verification

After running the migration, verify the tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these new tables:
   - `community_posts`
   - `post_comments`
   - `post_likes`
   - `post_shares`

3. Check that Row Level Security (RLS) is enabled on all tables
4. Verify the policies are in place by clicking on each table and viewing the **Policies** tab

## What's Next

After the migration is complete:

1. Start the development server: `npm run dev`
2. Navigate to the Community page
3. Try creating a post
4. Test commenting, liking, and sharing
5. Open the app in multiple browser windows to see real-time updates

## Rollback (if needed)

If you need to remove these tables:

```sql
DROP TABLE IF EXISTS post_shares CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP VIEW IF EXISTS community_posts_feed;
DROP VIEW IF EXISTS community_posts_with_stats;
```
