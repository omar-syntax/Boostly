import { useEffect } from 'react'
import { playCompletionSound } from '@/utils/sounds'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'
import { SessionData } from '@/hooks/useSessionCore/types'

interface SessionSideEffectsProps {
  state: SessionData
  soundEnabled?: boolean
}

export function useSessionSideEffects({ state, soundEnabled = true }: SessionSideEffectsProps) {
  const { user, updateUser } = useUser()

  // Handle session completion
  useEffect(() => {
    if (state.sessionStatus === 'completed') {
      // Play completion sound
      if (soundEnabled) {
        playCompletionSound()
      }

      // Calculate points and rewards
      const pointsEarned = calculatePoints(state.sessionType, state.config)
      const durationMinutes = getDurationMinutes(state.sessionType, state.config)

      // Update user stats if focus session
      if (state.sessionType === 'focus' && user) {
        const durationHours = durationMinutes / 60

        updateUser({
          points: user.points + pointsEarned,
          weeklyPoints: user.weeklyPoints + pointsEarned,
          focusHours: user.focusHours + durationHours
        })

        // Save to database
        saveSessionToDatabase({
          userId: user.id,
          duration: durationMinutes,
          pointsEarned,
          sessionType: state.sessionType,
          sessionNumber: state.sessionNumber
        })
      }
    }
  }, [state.sessionStatus, state.sessionType, state.config, soundEnabled, user])

  // Auto-transition from completed state
  useEffect(() => {
    if (state.sessionStatus === 'completed') {
      // Auto-transition to next session after 3 seconds
      const timer = setTimeout(() => {
        // This will be handled by the SessionCore automatically
        // The UI will show the next session type
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [state.sessionStatus])
}

function calculatePoints(sessionType: string, config: any): number {
  switch (sessionType) {
    case 'focus':
      return config.focusDuration * 2 // 2 points per minute
    case 'shortBreak':
      return config.shortBreakDuration * 1 // 1 point per minute
    case 'longBreak':
      return config.longBreakDuration * 1.5 // 1.5 points per minute
    default:
      return 0
  }
}

function getDurationMinutes(sessionType: string, config: any): number {
  switch (sessionType) {
    case 'focus':
      return config.focusDuration
    case 'shortBreak':
      return config.shortBreakDuration
    case 'longBreak':
      return config.longBreakDuration
    default:
      return 0
  }
}

async function saveSessionToDatabase(data: {
  userId: string
  duration: number
  pointsEarned: number
  sessionType: string
  sessionNumber: number
}) {
  try {
    const treeType = getTreeType(data.duration)
    
    const sessionData = {
      user_id: data.userId,
      duration: data.duration,
      completed: true,
      tree_type: treeType,
      points_earned: data.pointsEarned,
      session_type: data.sessionType,
      session_number: data.sessionNumber,
      completed_at: new Date().toISOString()
    }

    const { error } = await supabase.from('focus_sessions').insert(sessionData)
    
    if (error) {
      console.error('Error saving session:', error)
    }
  } catch (error) {
    console.error('Error in saveSessionToDatabase:', error)
  }
}

function getTreeType(durationMinutes: number): string {
  if (durationMinutes < 20) return 'sapling'
  if (durationMinutes < 45) return 'tree'
  if (durationMinutes < 90) return 'large_tree'
  return 'ancient_tree'
}
