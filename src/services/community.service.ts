/**
 * Community service for managing posts, comments, likes, and shares
 */

import { supabase } from '@/lib/supabase'
import { getBadgeForLevel } from '@/utils/points'
import type {
    CommunityPost,
    PostComment,
    CreatePostData,
    UpdatePostData,
    CommunityPostRow,
    PostCommentRow,
} from '@/types/community.types'

/**
 * Create a new community post
 */
export async function createPost(userId: string, postData: CreatePostData): Promise<{ data: CommunityPost | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .insert({
                user_id: userId,
                content: postData.content,
                type: postData.type,
                media_type: postData.mediaType,
                media_url: postData.mediaUrl,
                achievement_title: postData.achievementTitle,
                achievement_points: postData.achievementPoints,
                achievement_icon: postData.achievementIcon,
            })
            .select()
            .single()

        if (error) return { data: null, error }

        // Update user's last active timestamp
        await updateUserLastActive(userId)

        // Fetch the complete post with author info
        const { data: fullPost, error: fetchError } = await getPostById(data.id, userId)

        return { data: fullPost, error: fetchError }
    } catch (error) {
        console.error('Error creating post:', error)
        return { data: null, error }
    }
}

/**
 * Get posts with pagination and stats
 */
export async function getPosts(
    userId: string,
    limit: number = 20,
    offset: number = 0
): Promise<{ data: CommunityPost[] | null; error: any }> {
    try {
        // Fetch posts with author info
        const { data: postsData, error: postsError } = await supabase
            .from('community_posts')
            .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          level,
          avatar_url
        )
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (postsError) return { data: null, error: postsError }

        // Fetch stats for all posts
        const postIds = postsData.map((p: any) => p.id)

        const [likesData, commentsData, sharesData, userLikesData] = await Promise.all([
            supabase
                .from('post_likes')
                .select('post_id')
                .in('post_id', postIds),
            supabase
                .from('post_comments')
                .select('post_id')
                .in('post_id', postIds),
            supabase
                .from('post_shares')
                .select('post_id')
                .in('post_id', postIds),
            supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds),
        ])

        // Count stats
        const likeCounts = likesData.data?.reduce((acc: any, like: any) => {
            acc[like.post_id] = (acc[like.post_id] || 0) + 1
            return acc
        }, {}) || {}

        const commentCounts = commentsData.data?.reduce((acc: any, comment: any) => {
            acc[comment.post_id] = (acc[comment.post_id] || 0) + 1
            return acc
        }, {}) || {}

        const shareCounts = sharesData.data?.reduce((acc: any, share: any) => {
            acc[share.post_id] = (acc[share.post_id] || 0) + 1
            return acc
        }, {}) || {}

        const userLikedPosts = new Set(userLikesData.data?.map((like: any) => like.post_id) || [])

        // Map to CommunityPost format
        const posts: CommunityPost[] = postsData.map((post: any) => {
            const profile = post.profiles
            const initials = profile.full_name
                ? profile.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'

            return {
                id: post.id,
                userId: post.user_id,
                author: {
                    id: profile.id,
                    name: profile.full_name || 'User',
                    initials,
                    level: profile.level || 1,
                    badge: getBadgeForLevel(profile.level || 1),
                    profilePhoto: profile.avatar_url,
                },
                content: post.content,
                type: post.type,
                media: post.media_url
                    ? {
                        type: post.media_type,
                        url: post.media_url,
                    }
                    : undefined,
                achievement: post.achievement_title
                    ? {
                        title: post.achievement_title,
                        points: post.achievement_points || 0,
                        icon: post.achievement_icon || '🏆',
                    }
                    : undefined,
                stats: {
                    likes: likeCounts[post.id] || 0,
                    comments: commentCounts[post.id] || 0,
                    shares: shareCounts[post.id] || 0,
                },
                userHasLiked: userLikedPosts.has(post.id),
                createdAt: new Date(post.created_at),
                updatedAt: new Date(post.updated_at),
            }
        })

        return { data: posts, error: null }
    } catch (error) {
        console.error('Error fetching posts:', error)
        return { data: null, error }
    }
}

/**
 * Get a single post by ID
 */
