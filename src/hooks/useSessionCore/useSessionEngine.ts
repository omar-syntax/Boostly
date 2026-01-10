import { useEffect, useRef } from 'react'
import { SessionCore } from './SessionCore'
import { SessionData } from './types'

export function useSessionEngine(sessionCore: SessionCore) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())

  useEffect(() => {
    const startEngine = () => {
      if (intervalRef.current) return

      intervalRef.current = setInterval(() => {
        const state = sessionCore.getState()
        const now = Date.now()

        if (state.sessionStatus === 'running' && state.sessionEndTime) {
          const timeLeft = Math.max(0, Math.ceil((state.sessionEndTime - now) / 1000))
          
          // Only update if time actually changed (avoid unnecessary re-renders)
          if (timeLeft !== state.timeLeft) {
            sessionCore.updateTimeLeft(timeLeft)
          }

          // Check if session completed
          if (timeLeft <= 0) {
            sessionCore.completeSession()
          }
        }

        lastUpdateRef.current = now
      }, 1000) // Update every second
    }

    const stopEngine = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleStateChange = () => {
      const state = sessionCore.getState()
      
      if (state.sessionStatus === 'running') {
        startEngine()
      } else {
        stopEngine()
      }
    }

    // Start engine if already running
    handleStateChange()

    // Subscribe to state changes
    const unsubscribe = sessionCore.subscribe(handleStateChange)

    // Cleanup
    return () => {
      unsubscribe()
      stopEngine()
    }
  }, [sessionCore])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop the interval to save resources
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Page is visible again, restart engine if needed
        const state = sessionCore.getState()
        if (state.sessionStatus === 'running') {
          const now = Date.now()
          
          // Recalculate time left based on timestamps
          if (state.sessionEndTime) {
            const timeLeft = Math.max(0, Math.ceil((state.sessionEndTime - now) / 1000))
            sessionCore.updateTimeLeft(timeLeft)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [sessionCore])
}
