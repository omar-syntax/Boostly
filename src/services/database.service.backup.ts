import { supabase } from '../lib/supabase'
import { ChecklistItem, Project } from '../types/project.types'

// Database types matching the migration schema
export interface DbProject {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string
  priority: 'low' | 'medium' | 'high'
  start_date: string
  due_date: string
  progress: number
  collaborators: number
  points: number
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface DbGoal {
  id: string
  project_id: string
  text: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface DbTask {
  id: string
  project_id: string
  parent_task_id: string | null
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high' | null
  due_time: string | null
  created_at: string
  updated_at: string
}

class DatabaseService {
  private static instance: DatabaseService

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // PROJECTS
  async getProjects(): Promise<Project[]> {
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          goals (*),
          project_tasks (*)
        `)
        .eq('user_id', user.id) // Only get user's projects
        .order('created_at', { ascending: false })

      if (error) throw error

      return projects.map(project => this.transformDbProjectToProject(project))
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data: project, error } = await supabase
        .from('projects')
        .select(`
          *,
          goals (*),
          project_tasks (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns the project
        .single()

      if (error) throw error
      if (!project) return null

      return this.transformDbProjectToProject(project)
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  }

  async createProject(projectData: Omit<Project, 'id' | 'startDate' | 'taskStats'>): Promise<Project> {
    try {
      // Get current user to set user_id
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id, // Add user_id for RLS policy
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          priority: projectData.priority,
          start_date: projectData.startDate.toISOString().split('T')[0],
          due_date: projectData.dueDate.toISOString().split('T')[0],
          progress: projectData.progress,
          collaborators: projectData.collaborators,
          points: projectData.points,
          color: projectData.color,
          icon: projectData.icon
        })
        .select()
        .single()

      if (error) throw error

      // Create goals
      if (projectData.goals.length > 0) {
        const goalsData = projectData.goals.map(goal => ({
          project_id: project.id,
          text: goal.text,
          completed: goal.completed
        }))

        const { error: goalsError } = await supabase
          .from('goals')
          .insert(goalsData)

        if (goalsError) throw goalsError
      }

      // Create tasks
      if (projectData.tasks.length > 0) {
        await this.createTasksForProject(project.id, projectData.tasks)
      }

      return await this.getProject(project.id)
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const updateData: any = {}
      
      if (updates.title) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.category) updateData.category = updates.category
      if (updates.priority) updateData.priority = updates.priority
      if (updates.dueDate) updateData.due_date = updates.dueDate.toISOString().split('T')[0]
      if (updates.collaborators !== undefined) updateData.collaborators = updates.collaborators
      if (updates.points !== undefined) updateData.points = updates.points
      if (updates.color) updateData.color = updates.color
      if (updates.icon) updateData.icon = updates.icon

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      return await this.getProject(id)
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns the project

      if (error) throw error
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // GOALS
  async createGoal(projectId: string, goal: Omit<ChecklistItem, 'id'>): Promise<ChecklistItem> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          project_id: projectId,
          text: goal.text,
          completed: goal.completed
        })
        .select()
        .single()

      if (error) throw error

