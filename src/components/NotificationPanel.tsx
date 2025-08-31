import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bell,
  CheckCircle,
  Star,
  Trophy,
  Target,
  X,
  MoreHorizontal
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "achievement" | "reminder" | "social" | "system"
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "🎉 Achievement Unlocked!",
    message: "You completed 5 tasks today! Keep up the great work.",
    type: "achievement",
    timestamp: new Date(Date.now() - 300000), // 5 mins ago
    read: false
  },
  {
    id: "2", 
    title: "⏰ Focus Session Reminder",
    message: "Time for your scheduled 25-minute focus session.",
    type: "reminder",
    timestamp: new Date(Date.now() - 900000), // 15 mins ago
    read: false
  },
  {
    id: "3",
    title: "🔥 Habit Streak!",
    message: "You've maintained your meditation habit for 7 days straight!",
    type: "achievement", 
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    read: true
  },
  {
    id: "4",
    title: "👥 Community Update",
    message: "Sarah liked your post about morning routines",
    type: "social",
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    read: true
  },
  {
    id: "5",
    title: "📊 Weekly Report Ready",
    message: "Your productivity report for this week is available",
    type: "system",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    read: true
  }
]

const typeIcons = {
  achievement: Trophy,
  reminder: Bell,
  social: Target,
  system: CheckCircle
}

const typeColors = {
  achievement: "text-warning",
  reminder: "text-primary", 
  social: "text-secondary",
  system: "text-muted-foreground"
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

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
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notification => {
                    const IconComponent = typeIcons[notification.type]
                    return (
                      <div 
                        key={notification.id}
                        className={`p-3 rounded-lg border transition-smooth hover:bg-accent/50 ${
                          !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full bg-muted/50`}>
                            <IconComponent className={`h-4 w-4 ${typeColors[notification.type]}`} />
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
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              
                              {notification.action && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={notification.action.onClick}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
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