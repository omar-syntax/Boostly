import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FocusStatsDialog } from "@/components/FocusStatsDialog"
import { CustomSessionDialog } from "@/components/CustomSessionDialog"
import { TimerSettingsDialog } from "@/components/TimerSettingsDialog"
import { CircularProgress } from "@/components/ui/CircularProgress"
import { useUser } from "@/contexts/UserContext"
import { ForestContainer } from "@/components/Forest/ForestContainer"
import { useFocusTimer, SessionType } from "@/hooks/useFocusTimer"
import { useSessionCore } from "@/hooks/useSessionCore"
import { useSessionSideEffects } from "@/hooks/useSessionSideEffects"
import { SessionTemplate, getDefaultTemplate } from "@/lib/sessionTemplates"
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Settings,
  Target,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  CheckCircle,
} from "lucide-react"

interface FocusSession {
  id: string
  type: string
  duration: number
  completedAt: Date
  points: number
  tree_type?: string
}

// Linear Timer Component
function LinearTimer({ 
  timer, 
  sessionDurations, 
  sessionLabels, 
  sessionPoints, 
  formatTime, 
  switchSessionType,
  currentSession,
  currentTemplate 
}: any) {
  return (
    <Card className="p-8 flex flex-col items-center justify-center grow shrink-0 min-h-[400px]">
      {/* Session Type Selector */}
      <div className="flex justify-center gap-2 mb-8">
        <Button
          variant={timer.type === "work" ? "default" : "outline"}
          size="sm"
          onClick={() => switchSessionType("work")}
          className="rounded-full px-6"
        >
          Focus
        </Button>
        <Button
          variant={timer.type === "shortBreak" ? "default" : "outline"}
          size="sm"
          onClick={() => switchSessionType("shortBreak")}
          className="rounded-full px-6"
        >
          Short Break
        </Button>
        <Button
          variant={timer.type === "longBreak" ? "default" : "outline"}
          size="sm"
          onClick={() => switchSessionType("longBreak")}
          className="rounded-full px-6"
        >
          Long Break
        </Button>
      </div>

      {/* Timer Display */}
      <div className="relative text-center mb-8">
        <div
          className={`text-8xl md:text-9xl font-bold mb-4 tabular-nums tracking-tight ${timer.type === "work" ? "text-primary" :
            timer.type === "shortBreak" ? "text-success" : "text-secondary"
            }`}
        >
          {formatTime(timer.timeLeft)}
        </div>

        <Badge variant="outline" className="text-lg px-4 py-1">
          {sessionLabels[timer.type]} • Session {currentSession}/{currentTemplate.sessionsUntilLongBreak}
        </Badge>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <Progress
          value={timer.progress}
          className="w-full h-3"
        />

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {timer.state === "idle" || timer.state === "paused" ? (
            <Button
              onClick={timer.start}
              size="lg"
              className="gradient-primary px-12 h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="h-6 w-6 mr-2 fill-current" />
              {timer.state === "paused" ? "Resume" : "Start"}
            </Button>
          ) : (
            <Button
              onClick={timer.pause}
              size="lg"
              variant="secondary"
              className="px-12 h-14 text-lg rounded-full"
            >
              <Pause className="h-6 w-6 mr-2 fill-current" />
              Pause
            </Button>
          )}

          <Button
            onClick={() => timer.reset(sessionDurations[timer.type])}
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full p-0"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Circular Timer Component
function CircularTimerComponent({ 
  session, 
  currentTemplate, 
  formatTime, 
  getSessionTypeColor, 
  getSessionProgressColor 
}: any) {
  return (
    <Card className="p-8 flex flex-col items-center justify-center grow shrink-0 min-h-[400px]">
      {/* Session Type Display */}
      <div className="text-center mb-6">
        <Badge variant="outline" className="text-lg px-4 py-2">
          {session.sessionLabel} • Session {session.sessionNumber}/{currentTemplate.sessionsUntilLongBreak}
        </Badge>
      </div>

      {/* Circular Timer */}
      <div className="relative mb-8">
        <CircularProgress 
          progress={session.progress} 
          size={240} 
          strokeWidth={12}
          className={getSessionProgressColor(session.sessionType)}
        >
          <div className="text-center">
            <div className={`text-6xl md:text-7xl font-bold tabular-nums tracking-tight ${getSessionTypeColor(session.sessionType)}`}>
              {formatTime(session.timeLeft)}
            </div>
            
            {session.sessionStatus === 'completed' && (
              <div className="flex items-center justify-center mt-2 text-success">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Completed!</span>
              </div>
            )}
          </div>
        </CircularProgress>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {session.canStartSession ? (
          <Button
            onClick={session.startSession}
            size="lg"
            className="gradient-primary px-12 h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="h-6 w-6 mr-2 fill-current" />
            Start Session
          </Button>
        ) : session.sessionStatus === 'running' ? (
          <Button
            onClick={session.completeSession}
            size="lg"
            variant="secondary"
            className="px-12 h-14 text-lg rounded-full"
          >
            <CheckCircle className="h-6 w-6 mr-2" />
            Complete
          </Button>
        ) : null}

        {session.canSkipSession && (
          <Button
            onClick={session.skipToNextSession}
            size="lg"
            variant="outline"
            className="h-14 px-6 rounded-full"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Skip
          </Button>
        )}

        <Button
          onClick={session.resetSession}
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full p-0"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>
    </Card>
  )
}

export default function Focus() {
  const { user } = useUser()
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [forestSessions, setForestSessions] = useState<any[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTemplate, setCurrentTemplate] = useState<SessionTemplate>(getDefaultTemplate())
  const [currentSession, setCurrentSession] = useState(1)

  // Determine which timer to use based on user preference
  const timerType = user?.timerType || 'linear'

  // Initialize appropriate timer based on preference
  const linearTimer = useFocusTimer({
    onComplete: () => handleLinearComplete(),
    initialDuration: currentTemplate.workDuration * 60
  })

  const sessionTimer = useSessionCore({
    focusDuration: currentTemplate.workDuration,
    shortBreakDuration: currentTemplate.shortBreakDuration,
    longBreakDuration: currentTemplate.longBreakDuration,
    sessionsUntilLongBreak: currentTemplate.sessionsUntilLongBreak
  })

  // Handle side effects for circular timer
  useSessionSideEffects({
    state: sessionTimer.state,
    soundEnabled
  })

  // Linear timer completion handler
  const handleLinearComplete = () => {
    // Play sound
    if (soundEnabled) {
      // playCompletionSound() - Uncomment when available
    }

    // Update user stats and save to database (same logic as before)
    // This would be implemented similar to the original Focus.tsx
  }

  // Fetch sessions on mount
  useEffect(() => {
    if (!user?.id) return

    const fetchSessions = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: true })

      if (error) {
        console.error('Error fetching sessions:', error)
        return
      }

      setForestSessions(data || [])

      const todaySessionsRaw = data?.filter(s => new Date(s.completed_at) >= today) || []
      const mappedTodaySessions: FocusSession[] = todaySessionsRaw.map(s => ({
        id: s.id,
        type: s.session_type || 'work',
        duration: s.duration,
        completedAt: new Date(s.completed_at),
        points: s.points_earned,
        tree_type: s.tree_type
      })).reverse()

      setSessions(mappedTodaySessions)
    }

    fetchSessions()
  }, [user?.id])

  // Update session config when template changes
  useEffect(() => {
    if (timerType === 'circular') {
      sessionTimer.updateConfig({
        focusDuration: currentTemplate.workDuration,
        shortBreakDuration: currentTemplate.shortBreakDuration,
        longBreakDuration: currentTemplate.longBreakDuration,
        sessionsUntilLongBreak: currentTemplate.sessionsUntilLongBreak
      })
    }
  }, [currentTemplate, sessionTimer, timerType])

  // Format helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Helper functions for linear timer
  const sessionDurations = {
    work: currentTemplate.workDuration * 60,
    shortBreak: currentTemplate.shortBreakDuration * 60,
    longBreak: currentTemplate.longBreakDuration * 60
  }

  const sessionLabels = {
    work: "Focus Time",
    shortBreak: "Short Break",
    longBreak: "Long Break"
  }

  const switchSessionType = (type: any) => {
    linearTimer.setType(type)
    linearTimer.reset(sessionDurations[type])
  }

  // Helper functions for circular timer
  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'focus': return 'text-primary'
      case 'shortBreak': return 'text-success'
      case 'longBreak': return 'text-secondary'
      default: return 'text-primary'
    }
  }

  const getSessionProgressColor = (type: string) => {
    switch (type) {
      case 'focus': return 'text-primary'
      case 'shortBreak': return 'text-success'
      case 'longBreak': return 'text-secondary'
      default: return 'text-muted'
    }
  }

  const completedToday = sessions.filter(s => s.type === "focus").length
  const pointsToday = sessions.reduce((sum, s) => sum + s.points, 0)
  const focusTimeToday = sessions.filter(s => s.type === "focus").reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="flex flex-col md:h-[calc(100vh-2rem)] gap-4 md:flex-row overflow-hidden">

      {/* Left Section: Timer & Controls (50%) */}
      <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto pr-2 pb-20 md:pb-2">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold">Focus Room</h1>
            <p className="text-muted-foreground">Stay focused, grow your forest.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <TimerSettingsDialog>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </TimerSettingsDialog>
            <CustomSessionDialog
              currentTemplate={currentTemplate}
              onTemplateChange={(template) => {
                setCurrentTemplate(template)
                // Reset current timer with new template durations
                if (timerType === 'linear') {
                  linearTimer.reset(sessionDurations[linearTimer.type])
                }
              }}
              onCustomDurationsChange={() => {
                // Handled in the dialog component
              }}
            >
              <Button variant="outline" size="icon">
                <Target className="h-4 w-4" />
              </Button>
            </CustomSessionDialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          <Card className="p-3 glass-card flex flex-col items-center justify-center">
            <div className="text-xl font-bold">
              {timerType === 'linear' ? currentSession : sessionTimer.completedSessions}
            </div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </Card>
          <Card className="p-3 glass-card flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{focusTimeToday}m</div>
            <div className="text-xs text-muted-foreground">Focus</div>
          </Card>
          <Card className="p-3 glass-card flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{pointsToday}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </Card>
          <Card className="p-3 glass-card flex flex-col items-center justify-center">
            <FocusStatsDialog>
              <div className="flex flex-col items-center cursor-pointer hover:bg-white/5 transition-colors rounded p-2 -m-2">
                <Zap className="h-5 w-5 text-primary mb-1" />
                <div className="text-xs font-medium">Stats</div>
              </div>
            </FocusStatsDialog>
          </Card>
        </div>

        {/* Timer Component - Conditional Rendering */}
        {timerType === 'linear' ? (
          <LinearTimer
            timer={linearTimer}
            sessionDurations={sessionDurations}
            sessionLabels={sessionLabels}
            sessionPoints={{}} // Add if needed
            formatTime={formatTime}
            switchSessionType={switchSessionType}
            currentSession={currentSession}
            currentTemplate={currentTemplate}
          />
        ) : (
          <CircularTimerComponent
            session={sessionTimer}
            currentTemplate={currentTemplate}
            formatTime={formatTime}
            getSessionTypeColor={getSessionTypeColor}
            getSessionProgressColor={getSessionProgressColor}
          />
        )}

        {/* Today's History */}
        <Card className="p-4 flex-1 overflow-hidden flex flex-col min-h-[200px]">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Recent Activity
          </h3>
          <div className="space-y-2 overflow-y-auto pr-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sessions today</p>
            ) : (
              sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${session.type === 'focus' ? 'bg-primary' : 'bg-success'}`} />
                    <span>{session.type === 'focus' ? 'Focus Session' : session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {session.duration}m • {session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Right Section: Forest (50%) */}
      <div className="w-full md:w-1/2 h-[400px] md:h-full relative rounded-xl overflow-hidden shadow-2xl border border-border/50 shrink-0">
        <ForestContainer
          sessions={forestSessions}
          currentSession={{
            active: timerType === 'linear' 
              ? linearTimer.type === 'work' && (linearTimer.state === 'running' || linearTimer.progress > 0)
              : sessionTimer.sessionType === 'focus' && sessionTimer.sessionStatus === 'running',
            progress: timerType === 'linear' ? linearTimer.progress / 100 : sessionTimer.progress / 100,
            type: 'tree'
          }}
          className="w-full h-full"
        />

        {/* Overlay Info */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded badge border border-border/50 text-xs font-mono z-20">
          Total Trees: {forestSessions.length}
        </div>
      </div>
    </div>
  )
}
