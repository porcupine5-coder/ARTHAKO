# OAuth Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "OAuth redirect URL not configured"

**Symptoms:**
- Error message appears after clicking "Continue with Google"
- User is not redirected to Google sign-in page

**Cause:**
Redirect URL is not whitelisted in Supabase Dashboard

**Solution:**
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:5173/auth
   http://localhost:5173/account
   http://localhost:5173/professional-dashboard
   ```
4. Save changes
5. Try OAuth again

---

### Issue 2: "google provider not enabled"

**Symptoms:**
- Error message appears when clicking "Continue with Google"
- OAuth flow doesn't start

**Cause:**
Google OAuth provider is not enabled in Supabase

**Solution:**
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Click to expand
5. Toggle **Enable Sign in with Google** to ON
6. Add Google OAuth credentials (Client ID and Secret)
7. Save changes
8. Try OAuth again

---

### Issue 3: User redirected back to /auth after sign-in

**Symptoms:**
- User completes Google sign-in
- Redirected back to /auth page
- Cannot access protected pages
- No error message shown

**Cause:**
User sync to database failed

**Debugging Steps:**

1. **Check Browser Console:**
   ```javascript
   // Look for these logs:
   [AuthPage] OAuth callback detected, syncing user to database...
   [AuthPage] User synced successfully: {...}
   
   // If you see error instead:
   [AuthPage] Failed to sync user: ...
   ```

2. **Check Network Tab:**
   - Look for `/api/auth/me` request
   - Check if it returns 200 OK or error
   - Check response body for user data

3. **Check API Server:**
   - Ensure API server is running on port 8082
   - Check terminal for error logs
   - Look for `[auth]` prefixed messages

**Common Causes:**

a) **API Server Not Running**
   ```bash
   # Start API server
   cd api
   npm run dev
   ```

b) **JWT Secret Mismatch**
   - Check `api/.env` has `SUPABASE_JWT_SECRET`
   - Get correct value from Supabase Dashboard → Settings → API → JWT Secret
   - Restart API server after updating

c) **Database Connection Error**
   - Check `SUPABASE_URL` and `SUPABASE_KEY` in `api/.env`
   - Verify database schema is deployed
   - Check Supabase Dashboard for database status

---

### Issue 4: "Failed to complete sign in" error

**Symptoms:**
- Error message appears after OAuth redirect
- User cannot proceed to dashboard

**Debugging:**

1. **Check Browser Console:**
   ```javascript
   // Look for detailed error:
   [AuthPage] Error syncing user: Error: ...
   ```

2. **Check API Response:**
   - Open Network tab
   - Find `/api/auth/me` request
   - Check response status and body
   - Common errors:
     - 401: Token invalid or expired
     - 403: JWT verification failed
     - 500: Database error

3. **Check API Server Logs:**
   ```
   [auth] JWT verification failed: ...
   [auth] Error inserting user: ...
   [auth] Database error: ...
   ```

**Solutions:**

a) **Token Invalid (401/403)**
   - Clear browser data (cookies, localStorage)
   - Try OAuth flow again
   - Check `SUPABASE_JWT_SECRET` is correct

b) **Database Error (500)**
   - Check database schema is deployed
   - Verify `users` and `subscriptions` tables exist
   - Check RLS policies are enabled
   - Verify API has correct database credentials

---

### Issue 5: User account not created in database

**Symptoms:**
- OAuth sign-in appears successful
- User can't access protected pages
- Database shows no user record

**Debugging:**

1. **Check Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → Users
   - Verify user exists in auth.users table
   - Note the user ID

2. **Check Application Database:**
   - Go to Supabase Dashboard → Table Editor
   - Open `users` table
   - Search for user by email or ID
   - If missing, sync failed

3. **Check API Logs:**
   ```
   [auth] Error inserting user: ...
   [auth] User validation error: ...
   ```

**Solutions:**

a) **Sync Failed During OAuth**
   - Sign out completely
   - Clear browser data
   - Try OAuth flow again
   - Watch console for sync logs

b) **Database Constraints**
   - Check if email already exists
   - Verify schema constraints are correct
   - Check for unique constraint violations

c) **Manual Sync**
   - Get user's access token from browser console:
     ```javascript
     const { data } = await supabase.auth.getSession()
     console.log(data.session.access_token)
     ```
   - Call API manually:
     ```bash
     curl -H "Authorization: Bearer <token>" http://localhost:8082/api/auth/me
     ```

---

### Issue 6: "Invalid token payload" error

**Symptoms:**
- API returns 403 error
- Message: "Invalid token payload"

**Cause:**
JWT token doesn't contain expected claims (sub, email)

**Solution:**

1. **Check Token Structure:**
   ```javascript
   // In browser console:
   const { data } = await supabase.auth.getSession()
   const token = data.session.access_token
   
   // Decode token (don't verify, just decode):
   const parts = token.split('.')
   const payload = JSON.parse(atob(parts[1]))
   console.log(payload)
   
   // Should contain:
   // - sub: user ID
   // - email: user email
   ```

2. **Verify Supabase Configuration:**
   - Check JWT settings in Supabase Dashboard
   - Ensure JWT secret is correct
   - Verify token expiration settings

---

### Issue 7: Protected routes still redirect to /auth

**Symptoms:**
- User successfully signs in
- Redirected to dashboard
- Immediately redirected back to /auth

**Cause:**
AuthContext not detecting user session

**Debugging:**

1. **Check AuthContext State:**
   ```javascript
   // In browser console:
   // (Assuming you expose auth context for debugging)
   console.log('User:', user)
   console.log('Session:', session)
   console.log('Loading:', loading)
   ```

2. **Check localStorage:**
   ```javascript
   // Check if Supabase session is stored:
   Object.keys(localStorage).filter(k => k.includes('supabase'))
   ```

**Solutions:**

a) **Session Not Persisted**
   - Clear browser data
   - Sign in again
   - Check if session is stored in localStorage

b) **AuthContext Not Updating**
   - Check browser console for AuthContext logs
   - Verify `onAuthStateChange` is firing
   - Check for React strict mode double-mounting issues

---

### Issue 8: OAuth works locally but fails in production

**Symptoms:**
- OAuth works on localhost
- Fails on production domain

**Cause:**
Production URLs not configured in Supabase

**Solution:**

1. **Update Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add production URLs:
     ```
     https://yourdomain.com/auth
     https://yourdomain.com/account
     https://yourdomain.com/professional-dashboard
     ```

2. **Update Site URL:**
   - Set Site URL to: `https://yourdomain.com`

