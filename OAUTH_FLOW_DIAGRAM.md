# OAuth Authentication Flow Diagram

## Complete OAuth Flow (Google Sign-In)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INITIATES OAUTH SIGN-IN                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. User clicks "Continue with Google" on /auth page                        │
│     - OAuthButtons.tsx: handleOAuth('google')                               │
│     - Stores intended destination in sessionStorage                         │
│     - Calls supabase.auth.signInWithOAuth()                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. Browser redirects to Google OAuth                                       │
│     URL: https://accounts.google.com/o/oauth2/v2/auth?...                  │
│     - User sees Google sign-in page                                         │
│     - User selects Google account                                           │
│     - User grants permissions                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. Google redirects to Supabase callback                                   │
│     URL: https://[project].supabase.co/auth/v1/callback?code=...           │
│     - Supabase exchanges code for tokens                                    │
│     - Supabase creates/updates user in auth.users table                     │
│     - Supabase generates JWT access token                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. Supabase redirects to app callback URL                                  │
│     URL: http://localhost:5173/auth?oauth_callback=true&from=/dashboard    │
│     - Browser loads /auth page with callback parameters                     │
│     - Supabase client detects session in localStorage                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. AuthPage.tsx detects OAuth callback                                     │
│     - useEffect checks for oauth_callback=true parameter                    │
│     - Calls supabase.auth.getSession()                                      │
│     - Session exists with user data and access_token                        │
│     - Sets loading state to true                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. AuthPage syncs user to database                                         │
│     - Calls fetch('/api/auth/me', { Authorization: Bearer <token> })       │
│     - API receives request with JWT token                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. API Middleware processes request                                        │
│     - authenticateToken middleware extracts JWT                             │
│     - Verifies JWT signature using SUPABASE_JWT_SECRET                      │
│     - Extracts user ID and email from JWT claims                            │
│     - Queries users table for existing user                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                          ┌───────────┴───────────┐
                          │                       │
                    User exists?              User missing?
                          │                       │
                          ▼                       ▼
            ┌─────────────────────┐   ┌─────────────────────┐
            │  Return user data   │   │  Create user record │
            │  from database      │   │  in users table     │
            └─────────────────────┘   └─────────────────────┘
                          │                       │
                          │                       ▼
                          │           ┌─────────────────────┐
                          │           │  Create trial       │
                          │           │  subscription       │
                          │           │  (7 days)           │
                          │           └─────────────────────┘
                          │                       │
                          └───────────┬───────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. API returns user data                                                   │
│     Response: { id, email, role: 'user', access: { status: 'trial', ... }} │
│     - AuthPage receives successful response                                 │
│     - Logs: "[AuthPage] User synced successfully"                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  9. AuthPage redirects to intended destination                              │
│     - Cleans up URL parameters                                              │
│     - Calls navigate('/professional-dashboard', { replace: true })          │
│     - User sees dashboard page                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  10. AuthContext updates global state                                       │
│      - onAuthStateChange fires with SIGNED_IN event                         │
│      - Calls /api/auth/me again to ensure sync                              │
│      - Updates user and session state                                       │
│      - All components can now access user data                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  11. User accesses protected routes                                         │
│      - ProtectedRoute checks user state                                     │
│      - User is authenticated, allows access                                 │
│      - User can navigate to /companies, /account, etc.                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. OAuth Provider Not Enabled
   ├─ User clicks "Continue with Google"
   ├─ Supabase returns error: "Provider not enabled"
   ├─ OAuthButtons shows: "google provider not enabled"
   └─ User stays on /auth page

2. Redirect URL Not Configured
   ├─ User completes Google sign-in
   ├─ Supabase returns error: "redirect_uri mismatch"
   ├─ User sees error page
   └─ Solution: Add redirect URL in Supabase Dashboard

3. API Server Not Running
   ├─ User completes OAuth flow
   ├─ AuthPage tries to call /api/auth/me
   ├─ Fetch fails with network error
   ├─ Shows: "Failed to complete sign in"
   └─ User stays on /auth page

4. JWT Secret Mismatch
   ├─ User completes OAuth flow
   ├─ API receives /api/auth/me request
   ├─ JWT verification fails
   ├─ Returns 403 Forbidden
   ├─ AuthPage shows: "Failed to complete sign in"
   └─ Solution: Check SUPABASE_JWT_SECRET matches Supabase

5. Database Connection Error
   ├─ User completes OAuth flow
   ├─ API tries to create user record
   ├─ Database query fails
   ├─ Returns 500 Internal Server Error
   ├─ AuthPage shows: "Failed to complete sign in"
   └─ Solution: Check database connection and schema

