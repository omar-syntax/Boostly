import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { RewardsDialog } from "@/components/RewardsDialog"
import { 
  Trophy, 
  Medal, 
  Crown,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Target,
  Timer,
  CheckSquare,
  Calendar
} from "lucide-react"

interface LeaderboardEntry {
  id: string
  rank: number
  previousRank: number
  name: string
  initials: string
  points: number
  weeklyPoints: number
  level: number
  badge: string
  streak: number
  tasksCompleted: number
  focusHours: number
  avatar: string
}

const leaderboardData: LeaderboardEntry[] = [
  {
    id: "1",
    rank: 1,
    previousRank: 2,
    name: "Sarah Chen",
    initials: "SC", 
    points: 3420,
    weeklyPoints: 890,
    level: 25,
    badge: "Productivity Master",
    streak: 42,
    tasksCompleted: 156,
    focusHours: 89,
    avatar: "gradient-primary"
  },
  {
    id: "2", 
    rank: 2,
    previousRank: 1,
    name: "Mike Johnson",
    initials: "MJ",
    points: 3280,
    weeklyPoints: 760,
    level: 23,
    badge: "Focus Champion", 
    streak: 38,
    tasksCompleted: 142,
    focusHours: 95,
    avatar: "gradient-success"
  },
  {
    id: "3",
    rank: 3,
    previousRank: 4,
    name: "Emma Rodriguez",
    initials: "ER",
    points: 3150,
    weeklyPoints: 820,
    level: 24,
    badge: "Habit Builder",
    streak: 35,
    tasksCompleted: 138,
    focusHours: 76,
    avatar: "gradient-motivation"
  },
  {
    id: "4",
    rank: 4,
    previousRank: 3, 
    name: "Alex Kim",
    initials: "AK",
    points: 2890,
    weeklyPoints: 680,
    level: 21,
    badge: "Goal Crusher",
    streak: 28,
    tasksCompleted: 124,
    focusHours: 82,
    avatar: "gradient-secondary"
  },
  {
    id: "5",
    rank: 5,
    previousRank: 6,
    name: "Jordan Taylor", 
    initials: "JT",
    points: 2750,
    weeklyPoints: 740,
    level: 20,
    badge: "Rising Star",
    streak: 31,
    tasksCompleted: 119,
    focusHours: 67,
    avatar: "bg-warning"
  },
  {
    id: "current",
    rank: 12,
    previousRank: 15,
    name: "You",
    initials: "YO",
    points: 1240,
    weeklyPoints: 320,
    level: 12,
    badge: "Consistency Builder",
    streak: 7,
    tasksCompleted: 58,
    focusHours: 34,
    avatar: "gradient-hero"
  }
]

const timeframes = ["This Week", "This Month", "All Time"]
const categories = ["Overall", "Tasks", "Focus", "Habits", "Projects"]

