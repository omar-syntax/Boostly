import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink, 
  FolderOpen 
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Project {
  id: string
  title: string
  description: string
  goals: any[]
  tasks: any[]
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

interface ProjectActionsMenuProps {
  project: Project
  onOpenProject: (project: Project) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
}

export function ProjectActionsMenu({ 
  project, 
  onOpenProject, 
  onEditProject, 
  onDeleteProject 
}: ProjectActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleOpenProject = () => {
    setIsDropdownOpen(false)
    onOpenProject(project)
  }

  const handleEditProject = () => {
    setIsDropdownOpen(false)
    onEditProject(project)
  }

  const handleDeleteProject = () => {
    setIsDropdownOpen(false)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    onDeleteProject(project.id)
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hover:bg-muted/80 transition-colors"
            aria-label="Project actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end"
          className="w-48 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem 
            onClick={handleOpenProject}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            Open Project
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleEditProject}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            Edit Project
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleDeleteProject}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone and all project data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