export async function getPostById(
    postId: string,
    userId: string
): Promise<{ data: CommunityPost | null; error: any }> {
    try {
        const { data: postData, error: postError } = await supabase
            .from('community_posts')
            .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          level,
          avatar_url
        )
      `)
            .eq('id', postId)
            .single()

        if (postError) return { data: null, error: postError }

        // Fetch stats
        const [likesData, commentsData, sharesData, userLikeData] = await Promise.all([
            supabase.from('post_likes').select('id').eq('post_id', postId),
            supabase.from('post_comments').select('id').eq('post_id', postId),
            supabase.from('post_shares').select('id').eq('post_id', postId),
            supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', userId).single(),
        ])

        const profile = postData.profiles
        const initials = profile.full_name
            ? profile.full_name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'U'

        const post: CommunityPost = {
            id: postData.id,
            userId: postData.user_id,
            author: {
                id: profile.id,
                name: profile.full_name || 'User',
                initials,
                level: profile.level || 1,
                badge: getBadgeForLevel(profile.level || 1),
                profilePhoto: profile.avatar_url,
            },
            content: postData.content,
            type: postData.type,
            media: postData.media_url
                ? {
                    type: postData.media_type,
                    url: postData.media_url,
                }
                : undefined,
            achievement: postData.achievement_title
                ? {
                    title: postData.achievement_title,
                    points: postData.achievement_points || 0,
                    icon: postData.achievement_icon || '🏆',
                }
                : undefined,
            stats: {
                likes: likesData.data?.length || 0,
                comments: commentsData.data?.length || 0,
                shares: sharesData.data?.length || 0,
            },
            userHasLiked: !!userLikeData.data,
            createdAt: new Date(postData.created_at),
            updatedAt: new Date(postData.updated_at),
        }

        return { data: post, error: null }
    } catch (error) {
        console.error('Error fetching post:', error)
        return { data: null, error }
    }
}

/**
 * Update a post (user must own the post)
 */
export async function updatePost(
    postId: string,
    userId: string,
    updates: UpdatePostData
): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('community_posts')
            .update({
                content: updates.content,
                media_url: updates.mediaUrl,
                achievement_title: updates.achievementTitle,
                achievement_points: updates.achievementPoints,
            })
            .eq('id', postId)
            .eq('user_id', userId)

        return { error }
    } catch (error) {
        console.error('Error updating post:', error)
        return { error }
    }
}

/**
 * Delete a post (user must own the post)
 */
export async function deletePost(postId: string, userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('community_posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId)

        return { error }
    } catch (error) {
        console.error('Error deleting post:', error)
        return { error }
    }
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: string): Promise<{ data: PostComment[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('post_comments')
            .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error) return { data: null, error }

        const comments: PostComment[] = data.map((comment: any) => {
            const profile = comment.profiles
            const initials = profile.full_name
                ? profile.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'

            return {
                id: comment.id,
                postId: comment.post_id,
                userId: comment.user_id,
                author: {
                    name: profile.full_name || 'User',
                    initials,
                    profilePhoto: profile.avatar_url,
                },
                content: comment.content,
                createdAt: new Date(comment.created_at),
            }
        })

        return { data: comments, error: null }
    } catch (error) {
        console.error('Error fetching comments:', error)
        return { data: null, error }
    }
}

/**
 * Create a comment on a post
 */
export async function createComment(
    postId: string,
    userId: string,
    content: string
): Promise<{ data: PostComment | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: userId,
                content,
            })
            .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
            .single()

        if (error) return { data: null, error }

        // Update user's last active timestamp
        await updateUserLastActive(userId)

        const profile = data.profiles
        const initials = profile.full_name
            ? profile.full_name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'U'

        const comment: PostComment = {
            id: data.id,
            postId: data.post_id,
            userId: data.user_id,
            author: {
                name: profile.full_name || 'User',
                initials,
                profilePhoto: profile.avatar_url,
            },
            content: data.content,
            createdAt: new Date(data.created_at),
        }

        return { data: comment, error: null }
    } catch (error) {
        console.error('Error creating comment:', error)
        return { data: null, error }
    }
}

/**
 * Delete a comment (user must own the comment)
 */
export async function deleteComment(commentId: string, userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', userId)

        return { error }
    } catch (error) {
        console.error('Error deleting comment:', error)
        return { error }
    }
}

/**
 * Toggle like on a comment
 */
export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; error: any }> {
    try {
        // Check if already liked
        const { data: existingLike } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .single()

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from('comment_likes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', userId)

            // Update user's last active timestamp
            if (!error) {
                await updateUserLastActive(userId)
            }

            return { liked: false, error }
        } else {
            // Like
            const { error } = await supabase
                .from('comment_likes')
                .insert({
                    comment_id: commentId,
                    user_id: userId,
                })

            // Update user's last active timestamp
            if (!error) {
                await updateUserLastActive(userId)
            }

            return { liked: true, error }
        }
    } catch (error) {
        console.error('Error toggling comment like:', error)
        return { liked: false, error }
    }
}

/**
 * Check if a user has liked a specific comment (using database function to bypass RLS issues)
 */
export async function getUserCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; error: any }> {
    try {
        // Use the database function to bypass RLS issues
        const { data, error } = await supabase
            .rpc('user_liked_comment', { 
                comment_uuid: commentId, 
                user_uuid: userId 
            })

        return { liked: !!data, error }
    } catch (error) {
        console.error('Error checking comment like:', error)
        return { liked: false, error }
    }
}

/**
 * Get all likes for a specific comment
 */
export async function getCommentLikes(commentId: string): Promise<{ data: any[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('comment_likes')
            .select(`
                *,
                profiles:user_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('comment_id', commentId)
            .order('created_at', { ascending: false })

        return { data, error }
    } catch (error) {
        console.error('Error fetching comment likes:', error)
        return { data: null, error }
    }
}

/**
 * Subscribe to comment likes for a specific comment
 */
