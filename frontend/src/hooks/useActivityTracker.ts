import { useCallback } from 'react'
import { getSupabase } from '../lib/supabase'
import { trackActivity } from '../utils/accountUtils'

/**
 * Hook for tracking user activity throughout the app
 */
export function useActivityTracker() {
    const trackCompanyView = useCallback(async (companySymbol: string) => {
        try {
            const supabase = getSupabase()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await trackActivity(user.id, 'company_viewed', companySymbol)
            }
        } catch (error) {
            console.error('Error tracking company view:', error)
        }
    }, [])

    const trackPredictionUsed = useCallback(async (companySymbol?: string) => {
        try {
            const supabase = getSupabase()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await trackActivity(user.id, 'prediction_used', companySymbol)
            }
        } catch (error) {
            console.error('Error tracking prediction use:', error)
        }
    }, [])

    const trackCompanyTracked = useCallback(async (companySymbol: string) => {
        try {
            const supabase = getSupabase()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await trackActivity(user.id, 'company_tracked', companySymbol)
            }
        } catch (error) {
            console.error('Error tracking company:', error)
        }
    }, [])

    return {
        trackCompanyView,
        trackPredictionUsed,
        trackCompanyTracked
    }
}
