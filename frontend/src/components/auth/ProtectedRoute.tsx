import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactElement
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('[ProtectedRoute]', { path: location.pathname, loading, user })

  // Wait until Supabase finishes restoring user
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-arthako-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Only redirect AFTER loading is finished
  if (!user && !loading) {
    // Save intended page
    if (location.pathname !== '/auth') {
      sessionStorage.setItem('auth_redirect', location.pathname)
    }
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
