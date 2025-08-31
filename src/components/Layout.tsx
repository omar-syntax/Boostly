import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Bell, Settings } from "lucide-react"
import { NotificationPanel } from "@/components/NotificationPanel"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [notificationOpen, setNotificationOpen] = useState(false)

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent" />
                <div className="gradient-hero bg-clip-text text-transparent">
                  <h1 className="text-xl font-bold">Boostly</h1>
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
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-motivation rounded-full animate-pulse-glow"></span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-gradient-to-br from-background to-surface">
            {children}
          </main>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationPanel 
        isOpen={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
    </SidebarProvider>
  )
}