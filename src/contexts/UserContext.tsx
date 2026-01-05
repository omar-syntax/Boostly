import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { calculateLevel, getBadgeForLevel } from "@/utils/points"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

interface User {
  id: string
  name: string
  email: string
  initials: string
  level: number
  points: number
  badge: string
  streak: number
  tasksCompleted: number
  focusHours: number
  avatar: string
  profilePhoto?: string
  rank: number
  previousRank: number
  weeklyPoints: number
}

interface UserContextType {
  user: User | null
  updateUser: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  clearUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [user, setUser] = useState<User | null>(null)

  const fetchUser = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        // Map DB fields to User interface
        const initials = data.full_name
          ? data.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
          : "U"

        setUser({
          id: data.id,
          name: data.full_name || "User",
          email: data.email || email,
          initials,
          level: data.level,
          points: data.points,
          badge: getBadgeForLevel(data.level), // Calculate badge dynamically or store it? Sticking to calc for now
          streak: data.streak,
          tasksCompleted: data.tasks_completed,
          focusHours: data.focus_hours,
          avatar: data.avatar_url || "gradient-primary",
          profilePhoto: data.avatar_url, // Add profilePhoto field
          rank: data.rank,
          previousRank: data.rank, // You might want to track this separately in DB or logic
          weeklyPoints: data.weekly_points
        })
      }
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }, [])

  // Load user when session changes
  useEffect(() => {
    if (session?.user) {
      fetchUser(session.user.id, session.user.email!)

      // Realtime subscription
      const channel = supabase
        .channel('public:profiles')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`
        }, (payload) => {
          fetchUser(session.user.id, session.user.email!)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      setUser(null)
    }
  }, [session, fetchUser])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user || !session?.user) return

    try {
      // Update local state immediately
      setUser(prev => prev ? { ...prev, ...updates } : null)

      // Calculate new level/badge if points provided
      let dbUpdates: any = {}

      // Mapping frontend fields to DB fields
      if (updates.points !== undefined) dbUpdates.points = updates.points
      if (updates.streak !== undefined) dbUpdates.streak = updates.streak
      if (updates.tasksCompleted !== undefined) dbUpdates.tasks_completed = updates.tasksCompleted
      if (updates.focusHours !== undefined) dbUpdates.focus_hours = updates.focusHours
      if (updates.weeklyPoints !== undefined) dbUpdates.weekly_points = updates.weeklyPoints
      if (updates.name !== undefined) dbUpdates.full_name = updates.name
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar
      if (updates.profilePhoto !== undefined) {
        dbUpdates.avatar_url = updates.profilePhoto
        // Also update avatar field for consistency
        setUser(prev => prev ? { ...prev, avatar: updates.profilePhoto } : null)
      }

      // Handle Level Update Logic
      if (updates.points !== undefined) {
        const newLevel = calculateLevel(updates.points)
        dbUpdates.level = newLevel
      }

      // Only update database if there are changes
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id)

        if (error) {
          console.error('Error updating user:', error)
        }
      }
    } catch (error) {
      console.error('Error in updateUser:', error)
    }
  }, [user, session])

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUser(session.user.id, session.user.email!)
    }
  }

  const clearUser = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <UserContext.Provider value={{ user, updateUser, refreshUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