6. User Cancels OAuth
   ├─ User clicks "Continue with Google"
   ├─ User cancels on Google sign-in page
   ├─ Google redirects back with error=access_denied
   ├─ AuthPage shows: "Sign in was cancelled"
   └─ User stays on /auth page
```

## Database State Changes

```
BEFORE OAuth Sign-In:
┌──────────────┐
│ auth.users   │  (Supabase Auth table)
├──────────────┤
│ (empty)      │
└──────────────┘

┌──────────────┐
│ users        │  (Application table)
├──────────────┤
│ (empty)      │
└──────────────┘

┌──────────────┐
│ subscriptions│
├──────────────┤
│ (empty)      │
└──────────────┘

AFTER OAuth Sign-In:
┌──────────────────────────────────────┐
│ auth.users                           │
├──────────────────────────────────────┤
│ id: uuid-1234                        │
│ email: user@gmail.com                │
│ provider: google                     │
│ created_at: 2024-12-01T10:00:00Z     │
└──────────────────────────────────────┘
                │
                │ (synced by API)
                ▼
┌──────────────────────────────────────┐
│ users                                │
├──────────────────────────────────────┤
│ id: uuid-1234                        │
│ email: user@gmail.com                │
│ role: user                           │
│ created_at: 2024-12-01T10:00:01Z     │
└──────────────────────────────────────┘
                │
                │ (created by API)
                ▼
┌──────────────────────────────────────┐
│ subscriptions                        │
├──────────────────────────────────────┤
│ id: uuid-5678                        │
│ user_id: uuid-1234                   │
│ status: trial                        │
│ trial_ends_at: 2024-12-08T10:00:01Z  │
└──────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND COMPONENTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   App.tsx    │  Main app component
└──────┬───────┘
       │
       ├─► ┌──────────────────┐
       │   │  AuthProvider    │  Global auth state
       │   │  (AuthContext)   │  - user, session, loading
       │   └────────┬─────────┘  - signOut()
       │            │
       │            ├─► Listens to Supabase auth events
       │            ├─► Syncs user on SIGNED_IN
       │            └─► Updates global state
       │
       ├─► ┌──────────────────┐
       │   │   AuthPage.tsx   │  Login/signup page
       │   └────────┬─────────┘
       │            │
       │            ├─► ┌──────────────────┐
       │            │   │ OAuthButtons.tsx │  OAuth sign-in buttons
       │            │   └────────┬─────────┘
       │            │            │
       │            │            └─► Initiates OAuth flow
       │            │
       │            ├─► Detects OAuth callback
       │            ├─► Syncs user to database
       │            └─► Redirects to dashboard
       │
       └─► ┌──────────────────┐
           │ ProtectedRoute   │  Route guard
           └────────┬─────────┘
                    │
                    ├─► Checks user state
                    ├─► Shows loading if needed
                    └─► Redirects to /auth if not authenticated

┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND COMPONENTS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  index.ts    │  Express server
└──────┬───────┘
       │
       ├─► ┌──────────────────────┐
       │   │ authenticateToken    │  Auth middleware
       │   │ (auth.ts)            │
       │   └────────┬─────────────┘
       │            │
       │            ├─► Verifies JWT token
       │            ├─► Extracts user claims
       │            ├─► Queries users table
       │            └─► Calls syncUserFromToken if needed
       │
       ├─► ┌──────────────────────┐
       │   │ syncUserFromToken    │  User sync function
       │   │ (auth.ts)            │
       │   └────────┬─────────────┘
       │            │
       │            ├─► Decodes JWT
       │            ├─► Checks if user exists
       │            ├─► Creates user if missing
       │            └─► Returns user data
       │
       └─► ┌──────────────────────┐
           │ GET /auth/me         │  User profile endpoint
           └────────┬─────────────┘
                    │
                    ├─► Uses authenticateToken middleware
                    ├─► Fetches subscription data
                    └─► Returns user + access info
```

## Key Points

1. **Two-Step Sync**: User is synced both in AuthPage (immediate) and AuthContext (on auth state change)
2. **Idempotent**: Multiple sync calls are safe - checks if user exists before creating
3. **Trial Access**: New users automatically get 7-day trial subscription
4. **Error Handling**: Each step has error handling with user-friendly messages
5. **Loading States**: UI shows loading during sync to prevent premature redirects
6. **Session Management**: Supabase handles session persistence and token refresh
