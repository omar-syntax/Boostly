import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Clock, Coffee, Zap } from "lucide-react"
import { sessionTemplates, SessionTemplate, getDefaultTemplate } from "@/lib/sessionTemplates"

interface CustomSessionDialogProps {
  children: React.ReactNode
  currentTemplate: SessionTemplate
  onTemplateChange: (template: SessionTemplate) => void
  onCustomDurationsChange: (durations: {
    workDuration: number
    shortBreakDuration: number
    longBreakDuration: number
    sessionsUntilLongBreak: number
  }) => void
}

export function CustomSessionDialog({
  children,
  currentTemplate,
  onTemplateChange,
  onCustomDurationsChange
}: CustomSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplate.id)
  const [customDurations, setCustomDurations] = useState({
    workDuration: currentTemplate.workDuration,
    shortBreakDuration: currentTemplate.shortBreakDuration,
    longBreakDuration: currentTemplate.longBreakDuration,
    sessionsUntilLongBreak: currentTemplate.sessionsUntilLongBreak
  })

  const selectedTemplate = sessionTemplates.find(t => t.id === selectedTemplateId) || getDefaultTemplate()

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = sessionTemplates.find(t => t.id === templateId)
    if (template) {
      onTemplateChange(template)
      setCustomDurations({
        workDuration: template.workDuration,
        shortBreakDuration: template.shortBreakDuration,
        longBreakDuration: template.longBreakDuration,
        sessionsUntilLongBreak: template.sessionsUntilLongBreak
      })
    }
  }

  const handleCustomDurationChange = () => {
    onCustomDurationsChange(customDurations)
    const customTemplate: SessionTemplate = {
      id: 'custom',
      name: 'Custom',
      description: 'Custom session durations',
      workDuration: customDurations.workDuration,
      shortBreakDuration: customDurations.shortBreakDuration,
      longBreakDuration: customDurations.longBreakDuration,
      sessionsUntilLongBreak: customDurations.sessionsUntilLongBreak,
      category: 'custom',
      pointsPerWorkSession: Math.round(customDurations.workDuration * 2),
      pointsPerShortBreak: Math.round(customDurations.shortBreakDuration * 2),
      pointsPerLongBreak: Math.round(customDurations.longBreakDuration * 2)
    }
    onTemplateChange(customTemplate)
    setOpen(false)
  }

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
    }
    return `${minutes}m`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Session Settings
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Template Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Ready Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sessionTemplates.filter(t => t.id !== 'custom').map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplateId === template.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <Badge variant={template.category === 'classic' ? 'default' : 'secondary'}>
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(template.workDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coffee className="h-3 w-3" />
                        <span>{formatTime(template.shortBreakDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{template.pointsPerWorkSession} pts</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Duration Settings */}
          <div className="border-t pt-6">
            <Label className="text-base font-medium mb-3 block">Custom Durations</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-duration">Focus Session (minutes)</Label>
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="180"
                  value={customDurations.workDuration}
                  onChange={(e) => setCustomDurations(prev => ({
                    ...prev,
                    workDuration: parseInt(e.target.value) || 25
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-break">Short Break (minutes)</Label>
                <Input
                  id="short-break"
                  type="number"
                  min="1"
                  max="60"
                  value={customDurations.shortBreakDuration}
                  onChange={(e) => setCustomDurations(prev => ({
                    ...prev,
                    shortBreakDuration: parseInt(e.target.value) || 5
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long-break">Long Break (minutes)</Label>
                <Input
                  id="long-break"
                  type="number"
                  min="1"
                  max="120"
                  value={customDurations.longBreakDuration}
                  onChange={(e) => setCustomDurations(prev => ({
                    ...prev,
                    longBreakDuration: parseInt(e.target.value) || 15
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessions-until-long">Sessions Until Long Break</Label>
                <Select
                  value={customDurations.sessionsUntilLongBreak.toString()}
                  onValueChange={(value) => setCustomDurations(prev => ({
                    ...prev,
                    sessionsUntilLongBreak: parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} session{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Points calculation:</strong> Focus: {Math.round(customDurations.workDuration * 2)} pts, 
                Short Break: {Math.round(customDurations.shortBreakDuration * 2)} pts, 
                Long Break: {Math.round(customDurations.longBreakDuration * 2)} pts
              </p>
            </div>

            <Button onClick={handleCustomDurationChange} className="w-full mt-4">
              Apply Custom Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
