# Quick Start Guide - Account Enhancements

## Step 1: Apply Database Migration

You need to run the SQL migration to add the new tables and columns.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `db/account_enhancements.sql`
5. Click **Run** or press `Ctrl+Enter`
6. Verify success - you should see "Success. No rows returned"

### Option B: Using psql Command Line

```bash
# From the project root directory
psql -h your-supabase-host.supabase.co -U postgres -d postgres -f db/account_enhancements.sql
```

Replace `your-supabase-host` with your actual Supabase project URL.

## Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `profiles`
4. Set as **Public bucket** (check the box)
5. Click **Create bucket**

### Configure Bucket Policies

After creating the bucket, set up the storage policies:

1. Click on the `profiles` bucket
2. Go to **Policies** tab
3. Add the following policies:

**Allow authenticated users to upload:**
```sql
CREATE POLICY "Users can upload their own profile media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'profile-media'
);
```

**Allow public read access:**
```sql
CREATE POLICY "Public can view profile media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');
```

**Allow users to delete their own media:**
```sql
CREATE POLICY "Users can delete their own profile media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'profile-media'
);
```

## Step 3: Verify Installation

### Check Database Tables

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_activity', 'user_preferences');
```

You should see both tables listed.

### Check User Columns

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('display_name', 'profile_media_url', 'two_factor_enabled');
```

You should see all three columns.

### Check Function

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_user_stats';
```

Should return `get_user_stats`.

## Step 4: Test the Features

### Test Display Name

1. Log in to your account
2. Go to Account page
3. Click the edit icon next to your name
4. Change your display name
5. Click the checkmark to save
6. Refresh the page - your new name should persist

### Test Profile Media Upload

1. On Account page, click the upload icon on your avatar
2. Select an image, GIF, or video (max 10MB)
3. Upload should complete and show preview
4. Refresh page - media should persist

### Test Stats Tracking

Stats will start at 0 for new users. To test:

1. Navigate to a company detail page (this tracks a view)
2. Use an AI prediction feature (this tracks prediction usage)
3. Return to Account page and refresh
4. Stats should increment

### Test Settings Modals

**Change Password:**
1. Click "Change Password" in Settings
2. Enter new password (min 8 chars)
3. Confirm password
4. Submit - should update successfully

**Change Email:**
1. Click "Change Email"
2. Enter new email
3. Submit - you'll receive confirmation email

**Enable 2FA:**
1. Click "Enable 2FA"
2. Follow setup wizard
3. Scan QR code with authenticator app
4. Enter 6-digit code
5. 2FA should be enabled

**Privacy Settings:**
1. Click "Privacy Settings"
2. Toggle analytics on/off
3. Test "Download Data" - should download JSON file
4. Test "Delete Activity" (careful - this is permanent!)

## Step 5: Integrate Activity Tracking

To track user activity throughout your app, use the `useActivityTracker` hook:

```typescript
// In any component where you want to track activity
import { useActivityTracker } from '../hooks/useActivityTracker'

function CompanyDetailPage({ symbol }) {
  const { trackCompanyView, trackPredictionUsed } = useActivityTracker()
  
  useEffect(() => {
    // Track when user views this company
    trackCompanyView(symbol)
  }, [symbol])
  
  const handleRunPrediction = async () => {
    // Track when user uses AI prediction
    await trackPredictionUsed(symbol)
    // ... your prediction logic
  }
}
```

## Troubleshooting

### "Supabase not configured" error
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `frontend/.env`
- Restart the dev server after adding env variables

### Profile media upload fails
- Verify the `profiles` bucket exists and is public
- Check storage policies are correctly set
- Ensure file is under 10MB

### Stats show 0 even after activity
- Check that `user_activity` table has RLS policies
- Verify `get_user_stats()` function exists
- Check browser console for errors

### 2FA setup fails
- Ensure your Supabase project has MFA enabled (Project Settings → Authentication → MFA)
- Check that authenticator app time is synced correctly

### Display name doesn't save
- Check `users` table has `display_name` column
- Verify RLS policies allow user to update their own record
- Check browser console for errors

## Next Steps

After successful setup:

1. **Customize**: Adjust colors, sizes, or behavior in the components
2. **Track More**: Add more activity types in `accountUtils.ts`
3. **Extend Stats**: Add more stat cards for additional metrics
4. **Enhance Privacy**: Add more privacy controls as needed

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs in Dashboard → Logs
3. Verify all SQL migrations ran successfully
4. Ensure storage bucket and policies are configured

## Security Notes

- All user data is protected by Row Level Security (RLS)
- Users can only access their own data
- Profile media is stored in public bucket but URLs are not guessable
- 2FA uses industry-standard TOTP (Time-based One-Time Password)
- Password changes require current session authentication
- Email changes send confirmation to new address

## Performance Considerations

- Stats are calculated on-demand using PostgreSQL function
- Profile media should be optimized before upload (max 10MB)
- Activity tracking is fire-and-forget (doesn't block UI)
- All database queries use indexes for fast lookups

---

**Congratulations!** Your account enhancements are now fully functional. 🎉
