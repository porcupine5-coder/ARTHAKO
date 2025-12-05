# OAuth Setup Checklist

Use this checklist to ensure OAuth authentication is properly configured.

## ✅ Pre-Setup

- [ ] Supabase project created
- [ ] Database schema deployed (run `db/schema.sql`)
- [ ] API server can connect to Supabase
- [ ] Frontend can connect to Supabase

## ✅ Supabase Dashboard Configuration

### URL Configuration
- [ ] Navigate to **Authentication** → **URL Configuration**
- [ ] Add redirect URLs:
  - [ ] `http://localhost:5173/auth`
  - [ ] `http://localhost:5173/account`
  - [ ] `http://localhost:5173/professional-dashboard`
  - [ ] (Production) `https://yourdomain.com/auth`
  - [ ] (Production) `https://yourdomain.com/account`
  - [ ] (Production) `https://yourdomain.com/professional-dashboard`
- [ ] Set Site URL:
  - [ ] Development: `http://localhost:5173`
  - [ ] Production: `https://yourdomain.com`

### Google OAuth Provider
- [ ] Navigate to **Authentication** → **Providers**
- [ ] Find **Google** provider
- [ ] Enable the provider
- [ ] Create Google OAuth App:
  - [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
  - [ ] Create/select project
  - [ ] Enable Google+ API
  - [ ] Create OAuth 2.0 Client ID
  - [ ] Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
  - [ ] Copy Client ID and Client Secret
- [ ] Paste credentials into Supabase
- [ ] Save configuration

### GitHub OAuth Provider (Optional)
- [ ] Navigate to **Authentication** → **Providers**
- [ ] Find **GitHub** provider
- [ ] Enable the provider
- [ ] Create GitHub OAuth App:
  - [ ] Go to GitHub Settings → Developer settings → OAuth Apps
  - [ ] Create new OAuth App
  - [ ] Set callback URL: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
  - [ ] Copy Client ID and Client Secret
- [ ] Paste credentials into Supabase
- [ ] Save configuration

## ✅ Environment Variables

### Frontend (.env)
- [ ] Create `frontend/.env` file
- [ ] Add `VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co`
- [ ] Add `VITE_SUPABASE_ANON_KEY=your-anon-key`
- [ ] Verify values are correct (no typos)

### Backend (api/.env)
- [ ] Create `api/.env` file
- [ ] Add `SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co`
- [ ] Add `SUPABASE_KEY=your-service-role-key`
- [ ] Add `SUPABASE_ANON_KEY=your-anon-key`
- [ ] Add `SUPABASE_JWT_SECRET=your-jwt-secret`
- [ ] Add `PORT=8082`
- [ ] Add `NODE_ENV=development`
- [ ] Verify all values are correct

## ✅ Database Schema

- [ ] Connect to Supabase database
- [ ] Run `db/schema.sql` to create tables
- [ ] Verify `users` table exists
- [ ] Verify `subscriptions` table exists
- [ ] Verify RLS is enabled on both tables
- [ ] Verify RLS policies are created

## ✅ Server Setup

- [ ] Install API dependencies: `cd api && npm install`
- [ ] Install Frontend dependencies: `cd frontend && npm install`
- [ ] Start API server: `cd api && npm run dev`
- [ ] Verify API is running on http://localhost:8082
- [ ] Check API health: http://localhost:8082/health
- [ ] Start Frontend: `cd frontend && npm run dev`
- [ ] Verify Frontend is running on http://localhost:5173

## ✅ Testing OAuth Flow

### Google OAuth Test
- [ ] Clear browser data (cookies, localStorage, sessionStorage)
- [ ] Navigate to http://localhost:5173/auth
- [ ] Click "Continue with Google"
- [ ] Verify redirect to Google sign-in page
- [ ] Sign in with Google account
- [ ] Verify redirect back to app
- [ ] Check browser console for sync logs:
  - [ ] `[OAuth] Initiating google OAuth...`
  - [ ] `[AuthPage] OAuth callback detected...`
  - [ ] `[AuthPage] User synced successfully`
- [ ] Verify redirect to `/professional-dashboard`
- [ ] Verify user can access protected pages

### Database Verification
- [ ] Open Supabase Dashboard → Table Editor
- [ ] Check `users` table:
  - [ ] User record exists with correct email
  - [ ] `role` is set to 'user'
  - [ ] `created_at` timestamp is recent
- [ ] Check `subscriptions` table:
  - [ ] Subscription record exists for user
  - [ ] `status` is 'trial'
  - [ ] `trial_ends_at` is 7 days from now

### Protected Routes Test
- [ ] Navigate to `/professional-dashboard` - should work
- [ ] Navigate to `/companies` - should work
- [ ] Navigate to `/account` - should work
- [ ] Sign out
- [ ] Try accessing `/professional-dashboard` - should redirect to `/auth`

### Email/Password Test
- [ ] Navigate to `/auth`
- [ ] Click "Sign Up"
- [ ] Enter email and password
- [ ] Click "Create Account"
- [ ] Check email for verification (if enabled)
- [ ] Sign in with email/password
- [ ] Verify redirect to `/professional-dashboard`
- [ ] Verify user can access protected pages

## ✅ Debugging

If OAuth fails, check:

### Browser Console
- [ ] Look for error messages
- [ ] Check for `[OAuth]` prefixed logs
- [ ] Check for `[AuthPage]` prefixed logs
- [ ] Check for `[AuthContext]` prefixed logs
- [ ] Run `checkAuthConfig()` in console

### Network Tab
- [ ] Check for failed API calls
- [ ] Verify `/api/auth/me` returns 200 OK
- [ ] Check request headers include Authorization token
- [ ] Check response body for user data

### API Server Logs
- [ ] Check terminal running API server
- [ ] Look for `[auth]` prefixed logs
- [ ] Check for database errors
- [ ] Verify JWT verification succeeds

### Common Issues
- [ ] "OAuth redirect URL not configured" → Add URLs in Supabase Dashboard
- [ ] "google provider not enabled" → Enable in Supabase Dashboard
- [ ] "Failed to sync user" → Check API server is running
- [ ] "Invalid token" → Check SUPABASE_JWT_SECRET is set correctly
- [ ] User redirected back to /auth → Check browser console for sync errors

## ✅ Production Deployment

Before deploying to production:

- [ ] Update redirect URLs in Supabase for production domain
- [ ] Update Site URL in Supabase for production domain
- [ ] Set production environment variables
- [ ] Test OAuth flow on production
- [ ] Verify SSL/HTTPS is working
- [ ] Test all protected routes
- [ ] Monitor logs for errors

## 📚 Additional Resources

- **Detailed Guide**: See `OAUTH_SETUP_GUIDE.md`
- **Quick Summary**: See `OAUTH_FIX_SUMMARY.md`
- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth**: https://console.cloud.google.com/
- **GitHub OAuth**: https://github.com/settings/developers

## 🆘 Need Help?

1. Check browser console for error messages
2. Check API server logs
3. Run `checkAuthConfig()` in browser console
4. Review `OAUTH_SETUP_GUIDE.md` for troubleshooting
5. Check Supabase Dashboard for configuration issues
