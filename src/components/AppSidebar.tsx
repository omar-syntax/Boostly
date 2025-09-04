import { useState } from "react"
import { 
  BarChart3, 
  CheckSquare, 
  Target, 
  Timer, 
  FolderOpen, 
  Users, 
  Trophy,
  Zap,
  Star
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/", icon: BarChart3, color: "text-primary" },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, color: "text-success" },
  { title: "Habits", url: "/habits", icon: Target, color: "text-secondary" },
  { title: "Focus Room", url: "/focus", icon: Timer, color: "text-warning" },
  { title: "Projects", url: "/projects", icon: FolderOpen, color: "text-motivation" },
  { title: "Community", url: "/community", icon: Users, color: "text-primary" },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy, color: "text-warning" },
]

export function AppSidebar() {
  const { state, setOpen } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname

  const handleNavClick = () => {
    // Auto-close sidebar on navigation (especially useful on mobile)
    setOpen(false)
  }

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true
    if (path !== "/" && currentPath.startsWith(path)) return true
    return false
  }

  const getNavClassName = (path: string) => {
    const active = isActive(path)
    return active 
      ? "bg-primary/10 text-primary border-r-2 border-primary shadow-soft" 
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
  }

  return (
    <Sidebar className={`border-r border-border/50 ${collapsed ? "w-16" : "w-64"}`}>
      <SidebarContent className="bg-surface/50 backdrop-blur-sm">
        {/* Logo/Brand Section */}
        {!collapsed && (
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg gradient-hero bg-clip-text text-transparent">
                  Boostly
                </h2>
                <p className="text-xs text-muted-foreground">Level up your life</p>
              </div>
            </div>
          </div>
        )}

        {/* User Stats Mini Display */}
        {!collapsed && (
          <div className="p-4 mx-4 my-2 rounded-lg glass-card">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground">Points</span>
              </div>
              <span className="font-semibold text-warning">1,240</span>
            </div>
            <div className="mt-2 bg-muted rounded-full h-2">
              <div className="bg-gradient-motivation h-2 rounded-full w-3/4 animate-progress"></div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {collapsed ? "Menu" : "Productivity Hub"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`${getNavClassName(item.url)} transition-smooth hover:scale-[1.02] rounded-lg`}
                  >
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3"
                      onClick={handleNavClick}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? item.color : ""}`} />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom section with motivational quote */}
        {!collapsed && (
          <div className="mt-auto p-4 mx-4 mb-4 rounded-lg gradient-subtle border border-border/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground italic">
                "Progress, not perfection."
              </p>
              <div className="mt-2 text-xl">🚀</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}