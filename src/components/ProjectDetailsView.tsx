import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChecklistItem, Project } from "../types/project.types"
import { EnhancedTaskItem } from "./EnhancedTaskItem"
import { taskSyncService } from "../services/taskSync.service"
import { databaseService } from "../services/database.service"
import { 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  Star, 
  CheckCircle2,
  Circle,
  X,
  Edit
} from "lucide-react"
import { format } from "date-fns"
import { ProjectActionsMenu } from "./ProjectActionsMenu"

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Project {
  id: string
  title: string
  description: string
  goals: ChecklistItem[]
  tasks: ChecklistItem[]
  progress: number
  category: string
  startDate: Date
  dueDate: Date
  priority: "low" | "medium" | "high"
  taskStats: {
    total: number
    completed: number
  }
  collaborators: number
  points: number
  color: string
  icon: any
}

interface ProjectDetailsViewProps {
  project: Project | null
  open: boolean
  onClose: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
  onUpdateProgress: (projectId: string, goals: ChecklistItem[], tasks: ChecklistItem[]) => void
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive"
}

export function ProjectDetailsView({ 
  project, 
  open, 
  onClose, 
  onEditProject, 
  onDeleteProject,
  onUpdateProgress 
}: ProjectDetailsViewProps) {
  const [localGoals, setLocalGoals] = useState<ChecklistItem[]>([])
  const [localTasks, setLocalTasks] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)

  // Sync local state when project changes
  useEffect(() => {
    if (project) {
      setLocalGoals([...project.goals])
      setLocalTasks([...project.tasks])
    }
  }, [project])

  // Set up real-time subscription for project updates
  useEffect(() => {
    if (project && open) {
      setLoading(true)
      const subscription = databaseService.subscribeToProject(project.id, (updatedProject) => {
        if (updatedProject) {
          setLocalGoals([...updatedProject.goals])
          setLocalTasks([...updatedProject.tasks])
        }
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [project?.id, open])

  if (!project) return null

  const IconComponent = project.icon
  const timeLeft = Math.ceil((project.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const toggleGoal = async (id: string) => {
    try {
      const updatedGoals = localGoals.map(goal => 
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
      setLocalGoals(updatedGoals)
      
      await databaseService.updateGoal(id, {
        completed: !localGoals.find(g => g.id === id)?.completed
      })
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleAddSubtask = async (parentId: string, text: string) => {
    try {
      const newSubtask = await databaseService.createTask(project!.id, { text, completed: false }, parentId)
      
      const updatedTasks = localTasks.map(task => {
        if (task.id === parentId) {
          return {
            ...task,
            subtasks: [...(task.subtasks || []), newSubtask]
          }
        }
        return task
      })
      setLocalTasks(updatedTasks)
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  const handleToggleSubtask = async (parentId: string, subtaskId: string) => {
    try {
      const subtask = localTasks
        .flatMap(t => t.subtasks || [])
        .find(st => st.id === subtaskId)
      
      if (subtask) {
        await databaseService.updateTask(subtaskId, {
          completed: !subtask.completed
        })
      }
    } catch (error) {
      console.error('Error toggling subtask:', error)
    }
  }

  const handleRemoveSubtask = async (parentId: string, subtaskId: string) => {
    try {
      await databaseService.deleteTask(subtaskId)
      
      const updatedTasks = localTasks.map(task => {
        if (task.id === parentId && task.subtasks) {
          return {
            ...task,
            subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
          }
        }
        return task
      })
      setLocalTasks(updatedTasks)
    } catch (error) {
      console.error('Error removing subtask:', error)
    }
  }

  const handleAddToDailyTasks = (task: ChecklistItem) => {
    const success = taskSyncService.addProjectTaskToDaily(task, project!.id)
    if (success) {
      // Show success feedback
      console.log('Task added to daily tasks successfully')
    } else {
      // Show error feedback
      console.log('Task already exists in daily tasks')
    }
  }

  const calculateProgress = () => {
    const totalItems = localGoals.length + localTasks.length
    if (totalItems === 0) return 0
    const completedItems = localGoals.filter(g => g.completed).length + localTasks.filter(t => t.completed).length
    return Math.round((completedItems / totalItems) * 100)
  }

  const currentProgress = calculateProgress()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${project.color}/10`}>
                <IconComponent className={`h-6 w-6 ${project.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <div className="text-xl font-bold">{project.title}</div>
                <div className="text-sm text-muted-foreground">{project.category}</div>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEditProject(project)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <ProjectActionsMenu
                project={project}
                onOpenProject={() => {}} // Already in details view
                onEditProject={onEditProject}
                onDeleteProject={onDeleteProject}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Project Description */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{project.description}</p>
          </Card>

          {/* Progress Overview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Overall Progress</h3>
              <span className="text-2xl font-bold">{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-3 mb-4" />
            
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">{localTasks.filter(t => t.completed).length}/{localTasks.length}</div>
                <div className="text-muted-foreground">Tasks</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{localGoals.filter(g => g.completed).length}/{localGoals.length}</div>
                <div className="text-muted-foreground">Goals</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{timeLeft}d</div>
                <div className="text-muted-foreground">Remaining</div>
              </div>
              <div className="text-center">
                <div className="font-semibold flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 text-warning" />
                  {project.points}
                </div>
                <div className="text-muted-foreground">Points</div>
              </div>
            </div>
          </Card>

          {/* Goals Section */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals ({localGoals.filter(g => g.completed).length}/{localGoals.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {localGoals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No goals defined yet</p>
              ) : (
                localGoals.map(goal => (
                  <div 
                    key={goal.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {goal.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <span className={`flex-1 ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Tasks Section */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Tasks ({localTasks.filter(t => t.completed).length}/{localTasks.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {localTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tasks defined yet</p>
              ) : (
                localTasks.map(task => (
                  <EnhancedTaskItem
                    key={task.id}
                    task={task}
                    onToggle={(id) => {
                      const updatedTasks = localTasks.map(task => 
                        task.id === id ? { ...task, completed: !task.completed } : task
                      )
                      setLocalTasks(updatedTasks)
                      onUpdateProgress(project.id, localGoals, updatedTasks)
                    }}
                    onRemove={(id) => {
                      const updatedTasks = localTasks.filter(task => task.id !== id)
                      setLocalTasks(updatedTasks)
                      onUpdateProgress(project.id, localGoals, updatedTasks)
                    }}
                    onAddSubtask={handleAddSubtask}
                    onToggleSubtask={handleToggleSubtask}
                    onRemoveSubtask={handleRemoveSubtask}
                    onAddToDailyTasks={handleAddToDailyTasks}
                  />
                ))
              )}
            </div>
          </Card>

          {/* Project Meta Info */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={priorityColors[project.priority]}>
                  {project.priority} priority
                </Badge>
                <Badge variant="outline">{project.category}</Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due: {format(project.dueDate, "MMM dd, yyyy")}
                </div>
                {project.collaborators > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {project.collaborators}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
