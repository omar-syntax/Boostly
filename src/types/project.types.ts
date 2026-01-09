export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  subtasks?: ChecklistItem[]
  parentTaskId?: string
  projectId?: string
  priority?: "low" | "medium" | "high"
  dueTime?: string
}

export interface Project {
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

export interface DailyTask extends ChecklistItem {
  sourceProjectId: string
  sourceTaskId: string
  addedAt: Date
}
