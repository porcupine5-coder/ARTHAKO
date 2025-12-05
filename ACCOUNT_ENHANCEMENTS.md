# Account Page Enhancements - Implementation Guide

## Overview

This implementation adds comprehensive account management features to the Arthako application, including custom usernames, profile media uploads, real-time statistics, and fully functional settings.

## Features Implemented

### 1. Custom Display Names
- **Database Field**: `display_name` column added to `users` table
- **Default Behavior**: Automatically set to email prefix on signup
- **UI**: Inline editor in Account page header with save/cancel
- **Real-time Updates**: Changes immediately reflected in Supabase

### 2. Profile Media Upload
- **Database Field**: `profile_media_url` column added to `users` table
- **Supported Formats**: 
  - Images: JPG, PNG
  - Animated: GIF
  - Video: MP4, WebM (auto-play, muted, looped)
- **Storage**: Supabase Storage bucket `profiles`
- **Display**: Circular avatar with proper rendering for each media type
- **Size Limit**: 10MB maximum

### 3. Dynamic User Statistics
- **Database Table**: `user_activity` tracks all user interactions
- **Real Stats**:
  - **Total Views**: Count of company detail pages viewed
  - **Companies Tracked**: Unique companies saved/tracked by user
  - **AI Predictions Used**: Count of prediction API calls
- **Implementation**: PostgreSQL function `get_user_stats()` for efficient queries
- **Updates**: Real-time on Account page refresh

### 4. Account Details Section Removed
- Completely removed the "Account Details" UI block
- Layout spacing maintained
- All other sections remain unchanged

### 5. Functional Settings

#### Change Password
- Modal with new password + confirmation
- Validation: minimum 8 characters, passwords must match
- Uses Supabase `updateUser({ password })`

#### Change Email
- Modal showing current email and new email input
- Validation: valid email format, different from current
- Sends confirmation email to new address
- Uses Supabase `updateUser({ email })`

#### Enable 2FA
- Two-step process: Setup → Verify
- QR code generation for authenticator apps
- Manual code entry option
- 6-digit verification code input
- Updates `two_factor_enabled` boolean in database
- Badge shown when enabled

#### Manage Active Sessions
- Lists all active sessions with device info
- Shows device type (Desktop/Mobile/Tablet) with icons
- Current session highlighted
- Sign out from specific devices
- Uses Supabase session management

#### Privacy Settings
- **Analytics Toggle**: Allow/deny analytics tracking
- **Delete Activity**: Permanently remove all user activity data
- **Download Data**: Export account data as JSON file
- Stored in `user_preferences` table

## Database Schema

### New Tables

```sql
-- user_activity: Track user interactions
CREATE TABLE user_activity (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  company_symbol text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_preferences: Privacy and preference settings
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allow_analytics boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Modified Tables

```sql
-- users: Add new columns
ALTER TABLE users ADD COLUMN display_name text;
ALTER TABLE users ADD COLUMN profile_media_url text;
ALTER TABLE users ADD COLUMN two_factor_enabled boolean DEFAULT false;
```

## Setup Instructions

### 1. Database Migration

Run the SQL migration:

```bash
# Apply the schema changes
psql -h your-supabase-host -U postgres -d postgres -f db/account_enhancements.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `db/account_enhancements.sql`
3. Run the query

### 2. Supabase Storage Setup

Create the storage bucket for profile media:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `profiles`
3. Set as **Public** bucket
4. Configure CORS if needed

### 3. Environment Variables

Ensure these are set in `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Install Dependencies

No new dependencies required - uses existing Supabase SDK.

## Usage

### Tracking User Activity

Use the `useActivityTracker` hook throughout your app:

```typescript
import { useActivityTracker } from '../hooks/useActivityTracker'

function CompanyDetailPage({ symbol }) {
  const { trackCompanyView, trackPredictionUsed } = useActivityTracker()
  
  useEffect(() => {
    // Track when user views a company
    trackCompanyView(symbol)
  }, [symbol])
  
  const handlePrediction = async () => {
    // Track when user uses AI prediction
    await trackPredictionUsed(symbol)
    // ... prediction logic
  }
}
```

### Displaying Profile Avatar

Use the `ProfileAvatar` component anywhere:

```typescript
import { ProfileAvatar } from '../components/account/ProfileAvatar'

<ProfileAvatar
  mediaUrl={user.profile_media_url}
  displayName={user.display_name}
  size="md"
  showOnlineIndicator
/>
```

## File Structure

```
frontend/src/
├── components/account/
│   ├── AuthModals.tsx              # Password & Email change modals
│   ├── Enable2FAModal.tsx          # 2FA setup modal
│   ├── ManageSessionsModal.tsx     # Session management
│   ├── PrivacySettingsModal.tsx    # Privacy controls
│   ├── ProfileMediaUpload.tsx      # Media upload component
│   ├── DisplayNameEditor.tsx       # Inline name editor
│   └── ProfileAvatar.tsx           # Reusable avatar component
├── hooks/
│   └── useActivityTracker.ts       # Activity tracking hook
├── types/
│   └── account.ts                  # TypeScript types
├── utils/
│   └── accountUtils.ts             # Account utility functions
└── ui/pages/
    └── Account.tsx                 # Main account page

db/
└── account_enhancements.sql        # Database migration
```

## Key Features

### Real-time Stats
- Stats update on page refresh
- Zero values for new users
- Accurate tracking via database queries

### Profile Customization
- Display name editable inline
- Profile media supports images, GIFs, and videos
- Circular rendering with proper aspect ratio

### Security
- 2FA with TOTP (Time-based One-Time Password)
- Session management across devices
- Password change with validation

### Privacy
- Analytics opt-out
- Activity data deletion
- Account data export (GDPR compliance)

## Testing Checklist

- [ ] New user signup creates default display_name
- [ ] Display name can be edited and saved
- [ ] Profile media upload works for images
- [ ] Profile media upload works for GIFs
- [ ] Profile media upload works for videos
- [ ] Stats show 0 for new users
- [ ] Stats increment when tracking activities
- [ ] Change password modal works
- [ ] Change email modal works
- [ ] 2FA setup and verification works
- [ ] Active sessions list displays
- [ ] Privacy settings toggle works
- [ ] Activity deletion works
- [ ] Account data download works
- [ ] Account Details section is removed
- [ ] Layout spacing is correct

## Notes

- All changes are isolated to the Account section
- No modifications to other pages, routing, or global styles
- App name "Arthako" remains unchanged
- Navbar and theme system untouched
- All settings are fully functional (no placeholders)

## Troubleshooting

### Profile media not uploading
- Check Supabase Storage bucket `profiles` exists and is public
- Verify file size is under 10MB
- Check browser console for errors

### Stats not updating
- Ensure `user_activity` table exists
- Check `get_user_stats()` function is created
- Verify RLS policies allow user to read their own data

### 2FA not working
- Ensure Supabase project has MFA enabled
- Check authenticator app is synced with correct time
- Verify 6-digit code is entered correctly

## Future Enhancements

- Profile media cropping tool
- More detailed session information (IP, location)
- Activity export by date range
- Display name uniqueness check
- Profile themes/customization
