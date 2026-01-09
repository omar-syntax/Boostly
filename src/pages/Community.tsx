import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatePostDialog } from "@/components/CreatePostDialog"
import { useUser } from "@/contexts/UserContext"
import { useAuth } from "@/contexts/AuthContext"
import * as communityService from "@/services/community.service"
import type { CommunityPost, PostComment, CommunityStats } from "@/types/community.types"
import { supabase } from "@/lib/supabase"
import {
  Heart,
  MessageCircle,
  Share,
  Plus,
  Video,
  Trophy,
  Target,
  Zap,
  Users,
  TrendingUp,
  Play,
  Headphones,
  Filter,
  Loader2
} from "lucide-react"

interface Podcast {
  id: string
  title: string
  caption: string
  category: "Business" | "Religion" | "Productivity" | "Relationships"
  youtubeUrl: string
  thumbnail: string
  duration?: string
}

const podcastsData: Podcast[] = [
  {
    id: "1",
    title: "Distraction",
    caption: "How to overcome digital distractions and reclaim your focus in a hyperconnected world",
    category: "Productivity",
    youtubeUrl: "https://youtu.be/f0AHyAhNulc?si=3B5RYWltTa9ij_Eh",
    thumbnail: "https://img.youtube.com/vi/f0AHyAhNulc/maxresdefault.jpg",
    duration: "24:15"
  },
  {
    id: "2",
    title: "Building Wealth Through Faith",
    caption: "Biblical principles for financial stewardship and building generational wealth",
    category: "Religion",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "32:45"
  },
  {
    id: "3",
    title: "The Entrepreneur's Mindset",
    caption: "Essential mental frameworks for scaling your business and leading teams",
    category: "Business",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "18:30"
  },
  {
    id: "4",
    title: "Love in the Digital Age",
    caption: "Navigating modern relationships and building authentic connections",
    category: "Relationships",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: "27:20"
  }
]

