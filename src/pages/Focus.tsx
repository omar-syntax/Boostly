import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
  VolumeX
} from "lucide-react"

const POMODORO_TIME = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK = 5 * 60 // 5 minutes
const LONG_BREAK = 15 * 60 // 15 minutes

type SessionType = "work" | "shortBreak" | "longBreak"
type TimerState = "idle" | "running" | "paused"

interface FocusSession {
  id: string
  type: SessionType
  duration: number
  completedAt: Date
  points: number
}

const todaySessions: FocusSession[] = [
  {
    id: "1",
    type: "work",
    duration: 25,
    completedAt: new Date(Date.now() - 3600000),
    points: 50
  },
  {
    id: "2",
    type: "work", 
    duration: 25,
    completedAt: new Date(Date.now() - 1800000),
    points: 50
  }
]

export default function Focus() {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME)
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [sessionType, setSessionType] = useState<SessionType>("work")
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

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timerState === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerState === "running") {
      // Session completed
      completeSession()
    }

    return () => clearInterval(interval)
  }, [timerState, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    setTimerState("running")
  }

  const pauseTimer = () => {
    setTimerState("paused")
  }

  const resetTimer = () => {
    setTimerState("idle")
    setTimeLeft(sessionDurations[sessionType])
  }

  const completeSession = () => {
    const newSession: FocusSession = {
      id: Date.now().toString(),
      type: sessionType,
      duration: sessionType === "work" ? 25 : sessionType === "shortBreak" ? 5 : 15,
      completedAt: new Date(),
      points: sessionPoints[sessionType]
    }
    
    setSessions(prev => [newSession, ...prev])
    setTimerState("idle")
    
    // Auto-switch to next session type
    if (sessionType === "work") {
      const nextType = currentSession % 4 === 0 ? "longBreak" : "shortBreak"
      setSessionType(nextType)
      setTimeLeft(sessionDurations[nextType])
      if (nextType === "longBreak") {
        setCurrentSession(1)
      } else {
        setCurrentSession(prev => prev + 1)
      }
    } else {
      setSessionType("work")
      setTimeLeft(sessionDurations.work)
    }
  }

  const switchSessionType = (type: SessionType) => {
    setSessionType(type)
    setTimeLeft(sessionDurations[type])
    setTimerState("idle")
  }

  const progress = ((sessionDurations[sessionType] - timeLeft) / sessionDurations[sessionType]) * 100
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
              variant={sessionType === "work" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("work")}
            >
              Focus
            </Button>
            <Button 
              variant={sessionType === "shortBreak" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("shortBreak")}
            >
              Short Break
            </Button>
            <Button 
              variant={sessionType === "longBreak" ? "default" : "outline"}
              size="sm"
              onClick={() => switchSessionType("longBreak")}
            >
              Long Break
            </Button>
          </div>

          {/* Current Session Info */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{sessionLabels[sessionType]}</h2>
            <Badge variant="outline">Session {currentSession}/4</Badge>
          </div>

          {/* Timer Display */}
          <div className="relative">
            <div 
              className={`text-8xl font-bold mb-4 ${
                sessionType === "work" ? "text-primary" : 
                sessionType === "shortBreak" ? "text-success" : "text-secondary"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            
            <Progress 
              value={progress} 
              className="w-full h-2 mb-6"
            />
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-4">
            {timerState === "idle" || timerState === "paused" ? (
              <Button 
                onClick={startTimer}
                size="lg"
                className="gradient-primary px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                {timerState === "paused" ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button 
                onClick={pauseTimer}
                size="lg"
                variant="secondary"
                className="px-8"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}
            
            <Button 
              onClick={resetTimer}
              size="lg"
              variant="outline"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Session Info */}
          <div className="text-sm text-muted-foreground">
            <p>Earn <span className="font-semibold text-warning">{sessionPoints[sessionType]} points</span> when you complete this session</p>
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
                  <div className={`p-2 rounded-full ${
                    session.type === "work" ? "bg-primary/10" :
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
          <Button variant="glass" size="lg">
            View Focus Statistics
          </Button>
        </div>
      </Card>
    </div>
  )
}