import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Plus, Briefcase, Heart, Book, Dumbbell, Target, Lightbulb, Check, X, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ChecklistItem, Project } from "../types/project.types"
import { databaseService } from "../services/database.service"

interface CreateProjectDialogProps {
  onProjectCreated: (project: Omit<Project, 'id' | 'startDate' | 'taskStats'>) => void
}

const categoryIcons = {
  "Health": Dumbbell,
  "Learning": Book,
  "Career": Briefcase,
  "Wellness": Heart,
  "Personal": Target,
  "Creative": Lightbulb
}

const categoryColors = {
  "Health": "bg-success",
  "Learning": "bg-primary", 
  "Career": "bg-warning",
  "Wellness": "bg-secondary",
  "Personal": "bg-motivation",
  "Creative": "bg-purple-500"
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: ""
  })
  const [goals, setGoals] = useState<ChecklistItem[]>([])
  const [tasks, setTasks] = useState<ChecklistItem[]>([])
  const [newGoal, setNewGoal] = useState("")
  const [newTask, setNewTask] = useState("")

  // Calculate progress based on completed goals and tasks
  const calculateProgress = () => {
    const totalItems = goals.length + tasks.length
    if (totalItems === 0) return 0
    const completedItems = goals.filter(g => g.completed).length + tasks.filter(t => t.completed).length
    return Math.round((completedItems / totalItems) * 100)
  }

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(calculateProgress())
  }, [goals, tasks])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      priority: "medium",
      dueDate: ""
    })
    setGoals([])
    setTasks([])
    setNewGoal("")
    setNewTask("")
    setProgress(0)
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, {
        id: Date.now().toString(),
        text: newGoal.trim(),
        completed: false
      }])
      setNewGoal("")
    }
  }

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false
      }])
      setNewTask("")
    }
  }

  const toggleGoal = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ))
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const removeGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!formData.title.trim() || !formData.category || !formData.dueDate) {
      return
    }

    const dueDateObj = new Date(formData.dueDate)
    const newProject = {
      title: formData.title,
      description: formData.description,
      goals: goals,
      tasks: tasks,
      progress: progress,
      category: formData.category,
      startDate: new Date(),
      dueDate: dueDateObj,
      priority: formData.priority,
      collaborators: 0,
      points: 0,
      color: categoryColors[formData.category as keyof typeof categoryColors] || "bg-primary",
      icon: categoryIcons[formData.category as keyof typeof categoryIcons] || Target
    }

    try {
      await onProjectCreated(newProject)
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create New Project
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Learn Spanish, Get Fit, Launch Side Business"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a brief summary of your project..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {/* Goals Checklist */}
          <div className="space-y-3">
            <Label>Goals</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No goals added yet</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() => toggleGoal(goal.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className={`flex-1 text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(goal.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                className="flex-1"
              />
              <Button type="button" onClick={addGoal} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tasks Checklist */}
          <div className="space-y-3">
            <Label>Tasks</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No tasks added yet</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(task.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                className="flex-1"
              />
              <Button type="button" onClick={addTask} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {(goals.length > 0 || tasks.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span>{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categoryIcons).map(category => {
                    const IconComponent = categoryIcons[category as keyof typeof categoryIcons]
                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {category}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high") => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2"> 
            <Label htmlFor="dueDate">Target Completion Date *</Label>
            <div className="relative">
              <Input
                ref={dateInputRef}
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  e.stopPropagation()
                  setFormData(prev => ({ ...prev, dueDate: e.target.value }))
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10"
                required
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {formData.dueDate && (
              <p className="text-xs text-muted-foreground">
                Selected: {format(new Date(formData.dueDate), "PPP")}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-primary"
              disabled={!formData.title.trim() || !formData.category || !formData.dueDate}
            >
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}