export default function Community() {
  const { user } = useUser()
  const { session } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState("All")
  const [podcastFilter, setPodcastFilter] = useState("All")
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, PostComment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({})
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Load posts from database
  useEffect(() => {
    if (!user?.id) return

    const loadPosts = async () => {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await communityService.getPosts(user.id, 50, 0)

      if (fetchError) {
        console.error('Error loading posts:', fetchError)
        setError('Failed to load posts. Please try again.')
      } else if (data) {
        setPosts(data)
      }
      setLoading(false)
    }

    loadPosts()

    // Subscribe to new posts
    const channel = communityService.subscribeToPostUpdates(async (newPost) => {
      // Fetch the complete post data
      const { data } = await communityService.getPostById(newPost.id, user.id)
      if (data) {
        setPosts(prev => [data, ...prev])
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Load community statistics
  useEffect(() => {
    const loadCommunityStats = async () => {
      setStatsLoading(true)
      const { data, error } = await communityService.getCommunityStats()
      
      if (error) {
        console.error('Error loading community stats:', error)
      } else if (data) {
        setCommunityStats(data)
      }
      setStatsLoading(false)
    }

    loadCommunityStats()
    
    // Refresh stats every 5 minutes
    const interval = setInterval(loadCommunityStats, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Load comments when a post's comments are expanded
  useEffect(() => {
    expandedComments.forEach(async (postId) => {
      if (!comments[postId] && !loadingComments.has(postId)) {
        setLoadingComments(prev => new Set(prev).add(postId))
        const { data } = await communityService.getPostComments(postId)
        if (data) {
          setComments(prev => ({ ...prev, [postId]: data }))
          
          // Load comment likes for each comment using the new safe function
          const commentLikesPromises = data.map(async (comment) => {
            const { liked, error } = await communityService.getUserCommentLike(comment.id, user.id)
            if (error) {
              console.error('Error loading comment like:', error)
              return { commentId: comment.id, liked: false }
            }
            return { commentId: comment.id, liked }
          })
          
          const commentLikesResults = await Promise.all(commentLikesPromises)
          const newCommentLikes = commentLikesResults.reduce((acc, result) => {
            acc[result.commentId] = result.liked
            return acc
          }, {} as Record<string, boolean>)
          
          setCommentLikes(prev => ({ ...prev, ...newCommentLikes }))
        }
        
        setLoadingComments(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      }
    })
  }, [expandedComments])

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts(prev => [newPost, ...prev])
    setComments(prev => ({ ...prev, [newPost.id]: [] }))
  }

  const toggleLike = async (postId: string) => {
    if (!user?.id) return

    // Optimistic update
    setPosts(posts.map(post =>
      post.id === postId
        ? {
          ...post,
          userHasLiked: !post.userHasLiked,
          stats: {
            ...post.stats,
            likes: post.userHasLiked ? post.stats.likes - 1 : post.stats.likes + 1
          }
        }
        : post
    ))

    // Update database
    const { error } = await communityService.toggleLike(postId, user.id)

    if (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update
      setPosts(posts.map(post =>
        post.id === postId
          ? {
            ...post,
            userHasLiked: !post.userHasLiked,
            stats: {
              ...post.stats,
              likes: post.userHasLiked ? post.stats.likes + 1 : post.stats.likes - 1
            }
          }
          : post
      ))
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim()
    if (!commentText || !user?.id) return

    setCommentInputs(prev => ({ ...prev, [postId]: '' }))

    const { data: newComment, error } = await communityService.createComment(postId, user.id, commentText)

    if (error) {
      console.error('Error adding comment:', error)
      return
    }

    if (newComment) {
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }))

      // Update post comment count
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, stats: { ...post.stats, comments: post.stats.comments + 1 } }
          : post
      ))
    }
  }

  const toggleCommentLike = async (commentId: string) => {
    if (!user?.id) return

    const { liked, error } = await communityService.toggleCommentLike(commentId, user.id)
    
    if (error) {
      console.error('Error toggling comment like:', error)
      return
    }

    // Update local state to reflect the like/unlike
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: liked
    }))
  }

  const filters = ["All", "Achievement", "Tips", "Motivation", "Videos"]
  const filteredPosts = activeFilter === "All"
    ? posts
    : posts.filter(post => {
      switch (activeFilter.toLowerCase()) {
        case "achievement": return post.type === "achievement"
        case "tips": return post.type === "tip"
        case "motivation": return post.type === "motivation"
        case "videos": return post.type === "video"
        default: return true
      }
    })

  const podcastCategories = ["All", "Productivity", "Business", "Religion", "Relationships"]
  const filteredPodcasts = podcastFilter === "All"
    ? podcastsData
    : podcastsData.filter(podcast => podcast.category === podcastFilter)

  const getPostIcon = (type: string) => {
    switch (type) {
      case "achievement": return <Trophy className="h-4 w-4 text-warning" />
      case "tip": return <Target className="h-4 w-4 text-primary" />
      case "motivation": return <Zap className="h-4 w-4 text-motivation" />
      case "video": return <Video className="h-4 w-4 text-secondary" />
      default: return <MessageCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground">Connect, share, and get inspired by fellow productivity enthusiasts</p>
        </div>

        <CreatePostDialog onPostCreated={handlePostCreated} />
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  communityStats?.activeMembers.toLocaleString() || '0'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <MessageCircle className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  communityStats?.postsToday.toLocaleString() || '0'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Posts Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <Trophy className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  communityStats?.achievementsShared.toLocaleString() || '0'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Achievements Shared</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-motivation/10">
              <TrendingUp className="h-6 w-6 text-motivation" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${communityStats?.engagementRate || 0}%`
                )}
              </div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="podcasts" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            Podcasts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <div className="flex gap-2">
              {filters.map(filter => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Feed */}
            <div className="space-y-6">
              {/* Loading State */}
              {loading && (
                <Card className="p-12 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading posts...</p>
                </Card>
              )}

              {/* Error State */}
              {error && !loading && (
                <Card className="p-6 border-destructive/50 bg-destructive/5">
                  <p className="text-destructive">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </Card>
              )}

              {/* Empty State */}
              {!loading && !error && filteredPosts.length === 0 && (
                <Card className="p-12 flex flex-col items-center justify-center text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share something with the community!
                  </p>
                  <CreatePostDialog onPostCreated={handlePostCreated} />
                </Card>
              )}

              {/* Posts Feed */}
              {!loading && !error && filteredPosts.length > 0 && (
                <div className="space-y-4">
                  {filteredPosts.map(post => (
                    <Card key={post.id} className="p-6 hover:shadow-medium transition-smooth">
                      <div className="space-y-4">
                        {/* Post Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              {post.author.profilePhoto ? (
                                <AvatarImage src={post.author.profilePhoto} alt={post.author.name} />
                              ) : null}
                              <AvatarFallback className="gradient-primary text-white">
                                {post.author.initials}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{post.author.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Level {post.author.level}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-warning/10 text-warning">
                                  {post.author.badge}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getPostIcon(post.type)}
                                <span>{formatTimestamp(post.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Achievement Badge */}
                        {post.achievement && (
                          <div className="p-4 rounded-lg gradient-success text-white">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{post.achievement.icon}</div>
                              <div>
                                <div className="font-semibold">Achievement Unlocked!</div>
                                <div className="text-white/90">{post.achievement.title}</div>
                                <div className="text-sm text-white/80">+{post.achievement.points} points</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Post Content */}
                        <div className="text-foreground leading-relaxed">
                          {post.content}
                        </div>

                        {/* YouTube Video Player */}
                        {post.media?.type === "video" && post.media.url && (
                          <div className="rounded-lg overflow-hidden aspect-video">
                            {(() => {
                              const videoId = getYouTubeVideoId(post.media.url)
                              return videoId ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className="w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <p className="text-muted-foreground">Invalid video URL</p>
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        {/* Post Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={post.userHasLiked ? "text-red-500" : ""}
                              onClick={() => toggleLike(post.id)}
                            >
                              <Heart className={`h-4 w-4 mr-2 ${post.userHasLiked ? "fill-current" : ""}`} />
                              {post.stats.likes}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(post.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {comments[post.id]?.length || post.stats.comments}
                            </Button>

                            <Button variant="ghost" size="sm">
                              <Share className="h-4 w-4 mr-2" />
                              {post.stats.shares}
                            </Button>
                          </div>
                        </div>

                        {/* Comments Section */}
                        {expandedComments.has(post.id) && (
                          <div className="pt-4 border-t space-y-4">
                            <div className="font-semibold text-sm mb-3">
                              Comments ({comments[post.id]?.length || 0})
                            </div>

                            {/* Comments List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {comments[post.id]?.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8">
                                    {comment.author.profilePhoto ? (
                                      <AvatarImage src={comment.author.profilePhoto} alt={comment.author.name} />
                                    ) : null}
                                    <AvatarFallback className="gradient-primary text-white text-xs">
                                      {comment.author.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-muted rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">{comment.author.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTimestamp(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm">{comment.content}</p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className={`h-6 px-2 mt-1 ${commentLikes[comment.id] ? 'text-red-500' : ''}`}
                                      onClick={() => toggleCommentLike(comment.id)}
                                    >
                                      <Heart className={`h-3 w-3 mr-1 ${commentLikes[comment.id] ? 'fill-current' : ''}`} />
                                      <span className="text-xs">Like</span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {(!comments[post.id] || comments[post.id].length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No comments yet. Be the first to comment!
                                </p>
                              )}
                            </div>

                            {/* Add Comment */}
                            {user && (
                              <div className="flex gap-2 pt-2">
                                <Avatar className="h-8 w-8">
                                  {user.profilePhoto ? (
                                    <AvatarImage src={user.profilePhoto} alt={user.name} />
                                  ) : null}
                                  <AvatarFallback className="gradient-primary text-white text-xs">
                                    {user.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    placeholder="Write a comment..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleAddComment(post.id)
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddComment(post.id)}
                                    disabled={!commentInputs[post.id]?.trim()}
                                  >
                                    Post
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            </div>

        </TabsContent>

        <TabsContent value="podcasts" className="space-y-6">
          {/* Podcast Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Category:</span>
            </div>
            <div className="flex gap-2">
              {podcastCategories.map(category => (
                <Button
                  key={category}
                  variant={podcastFilter === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPodcastFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Podcasts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPodcasts.map(podcast => (
              <Card key={podcast.id} className="p-0 overflow-hidden hover:shadow-medium transition-smooth group">
                <div className="relative aspect-video">
                  <img
                    src={podcast.thumbnail}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                    <Button
                      size="lg"
                      className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                      onClick={() => window.open(podcast.youtubeUrl, '_blank')}
                    >
                      <Play className="h-6 w-6 text-white fill-white ml-1" />
                    </Button>
                  </div>
                  {podcast.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {podcast.duration}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {podcast.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{podcast.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{podcast.caption}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(podcast.youtubeUrl, '_blank')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}