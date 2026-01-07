import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import * as notificationService from "@/services/notification.service"
import { playNotificationSound, playLevelUpSound } from "@/utils/sounds"

export interface Notification {
  id: string
  title: string
  message: string
  type: "achievement" | "reminder" | "social" | "system" | "comment" | "like"
  createdAt: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: {
    achievementType?: "badge" | "level"
    badgeName?: string
    level?: number
    postId?: string
    commentId?: string
    actorId?: string
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Load notifications from database when user logs in
  useEffect(() => {
    if (!session?.user?.id) {
      setNotifications([])
      setLoading(false)
      return
    }

    const loadNotifications = async () => {
      setLoading(true)
      const { data, error } = await notificationService.getNotifications(session.user.id)

      if (error) {
        console.error('Error loading notifications:', error)
      } else if (data) {
        setNotifications(data)
      }
      setLoading(false)
    }

    loadNotifications()

    // Subscribe to real-time notifications
    const channel = notificationService.subscribeToNotifications(
      session.user.id,
      (newNotification) => {
        setNotifications(prev => {
          // Deduplicate
          if (prev.some(n => n.id === newNotification.id)) return prev
          return [newNotification, ...prev]
        })

        // Don't play generic sound for achievements as they have their own sound
        if (newNotification.type !== 'achievement') {
          playNotificationSound()
        }
      }
    )

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  const addNotification = useCallback(async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    if (!session?.user?.id) return

    // Create notification in database
    const { data, error } = await notificationService.createNotification({
      user_id: session?.user.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    })

    if (error) {
      console.error('Error creating notification:', error)
      return
    }

    if (data) {
      // Optimistically add to state (with dedupe check just in case)
      setNotifications(prev => {
        if (prev.some(n => n.id === data.id)) return prev
        return [data, ...prev]
      })
    }
  }, [session?.user?.id])

  // Listen for user level up and badge gained events
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      const { oldLevel, newLevel, newBadge } = event.detail

      playLevelUpSound()
      addNotification({
        title: "🎉 Level Up!",
        message: `Congratulations! You've reached Level ${newLevel}! Keep up the amazing work!`,
        type: "achievement",
        metadata: {
          achievementType: "level",
          level: newLevel,
        },
      })
    }

    const handleBadgeGained = (event: CustomEvent) => {
      const { oldBadge, newBadge, level } = event.detail

      // Only notify if it's a new badge (not the initial badge)
      if (oldBadge && oldBadge !== newBadge) {
        addNotification({
          title: "🏆 New Badge Earned!",
          message: `Congratulations! You've earned the "${newBadge}" badge! Your dedication is paying off!`,
          type: "achievement",
          metadata: {
            achievementType: "badge",
            badgeName: newBadge,
            level: level,
          },
        })
      }
    }

    window.addEventListener("userLevelUp", handleLevelUp as EventListener)
    window.addEventListener("userBadgeGained", handleBadgeGained as EventListener)

    return () => {
      window.removeEventListener("userLevelUp", handleLevelUp as EventListener)
      window.removeEventListener("userBadgeGained", handleBadgeGained as EventListener)
    }
  }, [addNotification])

  const markAsRead = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    // Optimistic update
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    )

    // Update database
    const { error } = await notificationService.markAsRead(id, session.user.id)

    if (error) {
      console.error('Error marking as read:', error)
      // Revert optimistic update
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: false } : notif))
      )
    }
  }, [session?.user?.id])

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return

    // Optimistic update
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))

    // Update database
    const { error } = await notificationService.markAllAsRead(session.user.id)

    if (error) {
      console.error('Error marking all as read:', error)
    }
  }, [session?.user?.id])

  const deleteNotification = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    // Optimistic update
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))

    // Delete from database
    const { error } = await notificationService.deleteNotification(id, session.user.id)

    if (error) {
      console.error('Error deleting notification:', error)
    }
  }, [session?.user?.id])

  const clearAll = useCallback(async () => {
    if (!session?.user?.id) return

    // Optimistic update
    setNotifications([])

    // Clear from database
    const { error } = await notificationService.clearAllNotifications(session.user.id)

    if (error) {
      console.error('Error clearing notifications:', error)
    }
  }, [session?.user?.id])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

