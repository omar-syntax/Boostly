import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'boostly_focus_session'

export type SessionType = "work" | "shortBreak" | "longBreak"
export type TimerState = "idle" | "running" | "paused"

interface StoredSession {
    endTime: number | null // Timestamp when timer ends (if running)
    timeLeft: number // Remaining seconds (if paused or idle)
    duration: number // Total duration in seconds
    type: SessionType
    state: TimerState
    lastUpdated: number // Timestamp
}

interface UseFocusTimerProps {
    onComplete: () => void
    initialType?: SessionType
    initialDuration?: number
}

export function useFocusTimer({ onComplete, initialType = 'work', initialDuration = 25 * 60 }: UseFocusTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialDuration)
    const [duration, setDuration] = useState(initialDuration)
    const [type, setType] = useState<SessionType>(initialType)
    const [state, setState] = useState<TimerState>('idle')

    // Load from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed: StoredSession = JSON.parse(stored)
                const now = Date.now()

                setType(parsed.type)
                setDuration(parsed.duration)

                if (parsed.state === 'running' && parsed.endTime) {
                    const remaining = Math.ceil((parsed.endTime - now) / 1000)

                    if (remaining <= 0) {
                        // Completed while away
                        setState('idle')
                        setTimeLeft(0)
                        localStorage.removeItem(STORAGE_KEY)
                        onComplete()
                    } else {
                        // Still running
                        setState('running')
                        setTimeLeft(remaining)
                    }
                } else {
                    // Paused or Idle state
                    setState(parsed.state)
                    setTimeLeft(parsed.timeLeft)
                }
            } catch (e) {
                console.error("Failed to parse stored session", e)
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    }, []) // Run once on mount

    // Sync to storage whenever state changes
    useEffect(() => {
        const now = Date.now()
        const endTime = state === 'running' ? now + (timeLeft * 1000) : null

        // We only save if not idle (or if we want to persist idle selection too? 
        // Usually persistence is most important for active sessions. 
        // But keeping selected type is nice too.)

        const sessionToStore: StoredSession = {
            endTime, // This is approximate "target" if we were to reload right now. 
            // Actually, `endTime` should be fixed when *starting*.
            // See updated logic below.
            timeLeft,
            duration,
            type,
            state,
            lastUpdated: now
        }

        // We don't want to constantly write to storage on every tick.
        // The tick logic should NOT update `state` or `type`.
        // Only `timeLeft` changes frequently. We can skip saving `timeLeft` constantly if running.

        if (state !== 'running') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToStore))
        }
    }, [state, type, duration]) // Dependencies excluding timeLeft to avoid tick spam

    // Special save for running state (only start or important events)
    const saveRunningState = (targetEndTime: number) => {
        const sessionToStore: StoredSession = {
            endTime: targetEndTime,
            timeLeft: Math.ceil((targetEndTime - Date.now()) / 1000), // Approximate
            duration,
            type,
            state: 'running',
            lastUpdated: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToStore))
    }

    // Timer Tick Logic
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (state === 'running') {
            // We need to know the REAL end time to calculate accurate ticks
            // Fetch it from storage or state?
            // Let's use a ref or derived value. 
            // Better: When starting, we calculate `endTimestamp`.

            const stored = localStorage.getItem(STORAGE_KEY)
            let targetEnd = 0

            if (stored) {
                const parsed = JSON.parse(stored)
                if (parsed.state === 'running' && parsed.endTime) {
                    targetEnd = parsed.endTime
                }
            }

            if (!targetEnd) {
                targetEnd = Date.now() + (timeLeft * 1000)
                saveRunningState(targetEnd)
            }

            interval = setInterval(() => {
                const now = Date.now()
                const diff = Math.ceil((targetEnd - now) / 1000)

                if (diff <= 0) {
                    setTimeLeft(0)
                    setState('idle')
                    localStorage.removeItem(STORAGE_KEY)
                    clearInterval(interval)
                    onComplete()
                } else {
                    setTimeLeft(diff)
                }
            }, 500) // 500ms check
        }

        return () => clearInterval(interval)
    }, [state])

    const start = () => {
        if (state === 'running') return
        const targetEnd = Date.now() + (timeLeft * 1000)
        saveRunningState(targetEnd)
        setState('running')
    }

    const pause = () => {
        if (state !== 'running') return
        setState('paused')
        // useEffect will trigger and save the paused state with current timeLeft
    }

    const reset = (newDuration?: number) => {
        setState('idle')
        localStorage.removeItem(STORAGE_KEY)
        if (newDuration) {
            setDuration(newDuration)
            setTimeLeft(newDuration)
        } else {
            setTimeLeft(duration)
        }
    }

    const setSessionDuration = (seconds: number) => {
        setDuration(seconds)
        setTimeLeft(seconds)
    }

    return {
        timeLeft,
        duration,
        type,
        state,
        start,
        pause,
        reset,
        setType,
        setSessionDuration,
        progress: ((duration - timeLeft) / duration) * 100
    }
}
