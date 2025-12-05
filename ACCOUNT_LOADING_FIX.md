# Account Loading Fix

## Problem
When users signed in, the Account page would show "Loading your account..." indefinitely and never display the profile information.

## Root Causes

1. **Missing Authorization Token**: The frontend was authenticated with Supabase, but wasn't forwarding the JWT token to the backend API
2. **Variable Reference Error**: Line 73 in `Account.tsx` referenced `currentSession` which didn't exist (should be `effectiveSession`)
3. **RLS Policy Issue**: Frontend was trying to INSERT into users table directly, but there's no RLS policy allowing that
4. **Circular Dependency**: The `apiFetchAuth` helper was using dynamic imports which caused issues

## Solution

### 1. Created Authenticated API Helper (`frontend/src/lib/apiClient.ts`)
Added `apiFetchAuth()` function that accepts a token parameter and includes it in the Authorization header:

```typescript
export const apiFetchAuth = async (path: string, token: string, init?: RequestInit) => {
  if (!token) {
    throw new Error('No authentication token provided')
  }
  
  const headers = {
    ...init?.headers,
    'Authorization': `Bearer ${token}`
  }
  
  const url = buildApiUrl(path)
  return fetch(url, { ...init, headers })
}
```

### 2. Fixed Account.tsx
- **Simplified user loading flow**: Now calls `/auth/me` API first (which auto-creates user via backend middleware)
- **Fixed variable reference bug**: `currentSession` → `effectiveSession`
- **Removed direct database INSERT**: Frontend no longer tries to insert into users table (no RLS policy for that)
- **Better error handling**: Shows a default profile if user is not signed in
- **Two-step loading**: First loads basic profile from API, then enriches with database details
- **Fixed refresh button**: Calls `loadUserProfile()` without parameters

### 3. Error Handling
The existing error handling in `Account.tsx` already sets a default profile on error to prevent infinite loading:

```typescript
catch (err: any) {
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
```

## Testing

To test the fix:

1. Start the API server:
   ```bash
   cd api
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Sign in with OAuth (Google/GitHub)
4. Navigate to the Account page
5. Verify that your profile loads correctly with:
   - Display name
   - Email
   - Role badge
   - Last login time
   - User stats (views, companies tracked, predictions used)

## Files Modified

- `frontend/src/lib/apiClient.ts` - Added `apiFetchAuth()` helper
- `frontend/src/ui/pages/Account.tsx` - Fixed bugs and updated to use authenticated API calls

## Backend Requirements

The backend middleware (`api/src/middleware/auth.ts`) already correctly:
- Validates JWT tokens from `Authorization: Bearer <token>` header
- Syncs users to the database if they don't exist
- Attaches user info to the request object

No backend changes were needed.
