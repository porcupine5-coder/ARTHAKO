import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSupabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
useEffect(() => {
  const supabase = getSupabase()

  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('[AuthContext] initial session:', session)
    setSession(session)
    setUser(session?.user ?? null)
    setLoading(false)
  })

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[AuthContext] onAuthStateChange:', event, session)
    
    // Handle OAuth sign-in completion - sync user to database
    if (event === 'SIGNED_IN' && session) {
      console.log('[AuthContext] User signed in successfully, syncing to database...')
      
      try {
        // Call /auth/me to trigger user sync in database
        const { apiFetchAuth } = await import('./apiClient')
        const response = await apiFetchAuth('/auth/me', session.access_token)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[AuthContext] User synced to database:', data)
        } else {
          const errorText = await response.text()
          console.error('[AuthContext] Failed to sync user:', errorText)
        }
      } catch (error) {
        console.error('[AuthContext] Error syncing user to database:', error)
      }
    }
    
    setSession(session)
    setUser(session?.user ?? null)
    setLoading(false)
  })

  return () => subscription.unsubscribe()
}, [])

  const signOut = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}