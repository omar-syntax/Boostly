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
