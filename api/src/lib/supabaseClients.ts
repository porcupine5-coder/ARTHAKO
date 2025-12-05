import pkg from '@supabase/supabase-js';
const { createClient } = pkg;
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Client (Service Role Key)
 * - Full database access without RLS restrictions
 * - Use ONLY for admin operations: user creation, data updates, sensitive queries
 * - Never expose this client to frontend
 * - Used by: /auth/register, /admin/*, data update operations
 */
function createAdminClient(): SupabaseClient {
  const poolerUrl = process.env.SUPABASE_POOLER_URL
  const supabaseUrl = poolerUrl || (process.env.SUPABASE_URL as string)
  const supabaseKey = process.env.SUPABASE_KEY as string

  if (!supabaseUrl || !supabaseKey) {
    console.error('[supabaseClients] Missing SUPABASE_URL or SUPABASE_KEY for admin client')
    process.exit(1)
  }

  if (poolerUrl) {
    console.log('[supabaseClients] Admin client using connection pooler')
  } else {
    console.log('[supabaseClients] Admin client using direct connection')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * User Client (Anon Key)
 * - Limited database access with RLS enforcement
 * - Use for read-only operations and user-scoped queries
 * - Safe to use in user context (browser can have this key)
 * - Used by: /companies/*, /prices/*, /portfolio/overview (user-scoped data)
 */
function createUserClient(): SupabaseClient {
  const poolerUrl = process.env.SUPABASE_POOLER_URL
  const supabaseUrl = poolerUrl || (process.env.SUPABASE_URL as string)
  const supabaseKey = process.env.SUPABASE_ANON_KEY as string

  if (!supabaseUrl) {
    console.error('[supabaseClients] Missing SUPABASE_URL for user client')
  }

  if (!supabaseKey) {
    console.warn('[supabaseClients] Missing SUPABASE_ANON_KEY for user client. Some read-only operations may fail.')
  }

  if (poolerUrl) {
    console.log('[supabaseClients] User client using connection pooler')
  } else {
    console.log('[supabaseClients] User client using direct connection')
  }

  return createClient(supabaseUrl, supabaseKey || 'dummy-anon-key')
}

// Singleton instances
let adminClientInstance: SupabaseClient | null = null
let userClientInstance: SupabaseClient | null = null

/**
 * Get or create admin client (service role)
 * Connection pooling can be configured by setting SUPABASE_POOLER_URL env var
 * Pool limits: DB_POOL_MIN (default: 2) and DB_POOL_MAX (default: 10)
 */
export function getAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    adminClientInstance = createAdminClient()
  }
  return adminClientInstance
}

/**
 * Get or create user client (anon key with RLS)
 * This client respects Row Level Security policies
 */
export function getUserClient(): SupabaseClient {
  if (!userClientInstance) {
    userClientInstance = createUserClient()
  }
  return userClientInstance
}

// Export as named exports for clarity
export const adminClient = getAdminClient()
export const userClient = getUserClient()
