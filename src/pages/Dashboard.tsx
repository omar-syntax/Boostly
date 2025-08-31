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

const weeklyData = [
  { name: 'Mon', tasks: 12, habits: 8, focus: 4 },
  { name: 'Tue', tasks: 15, habits: 9, focus: 6 },
  { name: 'Wed', tasks: 8, habits: 7, focus: 3 },
  { name: 'Thu', tasks: 18, habits: 10, focus: 8 },
  { name: 'Fri', tasks: 22, habits: 9, focus: 5 },
  { name: 'Sat', tasks: 16, habits: 11, focus: 7 },
  { name: 'Sun', tasks: 10, habits: 6, focus: 2 },
]

const pointsData = [
  { name: 'Week 1', points: 680 },
  { name: 'Week 2', points: 920 },
  { name: 'Week 3', points: 1200 },
  { name: 'Week 4', points: 1240 },
]

const categoryData = [
  { name: 'Tasks', value: 45, color: 'hsl(var(--success))' },
  { name: 'Habits', value: 30, color: 'hsl(var(--secondary))' },
  { name: 'Focus', value: 25, color: 'hsl(var(--warning))' },
]

export default function Dashboard() {
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="gradient-hero rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Good morning, Alex! 👋</h1>
              <p className="text-white/90 text-lg">{todayStr}</p>
              <p className="text-white/80 mt-2">Ready to boost your productivity today?</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">Current Streak</div>
              <div className="text-4xl font-bold">7</div>
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
              <div className="text-2xl font-bold">18</div>
              <div className="text-sm text-muted-foreground">Tasks Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card hover:shadow-medium transition-smooth">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <Target className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">5/7</div>
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
              <div className="text-2xl font-bold">4h</div>
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
              <div className="text-2xl font-bold">1,240</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Weekly Activity</h3>
              <p className="text-sm text-muted-foreground">Your productivity over the past week</p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              This Week
            </Button>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="tasks" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="habits" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="focus" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Points Progress */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Points Progress</h3>
            <p className="text-sm text-muted-foreground">Monthly point accumulation</p>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pointsData}>
              <Line type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-success">+28%</span>
            <span className="text-muted-foreground">from last month</span>
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

      {/* Achievement Banner */}
      <Card className="p-6 gradient-motivation text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Trophy className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">New Achievement Unlocked!</h3>
            <p className="text-white/90">You've completed 50 tasks this month. Keep up the great work!</p>
          </div>
          <Button variant="glass" size="lg">
            View Badge
          </Button>
        </div>
      </Card>
    </div>
  )
}