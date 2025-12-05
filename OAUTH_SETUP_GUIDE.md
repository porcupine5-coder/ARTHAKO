# OAuth Authentication Setup Guide

## Problem Summary
Users signing in/up with Google OAuth were being redirected back to `/auth` without their accounts being created in the database, preventing access to protected pages.

## Root Cause
When users authenticate via OAuth (Google/GitHub), Supabase creates a user in `auth.users` but doesn't automatically create a corresponding record in the application's `users` table. The middleware `syncUserFromToken` was designed to handle this, but it only runs when the user makes an API call with their token.

## Solution Implemented

### 1. Frontend Changes

#### AuthContext.tsx
- Added automatic user sync when `SIGNED_IN` event is detected
- Calls `/api/auth/me` endpoint to trigger user creation in database
- Ensures user record exists before allowing access to protected routes

#### AuthPage.tsx
- Enhanced OAuth callback handling
- Detects `oauth_callback=true` parameter in URL
- Syncs user to database before redirecting to intended destination
- Shows loading state during sync process
- Improved error handling with user-friendly messages

#### OAuthButtons.tsx
- Added better logging for debugging OAuth flow
- Improved error messages for common OAuth issues

### 2. Required Supabase Configuration

To make OAuth work properly, you need to configure your Supabase project:

#### Step 1: Configure Redirect URLs

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to **Redirect URLs**:
   ```
   http://localhost:5173/auth
   http://localhost:5173/account
   http://localhost:5173/professional-dashboard
   ```
4. For production, add your production URLs:
   ```
   https://yourdomain.com/auth
   https://yourdomain.com/account
   https://yourdomain.com/professional-dashboard
   ```

#### Step 2: Configure Site URL

1. In the same **URL Configuration** section
2. Set **Site URL** to:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

#### Step 3: Enable OAuth Providers

##### Google OAuth Setup

1. Go to **Authentication** → **Providers**
2. Find **Google** and click to configure
3. Enable the provider
4. You'll need to create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add authorized redirect URIs:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**
5. Paste the credentials into Supabase Google provider settings
6. Save the configuration

##### GitHub OAuth Setup (Optional)

1. Go to **Authentication** → **Providers**
2. Find **GitHub** and click to configure
3. Enable the provider
4. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click **New OAuth App**
   - Set **Authorization callback URL** to:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**
5. Paste the credentials into Supabase GitHub provider settings
6. Save the configuration

### 3. Database Schema Verification

Ensure your database has the correct schema:

```sql
-- Users table should exist with proper structure
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  session_expires_at timestamptz,
  CONSTRAINT role_check CHECK (role IN ('user','admin'))
);

-- Subscriptions table for trial/paid access
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_status_check CHECK (status IN ('trial', 'active', 'past_due', 'canceled'))
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY subscriptions_select_own ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY subscriptions_insert_own ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Testing the OAuth Flow

#### Test Checklist

1. **Clear browser data** (cookies, localStorage, sessionStorage)
2. **Navigate to** `/auth` page
3. **Click "Continue with Google"**
4. **Verify**:
   - Browser redirects to Google sign-in
   - After Google auth, redirects back to your app at `/auth?oauth_callback=true`
   - Console shows: `[AuthPage] OAuth callback detected, syncing user to database...`
   - Console shows: `[AuthPage] User synced successfully`
   - Redirects to `/professional-dashboard`
5. **Check database**:
   - User record exists in `users` table
   - Subscription record exists in `subscriptions` table with `status='trial'`
6. **Test protected routes**:
   - Navigate to `/professional-dashboard` - should work
   - Navigate to `/companies` - should work
   - Navigate to `/account` - should work

#### Debugging OAuth Issues

If OAuth fails, check browser console for these logs:

```javascript
// Expected successful flow:
[OAuth] Initiating google OAuth with redirect: http://localhost:5173/auth?oauth_callback=true&from=/professional-dashboard
[OAuth] Initiated successfully, redirecting to provider...
// ... user authenticates with Google ...
[AuthPage] User already logged in
[AuthPage] OAuth callback detected, syncing user to database...
[AuthPage] User synced successfully: {id: "...", email: "...", role: "user"}
[AuthContext] onAuthStateChange: SIGNED_IN
[AuthContext] User signed in successfully, syncing to database...
[AuthContext] User synced to database: {id: "...", email: "..."}
```

Common errors and solutions:

1. **"OAuth redirect URL not configured"**
   - Add redirect URLs in Supabase Dashboard → Authentication → URL Configuration

2. **"google provider not enabled"**
   - Enable Google provider in Supabase Dashboard → Authentication → Providers

3. **"Failed to sync user"**
   - Check API server is running on port 8082
   - Check `SUPABASE_JWT_SECRET` is set in `api/.env`
   - Check database connection and schema

4. **User redirected back to /auth after sign-in**
   - Check browser console for sync errors
   - Verify `/api/auth/me` endpoint is accessible
   - Check network tab for failed API calls

### 5. Environment Variables

Ensure all required environment variables are set:

#### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Backend (api/.env)
```bash
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
PORT=8082
NODE_ENV=development
```

### 6. How the Flow Works Now

1. **User clicks "Continue with Google"**
   - OAuthButtons component initiates OAuth flow
   - Stores intended destination in sessionStorage
   - Redirects to Google with callback URL: `/auth?oauth_callback=true&from=/professional-dashboard`

2. **User authenticates with Google**
   - Google redirects back to `/auth?oauth_callback=true&from=/professional-dashboard`
   - Supabase creates user in `auth.users` table

3. **AuthPage detects OAuth callback**
   - Checks for `oauth_callback=true` parameter
   - Calls `/api/auth/me` with user's access token
   - API middleware `syncUserFromToken` creates user in `users` table
   - Creates trial subscription in `subscriptions` table

4. **User is redirected to intended page**
   - After successful sync, redirects to `/professional-dashboard`
   - ProtectedRoute allows access since user is authenticated
   - User can now access all protected pages

### 7. Additional Notes

- **Trial Period**: New users get 7 days trial access automatically
- **Session Management**: Sessions are managed by Supabase Auth
- **Token Refresh**: Tokens are automatically refreshed by Supabase client
- **RLS Policies**: Row Level Security ensures users can only access their own data

## Support

If you encounter issues:

1. Check browser console for error messages
2. Check API server logs for backend errors
3. Verify Supabase configuration in dashboard
4. Run `checkAuthConfig()` in browser console for diagnostics
5. Check network tab for failed API calls

## Security Considerations

- Never commit `.env` files with real credentials
- Use service role key only on backend
- Keep JWT secret secure
- Enable RLS on all user-scoped tables
- Rotate keys if accidentally exposed
