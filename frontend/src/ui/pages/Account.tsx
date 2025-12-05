import { useEffect, useState } from 'react'
import { getSupabase } from '../../lib/supabase'
import { apiFetchAuth } from '../../lib/apiClient'
import {
  Shield,
  Clock,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Zap,
  Upload
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import type { Session } from '@supabase/supabase-js'
import { getUserStats, trackActivity } from '../../utils/accountUtils'
import type { UserStats } from '../../types/account'
import { ProfileAvatar } from '../../components/account/ProfileAvatar'
import { DisplayNameEditor } from '../../components/account/DisplayNameEditor'
import { ProfileMediaUpload } from '../../components/account/ProfileMediaUpload'

type Access = { status?: string; trial_ends_at?: string } | null

interface UserProfile {
  id: string
  email: string
  display_name: string
  profile_media_url: string | null
  role: string
  two_factor_enabled: boolean
  last_login_at: string | null
}

export default function Account() {
  const [profile, setProfile] = useState<UserProfile | null>({
    id: '',
    email: 'Not signed in',
    display_name: 'Guest',
    profile_media_url: null,
    role: 'user',
    two_factor_enabled: false,
    last_login_at: null
  })
  const [access, setAccess] = useState<Access>(null)
  const [msg, setMsg] = useState('')
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    total_views: 0,
    companies_tracked: 0,
    predictions_used: 0
  })

  // Modal states (only media upload kept)
  const [showMediaUpload, setShowMediaUpload] = useState(false)

  const navigate = useNavigate()
  const { session, user, loading: authLoading, signOut: authSignOut } = useAuth()

  async function loadUserProfile() {
    setMsg('')
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')

      const { data: { session: liveSession } } = await supabase.auth.getSession()
      const effectiveSession: Session | null = liveSession ?? session
      const token = effectiveSession?.access_token
      const userId = effectiveSession?.user?.id ?? user?.id

      // Immediately set an optimistic profile so the page doesn't stay stuck on the loader.
      // Use available AuthContext user info when possible even if token/session is missing.
      const authUser = user ?? (effectiveSession?.user ?? null)
      setProfile({
        id: authUser?.id ?? userId ?? '',
        email: authUser?.email ?? 'Not signed in',
        display_name: authUser?.email ? authUser.email.split('@')[0] : 'Guest',
        profile_media_url: null,
        role: 'user',
        two_factor_enabled: false,
        last_login_at: null
      })

      if (!token || !userId) {
        console.log('[Account] No session token or userId available — continuing with optimistic profile')
        // don't return; continue attempting API/db fetches but keep optimistic profile
      }

      console.log('[Account] Loading profile for user:', userId)

      // Call backend API to get user profile (this will auto-create user if needed)
      try {
        const res = await apiFetchAuth('/auth/me', token)

        if (res && res.ok) {
          const data = await res.json()
          console.log('[Account] User profile loaded from API:', data)
          setProfile(prev => prev ? ({
            ...prev,
            id: data.id || prev.id,
            email: data.email || prev.email,
            display_name: data.display_name || prev.display_name,
            role: data.role || prev.role
          }) : prev)
          setAccess(data?.access || null)
        } else {
          console.warn('[Account] /auth/me returned non-ok response, skipping overwrite')
        }
      } catch (apiErr) {
        console.warn('[Account] Error calling /auth/me (non-fatal):', apiErr)
      }

      // Now fetch additional user details from database (non-blocking)
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('display_name, profile_media_url, two_factor_enabled, last_login_at')
          .eq('id', userId)
          .single()

        if (!userError && userData) {
          console.log('[Account] User details loaded from database')
          setProfile(prev => prev ? {
            ...prev,
            display_name: userData.display_name || prev.display_name,
            profile_media_url: userData.profile_media_url,
            two_factor_enabled: userData.two_factor_enabled || false,
            last_login_at: userData.last_login_at
          } : prev)
        }
      } catch (dbErr) {
        console.warn('[Account] Could not fetch user details from database (non-fatal):', dbErr)
      }

      // Fetch real stats (non-blocking)
      try {
        console.log('[Account] Fetching user stats')
        const userStats = await getUserStats(userId)
        console.log('[Account] User stats loaded:', userStats)
        setStats(userStats)
      } catch (statsErr) {
        console.error('[Account] Error fetching stats:', statsErr)
        // Don't block profile loading if stats fetch fails
      }

      // Update last login (non-blocking)
      try {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId)
      } catch (updateErr) {
        console.warn('[Account] Error updating last login:', updateErr)
      }

    } catch (err: any) {
      console.error('[Account] Error loading profile:', err)
      setMsg(err?.message || 'Error loading profile')
      // Set a default empty profile to stop infinite loading
      setProfile({
        id: '',
        email: 'Error loading account',
        display_name: 'Error',
        profile_media_url: null,
        role: 'user',
        two_factor_enabled: false,
        last_login_at: null
      })
    }
  }

  async function handleSignOut() {
    try {
      // Prefer the AuthContext signOut which also updates context state
      if (authSignOut) await authSignOut()
      else {
        const supabase = getSupabase()
        await supabase.auth.signOut()
      }
      navigate('/')
    } catch (err: any) {
      setMsg(err?.message || 'Error signing out')
    }
  }

  function handleDisplayNameUpdate(newName: string) {
    if (profile) {
      setProfile({ ...profile, display_name: newName })
    }
  }

  function handleProfileMediaUpdate(url: string) {
    if (profile) {
      setProfile({ ...profile, profile_media_url: url })
    }
  }

  // 2FA and password/email change features are removed per request

  useEffect(() => {
    setMounted(true)
    // Ensure we attempt to load the profile once auth finishes. Previously this
    // only ran when `user` was set in AuthContext which could leave the page
    // stuck on a loading spinner. Call loader whenever authLoading becomes false.
    if (!authLoading) {
      loadUserProfile()
    }
  }, [authLoading])

  // Poll stats periodically so counts look up-to-date (near real-time)
  useEffect(() => {
    let interval: any
    if (profile?.id) {
      const fetchStats = async () => {
        try {
          const userStats = await getUserStats(profile.id)
          setStats(userStats)
        } catch (e) {
          // ignore
        }
      }

      // initial fetch already done, but ensure we have periodic updates
      interval = setInterval(fetchStats, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [profile?.id])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-arthako-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-6 transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Debug info - visible in dev to help diagnose auth/profile issues */}
        <div className="p-3 rounded-md bg-white/5 text-xs text-gray-300 font-mono">
          <div>authLoading: {String(authLoading)}</div>
          <div>auth user id: {user?.id ?? 'null'}</div>
          <div>auth user email: {user?.email ?? 'null'}</div>
          <div>profile.id: {profile?.id ?? 'null'}</div>
          <div>profile.email: {profile?.email ?? 'null'}</div>
          {msg && <div>msg: {msg}</div>}
        </div>
        {/* Hero Section */}
        <div className="glass-strong rounded-2xl p-8 border-2 border-white/10 hover:border-arthako-accent/30 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-arthako-accent/5 via-transparent to-arthako-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <ProfileAvatar
                mediaUrl={profile.profile_media_url}
                displayName={profile.display_name}
                size="xl"
                showOnlineIndicator
              />
              <button
                onClick={() => setShowMediaUpload(!showMediaUpload)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-arthako-accent hover:bg-arthako-accent/80 text-arthako-dark transition-all hover:scale-110"
                title="Upload profile media"
              >
                <Upload size={16} />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <DisplayNameEditor
                userId={user?.id ?? profile.id}
                currentDisplayName={profile.display_name || (user?.email ? user.email.split('@')[0] : 'Guest')}
                onUpdate={handleDisplayNameUpdate}
              />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-400 mt-2">
                <div className="flex items-center gap-1">
                  <Shield size={16} className="text-arthako-accent" />
                  <span className="capitalize">{profile.role}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={16} className="text-arthako-accent-purple" />
                  <span>Last login: {profile.last_login_at ? new Date(profile.last_login_at).toLocaleDateString() : 'Never'}</span>
                </div>
                {access?.status && (
                  <div className="px-3 py-1 rounded-full bg-arthako-accent/20 text-arthako-accent text-xs font-semibold">
                    {access.status}
                  </div>
                )}
                {profile.two_factor_enabled && (
                  <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                    2FA Enabled
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => loadUserProfile()}
                className="px-4 py-2 rounded-xl glass hover:glass-strong transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Activity size={18} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Profile Media Upload Section */}
          {showMediaUpload && (
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
              <ProfileMediaUpload
                userId={user?.id ?? profile.id}
                currentMediaUrl={profile.profile_media_url}
                onUpdate={handleProfileMediaUpdate}
              />
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<TrendingUp className="text-arthako-accent" />}
            label="Total Views"
            value={stats.total_views.toLocaleString()}
            delay="delay-100"
          />
          <StatCard
            icon={<BarChart3 className="text-arthako-accent-purple" />}
            label="Companies Tracked"
            value={stats.companies_tracked.toString()}
            delay="delay-200"
          />
          <StatCard
            icon={<Zap className="text-yellow-500" />}
            label="AI Predictions Used"
            value={stats.predictions_used.toString()}
            delay="delay-300"
          />
        </div>

        {/* Settings Section */}
        <div className="glass-strong rounded-2xl p-6 border-2 border-white/10 hover:border-arthako-accent/30 transition-all duration-500 animate-fade-in delay-500">
          <h2 className="text-heading-3 mb-6 flex items-center gap-2">
            <Settings className="text-arthako-accent" />
            Settings
          </h2>

          <div className="space-y-3">
            <SettingItem
              icon={<LogOut size={20} />}
              title="Sign Out"
              description="Log out from this device"
              onClick={handleSignOut}
            />
          </div>
        </div>

        {msg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-down">
            {msg}
          </div>
        )}
      </div>

      {/* All modals for 2FA/password/email/privacy have been removed per request. */}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  delay
}: {
  icon: React.ReactNode
  label: string
  value: string
  delay: string
}) {
  return (
    <div className={`glass-strong rounded-xl p-6 border-2 border-white/10 hover:border-arthako-accent/30 transition-all duration-500 hover:scale-105 group animate-fade-in ${delay}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-arthako-accent/10 group-hover:bg-arthako-accent/20 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-heading-2 font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function SettingItem({
  icon,
  title,
  description,
  badge,
  onClick,
  disabled
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-xl glass hover:glass-strong transition-all duration-300 hover:scale-[1.02] group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="p-3 rounded-lg bg-arthako-accent/10 group-hover:bg-arthako-accent/20 transition-colors">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-arthako-accent/20 text-arthako-accent text-xs font-semibold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      {!disabled && <ChevronRight className="text-gray-400 group-hover:text-arthako-accent transition-colors" />}
    </button>
  )
}