import { useState, useEffect } from 'react'
import { SessionCore } from './SessionCore'
import { useSessionEngine } from './useSessionEngine'
import { SessionData, SessionConfig } from './types'

export function useSessionCore(initialConfig?: Partial<SessionConfig>) {
  const [sessionCore] = useState(() => new SessionCore(initialConfig))
  const [state, setState] = useState<SessionData>(() => sessionCore.getState())

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = sessionCore.subscribe(() => {
      setState(sessionCore.getState())
    })

    return unsubscribe
  }, [sessionCore])

  // Start the timer engine
  useSessionEngine(sessionCore)

  // Return state and actions
  return {
    // State
    state,
    
    // Computed values
    sessionType: state.sessionType,
    sessionStatus: state.sessionStatus,
    sessionNumber: state.sessionNumber,
    completedSessions: state.completedSessions,
    timeLeft: state.timeLeft,
    config: state.config,
    progress: sessionCore.getSessionProgress(),
    sessionLabel: sessionCore.getSessionLabel(),
    isBreakSession: sessionCore.isBreakSession(),
    canStartSession: sessionCore.canStartSession(),
    canSkipSession: sessionCore.canSkipSession(),
    
    // Actions
    startSession: () => sessionCore.startSession(),
    completeSession: () => sessionCore.completeSession(),
    skipToNextSession: () => sessionCore.skipToNextSession(),
    resetSession: () => sessionCore.resetSession(),
    updateConfig: (newConfig: Partial<SessionConfig>) => sessionCore.updateConfig(newConfig),
    
    // Raw access if needed
    getSessionCore: () => sessionCore
  }
}
