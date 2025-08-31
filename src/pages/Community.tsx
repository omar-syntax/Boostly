import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreatePostDialog } from "@/components/CreatePostDialog"
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Plus,
  Video,
  BookOpen,
  Trophy,
  Target,
  Zap,
  Users,
  TrendingUp,
  Play
} from "lucide-react"

interface Post {
  id: string
  author: {
    name: string
    initials: string
    level: number
    badge: string
  }
  content: string
  type: "achievement" | "tip" | "motivation" | "video"
  timestamp: Date
  likes: number
  comments: number
  shares: number
  liked: boolean
  media?: {
    type: "image" | "video"
    url: string
    thumbnail?: string
  }
  achievement?: {
    title: string
    points: number
    icon: string
  }
}

const initialCommunityPosts: Post[] = [
  {
    id: "1",
    author: { name: "Sarah Chen", initials: "SC", level: 15, badge: "Habit Master" },
    content: "Just completed my 100th meditation session! 🧘‍♀️ The consistency has been life-changing. Who else is building a mindfulness practice?",
    type: "achievement",
    timestamp: new Date(Date.now() - 3600000),
    likes: 42,
    comments: 12,
    shares: 8,
    liked: false,
    achievement: {
      title: "Meditation Master",
      points: 500,
      icon: "🧘‍♀️"
    }
  },
  {
    id: "2",
    author: { name: "Mike Johnson", initials: "MJ", level: 12, badge: "Focus Champion" },
    content: "Pro tip: I use the 2-minute rule for building new habits. If it takes less than 2 minutes, do it immediately. If more, make it the first 2 minutes. Works every time! 💪",
    type: "tip",
    timestamp: new Date(Date.now() - 7200000),
    likes: 67,
    comments: 18,
    shares: 24,
    liked: true
  },
  {
    id: "3",
    author: { name: "Emma Rodriguez", initials: "ER", level: 18, badge: "Productivity Guru" },
    content: "New video: 'How I Built a Morning Routine That Changed My Life' 📹 Sharing my complete step-by-step process!",
    type: "video", 
    timestamp: new Date(Date.now() - 10800000),
    likes: 89,
    comments: 31,
    shares: 45,
    liked: false,
    media: {
      type: "video",
      url: "https://youtu.be/4pdeYkuJ-Zk?si=J6aWi1_pHbguLE6a"
    }
  },
  {
    id: "4",
    author: { name: "Alex Kim", initials: "AK", level: 8, badge: "Goal Getter" },
    content: "Remember: Progress over perfection. Every small step counts towards your bigger goals. You've got this! 🚀✨",
    type: "motivation",
    timestamp: new Date(Date.now() - 14400000),
    likes: 156,
    comments: 23,
    shares: 67,
    liked: true
  }
]

const trendingTopics = [
  { name: "Morning Routines", posts: 234, growth: "+12%" },
  { name: "Habit Stacking", posts: 189, growth: "+8%" },
  { name: "Focus Techniques", posts: 167, growth: "+15%" },
  { name: "Goal Setting", posts: 145, growth: "+5%" },
  { name: "Mindfulness", posts: 123, growth: "+18%" }
]

const topContributors = [
  { name: "Sarah Chen", points: 2450, posts: 67, badge: "🏆" },
  { name: "Mike Johnson", points: 2340, posts: 52, badge: "🥈" },
  { name: "Emma Rodriguez", points: 2280, posts: 48, badge: "🥉" },
  { name: "Alex Kim", points: 1890, posts: 41, badge: "⭐" }
]

export default function Community() {
  const [posts, setPosts] = useState<Post[]>(initialCommunityPosts)
  const [activeFilter, setActiveFilter] = useState("All")

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
  }

  const filters = ["All", "Achievement", "Tips", "Motivation", "Videos"]
  const filteredPosts = activeFilter === "All" 
    ? posts 
    : posts.filter(post => {
        switch(activeFilter.toLowerCase()) {
          case "achievement": return post.type === "achievement"
          case "tips": return post.type === "tip"
          case "motivation": return post.type === "motivation"
          case "videos": return post.type === "video"
          default: return true
        }
      })

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
              <div className="text-2xl font-bold">12.4k</div>
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
              <div className="text-2xl font-bold">1.2k</div>
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
              <div className="text-2xl font-bold">847</div>
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
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </div>
          </div>
        </Card>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Posts Feed */}
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className="p-6 hover:shadow-medium transition-smooth">
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar>
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
                          <span>{formatTimestamp(post.timestamp)}</span>
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
                        className={post.liked ? "text-red-500" : ""}
                        onClick={() => toggleLike(post.id)}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${post.liked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments}
                      </Button>
                      
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        {post.shares}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
            <div className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">#{topic.name}</div>
                    <div className="text-sm text-muted-foreground">{topic.posts} posts</div>
                  </div>
                  <Badge variant="outline" className="text-xs text-success">
                    {topic.growth}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Contributors */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xl">{contributor.badge}</div>
                  <div className="flex-1">
                    <div className="font-medium">{contributor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {contributor.points} points • {contributor.posts} posts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Educational Content */}
          <Card className="p-6 gradient-secondary text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold">Featured Guide</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Building Unbreakable Habits</h4>
                <p className="text-sm text-white/90 mb-4">
                  Learn the science-backed methods for creating lasting behavioral change.
                </p>
                <Button variant="glass" size="sm">
                  Read Guide
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}