export default function Leaderboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("This Week")
  const [selectedCategory, setSelectedCategory] = useState("Overall")

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Medal className="h-5 w-5 text-amber-600" />
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <TrendingUp className="h-4 w-4 text-success" />
    if (current > previous) return <TrendingDown className="h-4 w-4 text-destructive" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return "gradient-primary text-white"
    if (rank <= 10) return "bg-secondary text-secondary-foreground"
    return "bg-muted text-muted-foreground"
  }

  const topThree = leaderboardData.slice(0, 3)
  const otherRanks = leaderboardData.slice(3)
  const currentUser = leaderboardData.find(entry => entry.id === "current")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Compete with others and track your progress</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge className="gradient-hero text-white">
            <Star className="h-3 w-3 mr-1" />
            Your Rank: #{currentUser?.rank}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time:</span>
          {timeframes.map(timeframe => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Category:</span>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <Card className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🏆 Hall of Fame</h2>
          <p className="text-muted-foreground">Top performers this week</p>
        </div>

        <div className="flex items-end justify-center gap-8 mb-8">
          {/* 2nd Place */}
          <div className="text-center">
            <div className="relative mb-4">
              <Avatar className="w-16 h-16 mx-auto">
                <AvatarFallback className={topThree[1]?.avatar}>
                  {topThree[1]?.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2">
                <Medal className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-24 flex flex-col justify-end">
              <div className="font-semibold">{topThree[1]?.name}</div>
              <div className="text-sm text-muted-foreground">{topThree[1]?.points} pts</div>
            </div>
            <div className="text-lg font-bold mt-2">2nd</div>
          </div>

          {/* 1st Place */}
          <div className="text-center">
            <div className="relative mb-4">
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarFallback className={topThree[0]?.avatar}>
                  {topThree[0]?.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-3 -right-3">
                <Crown className="h-10 w-10 text-yellow-500" />
              </div>
            </div>
            <div className="gradient-primary text-white rounded-lg p-4 h-32 flex flex-col justify-end">
              <div className="font-bold text-lg">{topThree[0]?.name}</div>
              <div className="text-white/90">{topThree[0]?.points} pts</div>
            </div>
            <div className="text-xl font-bold mt-2">🥇 1st</div>
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="relative mb-4">
              <Avatar className="w-16 h-16 mx-auto">
                <AvatarFallback className={topThree[2]?.avatar}>
                  {topThree[2]?.initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2">
                <Medal className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 h-20 flex flex-col justify-end">
              <div className="font-semibold">{topThree[2]?.name}</div>
              <div className="text-sm text-muted-foreground">{topThree[2]?.points} pts</div>
            </div>
            <div className="text-lg font-bold mt-2">3rd</div>
          </div>
        </div>
      </Card>

      {/* Your Current Position */}
      {currentUser && (
        <Card className="p-6 border-2 border-primary/50 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadgeColor(currentUser.rank)}`}>
                #{currentUser.rank}
              </div>
              <Avatar className="w-12 h-12">
                <AvatarFallback className={currentUser.avatar}>
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">{currentUser.name}</span>
                <Badge variant="outline">{currentUser.badge}</Badge>
                {getTrendIcon(currentUser.rank, currentUser.previousRank)}
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-warning" />
                  <span>{currentUser.points} pts</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3 text-success" />
                  <span>{currentUser.tasksCompleted} tasks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3 text-primary" />
                  <span>{currentUser.focusHours}h focus</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-secondary" />
                  <span>{currentUser.streak} streak</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">+{currentUser.weeklyPoints}</div>
              <div className="text-sm text-muted-foreground">this week</div>
            </div>
          </div>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Full Rankings</h3>
          <p className="text-sm text-muted-foreground">Complete leaderboard for {selectedTimeframe.toLowerCase()}</p>
        </div>

        <div className="space-y-3">
          {leaderboardData.map(entry => (
            <div 
              key={entry.id} 
              className={`flex items-center gap-4 p-4 rounded-lg transition-smooth hover:bg-accent/50 ${
                entry.id === "current" ? "bg-primary/10 border border-primary/20" : ""
              }`}
            >
              {/* Rank */}
              <div className="flex items-center gap-2 w-16">
                {getRankIcon(entry.rank)}
                {getTrendIcon(entry.rank, entry.previousRank)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={entry.avatar}>
                    {entry.initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{entry.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Lv.{entry.level}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {entry.badge}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{entry.tasksCompleted}</div>
                  <div className="text-muted-foreground">Tasks</div>
                </div>
                
                <div className="text-center">
                  <div className="font-semibold">{entry.focusHours}h</div>
                  <div className="text-muted-foreground">Focus</div>
                </div>
                
                <div className="text-center">
                  <div className="font-semibold">{entry.streak}</div>
                  <div className="text-muted-foreground">Streak</div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-lg">{entry.points}</div>
                <div className="text-sm text-success">+{entry.weeklyPoints}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievement Showcase */}
      <Card className="p-6 gradient-motivation text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🚀 Climb the Ranks!</h3>
            <p className="text-white/90 mb-4">
              You're {currentUser && currentUser.rank > 10 ? 
                `${currentUser.points - (leaderboardData[9]?.points || 0)} points away from the top 10!` :
                `${currentUser && currentUser.points - (topThree[0]?.points || 0)} points away from the top spot!`
              }
            </p>
            <div className="w-64">
              <Progress 
                value={currentUser ? (currentUser.points / (topThree[0]?.points || 1)) * 100 : 0} 
                className="bg-white/20" 
              />
            </div>
          </div>
          
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2" />
            <RewardsDialog>
              <Button variant="glass">
                View Rewards
              </Button>
            </RewardsDialog>
          </div>
        </div>
      </Card>
    </div>
  )
}