import { ChecklistItem, DailyTask } from "../types/project.types"

class TaskSyncService {
  private static instance: TaskSyncService
  private dailyTasks: DailyTask[] = []
  private listeners: (() => void)[] = []

  private constructor() {
    this.dailyTasks = this.loadDailyTasks()
  }

  static getInstance(): TaskSyncService {
    if (!TaskSyncService.instance) {
      TaskSyncService.instance = new TaskSyncService()
    }
    return TaskSyncService.instance
  }

  // Load daily tasks from localStorage
  private loadDailyTasks(): DailyTask[] {
    try {
      const stored = localStorage.getItem('dailyTasks')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Save daily tasks to localStorage
  private saveDailyTasks(): void {
    try {
      localStorage.setItem('dailyTasks', JSON.stringify(this.dailyTasks))
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to save daily tasks:', error)
    }
  }

  // Subscribe to task changes
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  // Add project task to daily tasks
  addProjectTaskToDaily(task: ChecklistItem, projectId: string): boolean {
    // Check if task already exists in daily tasks
    const exists = this.dailyTasks.some(
      dt => dt.sourceTaskId === task.id && dt.sourceProjectId === projectId
    )

    if (exists) {
      return false // Prevent duplicates
    }

    const dailyTask: DailyTask = {
      ...task,
      sourceProjectId: projectId,
      sourceTaskId: task.id,
      addedAt: new Date(),
      id: `daily_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.dailyTasks.push(dailyTask)
    this.saveDailyTasks()
    return true
  }

  // Get all daily tasks
  getDailyTasks(): DailyTask[] {
    return [...this.dailyTasks]
  }

  // Update task completion status
  updateTaskCompletion(taskId: string, completed: boolean): void {
    const taskIndex = this.dailyTasks.findIndex(dt => dt.sourceTaskId === taskId)
    if (taskIndex > -1) {
      this.dailyTasks[taskIndex].completed = completed
      this.saveDailyTasks()
    }
  }

  // Update subtask completion status
  updateSubtaskCompletion(subtaskId: string, completed: boolean): void {
    const taskIndex = this.dailyTasks.findIndex(dt => dt.id === subtaskId)
    if (taskIndex > -1) {
      this.dailyTasks[taskIndex].completed = completed
      this.saveDailyTasks()
    }
  }

  // Remove daily task
  removeDailyTask(taskId: string): void {
    this.dailyTasks = this.dailyTasks.filter(dt => dt.id !== taskId)
    this.saveDailyTasks()
  }

  // Clear daily tasks (for new day)
  clearDailyTasks(): void {
    this.dailyTasks = []
    this.saveDailyTasks()
  }

  // Get tasks for a specific project
  getProjectDailyTasks(projectId: string): DailyTask[] {
    return this.dailyTasks.filter(dt => dt.sourceProjectId === projectId)
  }

  // Check if task is in daily tasks
  isTaskInDaily(taskId: string, projectId: string): boolean {
    return this.dailyTasks.some(
      dt => dt.sourceTaskId === taskId && dt.sourceProjectId === projectId
    )
  }
}

export const taskSyncService = TaskSyncService.getInstance()
export type { DailyTask }
