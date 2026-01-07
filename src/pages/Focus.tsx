import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FocusStatsDialog } from "@/components/FocusStatsDialog"
import { useUser } from "@/contexts/UserContext"
import { playCompletionSound } from "@/utils/sounds"
import { supabase } from "@/lib/supabase"
import { TreeIcon } from "@/components/Forest/TreeIcon"
import { useFocusTimer, SessionType } from "@/hooks/useFocusTimer"
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Coffee,
  Target,
  Star,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  ArrowRight
} from "lucide-react"
import { Link } from "react-router-dom"

const POMODORO_TIME = 25 * 60
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60

interface FocusSession {
  id: string
  type: SessionType
  duration: number
  completedAt: Date
  points: number
}

// Initial demo data for stats 
const todaySessions: FocusSession[] = []

export default function Focus() {
  const { user, updateUser } = useUser()
  const [sessions, setSessions] = useState<FocusSession[]>(todaySessions)
  const [currentSession, setCurrentSession] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)

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
      if (completedType === "work") {
        supabase.from('focus_sessions').insert({
          user_id: user.id,
          duration: durationMinutes,
          completed: true,
          tree_type: treeType,
          points_earned: pointsEarned,
          completed_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error("Error saving focus session:", error)
        })
      }
    }

    // Record Session Locally (for this view)
    const newSession: FocusSession = {
      id: Date.now().toString(),
      type: completedType,
      duration: durationMinutes,
      completedAt: new Date(),
      points: sessionPoints[completedType]
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

      // We must reset the timer with the new type's duration
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

  // Tree Animation Calc
  const treeScale = 0.5 + (0.5 * (timer.progress / 100))

  const completedToday = sessions.filter(s => s.type === "work").length
  const pointsToday = sessions.reduce((sum, s) => sum + s.points, 0)
  const focusTimeToday = sessions.filter(s => s.type === "work").reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Focus Room</h1>
          <p className="text-muted-foreground">Boost your productivity with focused work sessions</p>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/forest">
            <Button variant="outline" className="gap-2 text-success border-success/20 hover:bg-success/5">
              <TreeIcon type="tree" className="h-4 w-4" />
              Go to Forest
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedToday}</div>
              <div className="text-sm text-muted-foreground">Sessions Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{focusTimeToday}m</div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-motivation/10">
              <Star className="h-6 w-6 text-motivation" />
            </div>
            <div>
              <div className="text-2xl font-bold">{pointsToday}</div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <Zap className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round((completedToday / 8) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Daily Goal</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Timer */}
      <Card className="p-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          {/* Session Type Selector */}
          <div className="flex justify-center gap-2">
            <Button
              variant={timer.type === "work" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("work")}
            >
              Focus
            </Button>
            <Button
              variant={timer.type === "shortBreak" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("shortBreak")}
            >
              Short Break
            </Button>
            <Button
              variant={timer.type === "longBreak" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("longBreak")}
            >
              Long Break
            </Button>
          </div>

          {/* Current Session Info */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{sessionLabels[timer.type]}</h2>
            <Badge variant="outline">Session {currentSession}/4</Badge>
          </div>

          {/* Growing Tree Animation Area */}
          <div className="flex items-center justify-center h-24 relative">
            {timer.type === 'work' ? (
              <div style={{ transform: `scale(${timer.state === 'running' || timer.progress > 0 ? treeScale : 0.5})` }} className="transition-transform duration-1000 ease-in-out">
                <TreeIcon
                  type={getTreeType(sessionDurations[timer.type] / 60)}
                  stage={timer.progress < 20 ? 'seed' : timer.progress < 50 ? 'sapling' : 'growing'}
                  className="w-16 h-16"
                />
              </div>
            ) : (
              <Coffee className="w-12 h-12 text-muted-foreground/50 animate-pulse" />
            )}
          </div>

          {/* Timer Display */}
          <div className="relative">
            <div
              className={`text-8xl font-bold mb-4 ${timer.type === "work" ? "text-primary" :
                timer.type === "shortBreak" ? "text-success" : "text-secondary"
                }`}
            >
              {formatTime(timer.timeLeft)}
            </div>

            <Progress
              value={timer.progress}
              className="w-full h-2 mb-6"
            />
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-4">
            {timer.state === "idle" || timer.state === "paused" ? (
              <Button
                onClick={timer.start}
                size="lg"
                className="gradient-primary px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                {timer.state === "paused" ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button
                onClick={timer.pause}
                size="lg"
                variant="secondary"
                className="px-8"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}

            <Button
              onClick={() => timer.reset(sessionDurations[timer.type])}
              size="lg"
              variant="outline"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Session Info */}
          <div className="text-sm text-muted-foreground">
            <p>Earn <span className="font-semibold text-warning">{sessionPoints[timer.type]} points</span> when you complete this session</p>
          </div>
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Today's Sessions</h3>
          <p className="text-sm text-muted-foreground">Your focus sessions for today</p>
        </div>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions completed today</p>
              <p className="text-sm">Start your first focus session above!</p>
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${session.type === "work" ? "bg-primary/10" :
                    session.type === "shortBreak" ? "bg-success/10" : "bg-secondary/10"
                    }`}>
                    {session.type === "work" ?
                      <Target className="h-5 w-5 text-primary" /> :
                      <Coffee className="h-5 w-5 text-success" />
                    }
                  </div>

                  <div>
                    <div className="font-medium">
                      {sessionLabels[session.type]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.duration} minutes • {session.completedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Star className="h-3 w-3 mr-1" />
                    {session.points}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Motivational Section */}
      <Card className="p-6 gradient-hero text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">🎯 Focus Mode Active</h3>
          <p className="text-white/90 mb-4">
            Deep work is like a superpower in our increasingly competitive economy. Stay focused and achieve more!
          </p>
          <FocusStatsDialog>
            <Button variant="glass" size="lg">
              View Focus Statistics
            </Button>
          </FocusStatsDialog>
        </div>
      </Card>
    </div>
  )
}