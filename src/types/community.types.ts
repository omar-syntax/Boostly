/**
 * Community feature type definitions
 */

export type PostType = 'achievement' | 'tip' | 'motivation' | 'video'

export interface PostAuthor {
    id: string
    name: string
    initials: string
    level: number
    badge: string
    profilePhoto?: string
}

export interface PostMedia {
    type: 'image' | 'video'
    url: string
}

export interface PostAchievement {
    title: string
    points: number
    icon: string
}

export interface PostStats {
    likes: number
    comments: number
    shares: number
}

export interface CommunityPost {
    id: string
    userId: string
    author: PostAuthor
    content: string
    type: PostType
    media?: PostMedia
    achievement?: PostAchievement
    stats: PostStats
    userHasLiked: boolean
    createdAt: Date
    updatedAt: Date
}

export interface PostComment {
    id: string
    postId: string
    userId: string
    author: {
        name: string
        initials: string
        profilePhoto?: string
    }
    content: string
    createdAt: Date
}

export interface CreatePostData {
    content: string
    type: PostType
    mediaType?: 'image' | 'video'
    mediaUrl?: string
    achievementTitle?: string
    achievementPoints?: number
    achievementIcon?: string
}

export interface UpdatePostData {
    content?: string
    mediaUrl?: string
    achievementTitle?: string
    achievementPoints?: number
}

// Database row types (snake_case from Supabase)
export interface CommunityPostRow {
    id: string
    user_id: string
    content: string
    type: PostType
    media_type?: string
    media_url?: string
    achievement_title?: string
    achievement_points?: number
    achievement_icon?: string
    created_at: string
    updated_at: string
}

export interface PostCommentRow {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
}

export interface PostLikeRow {
    id: string
    post_id: string
    user_id: string
    created_at: string
}

export interface PostShareRow {
    id: string
    post_id: string
    user_id: string
    created_at: string
}

export interface CommunityStats {
    activeMembers: number
    postsToday: number
    achievementsShared: number
    engagementRate: number
}
