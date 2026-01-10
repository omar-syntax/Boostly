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
  Star,
  Loader2
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"
import { useFocusStats } from "@/hooks/useFocusStats"
import { useState, useEffect } from "react"

interface FocusStatsDialogProps {
  children: React.ReactNode
}

export function FocusStatsDialog({ children }: FocusStatsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    totalSessions,
    totalHours,
    totalPoints,
    avgSessionLength,
    longestStreak,
    todaysSessions,
    weeklyData,
    monthlyTrend,
    sessionTypes,
    productivityTrend,
    weeklyGoalProgress,
    isLoading,
    refetch
  } = useFocusStats()

  useEffect(() => {
    if (isOpen) {
      refetch()
      const interval = setInterval(refetch, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isOpen, refetch])

  return (
    <Dialog onOpenChange={(isOpen) => setIsOpen(isOpen)}>
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
                <BarChart data={weeklyData}>
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
                  <Badge className={`text-white ${productivityTrend >= 0 ? 'bg-success' : 'bg-destructive'}`}>
                    {productivityTrend >= 0 ? '+' : ''}{productivityTrend}%
                  </Badge>
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
                  <button 
                    onClick={refetch}
                    className="ml-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-4 p-4 border border-border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Weekly Goal Progress</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">40 hours</span>
                    <span className="text-sm">{Math.round(weeklyGoalProgress)}%</span>
                  </div>
                  <Progress value={weeklyGoalProgress} />
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
        )}
      </DialogContent>
    </Dialog>
  )
}