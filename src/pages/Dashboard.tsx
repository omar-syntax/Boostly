import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Timer, 
  CheckSquare,
  Star,
  Trophy,
  Zap,
  Calendar,
  ArrowRight
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Link } from "react-router-dom"
import { BadgeDialog } from "@/components/BadgeDialog"
import { useUser } from "@/contexts/UserContext"
import { getUserTasks, getUserHabits } from "@/utils/storage"

export default function Dashboard() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Load tasks and habits
  useEffect(() => {
    if (user?.id) {
      const userTasks = getUserTasks(user.id)
      const userHabits = getUserHabits(user.id)
      setTasks(userTasks)
      setHabits(userHabits)
    }
  }, [user?.id])

  // Get greeting based on time of day
  const hour = today.getHours()
  let greeting = "Good morning"
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17) {
    greeting = "Good evening"
  }

  // Get first name from user's full name
  const firstName = user?.name?.split(" ")[0] || "there"
  
  // Calculate real stats
  const tasksCompletedToday = tasks.filter(t => t.completed).length
  const habitsCompletedToday = habits.filter(h => h.completedToday).length
  const totalHabits = habits.length
  
  // Calculate category breakdown
  const taskPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.points || 0), 0)
  const habitPoints = habits.filter(h => h.completedToday).reduce((sum, h) => sum + (h.points || 0), 0)
  const totalPointsFromActivities = taskPoints + habitPoints
  
  const categoryData = totalPointsFromActivities > 0 ? [
    { name: 'Tasks', value: Math.round((taskPoints / totalPointsFromActivities) * 100), color: 'hsl(var(--success))' },
    { name: 'Habits', value: Math.round((habitPoints / totalPointsFromActivities) * 100), color: 'hsl(var(--secondary))' },
    { name: 'Focus', value: 0, color: 'hsl(var(--warning))' },
  ].filter(item => item.value > 0) : []
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="gradient-hero rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{greeting}, {firstName}! 👋</h1>
              <p className="text-white/90 text-lg">{todayStr}</p>
              <p className="text-white/80 mt-2">Ready to boost your productivity today?</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">Current Streak</div>
              <div className="text-4xl font-bold">{user?.streak || 0}</div>
              <div className="text-sm text-white/80">days</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
          <div className="text-8xl">🎯</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckSquare className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{tasksCompletedToday}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <Target className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalHabits > 0 ? `${habitsCompletedToday}/${totalHabits}` : '0'}</div>
              <div className="text-sm text-muted-foreground">Habits Done</div>
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
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-motivation/10">
              <Star className="h-6 w-6 text-motivation" />
            </div>
            <div>
              <div className="text-2xl font-bold">{user?.points?.toLocaleString() || 0}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Summary */}
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Activity Summary</h3>
            <p className="text-sm text-muted-foreground">Your productivity overview</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-success" />
                <span className="font-medium">Tasks Completed</span>
              </div>
              <span className="text-2xl font-bold">{tasksCompletedToday}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-secondary" />
                <span className="font-medium">Habits Completed</span>
              </div>
              <span className="text-2xl font-bold">{habitsCompletedToday}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-warning" />
                <span className="font-medium">Total Points</span>
              </div>
              <span className="text-2xl font-bold">{user.points.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Points Progress */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Level Progress</h3>
            <p className="text-sm text-muted-foreground">Level {user.level} - {user.badge}</p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{user.points}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">Level {user.level}</div>
              <div className="text-sm text-muted-foreground">{user.badge}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Breakdown */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Activity Breakdown</h3>
            <p className="text-sm text-muted-foreground">Where your points come from</p>
          </div>
          
          {categoryData.length > 0 ? (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Complete tasks and habits to see your activity breakdown</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Jump into your productivity tools</p>
          </div>

          <div className="space-y-3">
            <Link to="/tasks">
              <Button variant="outline" className="w-full justify-between group">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-4 w-4" />
                  <span>Add New Task</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link to="/focus">
              <Button variant="outline" className="w-full justify-between group">
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4" />
                  <span>Start Focus Session</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link to="/habits">
              <Button variant="outline" className="w-full justify-between group">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4" />
                  <span>Track Habits</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link to="/projects">
              <Button variant="gradient" className="w-full justify-between group mt-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4" />
                  <span>New Project</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Achievement Banner - Show only if user has achievements */}
      {user.tasksCompleted >= 10 && (
        <Card className="p-6 gradient-motivation text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Trophy className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Great Progress!</h3>
              <p className="text-white/90">You've completed {user.tasksCompleted} tasks. Keep up the great work!</p>
            </div>
            <BadgeDialog>
              <Button variant="glass" size="lg">
                View Badge
              </Button>
            </BadgeDialog>
          </div>
        </Card>
      )}
    </div>
  )
}