# Security: Authentication & Authorization Implementation

## Overview

This document outlines the JWT-based authentication and authorization system using Supabase and Express middleware. The system provides:

- **JWT Token Verification**: All protected endpoints verify Bearer tokens against Supabase's public key
- **User Synchronization**: First-time token verification creates/updates user record in PostgreSQL `users` table
- **Role-Based Access Control (RBAC)**: Middleware supports `requireRole(['admin', 'user'])` protection
- **Trial Subscriptions**: New users automatically receive 7-day trial access
- **Secure Session Management**: Tokens include user ID, email, and role claims

## Environment Configuration

### Required Environment Variables

**Backend** (`api/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
PORT=5001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:5173,https://nepse-app.com
```

**Frontend** (`frontend/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Initialization Guard

The auth middleware validates `SUPABASE_URL` and `SUPABASE_KEY` at server startup. If either is missing, the server exits with error code 1:

```
[auth] Missing SUPABASE_URL or SUPABASE_KEY. Auth middleware cannot initialize.
```

## Core Endpoints

### POST `/auth/register`
Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "role": "user"
  },
  "trialEndsAt": "2025-02-07T10:30:00Z"
}
```

**Error** (400 Bad Request):
```json
{ "error": "Email and password required" }
```

### GET `/auth/me`
Retrieve authenticated user profile and subscription info.

**Request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "role": "user",
  "access": {
    "status": "trial",
    "trial_ends_at": "2025-02-07T10:30:00Z",
    "current_period_end": null
  }
}
```

If no subscription exists:
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "role": "user",
  "access": null
}
```

**Error** (401 Unauthorized):
```json
{ "error": "Unauthenticated" }
```

### GET `/protected/ping`
Test endpoint for protected routes.

**Response** (200 OK):
```json
{ "message": "Authenticated request successful", "user": { "id": "...", "email": "..." } }
```

### GET `/admin/users` (Admin Only)
List all users. Requires `role: 'admin'`.

**Response** (200 OK):
```json
[
  { "id": "uuid", "email": "admin@example.com", "role": "admin" },
  { "id": "uuid", "email": "user@example.com", "role": "user" }
]
```

**Error** (403 Forbidden):
```json
{ "error": "Access denied" }
```

## Middleware Stack

### Authentication Middleware (`authenticateToken`)

Extracts and verifies Bearer tokens from the `Authorization` header.

1. **Token Extraction**: `Authorization: Bearer <token>`
2. **Signature Verification**: Uses `SUPABASE_JWT_SECRET` to verify JWT signature
3. **User Sync**: Creates/updates user in PostgreSQL on first auth
4. **Request Attachment**: Adds `req.user` object with claims:
   ```typescript
   {
     id: string          // User UUID
     email: string       // Email claim from token
     role: string        // Role claim from token
   }
   ```

### Authorization Middleware (`requireRole`)

Returns 403 Forbidden if user's role is not in the allowed list.

**Usage:**
```typescript
app.get('/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
  // Only admin users can access
})
```

## Protected Endpoints (User-Specific Data)

The following endpoints require `authenticateToken` and should use `req.user.id` for user scoping:

| Endpoint | Status | Note |
|----------|--------|------|
| `GET /portfolio/overview` | ⏳ TODO | Replace hardcoded holdings with `WHERE user_id = req.user.id` |
| `GET /portfolio/prediction` | ⏳ TODO | Replace hardcoded predictions with user-specific model |
| `GET /portfolio/analysis` | ⏳ TODO | Future: analyze user's portfolio |
| `GET /watchlist` | ⏳ TODO | Future: return user's saved symbols |

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login_at TIMESTAMP,
  session_expires_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

## Frontend Integration

### Supabase Session Management

The frontend uses `@supabase/supabase-js` to:
1. Listen for authentication state changes
2. Maintain local session in `localStorage`
3. Attach JWT tokens to API requests

**Frontend Setup** (`src/ui/App.tsx`):
```typescript
import { getSupabase } from '../lib/supabase'

const supabase = getSupabase()

// Listen for session changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    // Send to /auth/me for server-side validation
  }
})

// Attach token to requests
const headers = {
  'Authorization': `Bearer ${session?.access_token}`
}
```

### API Client Configuration

All authenticated requests include the JWT:
```typescript
const response = await fetch('/api/portfolio/overview', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
```

## Token Refresh Flow

**Current Implementation (Needs Enhancement):**

1. Supabase client automatically refreshes tokens before expiry
2. Frontend should call `supabase.auth.refreshSession()` on auth state change detection
3. Backend validates tokens on every protected endpoint request

**Recommended Enhancement:**
```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED' || (session && isTokenExpiring(session))) {
    const { data, error } = await supabase.auth.refreshSession(session!)
    if (!error && data.session) {
      // Token refreshed successfully
    } else if (error?.status === 401) {
      // Redirect to login
    }
  }
})
```

## Security Considerations

### Rate Limiting
All endpoints are protected with rate limiting (100 requests per 15 minutes per IP).

### CORS Whitelist
API only accepts requests from origins in `ALLOWED_ORIGINS` environment variable.

### Input Validation
Request bodies are validated before processing. Invalid requests return 400 Bad Request.

### Helmet Security Headers
All responses include security headers (X-Frame-Options, X-Content-Type-Options, etc.).

## Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_KEY" Error
- Ensure `.env` file exists in `api/` directory
- Verify both variables are set and not empty
- Check Supabase project dashboard for correct values

### "Unauthenticated" (401) on Protected Routes
- Verify token is present in `Authorization` header
- Check token format: `Bearer <token>` (space between Bearer and token)
- Confirm token was issued by your Supabase project
- Check token expiry: `token.exp * 1000 < Date.now()`

### "Access denied" (403) on Admin Routes
- Verify user's role is set to 'admin' in database
- Confirm `requireRole` middleware is applied to endpoint

### Database User Not Created
- Check Supabase service role key has `users` table write permissions
- Verify user table exists: `SELECT * FROM users LIMIT 1`

## Next Steps

1. **Add Token Refresh**: Implement `refreshSession()` in frontend auth listener
2. **Enhance Guards**: Add server-side validation in `RequireAuth` component
3. **User Scoping**: Replace hardcoded data with `req.user.id` queries in portfolio endpoints
4. **RLS Policies**: Enable Supabase Row-Level Security for additional table security
5. **Audit Logging**: Track auth events (login, logout, failed attempts) for compliance
