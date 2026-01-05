import { useState, useEffect } from "react"
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/contexts/UserContext"
import { ImageCropDialog } from "@/components/ImageCropDialog"
import * as storageService from "@/services/storage.service"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Star,
  Trophy,
  Target,
  Timer,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  Save,
  X,
  Calendar,
  Award,
  Zap,
  Camera,
  Upload,
  Loader2,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"

const weeklyStats = [
  { name: 'Mon', points: 120, tasks: 8 },
  { name: 'Tue', points: 150, tasks: 10 },
  { name: 'Wed', points: 90, tasks: 6 },
  { name: 'Thu', points: 180, tasks: 12 },
  { name: 'Fri', points: 220, tasks: 15 },
  { name: 'Sat', points: 160, tasks: 11 },
  { name: 'Sun', points: 100, tasks: 7 },
]

const recentAchievements = [
  { id: 1, title: "Task Master", description: "Completed 50 tasks", date: "2024-01-15", icon: CheckSquare },
  { id: 2, title: "Focus Champion", description: "10 hours of focus time", date: "2024-01-10", icon: Timer },
  { id: 3, title: "Habit Builder", description: "7-day streak", date: "2024-01-05", icon: Target },
]

export default function Profile() {
  const { user, updateUser } = useUser()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || "")
  const [editedEmail, setEditedEmail] = useState(user?.email || "")
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profilePhoto || null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Sync form fields when user data changes
  useEffect(() => {
    if (user) {
      setEditedName(user.name)
      setEditedEmail(user.email)
      setPhotoPreview(user.profilePhoto || null)
    }
  }, [user])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Read file and open crop dialog
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
      setCropDialogOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImage: Blob) => {
    if (!user?.id) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const { url, error } = await storageService.uploadProfilePhoto(
        user.id,
        croppedImage
      )

      if (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (url) {
        // Update user profile with new photo URL
        await updateUser({ avatar: url })
        setPhotoPreview(url)
        toast({
          title: "Success!",
          description: "Profile photo updated successfully",
        })
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!user?.id) return

    setUploading(true)
    try {
      // Delete from Supabase Storage
      await storageService.deleteProfilePhoto(user.id)

      // Update user profile
      await updateUser({ avatar: undefined })
      setPhotoPreview(null)

      toast({
        title: "Photo removed",
        description: "Profile photo has been removed",
      })
    } catch (error) {
      console.error('Error removing photo:', error)
      toast({
        title: "Error",
        description: "Failed to remove photo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    updateUser({
      name: editedName,
      email: editedEmail,
      initials: editedName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedName(user.name)
    setEditedEmail(user.email)
    setIsEditing(false)
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <TrendingUp className="h-4 w-4 text-success" />
    if (current > previous) return <TrendingDown className="h-4 w-4 text-destructive" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const pointsToNextLevel = user.level * 100 - user.points
  const levelProgress = ((user.points % 100) / 100) * 100

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-8 gradient-hero text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white/20">
                  {user.profilePhoto ? (
                    <AvatarImage src={user.profilePhoto} alt={user.name} />
                  ) : null}
                  <AvatarFallback className={`${user.avatar} text-2xl`}>
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-white/80 text-sm">Name</Label>
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white/80 text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="bg-white text-primary hover:bg-white/90">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} className="border-white/30 text-white hover:bg-white/10">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                    <div className="flex items-center gap-2 text-white/90">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                        Level {user.level}
                      </Badge>
                      <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                        {user.badge}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Profile Photo Upload Button - Always Visible */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-white/30 text-white hover:bg-white/10"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {user.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </Button>
              {user.profilePhoto && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="border-white/30 text-white hover:bg-white/10"
                  disabled={uploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/80">Progress to Level {user.level + 1}</span>
              <span className="text-sm font-semibold">{pointsToNextLevel} points needed</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
          <div className="text-9xl">👤</div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{user.points.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(user.rank, user.previousRank)}
                <span className="text-xs text-muted-foreground">
                  {user.weeklyPoints > 0 ? `+${user.weeklyPoints}` : user.weeklyPoints} this week
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckSquare className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{user.tasksCompleted}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Timer className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{user.focusHours}h</div>
              <div className="text-sm text-muted-foreground">Focus Hours</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-motivation/10">
              <Zap className="h-6 w-6 text-motivation" />
            </div>
            <div>
              <div className="text-2xl font-bold">{user.streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Weekly Activity</h3>
            <p className="text-sm text-muted-foreground">Your points and tasks this week</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasks" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Achievements */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Recent Achievements</h3>
            <p className="text-sm text-muted-foreground">Your latest accomplishments</p>
          </div>
          <div className="space-y-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <achievement.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(achievement.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Award className="h-5 w-5 text-warning" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leaderboard Position */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Leaderboard Position</h3>
            <p className="text-sm text-muted-foreground">Your ranking in the community</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/leaderboard")}>
            View Leaderboard
          </Button>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">#{user.rank}</div>
            <div className="text-sm text-muted-foreground">Current Rank</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">Rank Change</span>
              {getTrendIcon(user.rank, user.previousRank)}
              <span className="text-sm text-muted-foreground">
                {user.rank < user.previousRank
                  ? `Moved up ${user.previousRank - user.rank} position${user.previousRank - user.rank > 1 ? "s" : ""}`
                  : user.rank > user.previousRank
                    ? `Moved down ${user.rank - user.previousRank} position${user.rank - user.previousRank > 1 ? "s" : ""}`
                    : "No change"}
              </span>
            </div>
            <Progress value={(100 - user.rank) * 10} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Image Crop Dialog */}
      {selectedImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={() => {
            setCropDialogOpen(false)
            setSelectedImage(null)
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}