      return this.transformDbGoalToChecklistItem(data)
    } catch (error) {
      console.error('Error creating goal:', error)
      throw error
    }
  }

  async updateGoal(id: string, updates: Partial<ChecklistItem>): Promise<void> {
    try {
      const updateData: any = {}
      if (updates.text !== undefined) updateData.text = updates.text
      if (updates.completed !== undefined) updateData.completed = updates.completed

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  // TASKS
  async createTask(projectId: string, task: Omit<ChecklistItem, 'id'>, parentTaskId?: string): Promise<ChecklistItem> {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          parent_task_id: parentTaskId || null,
          text: task.text,
          completed: task.completed,
          priority: task.priority || null,
          due_time: task.dueTime || null
        })
        .select()
        .single()

      if (error) throw error

      return this.transformDbTaskToChecklistItem(data)
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  async updateTask(id: string, updates: Partial<ChecklistItem>): Promise<void> {
    try {
      const updateData: any = {}
      if (updates.text !== undefined) updateData.text = updates.text
      if (updates.completed !== undefined) updateData.completed = updates.completed
      if (updates.priority !== undefined) updateData.priority = updates.priority
      if (updates.dueTime !== undefined) updateData.due_time = updates.dueTime

      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // Helper method to create tasks with subtasks
  private async createTasksForProject(projectId: string, tasks: ChecklistItem[], parentTaskId?: string): Promise<void> {
    for (const task of tasks) {
      const createdTask = await this.createTask(projectId, task, parentTaskId)
      
      if (task.subtasks && task.subtasks.length > 0) {
        await this.createTasksForProject(projectId, task.subtasks, createdTask.id)
      }
    }
  }

  // Transform methods
  private transformDbProjectToProject(dbProject: any): Project {
    try {
      // Validate project data
      if (!dbProject || typeof dbProject !== 'object') {
        console.error('Invalid project data:', dbProject)
        return this.createEmptyProject()
      }
      
      // Validate and transform goals
      const goals = Array.isArray(dbProject.goals) 
        ? dbProject.goals
            .filter(goal => goal && typeof goal === 'object')
            .map(goal => this.transformDbGoalToChecklistItem(goal))
        : []
      
      // Validate and transform tasks
      const allTasks = Array.isArray(dbProject.project_tasks) ? dbProject.project_tasks : []
      const tasks = allTasks
        .filter((task: DbTask) => task && typeof task === 'object' && task.parent_task_id === null)
        .map((task: DbTask) => this.transformDbTaskToChecklistItem(task, allTasks))

      return {
        id: dbProject.id || '',
        title: dbProject.title || '',
        description: dbProject.description || '',
        goals,
        tasks,
        progress: Math.min(100, Math.max(0, dbProject.progress || 0)),
        category: dbProject.category || '',
        startDate: dbProject.start_date ? new Date(dbProject.start_date) : new Date(),
        dueDate: dbProject.due_date ? new Date(dbProject.due_date) : new Date(),
        priority: ['low', 'medium', 'high'].includes(dbProject.priority) ? dbProject.priority : 'medium',
        taskStats: {
          total: tasks.length,
          completed: tasks.filter(t => t.completed).length
        },
        collaborators: Math.max(0, dbProject.collaborators || 0),
        points: Math.max(0, dbProject.points || 0),
        color: dbProject.color || 'bg-primary',
        icon: this.getIconComponent(dbProject.icon || 'Target')
      }
    } catch (error) {
      console.error('Error transforming project:', error)
      return this.createEmptyProject()
    }
  }

  private createEmptyProject(): Project {
    return {
      id: '',
      title: '',
      description: '',
      goals: [],
      tasks: [],
      progress: 0,
      category: '',
      startDate: new Date(),
      dueDate: new Date(),
      priority: 'medium',
      taskStats: { total: 0, completed: 0 },
      collaborators: 0,
      points: 0,
      color: 'bg-primary',
      icon: 'Target'
    }
  }

  private transformDbGoalToChecklistItem(dbGoal: DbGoal): ChecklistItem {
    try {
      if (!dbGoal || typeof dbGoal !== 'object') {
        console.error('Invalid goal data:', dbGoal)
        return { id: '', text: '', completed: false }
      }
      
      return {
        id: dbGoal.id || '',
        text: dbGoal.text || '',
        completed: Boolean(dbGoal.completed)
      }
    } catch (error) {
      console.error('Error transforming goal:', error)
      return { id: '', text: '', completed: false }
    }
  }

  private transformDbTaskToChecklistItem(dbTask: DbTask, allTasks?: DbTask[]): ChecklistItem {
    try {
      if (!dbTask || typeof dbTask !== 'object') {
        console.error('Invalid task data:', dbTask)
        return { id: '', text: '', completed: false }
      }
      
      const subtasks = allTasks 
        ? allTasks
            .filter(task => task.parent_task_id === dbTask.id)
            .map(subtask => this.transformDbTaskToChecklistItem(subtask, allTasks))
        : []

      return {
        id: dbTask.id || '',
        text: dbTask.text || '',
        completed: Boolean(dbTask.completed),
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        priority: ['low', 'medium', 'high'].includes(dbTask.priority) ? dbTask.priority : undefined,
        dueTime: dbTask.due_time || undefined
      }
    } catch (error) {
      console.error('Error transforming task:', error)
      return { id: '', text: '', completed: false }
    }
  }

  private getIconComponent(iconName: string): any {
    // This would return the actual icon component
    // For now, return a placeholder
    return 'Target'
  }

  // Real-time subscriptions
  subscribeToProjects(callback: (projects: Project[]) => void) {
    return supabase
      .channel('projects-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects' 
        }, 
        async () => {
          const projects = await this.getProjects()
          callback(projects)
        }
      )
      .subscribe()
  }

  subscribeToProject(projectId: string, callback: (project: Project | null) => void) {
    return supabase
      .channel(`project-${projectId}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects',
          filter: `id=eq.${projectId}`
        }, 
        async () => {
          const project = await this.getProject(projectId)
          callback(project)
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'goals',
          filter: `project_id=eq.${projectId}`
        }, 
        async () => {
          const project = await this.getProject(projectId)
          callback(project)
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`
        }, 
        async () => {
          const project = await this.getProject(projectId)
          callback(project)
        }
      )
      .subscribe()
  }
}

export const databaseService = DatabaseService.getInstance()
