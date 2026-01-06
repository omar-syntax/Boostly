import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { playCompletionSound } from "@/utils/sounds"
import { getTaskPoints } from "@/utils/points"
import { useUser } from "@/contexts/UserContext"
import { supabase } from "@/lib/supabase"
import {
  Plus,
  Star,
  Clock,
  Flag,
  CheckCircle,
  Circle,
  Calendar,
  Filter,
  Search,
  Zap,
  Edit,
  Trash2,
  X,
  Save
} from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category: string
  points: number
  dueDate?: Date
  task_date: string
}

const categories = ["All", "Work", "Health", "Learning", "Personal"]
const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive"
}

export default function Tasks() {
  const { user, updateUser } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [newTaskCategory, setNewTaskCategory] = useState("Personal")
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium")
  const [editCategory, setEditCategory] = useState("Personal")

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showHistory, setShowHistory] = useState(false)
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const fetchTasks = async (date?: string) => {
    if (!user?.id) return

    const targetDate = date || selectedDate

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', targetDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return
    }

    if (data) {
      setTasks(data.map(task => ({
        ...task,
        dueDate: task.due_date ? new Date(task.due_date) : undefined
      })))
    }
  }

  // Load tasks on mount and when date changes
  useEffect(() => {
    fetchTasks()
  }, [user?.id, selectedDate])

  // Realtime subscription for tasks
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('tasks_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || !user) return

    const wasCompleted = task.completed
    const pointsToAward = getTaskPoints(task.priority)

    // Optimistic update
    const updatedTasks = tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    )
    setTasks(updatedTasks)

    // DB Update
    await supabase
      .from('tasks')
      .update({ completed: !wasCompleted })
      .eq('id', id)

    // Update user points and stats
    if (!wasCompleted) {
      // Completing task
      playCompletionSound()
      await updateUser({
        points: user.points + pointsToAward,
        tasksCompleted: user.tasksCompleted + 1,
        weeklyPoints: user.weeklyPoints + pointsToAward,
      })
    } else {
      // Uncompleting task - remove points
      await updateUser({
        points: Math.max(0, user.points - pointsToAward),
        tasksCompleted: Math.max(0, user.tasksCompleted - 1),
        weeklyPoints: Math.max(0, user.weeklyPoints - pointsToAward),
      })
    }
  }

  const addTask = async () => {
    if (!newTask.trim() || !user) return

    const points = getTaskPoints(newTaskPriority)

    const newTaskObj = {
      user_id: user.id,
      title: newTask,
      description: "",
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      points,
      task_date: selectedDate, // Store the date the task was created for
    }

    const { error } = await supabase
      .from('tasks')
      .insert([newTaskObj])

    if (error) {
      console.error('Error adding task:', error)
      return
    }

    setNewTask("")
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task.id)
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditCategory(task.category)
  }

  const saveEditTask = async () => {
    if (!editingTask || !editTitle.trim()) return

    const points = getTaskPoints(editPriority)

    // DB Update
    const { error } = await supabase
      .from('tasks')
      .update({
        title: editTitle,
        priority: editPriority,
        category: editCategory,
        points
      })
      .eq('id', editingTask)

    if (error) {
      console.error('Error updating task:', error)
      return
    }

    setEditingTask(null)
    setEditTitle("")
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditTitle("")
  }

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id)
    if (!taskToDelete || !user) return

    // DB Delete
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return
    }

    // If task was completed, remove points
    if (taskToDelete.completed) {
      const pointsToRemove = taskToDelete.points
      await updateUser({
        points: Math.max(0, user.points - pointsToRemove),
        tasksCompleted: Math.max(0, user.tasksCompleted - 1),
        weeklyPoints: Math.max(0, user.weeklyPoints - pointsToRemove),
      })
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === "All" || task.category === selectedCategory
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const completedToday = tasks.filter(task => task.completed).length
  const totalPoints = tasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0)

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {isToday ? "Manage your daily productivity" : `Viewing tasks for ${new Date(selectedDate).toLocaleDateString()}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {!isToday && (
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              size="sm"
            >
              Back to Today
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 h-9"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-warning" />
            <span className="font-semibold">{totalPoints}</span>
            <span className="text-muted-foreground">{isToday ? "points today" : "points earned"}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedToday}</div>
              <div className="text-sm text-muted-foreground">{isToday ? "Completed Today" : "Completed"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Circle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{tasks.filter(t => !t.completed).length}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-motivation/10">
              <Zap className="h-6 w-6 text-motivation" />
            </div>
            <div>
              <div className="text-2xl font-bold">{tasks.length > 0 ? Math.round((completedToday / tasks.length) * 100) : 0}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add New Task - Only visible for today or if explicitly allowed */}
      {isToday && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Add a new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
              </div>
              <Button onClick={addTask} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">Low Priority ({getTaskPoints("low")} pts)</option>
                <option value="medium">Medium Priority ({getTaskPoints("medium")} pts)</option>
                <option value="high">High Priority ({getTaskPoints("high")} pts)</option>
              </select>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.filter(c => c !== "All").map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
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

        <div className="flex-1" />

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <Card key={task.id} className={`p-4 transition-all ${task.completed ? 'opacity-60' : 'hover:shadow-medium'}`}>
            {editingTask === task.id ? (
              /* Edit Form */
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title..."
                      className="font-medium"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="low">Low Priority ({getTaskPoints("low")} pts)</option>
                    <option value="medium">Medium Priority ({getTaskPoints("medium")} pts)</option>
                    <option value="high">High Priority ({getTaskPoints("high")} pts)</option>
                  </select>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {categories.filter(c => c !== "All").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button onClick={saveEditTask} size="sm" className="bg-success hover:bg-success/90">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={cancelEdit} size="sm" variant="outline">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Task Display */
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => isToday && toggleTask(task.id)}
                  className={`mt-1 ${!isToday ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={!isToday}
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>

                      <Badge variant="outline">
                        {task.category}
                      </Badge>

                      <div className="flex items-center gap-1 text-sm text-warning">
                        <Star className="h-3 w-3" />
                        {task.points}
                      </div>

                      {/* Action Buttons - Only for current day */}
                      {isToday && (
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => startEditTask(task)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteTask(task.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                      {task.description}
                    </p>
                  )}

                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due {task.dueDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks found</p>
              <p className="text-sm">Add a new task to get started!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
