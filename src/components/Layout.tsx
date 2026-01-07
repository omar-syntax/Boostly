import { useState, useEffect } from "react"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Bell, Settings, Menu, User, LogOut, Sun, Moon } from "lucide-react"
import { NotificationPanel } from "@/components/NotificationPanel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/contexts/UserContext"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { useTheme } from "@/components/ThemeProvider"
import { useNavigate } from "react-router-dom"

interface LayoutProps {
  children: React.ReactNode
}

function LayoutContent({ children, notificationOpen, setNotificationOpen }: {
  children: React.ReactNode
  notificationOpen: boolean
  setNotificationOpen: (open: boolean) => void
}) {
  const { toggleSidebar } = useSidebar()
  const { user } = useUser()
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Track the actual applied theme
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement
      setIsDarkMode(root.classList.contains("dark"))
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [theme])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleTheme = () => {
    // Toggle to the opposite of current appearance
    setTheme(isDarkMode ? "light" : "dark")
  }

  // Show loading or fallback if user is not loaded
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hover:bg-accent"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <img src="/Boostly-logo.png" alt="Boostly" className="w-10 h-10 object-contain" />
                <div className="gradient-hero bg-clip-text text-transparent">
                  <h1 className="text-xl font-bold">Boostly</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-motivation rounded-full animate-pulse-glow"></span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {user.profilePhoto ? (
                        <AvatarImage src={user.profilePhoto} alt={user.name} />
                      ) : null}
                      <AvatarFallback className={user.avatar}>
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-background to-surface">
          {children}
        </main>
      </div>
    </div>
  )
}

export function Layout({ children }: LayoutProps) {
  const [notificationOpen, setNotificationOpen] = useState(false)

  return (
    <SidebarProvider>
      <LayoutContent
        children={children}
        notificationOpen={notificationOpen}
        setNotificationOpen={setNotificationOpen}
      />

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </SidebarProvider>
  )
}