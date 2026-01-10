export type SessionType = 'focus' | 'shortBreak' | 'longBreak'
export type SessionStatus = 'idle' | 'running' | 'completed' | 'break'

export interface SessionConfig {
  focusDuration: number // minutes
  shortBreakDuration: number // minutes  
  longBreakDuration: number // minutes
  sessionsUntilLongBreak: number
}

export interface SessionData {
  // Current session info
  sessionType: SessionType
  sessionStatus: SessionStatus
  sessionNumber: number // current session number (1-based)
  completedSessions: number // total completed focus sessions
  
  // Timing info
  sessionStartTime: number | null // timestamp
  sessionEndTime: number | null // timestamp
  timeLeft: number // seconds
  
  // Config
  config: SessionConfig
}

export interface SessionEvents {
  onSessionStart: (sessionType: SessionType, sessionNumber: number) => void
  onSessionComplete: (sessionType: SessionType, sessionNumber: number) => void
  onBreakComplete: (breakType: SessionType) => void
  onAllSessionsComplete: (totalSessions: number) => void
}
