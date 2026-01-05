import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  CheckCircle,
  Trophy,
  Target,
  X,
  Share2,
  MessageSquare,
  Heart
} from "lucide-react"
import { useNotifications, Notification } from "@/contexts/NotificationContext"
import { useNavigate } from "react-router-dom"

const typeIcons = {
  achievement: Trophy,
  reminder: Bell,
  social: Target,
  system: CheckCircle,
  comment: MessageSquare,
  like: Heart
}

const typeColors = {
  achievement: "text-warning",
  reminder: "text-primary",
  social: "text-secondary",
  system: "text-muted-foreground",
  comment: "text-primary",
  like: "text-destructive"
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const navigate = useNavigate()

  const handleCelebrate = (notification: Notification) => {
    // Navigate to community page with achievement data pre-filled
    const achievementType = notification.metadata?.achievementType
    const badgeName = notification.metadata?.badgeName
    const level = notification.metadata?.level

    let content = ""
    if (achievementType === "badge" && badgeName) {
      content = `🎉 Just earned the "${badgeName}" badge! Feeling proud and motivated to keep pushing forward! ${notification.message}`
    } else if (achievementType === "level" && level) {
      content = `🚀 Reached Level ${level}! So excited to continue this journey and see where it takes me! ${notification.message}`
    } else {
      content = `🎉 ${notification.title}! ${notification.message}`
    }

    // Store the achievement data for pre-filling the post
    sessionStorage.setItem("celebrate_achievement", JSON.stringify({
      type: "achievement",
      content,
      achievementTitle: badgeName || `Level ${level}`,
      achievementPoints: 0
    }))

    navigate("/community")
    markAsRead(notification.id)
    onClose()
  }

  const formatTimestamp = (date: any) => {
    if (!date) return "Just now"

    // Convert to Date if it's not already
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return "Recently"

    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute top-16 right-6 w-96">
        <Card className="glass-card border shadow-elegant">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="default" className="bg-motivation">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-[400px] w-full">
            <div className="p-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notification => {
                    const IconComponent = typeIcons[notification.type as keyof typeof typeIcons] || Bell
                    const colorClass = typeColors[notification.type as keyof typeof typeColors] || "text-primary"

                    return (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border transition-smooth hover:bg-accent/50 group ${!notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                          }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full bg-muted/50`}>
                            <IconComponent className={`h-4 w-4 ${colorClass}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>

                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-motivation rounded-full" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.createdAt)}
                              </span>

                              <div className="flex items-center gap-2">
                                {notification.type === "achievement" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCelebrate(notification)
                                    }}
                                  >
                                    <Share2 className="h-3 w-3 mr-1" />
                                    Celebrate
                                  </Button>
                                )}
                                {notification.action && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      notification.action?.onClick()
                                    }}
                                  >
                                    {notification.action.label}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}