export function subscribeToCommentLikes(commentId: string, callback: (like: any) => void) {
    const channel = supabase
        .channel(`comment_likes_${commentId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'comment_likes',
                filter: `comment_id=eq.${commentId}`,
            },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}

/**
 * Toggle like on a post
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; error: any }> {
    try {
        // Check if already liked
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single()

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId)

            return { liked: false, error }
        } else {
            // Like
            const { error } = await supabase
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: userId,
                })

            // Update user's last active timestamp
            if (!error) {
                await updateUserLastActive(userId)
            }

            return { liked: true, error }
        }
    } catch (error) {
        console.error('Error toggling like:', error)
        return { liked: false, error }
    }
}

/**
 * Track a share
 */
export async function sharePost(postId: string, userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('post_shares')
            .insert({
                post_id: postId,
                user_id: userId,
            })

        // Update user's last active timestamp
        if (!error) {
            await updateUserLastActive(userId)
        }

        return { error }
    } catch (error) {
        console.error('Error sharing post:', error)
        return { error }
    }
}

/**
 * Subscribe to new posts
 */
export function subscribeToPostUpdates(callback: (post: any) => void) {
    const channel = supabase
        .channel('community_posts_changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'community_posts',
            },
            (payload) => {
                callback(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to post comments
 */
export function subscribeToPostComments(postId: string, callback: (comment: any) => void) {
    const channel = supabase
        .channel(`post_comments_${postId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'post_comments',
                filter: `post_id=eq.${postId}`,
            },
            (payload) => {
                callback(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to post likes
 */
export function subscribeToPostLikes(postId: string, callback: (like: any) => void) {
    const channel = supabase
        .channel(`post_likes_${postId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'post_likes',
                filter: `post_id=eq.${postId}`,
            },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}

/**
 * Get community statistics
 */
export async function getCommunityStats(): Promise<{ data: CommunityStats | null; error: any }> {
    try {
        // Use the community_stats view for efficient querying
        const { data, error } = await supabase
            .from('community_stats')
            .select('*')
            .single()

        if (error) {
            // If view doesn't exist or has issues, fall back to manual calculation
            console.warn('Community stats view not available, using manual calculation:', error)
            return await getCommunityStatsManual()
        }

        const stats: CommunityStats = {
            activeMembers: data.active_members || 0,
            postsToday: data.posts_today || 0,
            achievementsShared: data.achievements_shared || 0,
            engagementRate: parseFloat(data.engagement_rate) || 0
        }

        return { data: stats, error: null }
    } catch (error) {
        console.error('Error fetching community stats:', error)
        return { data: null, error }
    }
}

/**
 * Manual calculation of community stats (fallback method)
 */
async function getCommunityStatsManual(): Promise<{ data: CommunityStats | null; error: any }> {
    try {
        const now = new Date()
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Get active members (users active in last 24 hours)
        const { data: activeMembersData } = await supabase
            .from('profiles')
            .select('id')
            .gte('last_active_at', twentyFourHoursAgo.toISOString())

        // Get posts today
        const { data: postsTodayData } = await supabase
            .from('community_posts')
            .select('id')
            .gte('created_at', todayStart.toISOString())

        // Get achievements shared
        const { data: achievementsSharedData } = await supabase
            .from('community_posts')
            .select('id')
            .eq('type', 'achievement')
            .eq('shared', true)

        // Get total interactions for engagement rate
        const [postsCount, likesCount, commentsCount, sharesCount, focusSessionsCount] = await Promise.all([
            supabase.from('community_posts').select('id', { count: 'exact', head: true }),
            supabase.from('post_likes').select('id', { count: 'exact', head: true }),
            supabase.from('post_comments').select('id', { count: 'exact', head: true }),
            supabase.from('post_shares').select('id', { count: 'exact', head: true }),
            supabase.from('focus_sessions').select('id', { count: 'exact', head: true })
                .gte('completed_at', todayStart.toISOString())
        ])

        const activeMembers = activeMembersData?.length || 0
        const postsToday = postsTodayData?.length || 0
        const achievementsShared = achievementsSharedData?.length || 0
        
        const totalInteractions = 
            (postsCount.count || 0) + 
            (likesCount.count || 0) + 
            (commentsCount.count || 0) + 
            (sharesCount.count || 0) + 
            (focusSessionsCount.count || 0)

        const engagementRate = activeMembers > 0 
            ? Math.round((totalInteractions / activeMembers) * 100) 
            : 0

        const stats: CommunityStats = {
            activeMembers,
            postsToday,
            achievementsShared,
            engagementRate
        }

        return { data: stats, error: null }
    } catch (error) {
        console.error('Error calculating community stats manually:', error)
        return { data: null, error }
    }
}

/**
 * Update user's last active timestamp
 */
export async function updateUserLastActive(userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', userId)

        return { error }
    } catch (error) {
        console.error('Error updating user last active:', error)
        return { error }
    }
}

/**
 * Mark an achievement post as shared
 */
export async function shareAchievement(postId: string, userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('community_posts')
            .update({ 
                shared: true, 
                shared_at: new Date().toISOString() 
            })
            .eq('id', postId)
            .eq('user_id', userId)
            .eq('type', 'achievement')

        return { error }
    } catch (error) {
        console.error('Error sharing achievement:', error)
        return { error }
    }
}
