import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Clock, Target, Zap } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

interface TimerSettingsDialogProps {
  children: React.ReactNode
}

export function TimerSettingsDialog({ children }: TimerSettingsDialogProps) {
  const { user, updateUser } = useUser()
  const [open, setOpen] = useState(false)
  const [selectedTimerType, setSelectedTimerType] = useState<'linear' | 'circular'>(
    user?.timerType || 'linear'
  )

  const handleTimerTypeChange = async (type: 'linear' | 'circular') => {
    setSelectedTimerType(type)
    if (user) {
      await updateUser({ timerType: type })
    }
  }

  const timerOptions = [
    {
      type: 'linear' as const,
      name: 'Linear Timer',
      description: 'Classic progress bar with traditional countdown display',
      features: [
        'Linear progress bar',
        'Traditional countdown',
        'Manual session control',
        'Flexible duration settings'
      ],
      icon: Clock,
      color: 'text-blue-500'
    },
    {
      type: 'circular' as const,
      name: 'Circular Timer',
      description: 'Modern session-based Pomodoro with circular progress',
      features: [
        'Circular progress ring',
        'Session-based workflow',
        'Auto-progression',
        'Deterministic timing'
      ],
      icon: Target,
      color: 'text-purple-500'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Timer Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Choose Your Timer Style</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select the timer interface that works best for your focus workflow.
            </p>
          </div>

          <div className="grid gap-4">
            {timerOptions.map((option) => (
              <Card
                key={option.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTimerType === option.type
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleTimerTypeChange(option.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <option.icon className={`h-6 w-6 ${option.color}`} />
                      <div>
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                    {selectedTimerType === option.type && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Features:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
