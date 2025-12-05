import { useEffect, useState } from 'react'
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'
import { useAuth } from '../lib/AuthContext'
import ProfessionalDashboard from './pages/ProfessionalDashboard'

import Account from './pages/Account'
import AuthPage from './pages/AuthPage'
import Companies from './pages/Companies'
import Company from './pages/Company'
import Navbar from '../components/navigation/Navbar'
import FluidBackground from '../components/effects/FluidBackground'
import LiquidTransition from '../components/transitions/LiquidTransition'
import HeroSection3D from '../components/hero/HeroSection3D'
import MarketOverview from '../components/dashboard/MarketOverview'
import CompanySearch from '../components/search/CompanySearch'
import Top200Carousel from '../components/carousel/Top200Carousel'
import TradingAssistant from '../components/dashboard/TradingAssistant'
import ProtectedRoute from '../components/auth/ProtectedRoute'

type Health = { ok: boolean; service: string; time: string } | null
type Access = { status?: string; trial_ends_at?: string } | null

function App() {
  const { isDark: dark, toggleTheme } = useTheme()
  const { user, signOut: authSignOut } = useAuth()
  const [apiHealth, setApiHealth] = useState<Health>(null)
  const [aiHealth, setAiHealth] = useState<Health>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerMsg, setRegisterMsg] = useState('')
  const [meMsg, setMeMsg] = useState('')
  const [useStub, setUseStub] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string>('')
  const [protectedMsg, setProtectedMsg] = useState('')
  const [access, setAccess] = useState<Access>(null)
  const [accessMsg, setAccessMsg] = useState('')

  async function refreshAccess() {
    setAccessMsg('')
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error(error.message)
      const token = data.session?.access_token
      if (!token) {
        setAccess(null)
        return
      }
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Request failed')
      setAccess(body?.access || null)
    } catch (err: any) {
      setAccessMsg(err?.message || 'Error')
    }
  }

  const navigate = useNavigate()
  const appLocation = useLocation()
  useEffect(() => {
    // initial health fetch
    fetch('/api/health').then(r => r.json()).then(setApiHealth).catch(() => setApiHealth(null))
    fetch('/ai/health').then(r => r.json()).then(setAiHealth).catch(() => setAiHealth(null))
    // health polling
    const tid = setInterval(() => {
      fetch('/api/health').then(r => r.json()).then(setApiHealth).catch(() => setApiHealth(null))
      fetch('/ai/health').then(r => r.json()).then(setAiHealth).catch(() => setAiHealth(null))
    }, 10000)
    // stub toggle from localStorage
    try {
      const saved = localStorage.getItem('useStub')
      if (saved != null) setUseStub(saved === '1')
    } catch { }
    const supabase = getSupabase()
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        const mail = data.session?.user?.email
        if (mail) setSessionEmail(mail)
      })
      const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
        setSessionEmail(sess?.user?.email || '')
        await refreshAccess()

        // Token refresh: if token is about to expire, refresh before it becomes invalid
        if (sess?.access_token && sess?.expires_at) {
          const now = Math.floor(Date.now() / 1000)
          const expiresIn = sess.expires_at - now
          // Refresh if less than 5 minutes remaining
          if (expiresIn < 300 && expiresIn > 0) {
            try {
              const { data, error } = await supabase.auth.refreshSession(sess)
              if (error || !data.session) {
                console.error('[App] Token refresh failed:', error?.message || 'Unknown error')
                // Redirect to login on refresh failure
                navigate('/', { replace: true })
              }
            } catch (err) {
              console.error('[App] Token refresh error:', err)
              navigate('/', { replace: true })
            }
          }
        }

        // post-login redirect to intended page
        if (sess && (appLocation.state as any)?.from) {
          const fromLoc = (appLocation.state as any).from
          const to = typeof fromLoc === 'string' ? fromLoc : fromLoc.pathname || '/'
          navigate(to, { replace: true, state: undefined })
        }
      })
      return () => { sub.subscription.unsubscribe(); clearInterval(tid) }
    }
    return () => { clearInterval(tid) }
  }, [])

  // persist stub toggle
  useEffect(() => {
    try {
      localStorage.setItem('useStub', useStub ? '1' : '0')
    } catch { }
  }, [useStub])

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterMsg('')
    try {
      const supabase = getSupabase()
      if (supabase && !useStub) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        setRegisterMsg(`Supabase signup: ${data.user?.email || email}. Check email for confirmation (if enabled).`)
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Registration failed')
        setRegisterMsg(`Registered: ${data.user.email} role=${data.user.role}. Trial ends: ${new Date(data.trialEndsAt).toLocaleString()}`)
      }
    } catch (err: any) {
      setRegisterMsg((err?.message || 'Error') + (err?.stack ? `\n${String(err.stack)}` : ''))
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setRegisterMsg('')
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      setSessionEmail(data.user?.email || '')
      setRegisterMsg(`Signed in as ${data.user?.email || email}`)
    } catch (err: any) {
      setRegisterMsg((err?.message || 'Error') + (err?.stack ? `\n${String(err.stack)}` : ''))
    }
  }

  async function onSignOut() {
    setRegisterMsg('')
    try {
      await authSignOut()
      setSessionEmail('')
      setRegisterMsg('Signed out')
    } catch (err: any) {
      setRegisterMsg((err?.message || 'Error') + (err?.stack ? `\n${String(err.stack)}` : ''))
    }
  }

  async function onCheckMe() {
    setMeMsg('')
    try {
      const supabase = getSupabase()
      let token: string | undefined
      if (supabase) {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw new Error(error.message)
        token = data.session?.access_token
      }
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setMeMsg(JSON.stringify(data))
    } catch (err: any) {
      setMeMsg((err?.message || 'Error') + (err?.stack ? `\n${String(err.stack)}` : ''))
    }
  }

  async function onProtectedPing() {
    setProtectedMsg('')
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.auth.getSession()
      if (error) throw new Error(error.message)
      const token = data.session?.access_token
      if (!token) throw new Error('No session. Please Login first.')
      const res = await fetch('/api/protected/ping', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Request failed')
      setProtectedMsg(JSON.stringify(body))
    } catch (err: any) {
      setProtectedMsg((err?.message || 'Error') + (err?.stack ? `\n${String(err.stack)}` : ''))
    }
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="relative min-h-screen overflow-hidden transition-liquid text-gray-900 dark:text-[#E2E8F0]">
        <FluidBackground />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Navigation */}
          <Navbar
            sessionEmail={user?.email || sessionEmail}
            onSignOut={onSignOut}
            dark={dark}
            onToggleDark={toggleTheme}
          />

          {/* Status Bar */}
          <StatusBar apiHealth={apiHealth} aiHealth={aiHealth} />

          {/* Main Content with Liquid Transitions */}
          <main className="flex-1">
            <LiquidTransition>
              <Routes>
                <Route path="/" element={<ModernHome />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<Navigate to="/professional-dashboard" replace />} />
                <Route path="/professional-dashboard" element={<ProtectedRoute><ProfessionalDashboard /></ProtectedRoute>} />

                <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
                <Route path="/companies/:symbol" element={<ProtectedRoute><Company /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              </Routes>
            </LiquidTransition>
          </main>

          {/* Global AI Trading Assistant - Available on all pages */}
          <TradingAssistant />
        </div>
      </div>
    </div>
  )
}

