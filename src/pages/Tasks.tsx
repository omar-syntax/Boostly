import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { playCompletionSound } from "@/utils/sounds"
import { getUserTasks, saveUserTasks } from "@/utils/storage"
import { getTaskPoints } from "@/utils/points"
import { useUser } from "@/contexts/UserContext"
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
  Zap
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

  // Load tasks from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedTasks = getUserTasks(user.id)
      // Convert date strings back to Date objects
      const tasksWithDates = savedTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }))
      setTasks(tasksWithDates)
    }
  }, [user?.id])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (user?.id && tasks.length >= 0) {
      saveUserTasks(user.id, tasks)
    }
  }, [tasks, user?.id])

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || !user) return
    
    const wasCompleted = task.completed || false
    const pointsToAward = getTaskPoints(task.priority)
    
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    )
    setTasks(updatedTasks)
    
    // Update user points and stats
    if (!wasCompleted) {
      // Completing task
      playCompletionSound()
      updateUser({
        points: user.points + pointsToAward,
        tasksCompleted: user.tasksCompleted + 1,
        weeklyPoints: user.weeklyPoints + pointsToAward,
      })
    } else {
      // Uncompleting task - remove points
      updateUser({
        points: Math.max(0, user.points - pointsToAward),
        tasksCompleted: Math.max(0, user.tasksCompleted - 1),
        weeklyPoints: Math.max(0, user.weeklyPoints - pointsToAward),
      })
    }
  }

  const addTask = () => {
    if (!newTask.trim() || !user) return
    
    const points = getTaskPoints(newTaskPriority)
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      description: "",
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      points,
    }
    
    setTasks([task, ...tasks])
    setNewTask("")
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
          <p className="text-muted-foreground">Manage your daily productivity</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-warning" />
            <span className="font-semibold">{totalPoints}</span>
            <span className="text-muted-foreground">points today</span>
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
              <div className="text-sm text-muted-foreground">Completed Today</div>
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
              <div className="text-2xl font-bold">{Math.round((completedToday / tasks.length) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add New Task */}
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
            <div className="flex items-start gap-4">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-1"
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