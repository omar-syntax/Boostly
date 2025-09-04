import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  Timer, 
  Target, 
  TrendingUp, 
  Calendar,
  Clock,
  Zap,
  Star
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"

const weeklyFocusData = [
  { day: 'Mon', sessions: 4, minutes: 100, points: 200 },
  { day: 'Tue', sessions: 6, minutes: 150, points: 300 },
  { day: 'Wed', sessions: 3, minutes: 75, points: 150 },
  { day: 'Thu', sessions: 8, minutes: 200, points: 400 },
  { day: 'Fri', sessions: 5, minutes: 125, points: 250 },
  { day: 'Sat', sessions: 7, minutes: 175, points: 350 },
  { day: 'Sun', sessions: 2, minutes: 50, points: 100 },
]

const monthlyTrend = [
  { week: 'Week 1', hours: 8.5 },
  { week: 'Week 2', hours: 12.2 },
  { week: 'Week 3', hours: 15.8 },
  { week: 'Week 4', hours: 18.3 },
]

const sessionTypes = [
  { type: 'Pomodoro (25m)', count: 48, percentage: 65 },
  { type: 'Short Break (5m)', count: 20, percentage: 27 },
  { type: 'Long Break (15m)', count: 6, percentage: 8 },
]

interface FocusStatsDialogProps {
  children: React.ReactNode
}

export function FocusStatsDialog({ children }: FocusStatsDialogProps) {
  const totalSessions = 35
  const totalHours = 18.3
  const totalPoints = 1750
  const avgSessionLength = 25
  const longestStreak = 12
  const todaysSessions = 3

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            Focus Statistics
            <Badge variant="outline">This Month</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalHours}h</div>
                  <div className="text-sm text-muted-foreground">Focus Time</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{longestStreak}</div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-motivation/10">
                  <Star className="h-5 w-5 text-motivation" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Points Earned</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Daily Focus Activity</h3>
                <p className="text-sm text-muted-foreground">Sessions completed this week</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyFocusData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Monthly Trend */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Monthly Trend</h3>
                <p className="text-sm text-muted-foreground">Focus hours per week</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Breakdown */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Session Types</h3>
              <div className="space-y-4">
                {sessionTypes.map((session, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{session.type}</span>
                      <span className="font-medium">{session.count} sessions</span>
                    </div>
                    <Progress value={session.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Insights */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="text-sm">Productivity Trend</span>
                  </div>
                  <Badge className="bg-success text-white">+23%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-primary" />
                    <span className="text-sm">Avg Session Length</span>
                  </div>
                  <span className="font-semibold">{avgSessionLength}min</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-warning" />
                    <span className="text-sm">Today's Progress</span>
                  </div>
                  <span className="font-semibold">{todaysSessions}/8 sessions</span>
                </div>

                <div className="mt-4 p-4 border border-border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Weekly Goal Progress</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">40 hours</span>
                    <span className="text-sm">{Math.round((totalHours/40) * 100)}%</span>
                  </div>
                  <Progress value={(totalHours/40) * 100} />
                </div>
              </div>
            </Card>
          </div>

          {/* Achievement Section */}
          <Card className="p-6 gradient-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">🎯 Focus Mastery</h3>
                <p className="text-white/90">
                  You're in the top 15% of focused users this month! 
                  Keep up the excellent work to reach Focus Champion status.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">85%</div>
                <div className="text-sm opacity-90">to next level</div>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}