function ModernHome() {
  const { user } = useAuth()
  
  return (
    <div>
      <HeroSection3D />
      <MarketOverview />
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-heading-1 mb-4 text-center">Search Companies</h2>
          {!user && (
            <div className="mb-6 p-4 rounded-xl glass-strong border border-arthako-accent/30 text-center">
              <p className="text-body text-gray-300">
                🔒 Sign in to search and explore companies
              </p>
            </div>
          )}
          <CompanySearch />
        </div>
      </div>
      {!user && (
        <div className="mb-6 p-6 rounded-xl glass-strong border border-arthako-accent/30 text-center max-w-4xl mx-auto">
          <p className="text-heading-3 mb-2">🔒 Authentication Required</p>
          <p className="text-body text-gray-300">
            Sign in to view Nepal's top 200 companies and access detailed market data
          </p>
        </div>
      )}
      <Top200Carousel />
    </div>
  )
}

export default App


function StatusBar({ apiHealth, aiHealth }: { apiHealth: Health; aiHealth: Health }) {
  const Chip = ({ label, ok }: { label: string; ok: boolean }) => (
    <span className={`px-2 py-1 rounded text-xs border ${ok ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
      {label}: {ok ? 'UP' : 'DOWN'}
    </span>
  )
  return (
    <div className="px-4 py-2 border-b bg-white/60 dark:bg-black/40 backdrop-blur flex items-center gap-2 text-xs">
      <Chip label="API" ok={!!apiHealth} />
      <Chip label="AI" ok={!!aiHealth} />
      <div className="ml-auto text-gray-500">
        {apiHealth?.time ? new Date(apiHealth.time).toLocaleTimeString() : ''}
      </div>
    </div>
  )
}
