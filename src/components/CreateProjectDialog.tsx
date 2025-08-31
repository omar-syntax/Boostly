import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { CalendarIcon, Plus, Briefcase, Heart, Book, Dumbbell, Target, Lightbulb } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface Project {
  id: string
  title: string
  description: string
  progress: number
  category: string
  startDate: Date
  dueDate: Date
  priority: "low" | "medium" | "high"
  tasks: {
    total: number
    completed: number
  }
  collaborators: number
  points: number
  color: string
  icon: any
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

interface CreateProjectDialogProps {
  onProjectCreated: (project: Project) => void
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: undefined as Date | undefined
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "", 
      category: "",
      priority: "medium",
      dueDate: undefined
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.category || !formData.dueDate) {
      return
    }

    const newProject: Project = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      progress: 0,
      category: formData.category,
      startDate: new Date(),
      dueDate: formData.dueDate,
      priority: formData.priority,
      tasks: { total: 0, completed: 0 },
      collaborators: 0,
      points: 0,
      color: categoryColors[formData.category as keyof typeof categoryColors] || "bg-primary",
      icon: categoryIcons[formData.category as keyof typeof categoryIcons] || Target
    }

    onProjectCreated(newProject)
    setOpen(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create New Project
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Describe your project goals and what you want to achieve..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

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
            <Label>Target Completion Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData({...formData, dueDate: date})}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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