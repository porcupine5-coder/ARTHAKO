import type { Request, Response, NextFunction } from 'express'
import pkg from '@supabase/supabase-js';
const { createClient } = pkg;
import type { SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase admin client using server keys
const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.error('[auth] Missing SUPABASE_URL or SUPABASE_KEY. Auth middleware cannot initialize.');
  process.exit(1);
}

const supabase: SupabaseClient<any> = createClient(supabaseUrl, supabaseKey)

// Extend Express Request to include user
export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: string }
}

// Helper: decode and verify JWT using Supabase Auth
export async function verifyJwt(token: string) {
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    console.warn('[auth] Supabase token verification failed:', error?.message || 'No user')
    throw new Error('Invalid or expired token')
  }

  const user: any = data.user
  return {
    sub: user.id,
    user,
    email: user.email,
  }
}

// Sync user record in users table from token payload (create if missing)
export async function syncUserFromToken(token: string) {
  const decoded: any = await verifyJwt(token)
  const userId = decoded?.sub || decoded?.user?.id || decoded?.user_id
  const email = decoded?.email || decoded?.user?.email
  if (!userId || !email) throw new Error('Invalid token payload')

  // Check if user exists
  const { data: existing, error: selectErr } = await supabase.from('users').select('id,email,role').eq('id', userId).limit(1).maybeSingle()
  if (selectErr) {
    console.error('[auth] Error querying users table', selectErr)
    throw new Error('Database error')
  }

  if (existing) return existing as { id: string; email: string; role: string }

  // Create user if missing with default role 'user'
  const { data: inserted, error: insertErr } = await supabase.from('users').insert({ id: userId, email, role: 'user' }).select().single()
  if (insertErr) {
    console.error('[auth] Error inserting user', insertErr)
    throw new Error('Database error')
  }
  return inserted as { id: string; email: string; role: string }
}

// Middleware: authenticate token in Authorization header
export async function authenticateToken(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers['authorization']
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' })
    const token = auth.split(' ')[1]
    let decoded: any
    try {
      decoded = await verifyJwt(token)
    } catch (e) {
      console.warn('[auth] JWT verification failed:', (e as any)?.message || e)
      return res.status(403).json({ error: 'Invalid or expired token' })
    }

    const userId = decoded?.sub || decoded?.user?.id || decoded?.user_id
    if (!userId) return res.status(403).json({ error: 'Invalid token payload' })

    // Fetch user from DB and attach to req
    const { data, error } = await supabase.from('users').select('id,email,role').eq('id', userId).limit(1).maybeSingle()
    if (error) {
      console.error('[auth] DB error while fetching user', error)
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (!data) {
      // try to sync/create user
      try {
        const synced = await syncUserFromToken(token)
        req.user = synced
        return next()
      } catch (e) {
        console.error('[auth] Failed to sync/create user', e)
        return res.status(403).json({ error: 'User not found' })
      }
    }

    req.user = data as { id: string; email: string; role: string }
    return next()
  } catch (err) {
    console.error('[auth] Unexpected auth error', err)
    return res.status(500).json({ error: 'Authentication error' })
  }
}

// Role-based access control middleware
export function requireRole(roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthenticated' })
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Access denied' })
    return next()
  }
}
