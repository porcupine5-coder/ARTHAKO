// Account-related types and interfaces

export interface UserProfile {
    id: string
    email: string
    display_name: string | null
    profile_media_url: string | null
    role: string
    two_factor_enabled: boolean
    created_at: string
    updated_at: string
    last_login_at: string | null
}

export interface UserStats {
    total_views: number
    companies_tracked: number
    predictions_used: number
}

export interface UserActivity {
    id: string
    user_id: string
    activity_type: 'company_viewed' | 'prediction_used' | 'company_tracked'
    company_symbol?: string
    metadata?: Record<string, any>
    created_at: string
}

export interface UserPreferences {
    user_id: string
    allow_analytics: boolean
    created_at: string
    updated_at: string
}

export interface ActiveSession {
    id: string
    user_id: string
    created_at: string
    updated_at: string
    factor_id: string
    aal: string
    not_after: string
    ip?: string
    user_agent?: string
}

export type MediaType = 'image' | 'gif' | 'video'

export interface ProfileMediaInfo {
    url: string
    type: MediaType
}
