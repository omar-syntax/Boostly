import { supabase } from '@/lib/supabase'

export interface LeaderboardEntry {
  id: string
  rank: number
  previousRank: number
  name: string
  initials: string
  points: number
  weeklyPoints: number
  level: number
  badge: string
  streak: number
  tasksCompleted: number
  focusHours: number
  avatar: string
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[]
  currentUser: LeaderboardEntry | null
  totalUsers: number
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to get badge based on level
const getBadgeByLevel = (level: number): string => {
  if (level >= 25) return 'Productivity Master'
  if (level >= 20) return 'Focus Champion'
  if (level >= 15) return 'Habit Builder'
  if (level >= 10) return 'Goal Crusher'
  if (level >= 5) return 'Rising Star'
  return 'Consistency Builder'
}

// Helper function to get avatar style based on rank
const getAvatarByRank = (rank: number): string => {
  if (rank === 1) return 'gradient-primary'
  if (rank === 2) return 'gradient-success'
  if (rank === 3) return 'gradient-motivation'
  if (rank <= 10) return 'gradient-secondary'
  return 'bg-warning'
}

export const leaderboardService = {
  // Fetch leaderboard data from database
  async fetchLeaderboard(timeframe: string = 'This Week', category: string = 'Overall'): Promise<LeaderboardResponse> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch leaderboard data from the view
      const { data: leaderboardData, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .limit(100) // Limit to top 100 for performance

      if (error) throw error

      // Transform data to match LeaderboardEntry interface
      const transformedData: LeaderboardEntry[] = (leaderboardData || []).map((entry, index) => ({
        id: entry.id,
        rank: entry.current_rank,
        previousRank: entry.previous_rank || entry.current_rank,
        name: entry.full_name || 'Anonymous User',
        initials: getInitials(entry.full_name || 'Anonymous'),
        points: entry.points || 0,
        weeklyPoints: entry.weekly_points || 0,
        level: entry.level || 1,
        badge: getBadgeByLevel(entry.level || 1),
        streak: entry.streak || 0,
        tasksCompleted: entry.tasks_completed || 0,
        focusHours: entry.focus_hours || 0,
        avatar: entry.avatar_url || getAvatarByRank(entry.current_rank)
      }))

      // Find current user in leaderboard
      const currentUser = user ? transformedData.find(entry => entry.id === user.id) || null : null

      return {
        data: transformedData,
        currentUser,
        totalUsers: transformedData.length
      }

    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      // Return empty state on error
      return {
        data: [],
        currentUser: null,
        totalUsers: 0
      }
    }
  },

  // Subscribe to real-time leaderboard updates
  subscribeToLeaderboardUpdates(callback: (data: LeaderboardResponse) => void) {
    const channel = supabase
      .channel('leaderboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        async () => {
          // Refetch leaderboard when profiles change
          const data = await this.fetchLeaderboard()
          callback(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
