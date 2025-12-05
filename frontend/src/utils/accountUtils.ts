import { getSupabase } from '../lib/supabase'
import type { UserStats, UserActivity, UserPreferences, ActiveSession, MediaType } from '../types/account'

/**
 * Get user statistics from the database
 */
export async function getUserStats(userId: string): Promise<UserStats> {
    const supabase = getSupabase()

    try {
        const { data, error } = await supabase
            .rpc('get_user_stats', { p_user_id: userId })
            .single()

        if (error) {
            console.error('Error fetching user stats:', error)
            return {
                total_views: 0,
                companies_tracked: 0,
                predictions_used: 0
            }
        }

        // Cast data to any to access properties since RPC return type is not automatically inferred
        const stats = data as any

        return {
            total_views: Number(stats?.total_views) || 0,
            companies_tracked: Number(stats?.companies_tracked) || 0,
            predictions_used: Number(stats?.predictions_used) || 0
        }
    } catch (err) {
        console.error('Exception fetching user stats:', err)
        return {
            total_views: 0,
            companies_tracked: 0,
            predictions_used: 0
        }
    }
}

/**
 * Track user activity
 */
export async function trackActivity(
    userId: string,
    activityType: 'company_viewed' | 'prediction_used' | 'company_tracked',
    companySymbol?: string,
    metadata?: Record<string, any>
): Promise<void> {
    const supabase = getSupabase()

    const { error } = await supabase
        .from('user_activity')
        .insert({
            user_id: userId,
            activity_type: activityType,
            company_symbol: companySymbol,
            metadata
        })

    if (error) {
        console.error('Error tracking activity:', error)
    }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const supabase = getSupabase()

    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching user preferences:', error)
        return null
    }

    return data
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
): Promise<boolean> {
    const supabase = getSupabase()

    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating user preferences:', error)
        return false
    }

    return true
}

/**
 * Upload profile media to Supabase Storage
 */
export async function uploadProfileMedia(
    userId: string,
    file: File
): Promise<{ url: string; type: MediaType } | null> {
    const supabase = getSupabase()

    // Determine media type
    const fileType = file.type
    let mediaType: MediaType = 'image'
    if (fileType.includes('gif')) {
        mediaType = 'gif'
    } else if (fileType.includes('video')) {
        mediaType = 'video'
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `profile-media/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        })

    if (uploadError) {
        console.error('Error uploading profile media:', uploadError)
        // Surface a clearer error to the caller
        throw new Error(uploadError.message || 'Failed to upload profile media')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

    return { url: publicUrl, type: mediaType }
}

/**
 * Update user display name
 */
export async function updateDisplayName(userId: string, displayName: string): Promise<boolean> {
    const supabase = getSupabase()

    const { error } = await supabase
        .from('users')
        .update({
            display_name: displayName,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('Error updating display name:', error)
        return false
    }

    return true
}

/**
 * Update profile media URL
 */
export async function updateProfileMediaUrl(userId: string, url: string): Promise<boolean> {
    const supabase = getSupabase()

    const { error } = await supabase
        .from('users')
        .update({
            profile_media_url: url,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('Error updating profile media URL:', error)
        return false
    }

    return true
}

/**
 * Get user's active sessions
 */
export async function getActiveSessions(): Promise<ActiveSession[]> {
    const supabase = getSupabase()

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        console.error('Error fetching active sessions:', error)
        return []
    }

    // Return current session formatted as ActiveSession
    // We can't list other sessions from client-side for security reasons
    return [{
        id: 'current',
        user_id: session.user.id,
        created_at: new Date().toISOString(), // Approximate since we don't have session creation time in client object
        updated_at: new Date().toISOString(),
        factor_id: '',
        aal: session.user.app_metadata.aal || 'aal1',
        not_after: new Date(session.expires_at! * 1000).toISOString(),
        ip: 'Current Device',
        user_agent: navigator.userAgent
    }]
}

/**
 * Sign out from a specific session
 */
export async function signOutSession(sessionId: string): Promise<boolean> {
    const supabase = getSupabase()

    if (sessionId === 'current') {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error)
            return false
        }
        return true
    }

    // Cannot sign out other sessions from client-side
    console.warn('Cannot sign out other sessions from client-side')
    return false
}

/**
 * Delete all user activity data
 */
export async function deleteUserActivity(userId: string): Promise<boolean> {
    const supabase = getSupabase()

    const { error } = await supabase
        .from('user_activity')
        .delete()
        .eq('user_id', userId)

    if (error) {
        console.error('Error deleting user activity:', error)
        return false
    }

    return true
}

/**
 * Download user account data as JSON
 */
export async function downloadAccountData(userId: string): Promise<void> {
    const supabase = getSupabase()

    // Fetch all user data
    const [userResult, activityResult, preferencesResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('user_activity').select('*').eq('user_id', userId),
        supabase.from('user_preferences').select('*').eq('user_id', userId).single()
    ])

    const accountData = {
        user: userResult.data,
        activity: activityResult.data || [],
        preferences: preferencesResult.data,
        exported_at: new Date().toISOString()
    }

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(accountData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `arthako-account-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Determine media type from URL
 */
export function getMediaType(url: string): MediaType {
    const extension = url.split('.').pop()?.toLowerCase()

    if (extension === 'gif') return 'gif'
    if (['mp4', 'webm', 'mov'].includes(extension || '')) return 'video'
    return 'image'
}
