import { SessionType, SessionConfig, SessionData } from './types'

const DEFAULT_CONFIG: SessionConfig = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4
}

const STORAGE_KEY = 'boostly_session_core'

export class SessionCore {
  private state: SessionData
  private listeners: Set<() => void> = new Set()

  constructor(initialConfig?: Partial<SessionConfig>) {
    this.state = this.loadState() || this.createInitialState(initialConfig)
  }

  private createInitialState(config?: Partial<SessionConfig>): SessionData {
    return {
      sessionType: 'focus',
      sessionStatus: 'idle',
      sessionNumber: 1,
      completedSessions: 0,
      sessionStartTime: null,
      sessionEndTime: null,
      timeLeft: (config?.focusDuration || DEFAULT_CONFIG.focusDuration) * 60,
      config: { ...DEFAULT_CONFIG, ...config }
    }
  }

  private loadState(): SessionData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      const now = Date.now()

      // Validate and restore state
      if (parsed.sessionStartTime && parsed.sessionEndTime) {
        if (now >= parsed.sessionEndTime) {
          // Session completed while away
          return this.createInitialState(parsed.config)
        } else {
          // Session still running, restore time left
          parsed.timeLeft = Math.ceil((parsed.sessionEndTime - now) / 1000)
          parsed.sessionStatus = 'running'
        }
      }

      return parsed
    } catch (error) {
      console.error('Failed to load session state:', error)
      return null
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (error) {
      console.error('Failed to save session state:', error)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  // Public API
  getState(): SessionData {
    return { ...this.state }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  startSession(): void {
    if (this.state.sessionStatus === 'running') return

    const now = Date.now()
    const duration = this.getDurationForSessionType(this.state.sessionType)
    
    this.state = {
      ...this.state,
      sessionStatus: 'running',
      sessionStartTime: now,
      sessionEndTime: now + (duration * 1000),
      timeLeft: duration
    }

    this.saveState()
    this.notifyListeners()
  }

  completeSession(): void {
    if (this.state.sessionState !== 'running') return

    const wasFocusSession = this.state.sessionType === 'focus'
    
    if (wasFocusSession) {
      this.state.completedSessions++
    }

    // Determine next session type
    let nextSessionType: SessionType
    let nextSessionNumber = this.state.sessionNumber

    if (wasFocusSession) {
      if (this.state.sessionNumber % this.state.config.sessionsUntilLongBreak === 0) {
        nextSessionType = 'longBreak'
      } else {
        nextSessionType = 'shortBreak'
      }
      nextSessionNumber++
    } else {
      // After any break, go back to focus
      nextSessionType = 'focus'
    }

    const duration = this.getDurationForSessionType(nextSessionType)

    this.state = {
      ...this.state,
      sessionType: nextSessionType,
      sessionStatus: 'completed',
      sessionNumber: nextSessionNumber,
      sessionStartTime: null,
      sessionEndTime: null,
      timeLeft: duration
    }

    this.saveState()
    this.notifyListeners()
  }

  skipToNextSession(): void {
    if (this.state.sessionStatus === 'running') return

    // Determine next session type
    let nextSessionType: SessionType
    let nextSessionNumber = this.state.sessionNumber

    if (this.state.sessionType === 'focus') {
      if (this.state.sessionNumber % this.state.config.sessionsUntilLongBreak === 0) {
        nextSessionType = 'longBreak'
      } else {
        nextSessionType = 'shortBreak'
      }
      nextSessionNumber++
    } else {
      nextSessionType = 'focus'
    }

    const duration = this.getDurationForSessionType(nextSessionType)

    this.state = {
      ...this.state,
      sessionType: nextSessionType,
      sessionState: 'idle',
      sessionNumber: nextSessionNumber,
      sessionStartTime: null,
      sessionEndTime: null,
      timeLeft: duration
    }

    this.saveState()
    this.notifyListeners()
  }

  resetSession(): void {
    this.state = this.createInitialState(this.state.config)
    this.saveState()
    this.notifyListeners()
  }

  updateConfig(newConfig: Partial<SessionConfig>): void {
    const isIdle = this.state.sessionStatus === 'idle'
    
    this.state = {
      ...this.state,
      config: { ...this.state.config, ...newConfig },
      timeLeft: isIdle ? this.getDurationForSessionType(this.state.sessionType) : this.state.timeLeft
    }

    this.saveState()
    this.notifyListeners()
  }

  updateTimeLeft(timeLeft: number): void {
    if (this.state.sessionStatus !== 'running') return

    this.state = {
      ...this.state,
      timeLeft
    }

    // Auto-complete when time runs out
    if (timeLeft <= 0) {
      this.completeSession()
    } else {
      this.saveState()
      this.notifyListeners()
    }
  }

  // Helper methods
  private getDurationForSessionType(type: SessionType): number {
    switch (type) {
      case 'focus':
        return this.state.config.focusDuration * 60
      case 'shortBreak':
        return this.state.config.shortBreakDuration * 60
      case 'longBreak':
        return this.state.config.longBreakDuration * 60
    }
  }

  getSessionProgress(): number {
    const totalDuration = this.getDurationForSessionType(this.state.sessionType)
    return ((totalDuration - this.state.timeLeft) / totalDuration) * 100
  }

  getSessionLabel(): string {
    switch (this.state.sessionType) {
      case 'focus':
        return 'Focus Session'
      case 'shortBreak':
        return 'Short Break'
      case 'longBreak':
        return 'Long Break'
    }
  }

  isBreakSession(): boolean {
    return this.state.sessionType !== 'focus'
  }

  canStartSession(): boolean {
    return this.state.sessionStatus === 'idle' || this.state.sessionStatus === 'completed'
  }

  canSkipSession(): boolean {
    return this.state.sessionStatus === 'idle' || this.state.sessionStatus === 'completed'
  }
}
