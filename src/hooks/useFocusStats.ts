import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/lib/supabase'

interface FocusSession {
  id: string
  user_id: string
  duration: number
  completed: boolean
  tree_type: string
  points_earned: number
  completed_at: string
}

interface WeeklyData {
  day: string
  sessions: number
  minutes: number
  points: number
}

interface MonthlyTrend {
  week: string
  hours: number
  sessions: number
  points: number
}

interface SessionType {
  type: string
  count: number
  percentage: number
  totalMinutes: number
}

interface FocusStats {
  totalSessions: number
  totalHours: number
  totalPoints: number
  avgSessionLength: number
  longestStreak: number
  todaysSessions: number
  weeklyData: WeeklyData[]
  monthlyTrend: MonthlyTrend[]
  sessionTypes: SessionType[]
  productivityTrend: number
  weeklyGoalProgress: number
  isLoading: boolean
}

export function useFocusStats() {
  const { user } = useUser()
  const [stats, setStats] = useState<FocusStats>({
    totalSessions: 0,
    totalHours: 0,
    totalPoints: 0,
    avgSessionLength: 0,
    longestStreak: 0,
    todaysSessions: 0,
    weeklyData: [],
    monthlyTrend: [],
    sessionTypes: [],
    productivityTrend: 0,
    weeklyGoalProgress: 0,
    isLoading: true
  })

  const calculateStreak = useCallback((sessions: FocusSession[]): number => {
    if (sessions.length === 0) return 0
    
    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    const sessionDates = new Set(
      sortedSessions.map(s => {
        const date = new Date(s.completed_at)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
    )
    
    while (sessionDates.has(currentDate.getTime())) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    return streak
  }, [])

  const getWeeklyData = useCallback((sessions: FocusSession[]): WeeklyData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const weeklyData: WeeklyData[] = days.map(day => ({
      day,
      sessions: 0,
      minutes: 0,
      points: 0
    }))
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.completed_at)
      if (sessionDate >= startOfWeek) {
        const dayIndex = (sessionDate.getDay() + 6) % 7
        weeklyData[dayIndex].sessions++
        weeklyData[dayIndex].minutes += session.duration
        weeklyData[dayIndex].points += session.points_earned
      }
    })
    
    return weeklyData
  }, [])

  const getMonthlyTrend = useCallback((sessions: FocusSession[]): MonthlyTrend[] => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const weeks: MonthlyTrend[] = []
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startOfMonth)
      weekStart.setDate(startOfMonth.getDate() + (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.completed_at)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })
      
      weeks.push({
        week: `Week ${i + 1}`,
        hours: weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60,
        sessions: weekSessions.length,
        points: weekSessions.reduce((sum, s) => sum + s.points_earned, 0)
      })
    }
    
    return weeks
  }, [])

  const getSessionTypes = useCallback((sessions: FocusSession[]): SessionType[] => {
    const typeMap = new Map<string, { count: number; minutes: number }>()
    
    sessions.forEach(session => {
      const type = session.duration <= 5 ? 'Short Break (5m)' : 
                   session.duration <= 15 ? 'Long Break (15m)' : 
                   'Pomodoro (25m)'
      
      const existing = typeMap.get(type) || { count: 0, minutes: 0 }
      typeMap.set(type, {
        count: existing.count + 1,
        minutes: existing.minutes + session.duration
      })
    })
    
    const totalSessions = sessions.length
    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      totalMinutes: data.minutes,
      percentage: totalSessions > 0 ? Math.round((data.count / totalSessions) * 100) : 0
    }))
  }, [])

  const calculateProductivityTrend = useCallback((sessions: FocusSession[]): number => {
    if (sessions.length === 0) return 0
    
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    // Get sessions from last 7 days
    const recentSessions = sessions.filter(s => new Date(s.completed_at) >= last7Days)
    const recentHours = recentSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    
    // Get sessions from previous 7 days (7-14 days ago)
    const previousSessions = sessions.filter(s => {
      const sessionDate = new Date(s.completed_at)
      return sessionDate >= previous7Days && sessionDate < last7Days
    })
    const previousHours = previousSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    
    // If no previous activity, show strong positive trend if now active
    if (previousHours === 0) {
      return recentHours > 0 ? 100 : 0
    }
    
    // Calculate percentage change
    const trend = ((recentHours - previousHours) / previousHours) * 100
    
    // Cap the trend at reasonable bounds (-100% to +200%)
    return Math.max(-100, Math.min(200, Math.round(trend)))
  }, [])

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setStats(prev => ({ ...prev, isLoading: true }))

      const { data: sessions, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching focus sessions:', error)
        setStats(prev => ({ ...prev, isLoading: false }))
        return
      }

      const focusSessions: FocusSession[] = sessions || []
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todaysSessions = focusSessions.filter(s => 
        new Date(s.completed_at) >= today
      ).length
      
      const totalSessions = focusSessions.length
      const totalMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0)
      const totalHours = totalMinutes / 60
      const totalPoints = focusSessions.reduce((sum, s) => sum + s.points_earned, 0)
      const avgSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
      const longestStreak = calculateStreak(focusSessions)
      
      const weeklyData = getWeeklyData(focusSessions)
      const monthlyTrend = getMonthlyTrend(focusSessions)
      const sessionTypes = getSessionTypes(focusSessions)
      const productivityTrend = calculateProductivityTrend(focusSessions)
      
      const weeklyGoalHours = 40
      const currentWeekHours = weeklyData.reduce((sum, day) => sum + day.minutes, 0) / 60
      const weeklyGoalProgress = Math.min((currentWeekHours / weeklyGoalHours) * 100, 100)

      setStats({
        totalSessions,
        totalHours: Math.round(totalHours * 10) / 10,
        totalPoints,
        avgSessionLength,
        longestStreak,
        todaysSessions,
        weeklyData,
        monthlyTrend,
        sessionTypes,
        productivityTrend,
        weeklyGoalProgress: Math.round(weeklyGoalProgress),
        isLoading: false
      })
    } catch (error) {
      console.error('Error in fetchStats:', error)
      setStats(prev => ({ ...prev, isLoading: false }))
    }
  }, [user?.id, calculateStreak, getWeeklyData, getMonthlyTrend, getSessionTypes, calculateProductivityTrend])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { ...stats, refetch: fetchStats }
}
