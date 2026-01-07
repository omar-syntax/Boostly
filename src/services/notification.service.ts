/**
 * Notification service for managing user notifications
 */

import { supabase } from '@/lib/supabase'

export interface Notification {
    id: string
    userId: string
    type: 'comment' | 'like' | 'achievement' | 'system' | 'reminder' | 'social'
    title: string
    message: string
    read: boolean
    postId?: string
    commentId?: string
    actorId?: string
    metadata?: any
    createdAt: Date
}

interface NotificationRow {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    read: boolean
    post_id?: string
    comment_id?: string
    actor_id?: string
    metadata?: any
    created_at: string
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(
    userId: string,
    limit: number = 50
): Promise<{ data: Notification[] | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) return { data: null, error }

        const notifications: Notification[] = data.map((row: NotificationRow) => ({
            id: row.id,
            userId: row.user_id,
            type: row.type as any,
            title: row.title,
            message: row.message,
            read: row.read ?? false,
            postId: row.post_id,
            commentId: row.comment_id,
            actorId: row.actor_id,
            metadata: row.metadata,
            createdAt: new Date(row.created_at),
        }))

        return { data: notifications, error: null }
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return { data: null, error }
    }
}

/**
 * Create a new notification
 */
export async function createNotification(notification: {
    user_id: string
    type: string
    title: string
    message: string
    post_id?: string
    comment_id?: string
    actor_id?: string
    metadata?: any
}): Promise<{ data: Notification | null; error: any }> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single()

        if (error) return { data: null, error }

        const result: Notification = {
            id: data.id,
            userId: data.user_id,
            type: data.type,
            title: data.title,
            message: data.message,
            read: data.read,
            postId: data.post_id,
            commentId: data.comment_id,
            actorId: data.actor_id,
            metadata: data.metadata,
            createdAt: new Date(data.created_at),
        }

        return { data: result, error: null }
    } catch (error) {
        console.error('Error creating notification:', error)
        return { data: null, error }
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(
    notificationId: string,
    userId: string
): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId)

        return { error }
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return { error }
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false)

        return { error }
    } catch (error) {
        console.error('Error marking all as read:', error)
        return { error }
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
    notificationId: string,
    userId: string
): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId)

        return { error }
    } catch (error) {
        console.error('Error deleting notification:', error)
        return { error }
    }
}

/**
 * Delete all notifications for a user
 */
export async function clearAllNotifications(userId: string): Promise<{ error: any }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)

        return { error }
    } catch (error) {
        console.error('Error clearing notifications:', error)
        return { error }
    }
}

/**
 * Subscribe to new notifications for a user
 */
export function subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
) {
    const channel = supabase
        .channel(`notifications_${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                const row = payload.new as NotificationRow
                const notification: Notification = {
                    id: row.id,
                    userId: row.user_id,
                    type: row.type as any,
                    title: row.title,
                    message: row.message,
                    read: row.read ?? false,
                    postId: row.post_id,
                    commentId: row.comment_id,
                    actorId: row.actor_id,
                    metadata: row.metadata,
                    createdAt: new Date(row.created_at),
                }
                callback(notification)
            }
        )
        .subscribe()

    return channel
}
