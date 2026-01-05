-- Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'tip', 'motivation', 'video')),
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  media_url TEXT,
  achievement_title TEXT,
  achievement_points INTEGER,
  achievement_icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post Shares Table
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for posts with aggregated stats
CREATE OR REPLACE VIEW community_posts_with_stats AS
SELECT 
  p.*,
  COALESCE(l.like_count, 0) AS like_count,
  COALESCE(c.comment_count, 0) AS comment_count,
  COALESCE(s.share_count, 0) AS share_count
FROM community_posts p
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
) s ON p.id = s.post_id;

-- View for posts feed with user profile data
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

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Anyone can view posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments"
  ON post_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for post_shares
CREATE POLICY "Anyone can view shares"
  ON post_shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create shares"
  ON post_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
  ON post_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
