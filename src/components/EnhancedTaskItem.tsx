import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Calendar,
  CheckCircle2,
  Circle,
  X,
  Trash2,
  CalendarPlus
} from "lucide-react"

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  subtasks?: ChecklistItem[]
  parentTaskId?: string
  projectId?: string
  priority?: "low" | "medium" | "high"
  dueTime?: string
}

interface EnhancedTaskItemProps {
  task: ChecklistItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onAddSubtask: (parentId: string, text: string) => void
  onToggleSubtask: (parentId: string, subtaskId: string) => void
  onRemoveSubtask: (parentId: string, subtaskId: string) => void
  onAddToDailyTasks: (task: ChecklistItem) => void
  level?: number
}

export function EnhancedTaskItem({ 
  task, 
  onToggle, 
  onRemove, 
  onAddSubtask, 
  onToggleSubtask, 
  onRemoveSubtask,
  onAddToDailyTasks,
  level = 0 
}: EnhancedTaskItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [newSubtask, setNewSubtask] = useState("")
  const [showAddToDailyDialog, setShowAddToDailyDialog] = useState(false)
  const [dailyTaskPriority, setDailyTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [dailyTaskDueTime, setDailyTaskDueTime] = useState("")

  const hasSubtasks = task.subtasks && task.subtasks.length > 0
  const allSubtasksCompleted = hasSubtasks && task.subtasks.every(st => st.completed)
  const shouldShowTaskCompleted = task.completed || (hasSubtasks && allSubtasksCompleted)

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim())
      setNewSubtask("")
    }
  }

  const handleAddToDailyTasks = () => {
    const taskForDaily = {
      ...task,
      priority: dailyTaskPriority,
      dueTime: dailyTaskDueTime
    }
    onAddToDailyTasks(taskForDaily)
    setShowAddToDailyDialog(false)
    setDailyTaskPriority("medium")
    setDailyTaskDueTime("")
  }

  return (
    <>
      <div className={`space-y-2 ${level > 0 ? 'ml-6' : ''}`}>
        {/* Main Task */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => onToggle(task.id)}
          >
            {shouldShowTaskCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          
          <span className={`flex-1 ${shouldShowTaskCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.text}
          </span>
          
          <div className="flex items-center gap-1">
            {hasSubtasks && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowSubtasks(!showSubtasks)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showSubtasks ? 'rotate-180' : ''}`} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Add Subtask Input */}
        {showSubtasks && (
          <div className="flex items-center gap-2 ml-9">
            <Input
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
              className="flex-1 h-8"
            />
            <Button onClick={handleAddSubtask} size="sm">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Subtasks */}
        {showSubtasks && hasSubtasks && (
          <div className="space-y-1 ml-9">
            {task.subtasks!.map(subtask => (
              <EnhancedTaskItem
                key={subtask.id}
                task={subtask}
                level={level + 1}
                onToggle={onToggleSubtask}
                onRemove={onRemoveSubtask}
                onAddSubtask={onAddSubtask}
                onToggleSubtask={onToggleSubtask}
                onRemoveSubtask={onRemoveSubtask}
                onAddToDailyTasks={onAddToDailyTasks}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add to Daily Tasks Button */}
      <div className="flex items-center gap-2 ml-9 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddToDailyDialog(true)}
          className="text-xs"
        >
          <CalendarPlus className="h-3 w-3 mr-1" />
          Add to Today's Tasks
        </Button>
      </div>

      {/* Add to Daily Tasks Dialog */}
      <Dialog open={showAddToDailyDialog} onOpenChange={setShowAddToDailyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Today's Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task</Label>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {task.text}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={dailyTaskPriority} onValueChange={(value: "low" | "medium" | "high") => setDailyTaskPriority(value)}>
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

            <div className="space-y-2">
              <Label>Due Time (Optional)</Label>
              <Input
                type="time"
                value={dailyTaskDueTime}
                onChange={(e) => setDailyTaskDueTime(e.target.value)}
                placeholder="e.g., 2:00 PM"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddToDailyDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddToDailyTasks}
                className="flex-1"
              >
                Add to Today
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
