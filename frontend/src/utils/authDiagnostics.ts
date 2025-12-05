/**
 * Authentication Diagnostics Utility
 * Run this in browser console to check auth configuration
 */

export function checkAuthConfig() {
  const results = {
    environment: {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      currentOrigin: window.location.origin,
      expectedRedirect: `${window.location.origin}/account`
    },
    checks: [] as Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message: string }>
  }

  // Check 1: Supabase URL exists
  if (!import.meta.env.VITE_SUPABASE_URL) {
    results.checks.push({
      name: 'Supabase URL',
      status: 'fail',
      message: 'VITE_SUPABASE_URL is not set in .env file'
    })
  } else {
    results.checks.push({
      name: 'Supabase URL',
      status: 'pass',
      message: `URL configured: ${import.meta.env.VITE_SUPABASE_URL}`
    })
  }

  // Check 2: Anon key exists
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    results.checks.push({
      name: 'Anon Key',
      status: 'fail',
      message: 'VITE_SUPABASE_ANON_KEY is not set in .env file'
    })
  } else {
    results.checks.push({
      name: 'Anon Key',
      status: 'pass',
      message: 'Anon key is configured'
    })
  }

  // Check 3: Redirect URL format
  const redirectUrl = `${window.location.origin}/account`
  if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
    results.checks.push({
      name: 'Redirect URL',
      status: 'fail',
      message: 'Invalid redirect URL format'
    })
  } else {
    results.checks.push({
      name: 'Redirect URL',
      status: 'warning',
      message: `Redirect URL: ${redirectUrl}. Ensure this is whitelisted in Supabase dashboard.`
    })
  }

  // Check 4: Development vs Production
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  results.checks.push({
    name: 'Environment',
    status: 'pass',
    message: isDev ? 'Running in development mode' : 'Running in production mode'
  })

  console.group('🔐 Authentication Configuration Diagnostics')
  console.log('Environment:', results.environment)
  console.log('\nChecks:')
  results.checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${check.name}: ${check.message}`)
  })
  console.log('\n📋 Next Steps:')
  console.log('1. Go to Supabase Dashboard → Authentication → URL Configuration')
  console.log(`2. Add this URL to Redirect URLs: ${redirectUrl}`)
  console.log('3. Set Site URL to:', window.location.origin)
  console.log('4. Enable OAuth providers (Google, GitHub) in Authentication → Providers')
  console.groupEnd()

  return results
}

// Auto-run in development
if (import.meta.env.DEV) {
  // @ts-ignore - expose to window for easy console access
  window.checkAuthConfig = checkAuthConfig
  console.log('💡 Run checkAuthConfig() in console to diagnose auth configuration')
}