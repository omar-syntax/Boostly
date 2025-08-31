import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageCircle, Trophy, Lightbulb, Video, Star } from "lucide-react"

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
  }
  achievement?: {
    title: string
    points: number
    icon: string
  }
}

const postTypes = [
  { value: "tip", label: "💡 Share a Tip", icon: Lightbulb },
  { value: "achievement", label: "🏆 Achievement", icon: Trophy }, 
  { value: "motivation", label: "✨ Motivation", icon: Star },
  { value: "video", label: "📹 Video", icon: Video }
]

interface CreatePostDialogProps {
  onPostCreated: (post: Post) => void
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    content: "",
    type: "tip" as "achievement" | "tip" | "motivation" | "video",
    videoUrl: "",
    achievementTitle: "",
    achievementPoints: ""
  })

  const resetForm = () => {
    setFormData({
      content: "",
      type: "tip",
      videoUrl: "",
      achievementTitle: "",
      achievementPoints: ""
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim()) {
      return
    }

    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: "You",
        initials: "YU",
        level: 15,
        badge: "Rising Star"
      },
      content: formData.content,
      type: formData.type,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false
    }

    // Add media for video posts
    if (formData.type === "video" && formData.videoUrl.trim()) {
      newPost.media = {
        type: "video",
        url: formData.videoUrl
      }
    }

    // Add achievement data
    if (formData.type === "achievement" && formData.achievementTitle.trim() && formData.achievementPoints) {
      newPost.achievement = {
        title: formData.achievementTitle,
        points: parseInt(formData.achievementPoints) || 0,
        icon: "🏆"
      }
    }

    onPostCreated(newPost)
    setOpen(false)
    resetForm()
  }

  const selectedType = postTypes.find(type => type.value === formData.type)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Create New Post
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={formData.type} onValueChange={(value: "achievement" | "tip" | "motivation" | "video") => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map(type => {
                  const IconComponent = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder={
                formData.type === "tip" ? "Share your productivity tip..." :
                formData.type === "achievement" ? "Tell us about your achievement..." :
                formData.type === "motivation" ? "Share some motivation..." :
                "Tell us about your video..."
              }
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={4}
              required
            />
          </div>

          {/* Video URL field for video posts */}
          {formData.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube Video URL</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtu.be/VIDEO_ID or https://www.youtube.com/watch?v=VIDEO_ID"
                value={formData.videoUrl}
                onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
              />
            </div>
          )}

          {/* Achievement fields for achievement posts */}
          {formData.type === "achievement" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="achievementTitle">Achievement Title</Label>
                <Input
                  id="achievementTitle"
                  placeholder="e.g., 30-Day Habit Streak"
                  value={formData.achievementTitle}
                  onChange={(e) => setFormData({...formData, achievementTitle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievementPoints">Points Earned</Label>
                <Input
                  id="achievementPoints"
                  type="number"
                  placeholder="100"
                  value={formData.achievementPoints}
                  onChange={(e) => setFormData({...formData, achievementPoints: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {selectedType && <selectedType.icon className="h-4 w-4 text-primary" />}
              <Badge variant="outline">{selectedType?.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formData.content || "Your post content will appear here..."}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-primary"
              disabled={!formData.content.trim()}
            >
              Share Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}