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
import { getHabitPoints } from "@/utils/points"
import { useUser } from "@/contexts/UserContext"
import { supabase } from "@/lib/supabase"
import {
  Target,
  Star,
  Plus,
  Calendar,
  Flame,
  CheckCircle,
  Circle,
  TrendingUp,
  Edit,
  Trash2
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
  const [habitDialogOpen, setHabitDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [habitForm, setHabitForm] = useState({
    title: "",
    description: "",
    category: "",
    weeklyTarget: 7,
    points: 25
  })

  const categories = ["Mindfulness", "Learning", "Health", "Fitness", "Productivity", "Personal"]
  const colors = ["bg-secondary", "bg-primary", "bg-success", "bg-warning", "bg-motivation", "bg-purple-500"]

  const fetchHabits = async () => {
    if (!user?.id) return

    // 1. Fetch Habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (habitsError) {
      console.error('Error fetching habits:', habitsError)
      return
    }

    if (!habitsData) return

    // 2. Fetch Completion for Today (Local Time logic)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

    const { data: logsData, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .gte('completed_at', startOfDay)
      .lte('completed_at', endOfDay)

    const completedHabitIds = new Set(logsData?.map(log => log.habit_id) || [])

    // 3. Map to UI Model
    const mappedHabits = habitsData.map(h => ({
      id: h.id,
      title: h.title,
      description: h.description,
      streak: h.current_streak,
      bestStreak: h.best_streak,
      completedToday: completedHabitIds.has(h.id),
      weeklyTarget: h.weekly_target,
      weeklyProgress: 0,
      points: h.points,
      category: h.category,
      color: h.color || colors[0]
    }))

    setHabits(mappedHabits)
  }

  // Load habits on mount
  useEffect(() => {
    fetchHabits()
  }, [user?.id])

  const handleOpenDialog = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit)
      setHabitForm({
        title: habit.title,
        description: habit.description || "",
        category: habit.category,
        weeklyTarget: habit.weeklyTarget,
        points: habit.points
      })
    } else {
      setEditingHabit(null)
      setHabitForm({
        title: "",
        description: "",
        category: "",
        weeklyTarget: 7,
        points: 25
      })
    }
    setHabitDialogOpen(true)
  }

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!habitForm.title.trim() || !habitForm.category || !user) {
      return
    }

    if (editingHabit) {
      // Update existing habit
      const { error } = await supabase
        .from('habits')
        .update({
          title: habitForm.title,
          description: habitForm.description,
          category: habitForm.category,
          weekly_target: habitForm.weeklyTarget,
          points: habitForm.points
        })
        .eq('id', editingHabit.id)

      if (error) {
        console.error("Error updating habit", error)
        return
      }
    } else {
      // Create new habit
      const color = colors[Math.floor(Math.random() * colors.length)]

      const newHabitObj = {
        user_id: user.id,
        title: habitForm.title,
        description: habitForm.description,
        category: habitForm.category,
        weekly_target: habitForm.weeklyTarget,
        points: habitForm.points,
        color,
        current_streak: 0,
        best_streak: 0
      }

      const { error } = await supabase
        .from('habits')
        .insert([newHabitObj])

      if (error) {
        console.error("Error creating habit", error)
        return
      }
    }

    // Refresh list
    fetchHabits()
    setHabitDialogOpen(false)
  }

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?") || !user) return

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Error deleting habit", error)
      return
    }

    // Update local state
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id)
    if (!habit || !user) return

    const wasCompleted = habit.completedToday
    const newCompleted = !wasCompleted
    const newStreak = newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1)
    const pointsToAward = getHabitPoints(newStreak)

    try {
      if (newCompleted) {
        // MARK AS DONE
        // 1. Insert Log
        const { error: logError } = await supabase.from('habit_logs').insert([{
          habit_id: id,
          user_id: user.id,
          completed_at: new Date().toISOString()
        }])
        if (logError) throw logError

        // 2. Update Streak
        const newBestStreak = Math.max(habit.bestStreak, newStreak)
        const { error: updateError } = await supabase.from('habits').update({
          current_streak: newStreak,
          best_streak: newBestStreak,
          last_completed_at: new Date().toISOString()
        }).eq('id', id)
        if (updateError) throw updateError

        // 3. Award Points
        playCompletionSound()
        updateUser({
          points: user.points + pointsToAward,
          weeklyPoints: user.weeklyPoints + pointsToAward,
        })

      } else {
        // UN-MARK (UNDO)
        // 1. Find the log to delete (Robust Logic)
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        
        // First find the ID of the log for completion TODAY
        const { data: logs, error: fetchError } = await supabase
          .from('habit_logs')
          .select('id')
          .eq('habit_id', id)
          .eq('user_id', user.id)
          .gte('completed_at', startOfDay)
          .order('completed_at', { ascending: false }) // Get most recent if duplicates

        if (fetchError) throw fetchError

        if (logs && logs.length > 0) {
            // Delete specifically by ID
            const { error: deleteError } = await supabase
              .from('habit_logs')
              .delete()
              .eq('id', logs[0].id)
            
            if (deleteError) throw deleteError
        }

        // 2. Revert Streak
        const { error: updateError } = await supabase.from('habits').update({
          current_streak: newStreak
        }).eq('id', id)
        if (updateError) throw updateError

        // 3. Deduct Points (Simplified)
        await updateUser({
          points: Math.max(0, user.points - pointsToAward),
          weeklyPoints: Math.max(0, user.weeklyPoints - pointsToAward),
        })
      }

      // 4. Update UI State (Success)
      setHabits(prev => prev.map(h => {
        if (h.id === id) {
          return {
            ...h,
            completedToday: newCompleted,
            streak: newStreak,
            bestStreak: newCompleted ? Math.max(h.bestStreak, newStreak) : h.bestStreak
          }
        }
        return h
      }))

    } catch (error) {
      console.error("Error toggling habit:", error)
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
  const averageStreak = habits.length > 0 ? habits.reduce((sum, h) => sum + h.streak, 0) / habits.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground">Build consistent habits for lasting success</p>
        </div>

        <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {editingHabit ? "Edit Habit" : "Create New Habit"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="habit-title">Habit Title *</Label>
                <Input
                  id="habit-title"
                  placeholder="e.g., Morning Meditation, Daily Reading"
                  value={habitForm.title}
                  onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="habit-description">Description</Label>
                <Input
                  id="habit-description"
                  placeholder="Brief description of your habit..."
                  value={habitForm.description}
                  onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={habitForm.category} onValueChange={(value) => setHabitForm({ ...habitForm, category: value })}>
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
                    value={habitForm.weeklyTarget}
                    onChange={(e) => setHabitForm({ ...habitForm, weeklyTarget: parseInt(e.target.value) || 7 })}
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
                  value={habitForm.points}
                  onChange={(e) => setHabitForm({ ...habitForm, points: parseInt(e.target.value) || 25 })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHabitDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary"
                  disabled={!habitForm.title.trim() || !habitForm.category}
                >
                  {editingHabit ? "Save Changes" : "Create Habit"}
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
            <Progress value={habits.length > 0 ? (completedToday / habits.length) * 100 : 0} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {completedToday} of {habits.length} habits completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="text-center relative group">
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleOpenDialog(habit)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
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
          <Card key={habit.id} className="p-6 hover:shadow-medium transition-smooth relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpenDialog(habit)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeleteHabit(habit.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-12">
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
