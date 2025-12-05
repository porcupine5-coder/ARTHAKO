# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the Arthako application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 2: Configure Environment Variables

1. Navigate to the `frontend` directory
2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3: Enable Authentication Providers

### Email/Password Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure email settings:
   - Enable **Confirm email** (recommended for production)
   - For development, you can disable it temporarily

### Google OAuth

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Enable the provider
4. Add your OAuth credentials:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase

### GitHub OAuth

1. Go to **Authentication** → **Providers**
2. Click on **GitHub**
3. Enable the provider
4. Add your OAuth credentials:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret to Supabase

## Step 4: Configure Redirect URLs

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`
3. Add redirect URLs:
   - `http://localhost:5173/account`
   - `https://your-domain.com/account`

## Step 5: Set Up Database (Optional)

If you want to store additional user data:

1. Go to **SQL Editor** in Supabase
2. Create a users table:
   ```sql
   create table public.users (
     id uuid references auth.users on delete cascade primary key,
     email text,
     role text default 'user',
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     trial_ends_at timestamp with time zone
   );

   -- Enable Row Level Security
   alter table public.users enable row level security;

   -- Create policy for users to read their own data
   create policy "Users can view own data"
     on public.users for select
     using (auth.uid() = id);
   ```

## Step 6: Test Authentication

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5173/auth`
3. Try signing up with:
   - Email/Password
   - Google OAuth
   - GitHub OAuth

## Troubleshooting

### "Failed to fetch" Error

**Causes:**
1. Missing or incorrect environment variables
2. Supabase project not accessible
3. CORS issues

**Solutions:**
1. Verify `.env` file exists and has correct values
2. Check Supabase project is active
3. Ensure redirect URLs are configured correctly
4. Restart development server after changing `.env`

### OAuth Not Working

**Causes:**
1. Redirect URLs not configured
2. OAuth provider not enabled
3. Invalid OAuth credentials

**Solutions:**
1. Double-check redirect URLs in Supabase dashboard
2. Verify OAuth provider is enabled and configured
3. Ensure OAuth app callback URLs match Supabase callback URL
4. Check browser console for specific error messages

### Email Confirmation Issues

**For Development:**
- Disable email confirmation in Supabase → Authentication → Providers → Email
- Or check your email for confirmation link

**For Production:**
- Configure email templates in Supabase
- Set up custom SMTP (optional)

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Rotate keys if exposed** - Generate new keys in Supabase dashboard
3. **Use Row Level Security** - Protect your database tables
4. **Enable email confirmation** - For production environments
5. **Set up proper redirect URLs** - Only allow trusted domains

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login)

## Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure your Supabase project is active and not paused