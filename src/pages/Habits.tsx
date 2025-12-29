import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { playCompletionSound } from "@/utils/sounds"
import { getUserHabits, saveUserHabits } from "@/utils/storage"
import { getHabitPoints } from "@/utils/points"
import { useUser } from "@/contexts/UserContext"
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

export default function Habits() {
  const { user, updateUser } = useUser()
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabitOpen, setNewHabitOpen] = useState(false)
  const [newHabitForm, setNewHabitForm] = useState({
    title: "",
    description: "",
    category: "",
    weeklyTarget: 7,
    points: 25
  })

  const categories = ["Mindfulness", "Learning", "Health", "Fitness", "Productivity", "Personal"]
  const colors = ["bg-secondary", "bg-primary", "bg-success", "bg-warning", "bg-motivation", "bg-purple-500"]

  // Load habits from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedHabits = getUserHabits(user.id)
      setHabits(savedHabits)
    }
  }, [user?.id])

  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (user?.id && habits.length >= 0) {
      saveUserHabits(user.id, habits)
    }
  }, [habits, user?.id])

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newHabitForm.title.trim() || !newHabitForm.category || !user) {
      return
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newHabitForm.title,
      description: newHabitForm.description,
      streak: 0,
      bestStreak: 0,
      completedToday: false,
      weeklyTarget: newHabitForm.weeklyTarget,
      weeklyProgress: 0,
      points: 20, // Base habit points
      category: newHabitForm.category,
      color: colors[Math.floor(Math.random() * colors.length)]
    }

    setHabits(prev => [...prev, newHabit])
    setNewHabitOpen(false)
    setNewHabitForm({
      title: "",
      description: "",
      category: "",
      weeklyTarget: 7,
      points: 25
    })
  }

  const toggleHabit = (id: string) => {
    const habit = habits.find(h => h.id === id)
    if (!habit || !user) return
    
    const wasCompleted = habit.completedToday
    const newStreak = !wasCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1)
    const pointsToAward = getHabitPoints(newStreak)
    
    const updatedHabits = habits.map(h => {
      if (h.id === id) {
        const newCompletedToday = !h.completedToday
        return {
          ...h,
          completedToday: newCompletedToday,
          streak: newCompletedToday ? h.streak + 1 : Math.max(0, h.streak - 1),
          bestStreak: newCompletedToday && h.streak + 1 > h.bestStreak ? h.streak + 1 : h.bestStreak,
          weeklyProgress: newCompletedToday ? 
            Math.min(h.weeklyTarget, h.weeklyProgress + 1) : 
            Math.max(0, h.weeklyProgress - 1)
        }
      }
      return h
    })
    
    setHabits(updatedHabits)
    
    // Update user points and stats
    if (!wasCompleted) {
      // Completing habit
      playCompletionSound()
      updateUser({
        points: user.points + pointsToAward,
        weeklyPoints: user.weeklyPoints + pointsToAward,
      })
    } else {
      // Uncompleting habit - remove points (use base points without streak bonus)
      const basePoints = 20
      updateUser({
        points: Math.max(0, user.points - basePoints),
        weeklyPoints: Math.max(0, user.weeklyPoints - basePoints),
      })
    }
  }
  
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
        
        <Dialog open={newHabitOpen} onOpenChange={setNewHabitOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Create New Habit
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="habit-title">Habit Title *</Label>
                <Input
                  id="habit-title"
                  placeholder="e.g., Morning Meditation, Daily Reading"
                  value={newHabitForm.title}
                  onChange={(e) => setNewHabitForm({...newHabitForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="habit-description">Description</Label>
                <Input
                  id="habit-description"
                  placeholder="Brief description of your habit..."
                  value={newHabitForm.description}
                  onChange={(e) => setNewHabitForm({...newHabitForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={newHabitForm.category} onValueChange={(value) => setNewHabitForm({...newHabitForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly-target">Weekly Target</Label>
                  <Input
                    id="weekly-target"
                    type="number"
                    min="1"
                    max="7"
                    value={newHabitForm.weeklyTarget}
                    onChange={(e) => setNewHabitForm({...newHabitForm, weeklyTarget: parseInt(e.target.value) || 7})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points per Completion</Label>
                <Input
                  id="points"
                  type="number"
                  min="5"
                  max="100"
                  value={newHabitForm.points}
                  onChange={(e) => setNewHabitForm({...newHabitForm, points: parseInt(e.target.value) || 25})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setNewHabitOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 gradient-primary"
                  disabled={!newHabitForm.title.trim() || !newHabitForm.category}
                >
                  Create Habit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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