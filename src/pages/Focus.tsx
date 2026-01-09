import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FocusStatsDialog } from "@/components/FocusStatsDialog"
import { useUser } from "@/contexts/UserContext"
import { playCompletionSound } from "@/utils/sounds"
import { supabase } from "@/lib/supabase"
import { ForestContainer } from "@/components/Forest/ForestContainer"
import { useFocusTimer, SessionType } from "@/hooks/useFocusTimer"
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Target,
  Clock,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react"

const POMODORO_TIME = 25 * 60
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60

interface FocusSession {
  id: string
  type: SessionType
  duration: number
  completedAt: Date
  points: number
  tree_type?: string
}

export default function Focus() {
  const { user, updateUser } = useUser()
  const [sessions, setSessions] = useState<FocusSession[]>([]) // For stats (Today)
  const [forestSessions, setForestSessions] = useState<any[]>([]) // For Forest (All time)
  const [currentSession, setCurrentSession] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)

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
        .order('completed_at', { ascending: true }) // Oldest first for Forest growth

      if (error) {
        console.error('Error fetching sessions:', error)
        return
      }

      // Process for Forest (All time, ordered by date for stable index)
      setForestSessions(data || [])

      // Process for Dashboard Stats (Today only)
      const todaySessionsRaw = data?.filter(s => new Date(s.completed_at) >= today) || []

      const mapType = (points: number): SessionType => {
        if (points === 50) return 'work'
        if (points === 10) return 'shortBreak'
        if (points === 15) return 'longBreak'
        return 'work'
      }

      const mappedTodaySessions: FocusSession[] = todaySessionsRaw.map(s => ({
        id: s.id,
        type: mapType(s.points_earned),
        duration: s.duration,
        completedAt: new Date(s.completed_at),
        points: s.points_earned,
        tree_type: s.tree_type
      })).reverse() // Show newest first in list

      setSessions(mappedTodaySessions)
    }

    fetchSessions()
  }, [user?.id])

  const sessionDurations = {
    work: POMODORO_TIME,
    shortBreak: SHORT_BREAK,
    longBreak: LONG_BREAK
  }

  const sessionLabels = {
    work: "Focus Time",
    shortBreak: "Short Break",
    longBreak: "Long Break"
  }

  const sessionPoints = {
    work: 50,
    shortBreak: 10,
    longBreak: 15
  }

  const getTreeType = (durationMinutes: number) => {
    if (durationMinutes < 25) return 'sapling'
    if (durationMinutes < 50) return 'tree'
    return 'large_tree'
  }

  const handleComplete = () => {
    // Play Sound
    if (soundEnabled) {
      playCompletionSound()
    }

    const completedType = timer.type
    const pointsEarned = sessionPoints[completedType]
    const durationMinutes = sessionDurations[completedType] / 60
    const treeType = getTreeType(durationMinutes)

    // Add Points and Stats
    if (user) {
      const durationHours = sessionDurations[completedType] / 3600

      updateUser({
        points: user.points + pointsEarned,
        weeklyPoints: user.weeklyPoints + pointsEarned,
        focusHours: user.focusHours + durationHours
      })

      // Save to Supabase (Forest)
      const newSessionData = {
        user_id: user.id,
        duration: durationMinutes,
        completed: true,
        tree_type: treeType,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      }

      supabase.from('focus_sessions').insert(newSessionData)
        .select()
        .then(({ data, error }) => {
          if (error) console.error("Error saving focus session:", error)
          if (data) {
            // Update local forest state
            setForestSessions(prev => [...prev, data[0]])
          }
        })
    }

    // Record Session Locally (for this view)
    const newSession: FocusSession = {
      id: Date.now().toString(),
      type: completedType,
      duration: durationMinutes,
      completedAt: new Date(),
      points: sessionPoints[completedType],
      tree_type: treeType
    }

    setSessions(prev => [newSession, ...prev])

    // Auto-switch logic
    if (completedType === "work") {
      const nextType = currentSession % 4 === 0 ? "longBreak" : "shortBreak"

      if (nextType === "longBreak") {
        setCurrentSession(1)
      } else {
        setCurrentSession(prev => prev + 1)
      }

      timer.setType(nextType)
      timer.reset(sessionDurations[nextType])
    } else {
      timer.setType("work")
      timer.reset(sessionDurations.work)
    }
  }

  const timer = useFocusTimer({
    onComplete: handleComplete
  })

  // Format helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const switchSessionType = (type: SessionType) => {
    timer.setType(type)
    timer.reset(sessionDurations[type])
  }

  const completedToday = sessions.filter(s => s.type === "work").length
  const pointsToday = sessions.reduce((sum, s) => sum + s.points, 0)
  const focusTimeToday = sessions.filter(s => s.type === "work").reduce((sum, s) => sum + s.duration, 0)

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
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          <Card className="p-3 glass-card flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{completedToday}</div>
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
          <Card className="p-3 glass-card flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
            <FocusStatsDialog>
              <div className="flex flex-col items-center">
                <Zap className="h-5 w-5 text-primary mb-1" />
                <div className="text-xs font-medium">Stats</div>
              </div>
            </FocusStatsDialog>
          </Card>
        </div>

        {/* Main Timer */}
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
              {sessionLabels[timer.type]} • Session {currentSession}/4
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

        {/* Today's History (Compact) */}
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
                    <div className={`w-2 h-2 rounded-full ${session.type === 'work' ? 'bg-primary' : 'bg-success'}`} />
                    <span>{sessionLabels[session.type]}</span>
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
      {/* Mobile: Order 2 (default). Desktop: same. Flex-col flips it on mobile? No, flex-col stacks them. */}
      {/* On mobile we want trees below focus. Flex-col puts first child on top. So Timer is top. Correct. */}
      <div className="w-full md:w-1/2 h-[400px] md:h-full relative rounded-xl overflow-hidden shadow-2xl border border-border/50 shrink-0">
        <ForestContainer
          sessions={forestSessions}
          currentSession={{
            active: timer.type === 'work' && (timer.state === 'running' || timer.progress > 0),
            progress: timer.progress / 100, // Normalize to 0-1
            type: 'tree' // Simplified
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