3. **Update Environment Variables:**
   - Ensure production environment has correct Supabase credentials
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

4. **Update OAuth Provider:**
   - Go to Google Cloud Console
   - Add production redirect URI:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```

---

### Issue 9: "User not found" after successful OAuth

**Symptoms:**
- OAuth completes successfully
- API returns "User not found" error
- User exists in auth.users but not in users table

**Cause:**
`syncUserFromToken` failed to create user record

**Debugging:**

1. **Check API Logs:**
   ```
   [auth] Failed to sync/create user: ...
   [auth] Error inserting user: ...
   ```

2. **Check Database Constraints:**
   - Verify `users` table schema
   - Check for constraint violations
   - Verify RLS policies allow inserts

**Solution:**

1. **Manual User Creation:**
   ```sql
   -- In Supabase SQL Editor:
   INSERT INTO users (id, email, role)
   VALUES ('user-uuid-from-auth-users', 'user@email.com', 'user');
   
   INSERT INTO subscriptions (user_id, status, trial_ends_at)
   VALUES ('user-uuid-from-auth-users', 'trial', NOW() + INTERVAL '7 days');
   ```

2. **Fix and Retry:**
   - Fix database schema issues
   - Sign out user
   - Clear browser data
   - Try OAuth flow again

---

### Issue 10: Multiple user records created

**Symptoms:**
- User signs in multiple times
- Multiple records in users table with same email

**Cause:**
Race condition or duplicate sync calls

**Solution:**

1. **Clean Up Duplicates:**
   ```sql
   -- Find duplicates:
   SELECT email, COUNT(*) 
   FROM users 
   GROUP BY email 
   HAVING COUNT(*) > 1;
   
   -- Keep only the first record:
   DELETE FROM users 
   WHERE id NOT IN (
     SELECT MIN(id) 
     FROM users 
     GROUP BY email
   );
   ```

2. **Prevent Future Duplicates:**
   - Verify `email` column has UNIQUE constraint
   - Check `syncUserFromToken` uses proper error handling
   - Ensure idempotent operations

---

## Diagnostic Commands

### Browser Console Commands

```javascript
// Check auth configuration
checkAuthConfig()

// Check current session
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)
console.log('User:', data.session?.user)
console.log('Token:', data.session?.access_token)

// Check localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase')) {
    console.log(key, localStorage.getItem(key))
  }
})

// Test API endpoint
const token = (await supabase.auth.getSession()).data.session?.access_token
const response = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
console.log('API Response:', await response.json())
```

### API Server Commands

```bash
# Check API health
curl http://localhost:8082/health

# Test auth endpoint (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" http://localhost:8082/api/auth/me

# Check protected endpoint
curl -H "Authorization: Bearer TOKEN" http://localhost:8082/api/protected/ping
```

### Database Queries

```sql
-- Check if user exists in auth.users
SELECT * FROM auth.users WHERE email = 'user@email.com';

-- Check if user exists in users table
SELECT * FROM users WHERE email = 'user@email.com';

-- Check user's subscription
SELECT s.* FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'user@email.com';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('users', 'subscriptions');
```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Collect Information:**
   - Browser console logs
   - Network tab screenshots
   - API server logs
   - Database query results

2. **Check Documentation:**
   - `OAUTH_SETUP_GUIDE.md` - Detailed setup instructions
   - `OAUTH_FLOW_DIAGRAM.md` - Visual flow diagram
   - `OAUTH_SETUP_CHECKLIST.md` - Configuration checklist

3. **Common Resources:**
   - Supabase Docs: https://supabase.com/docs/guides/auth
   - Supabase Discord: https://discord.supabase.com
   - GitHub Issues: Check for similar issues

4. **Debug Mode:**
   - Enable verbose logging in browser console
   - Check all network requests
   - Verify each step of the OAuth flow
   - Compare with expected flow in diagram
