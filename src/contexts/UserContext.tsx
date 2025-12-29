import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { calculateLevel, getBadgeForLevel } from "@/utils/points"

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
  rank: number
  previousRank: number
  weeklyPoints: number
}

interface UserContextType {
  user: User | null
  updateUser: (updates: Partial<User>) => void
  loadUser: (userId: string) => void
  clearUser: () => void
}

const defaultUser: User = {
  id: "current",
  name: "John Doe",
  email: "john.doe@example.com",
  initials: "JD",
  level: 15,
  points: 1240,
  badge: "Rising Star",
  streak: 12,
  tasksCompleted: 89,
  focusHours: 45,
  avatar: "gradient-primary",
  rank: 5,
  previousRank: 6,
  weeklyPoints: 320,
}

const STORAGE_KEY_PREFIX = "boostly_user_"

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const loadUser = useCallback((userId: string) => {
    try {
      const userData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } else {
        // If user data doesn't exist, create default
        const users = JSON.parse(localStorage.getItem("boostly_users") || "[]")
        const userAccount = users.find((u: any) => u.id === userId)
        if (userAccount) {
          const initials = userAccount.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)

          const newUserData: User = {
            id: userId,
            name: userAccount.name,
            email: userAccount.email,
            initials,
            level: 1,
            points: 0,
            badge: "Newcomer",
            streak: 0,
            tasksCompleted: 0,
            focusHours: 0,
            avatar: "gradient-primary",
            rank: 999,
            previousRank: 999,
            weeklyPoints: 0,
          }
          setUser(newUserData)
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(newUserData))
        }
      }
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }, [])

  const clearUser = useCallback(() => {
    setUser(null)
  }, [])

  // Load user from localStorage on mount
  useEffect(() => {
    const authData = localStorage.getItem("boostly_auth")
    if (authData) {
      try {
        const auth = JSON.parse(authData)
        if (auth.isAuthenticated && auth.email) {
          // Find user by email
          const users = JSON.parse(localStorage.getItem("boostly_users") || "[]")
          const userAccount = users.find((u: any) => u.email === auth.email)
          if (userAccount) {
            loadUser(userAccount.id)
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
      }
    }
  }, [loadUser])

  // Listen for login/logout events
  useEffect(() => {
    const handleLogin = (event: CustomEvent) => {
      loadUser(event.detail.userId)
    }

    const handleLogout = () => {
      clearUser()
    }

    window.addEventListener("userLoggedIn", handleLogin as EventListener)
    window.addEventListener("userLoggedOut", handleLogout)

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin as EventListener)
      window.removeEventListener("userLoggedOut", handleLogout)
    }
  }, [loadUser, clearUser])

  const updateUser = (updates: Partial<User>) => {
    if (!user) return
    
    let updatedUser = { ...user, ...updates }
    
    // Recalculate level and badge if points changed
    if (updates.points !== undefined) {
      const newLevel = calculateLevel(updatedUser.points)
      updatedUser = {
        ...updatedUser,
        level: newLevel,
        badge: getBadgeForLevel(newLevel),
      }
    }
    
    setUser(updatedUser)
    
    // Save to localStorage
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(updatedUser))
    } catch (error) {
      console.error("Error saving user:", error)
    }
  }

  return (
    <UserContext.Provider value={{ user, updateUser, loadUser, clearUser }}>
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

// Helper function to get user ID from email
export function getUserIdFromEmail(email: string): string | null {
  try {
    const users = JSON.parse(localStorage.getItem("boostly_users") || "[]")
    const user = users.find((u: any) => u.email === email)
    return user ? user.id : null
  } catch {
    return null
  }
}

