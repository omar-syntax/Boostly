import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreateProjectDialog } from "@/components/CreateProjectDialog"
import { CelebrationDialog } from "@/components/CelebrationDialog"
import { ProjectActionsMenu } from "@/components/ProjectActionsMenu"
import { ProjectDetailsView } from "@/components/ProjectDetailsView"
import { databaseService } from "@/services/database.service"
import { 
  FolderOpen, 
  Plus,
  Calendar,
  Users,
  Target,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Star,
  Briefcase,
  Heart,
  Book,
  Dumbbell,
  Loader2
} from "lucide-react"
import { ChecklistItem, Project } from "../types/project.types"

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'Target': Target,
    'Briefcase': Briefcase,
    'Heart': Heart,
    'Book': Book,
    'Dumbbell': Dumbbell,
    'FolderOpen': FolderOpen,
    'Star': Star,
    'Clock': Clock,
    'CheckCircle': CheckCircle,
    'Users': Users,
    'Calendar': Calendar
  }
  return iconMap[iconName] || Target
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [detailsViewOpen, setDetailsViewOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Load projects from database
  useEffect(() => {
    loadProjects()
    
    // Set up real-time subscription
    const subscription = databaseService.subscribeToProjects((updatedProjects) => {
      setProjects(updatedProjects)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const projectsData = await databaseService.getProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = async (newProject: Omit<Project, 'id' | 'startDate' | 'taskStats'>) => {
    try {
      const createdProject = await databaseService.createProject(newProject)
      if (createdProject) {
        setProjects(prev => [createdProject, ...prev])
      }
    } catch (error) {
      console.error('Error creating project:', error)
      // You could add a toast notification here
    }
  }

  const handleOpenProject = async (project: Project) => {
    try {
      const fullProject = await databaseService.getProject(project.id)
      if (fullProject) {
        setSelectedProject(fullProject)
        setDetailsViewOpen(true)
      }
    } catch (error) {
      console.error('Error loading project details:', error)
    }
  }

  const handleEditProject = async (project: Project) => {
    try {
      const fullProject = await databaseService.getProject(project.id)
      if (fullProject) {
        setEditingProject(fullProject)
        setEditDialogOpen(true)
      }
    } catch (error) {
      console.error('Error loading project for editing:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await databaseService.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleUpdateProgress = async (projectId: string, goals: ChecklistItem[], tasks: ChecklistItem[]) => {
    try {
      // Update goals in database
      for (const goal of goals) {
        await databaseService.updateGoal(goal.id, {
          text: goal.text,
          completed: goal.completed
        })
      }

      // Update tasks in database
      for (const task of tasks) {
        await databaseService.updateTask(task.id, {
          text: task.text,
          completed: task.completed,
          priority: task.priority,
          dueTime: task.dueTime
        })
      }
      
      // Refresh the project data
      const updatedProject = await databaseService.getProject(projectId)
      if (updatedProject) {
        setSelectedProject(updatedProject)
        // Update projects list if needed
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p))
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }
  
  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/10 text-warning",
    high: "bg-destructive/10 text-destructive"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading projects...</span>
      </div>
    )
  }

  const categories = ["All", ...Array.from(new Set(projects.map(p => p.category)))]
  const filteredProjects = selectedCategory === "All" 
    ? projects 
    : projects.filter(p => p.category === selectedCategory)

  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.progress < 100).length
  const completedProjects = projects.filter(p => p.progress >= 100).length
  const totalPoints = projects.reduce((sum, p) => sum + p.points, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Long-term Projects</h1>
          <p className="text-muted-foreground">Track and manage your long-term goals and achievements</p>
        </div>
        
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedProjects}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
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
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filter by category:</span>
        <div className="flex gap-2">
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map(project => {
          const IconComponent = getIconComponent(project.icon)
          const timeLeft = Math.ceil((project.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          
          return (
            <Card key={project.id} className="p-6 hover:shadow-medium transition-smooth">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${project.color}/10`}>
                      <IconComponent className={`h-6 w-6 ${project.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  
                  <ProjectActionsMenu
                    project={project}
                    onOpenProject={handleOpenProject}
                    onEditProject={handleEditProject}
                    onDeleteProject={handleDeleteProject}
                  />
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span>{project.progress}% complete</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{project.taskStats.completed}/{project.taskStats.total}</div>
                    <div className="text-muted-foreground">Tasks</div>
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

                {/* Meta Info */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={priorityColors[project.priority]}>
                      {project.priority} priority
                    </Badge>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {project.collaborators > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.collaborators}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {project.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Project Details View */}
      <ProjectDetailsView
        project={selectedProject}
        open={detailsViewOpen}
        onClose={() => {
          setDetailsViewOpen(false)
          setSelectedProject(null)
        }}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onUpdateProgress={handleUpdateProgress}
      />

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="p-8 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedCategory === "All" 
              ? "Start your first long-term project to track your goals!"
              : `No projects in the ${selectedCategory} category yet.`
            }
          </p>
          <CreateProjectDialog onProjectCreated={handleProjectCreated} />
        </Card>
      )}
    </div>
  )
}