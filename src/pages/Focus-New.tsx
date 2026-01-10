import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FocusStatsDialog } from "@/components/FocusStatsDialog"
import { CustomSessionDialog } from "@/components/CustomSessionDialog"
import { CircularProgress } from "@/components/ui/CircularProgress"
import { useUser } from "@/contexts/UserContext"
import { ForestContainer } from "@/components/Forest/ForestContainer"
import { useSessionCore } from "@/hooks/useSessionCore"
import { useSessionSideEffects } from "@/hooks/useSessionSideEffects"
import { SessionTemplate, getDefaultTemplate } from "@/lib/sessionTemplates"
import {
  Play,
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

export default function Focus() {
  const { user } = useUser()
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [forestSessions, setForestSessions] = useState<any[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTemplate, setCurrentTemplate] = useState<SessionTemplate>(getDefaultTemplate())

  // Initialize session core with template config
  const session = useSessionCore({
    focusDuration: currentTemplate.workDuration,
    shortBreakDuration: currentTemplate.shortBreakDuration,
    longBreakDuration: currentTemplate.longBreakDuration,
    sessionsUntilLongBreak: currentTemplate.sessionsUntilLongBreak
  })

  // Handle side effects (sound, points, database)
  useSessionSideEffects({
    state: session.state,
    soundEnabled
  })

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
    session.updateConfig({
      focusDuration: currentTemplate.workDuration,
      shortBreakDuration: currentTemplate.shortBreakDuration,
      longBreakDuration: currentTemplate.longBreakDuration,
      sessionsUntilLongBreak: currentTemplate.sessionsUntilLongBreak
    })
  }, [currentTemplate, session])

  // Format helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
            <CustomSessionDialog
              currentTemplate={currentTemplate}
              onTemplateChange={(template) => {
                setCurrentTemplate(template)
              }}
              onCustomDurationsChange={() => {
                // Handled in the dialog component
              }}
            >
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </CustomSessionDialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          <Card className="p-3 glass-card flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{session.completedSessions}</div>
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

        {/* Main Timer */}
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
            active: session.sessionType === 'focus' && session.sessionStatus === 'running',
            progress: session.progress / 100,
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
