import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../../lib/supabase'
import FloatingInput from '../../components/auth/FloatingInput'
import PasswordStrength from '../../components/auth/PasswordStrength'
import OAuthButtons from '../../components/auth/OAuthButtons'
import { ArrowLeft, Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
    
    const params = new URLSearchParams(window.location.search)
    const isOAuthCallback = params.get('oauth_callback') === 'true'
    const fromPath = params.get('from') || '/professional-dashboard'
    
    // Check if already logged in
    const supabase = getSupabase()
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        console.log('[AuthPage] User already logged in')
        
        // If this is an OAuth callback, ensure user is synced to database
        if (isOAuthCallback) {
          console.log('[AuthPage] OAuth callback detected, syncing user to database...')
          setLoading(true)
          
          try {
            // Call /auth/me to trigger user sync
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            })
            
            if (response.ok) {
              const userData = await response.json()
              console.log('[AuthPage] User synced successfully:', userData)
              
              // Clean up URL params and redirect
              window.history.replaceState({}, '', '/auth')
              navigate(fromPath, { replace: true })
            } else {
              const errorText = await response.text()
              console.error('[AuthPage] Failed to sync user:', errorText)
              setError('Failed to complete sign in. Please try again.')
              setLoading(false)
            }
          } catch (error) {
            console.error('[AuthPage] Error syncing user:', error)
            setError('Failed to complete sign in. Please try again.')
            setLoading(false)
          }
        } else {
          // Regular login, just redirect
          navigate('/professional-dashboard', { replace: true })
        }
      }
    })

    // Handle OAuth callback errors
    const errorParam = params.get('error')
    const errorDescription = params.get('error_description')
    
    if (errorParam) {
      console.error('OAuth callback error:', { errorParam, errorDescription })
      
      // Provide user-friendly error messages
      let friendlyError = errorDescription || errorParam
      
      if (errorParam === 'access_denied') {
        friendlyError = 'Sign in was cancelled. Please try again.'
      } else if (errorDescription?.includes('redirect')) {
        friendlyError = 'OAuth configuration error. Please contact support.'
      }
      
      setError(friendlyError)
      
      // Clean up error params from URL
      window.history.replaceState({}, '', '/auth')
    }
  }, [navigate])

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setLoading(true)

    try {
      const supabase = getSupabase()

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: {
              email: email
            }
          }
        })

        if (error) throw error

        if (data.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            setError('This email is already registered. Please sign in instead.')
            setMode('signin')
          } else {
            setSuccess('Account created! Please check your email to verify your account.')
            setTimeout(() => {
              setMode('signin')
              setSuccess('')
            }, 3000)
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        if (data.session) {
          // Sync user to database
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            })
            
            if (response.ok) {
              console.log('[AuthPage] User synced on sign in')
            }
          } catch (err) {
            console.warn('[AuthPage] Failed to sync user on sign in:', err)
          }
          
          navigate('/professional-dashboard')
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-arthako-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-arthako-accent-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-arthako-accent transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Main card */}
        <div className="glass-strong rounded-2xl p-8 border-2 border-white/10 hover:border-arthako-accent/30 transition-all duration-500 relative overflow-hidden group">
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-arthako-accent/0 via-arthako-accent/5 to-arthako-accent-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            {/* Logo animation */}
            <div className="text-center mb-8">
              <h1 className="text-heading-1 gradient-text mb-2 animate-fade-in">
                ARTHAKO
              </h1>
              <p className="text-body-sm text-gray-400 animate-fade-in delay-100">
                {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="mb-6 animate-fade-in delay-200">
              <OAuthButtons />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in delay-300">
              <FloatingInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error && error.toLowerCase().includes('email') ? error : undefined}
                autoComplete="email"
              />

              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showPasswordToggle
                error={error && error.toLowerCase().includes('password') && !error.toLowerCase().includes('match') ? error : undefined}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />

              {mode === 'signup' && (
                <>
                  <PasswordStrength password={password} />
                  
                  <FloatingInput
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    showPasswordToggle
                    error={error && error.toLowerCase().includes('match') ? error : undefined}
                    autoComplete="new-password"
                  />
                </>
              )}

              {mode === 'signin' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-arthako-accent focus:ring-arthako-accent focus:ring-offset-0"
                    />
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-arthako-accent hover:text-arthako-accent-purple transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password') && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-slide-down">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 animate-slide-down">
                  <p className="text-sm text-green-400">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-arthako-accent to-arthako-accent-purple text-arthako-dark font-semibold hover:shadow-lg hover:shadow-arthako-accent/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 text-center text-sm animate-fade-in delay-400">
              <span className="text-gray-400">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              </span>
              {' '}
              <button
                onClick={toggleMode}
                className="text-arthako-accent hover:text-arthako-accent-purple transition-colors font-semibold"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-gray-500 animate-fade-in delay-500">
          By continuing, you agree to Arthako's{' '}
          <a href="#" className="text-arthako-accent hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-arthako-accent hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}