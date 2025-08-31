import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Target, 
  Star, 
  Plus,
  Calendar,
  Flame,
  CheckCircle,
  Circle,
  TrendingUp
} from "lucide-react"

interface Habit {
  id: string
  title: string
  description: string
  streak: number
  bestStreak: number
  completedToday: boolean
  weeklyTarget: number
  weeklyProgress: number
  points: number
  category: string
  color: string
}

const initialHabits: Habit[] = [
  {
    id: "1",
    title: "Morning Meditation",
    description: "10 minutes of mindfulness meditation",
    streak: 7,
    bestStreak: 12,
    completedToday: true,
    weeklyTarget: 7,
    weeklyProgress: 5,
    points: 25,
    category: "Mindfulness",
    color: "bg-secondary"
  },
  {
    id: "2",
    title: "Read for 30 minutes",
    description: "Read personal development or fiction",
    streak: 4,
    bestStreak: 8,
    completedToday: false,
    weeklyTarget: 5,
    weeklyProgress: 3,
    points: 30,
    category: "Learning",
    color: "bg-primary"
  },
  {
    id: "3",
    title: "Drink 8 glasses of water",
    description: "Stay hydrated throughout the day",
    streak: 12,
    bestStreak: 15,
    completedToday: true,
    weeklyTarget: 7,
    weeklyProgress: 6,
    points: 15,
    category: "Health",
    color: "bg-success"
  },
  {
    id: "4",
    title: "Exercise",
    description: "30 minutes of physical activity",
    streak: 0,
    bestStreak: 21,
    completedToday: false,
    weeklyTarget: 5,
    weeklyProgress: 2,
    points: 40,
    category: "Fitness",
    color: "bg-warning"
  }
]

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)

  const toggleHabit = (id: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const newCompletedToday = !habit.completedToday
        return {
          ...habit,
          completedToday: newCompletedToday,
          streak: newCompletedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1),
          weeklyProgress: newCompletedToday ? 
            Math.min(habit.weeklyTarget, habit.weeklyProgress + 1) : 
            Math.max(0, habit.weeklyProgress - 1)
        }
      }
      return habit
    }))
  }

  const completedToday = habits.filter(h => h.completedToday).length
  const totalPoints = habits.filter(h => h.completedToday).reduce((sum, h) => sum + h.points, 0)
  const averageStreak = habits.reduce((sum, h) => sum + h.streak, 0) / habits.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground">Build consistent habits for lasting success</p>
        </div>
        
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Habit
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedToday}/{habits.length}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Flame className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(averageStreak)}</div>
              <div className="text-sm text-muted-foreground">Avg Streak</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-motivation/10">
              <Star className="h-6 w-6 text-motivation" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Points Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">85%</div>
              <div className="text-sm text-muted-foreground">Weekly Success</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Progress */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Today's Progress</h3>
          <div className="flex items-center gap-4">
            <Progress value={(completedToday / habits.length) * 100} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {completedToday} of {habits.length} habits completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="text-center">
              <Button
                variant={habit.completedToday ? "default" : "outline"}
                size="icon"
                className={`w-16 h-16 rounded-full mb-3 ${habit.completedToday ? habit.color : ''} transition-bounce`}
                onClick={() => toggleHabit(habit.id)}
              >
                {habit.completedToday ? 
                  <CheckCircle className="h-8 w-8" /> : 
                  <Circle className="h-8 w-8" />
                }
              </Button>
              <p className="text-sm font-medium">{habit.title}</p>
              <p className="text-xs text-muted-foreground">
                {habit.streak} day streak
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Habit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {habits.map(habit => (
          <Card key={habit.id} className="p-6 hover:shadow-medium transition-smooth">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{habit.title}</h3>
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                </div>
                
                <Button
                  variant={habit.completedToday ? "default" : "outline"}
                  size="icon"
                  className={`${habit.completedToday ? habit.color : ''} transition-bounce`}
                  onClick={() => toggleHabit(habit.id)}
                >
                  {habit.completedToday ? 
                    <CheckCircle className="h-5 w-5" /> : 
                    <Circle className="h-5 w-5" />
                  }
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="h-4 w-4 text-warning" />
                    <span className="font-semibold text-lg">{habit.streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-lg">{habit.bestStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="font-semibold text-lg">{habit.points}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
              </div>

              {/* Weekly Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Weekly Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {habit.weeklyProgress}/{habit.weeklyTarget}
                  </span>
                </div>
                <Progress 
                  value={(habit.weeklyProgress / habit.weeklyTarget) * 100} 
                  className="h-2"
                />
              </div>

              {/* Category Badge */}
              <div className="flex items-center justify-between">
                <Badge variant="outline">{habit.category}</Badge>
                {habit.completedToday && (
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done Today
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Motivational Quote */}
      <Card className="p-6 gradient-motivation text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">💪 Keep Building!</h3>
          <p className="text-white/90">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Aristotle
          </p>
        </div>
      </Card>
    </div>
  )
}