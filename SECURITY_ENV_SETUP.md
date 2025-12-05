# Security & Environment Setup

## Overview

This project uses environment variables to configure runtime secrets and service endpoints.
Hardcoded credentials are a security risk and must not be committed. Use `.env` files locally
and store production secrets in a secret manager or your hosting provider's environment settings.

## Quick Start

1. Copy templates to local .env files:
   - Frontend: `cp frontend/.env.example frontend/.env`
   - API: `cp api/.env.example api/.env`
2. Fill in values from your Supabase project dashboard → Settings → API.
3. Start services:
   - API: `cd api && npm run dev`
   - Frontend: `cd frontend && npm run dev`

If either service fails to start because of missing environment variables, follow the Troubleshooting section below.

## Environment Variables Reference

Frontend (public/client-side)
- `VITE_SUPABASE_URL`: Supabase project REST URL. Found in Supabase dashboard → Settings → API.
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key for client use. Prefixed with `VITE_` so Vite exposes it.

Notes: `VITE_` prefix is required for Vite to expose the variable to client code. The anon key is intended
for public use in the browser but should still not be committed in source control. Rotate keys if exposed.

API (server-side)
- `SUPABASE_URL`: Supabase project URL (same as frontend).
- `SUPABASE_KEY`: Supabase service role key (admin privileges). MUST NOT be exposed to client or committed.
- `PORT`: Port for the API server (default 8082).
- `NODE_ENV`: `development`, `production`, or `test`.

## Secret Rotation Procedure (Supabase keys)

When to rotate:
- Immediately if a key is accidentally committed or logged.
- Immediately if you suspect any unauthorized access.
- Regularly as part of standard security hygiene (e.g., quarterly).

How to rotate safely:
1. In Supabase dashboard → Settings → API, generate new keys (anon and/or service_role as needed).
2. Update `.env` on all environments (local, staging, production) or update secrets in your deployment platform.
3. Restart services to pick up new keys.
4. Verify application functionality.
5. Revoke old keys in the Supabase dashboard.

Emergency rotation steps:
1. Revoke compromised key immediately in Supabase.
2. Generate and propagate new keys to all environments.
3. Rotate any CI/CD or third-party integrations that used the compromised key.
4. Review logs for potential unauthorized activity.

## Troubleshooting

- App exits with missing-env error: Confirm `api/.env` or `frontend/.env` exists and filled in, or that environment variables
  are configured in your hosting environment.
- Frontend build warnings: In dev the Vite dev server will warn if `VITE_` variables are missing; production builds fail fast.
- If you changed keys and things break: restart services and confirm `.env` values are correct.

## CI/CD & Production

- Use your CI provider's secret store (GitHub Actions Secrets, GitLab CI variables, etc.) instead of committing `.env`.
- Do not expose service role keys to the client or in logs.

## References

- Supabase API keys: https://supabase.com/docs
- Vite environment variables: https://vitejs.dev/guide/env-and-mode.html
- dotenv: https://github.com/motdotla/dotenv
