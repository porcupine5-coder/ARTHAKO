import { createClient, SupabaseClient } from '@supabase/supabase-js'

// CRITICAL: use only environment variables (no hardcoded fallbacks)
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (!url || !anon) {
  console.error(
    '[supabase] Missing environment variables: ' +
    `${!url ? 'VITE_SUPABASE_URL ' : ''}${!anon ? 'VITE_SUPABASE_ANON_KEY' : ''}` +
    ' — see frontend/.env.example'
  )
  client = null
} else {
  client = createClient(url, anon)
}

/**
 * Get the Supabase client.
 * Throws a helpful error if env vars are missing so the app fails fast.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(
      'Supabase client not configured. Check frontend/.env.example and create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    )
  }
  return client
}

// Export only the accessor so callers fail fast when env is missing.
// Avoid exporting the client object directly to discourage silent null usage.

