/**
 * Supabase Storage service for file uploads
 */

import { supabase } from '@/lib/supabase'

/**
 * Upload profile photo to Supabase Storage
 */
export async function uploadProfilePhoto(
    userId: string,
    file: Blob,
    fileName: string = 'avatar.jpg'
): Promise<{ url: string | null; error: any }> {
    try {
        const filePath = `${userId}/${fileName}`

        // Upload file to storage
        const { data, error } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true, // Replace existing file
            })

        if (error) {
            console.error('Error uploading photo:', error)
            return { url: null, error }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath)

        return { url: urlData.publicUrl, error: null }
    } catch (error) {
        console.error('Error in uploadProfilePhoto:', error)
        return { url: null, error }
    }
}

/**
 * Delete profile photo from Supabase Storage
 */
export async function deleteProfilePhoto(userId: string): Promise<{ error: any }> {
    try {
        const filePath = `${userId}/avatar.jpg`

        const { error } = await supabase.storage
            .from('profile-photos')
            .remove([filePath])

        if (error) {
            console.error('Error deleting photo:', error)
            return { error }
        }

        return { error: null }
    } catch (error) {
        console.error('Error in deleteProfilePhoto:', error)
        return { error }
    }
}

/**
 * Get public URL for profile photo
 */
export function getProfilePhotoUrl(userId: string): string {
    const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(`${userId}/avatar.jpg`)

    return data.publicUrl
}
