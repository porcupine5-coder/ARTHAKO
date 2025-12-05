# Account Enhancements - Setup Checklist

Use this checklist to ensure everything is properly set up and working.

## 📋 Pre-Setup Checklist

- [ ] Supabase project is created and accessible
- [ ] Frontend environment variables are configured (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Development server can connect to Supabase
- [ ] You have admin access to Supabase Dashboard

## 🗄️ Database Setup

### Step 1: Apply SQL Migration
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy contents from `db/account_enhancements.sql`
- [ ] Run the query
- [ ] Verify "Success. No rows returned" message

### Step 2: Verify Tables Created
Run this query to check:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_activity', 'user_preferences');
```
- [ ] `user_activity` table exists
- [ ] `user_preferences` table exists

### Step 3: Verify Columns Added
Run this query:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('display_name', 'profile_media_url', 'two_factor_enabled');
```
- [ ] `display_name` column exists (type: text)
- [ ] `profile_media_url` column exists (type: text)
- [ ] `two_factor_enabled` column exists (type: boolean)

### Step 4: Verify Function Created
Run this query:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_user_stats';
```
- [ ] `get_user_stats` function exists

### Step 5: Verify RLS Policies
Run this query:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_activity', 'user_preferences');
```
- [ ] RLS policies exist for `user_activity`
- [ ] RLS policies exist for `user_preferences`

## 📦 Storage Setup

### Step 1: Create Storage Bucket
- [ ] Go to Supabase Dashboard → Storage
- [ ] Click "New bucket"
- [ ] Name: `profiles`
- [ ] Check "Public bucket"
- [ ] Click "Create bucket"

### Step 2: Configure Bucket Policies
- [ ] Click on `profiles` bucket
- [ ] Go to "Policies" tab
- [ ] Add policy: "Users can upload their own profile media"
- [ ] Add policy: "Public can view profile media"
- [ ] Add policy: "Users can delete their own profile media"

### Step 3: Verify Bucket
- [ ] Bucket `profiles` is visible in Storage
- [ ] Bucket is marked as "Public"
- [ ] Policies are active (green checkmarks)

## 🔐 Authentication Setup

### Enable MFA (for 2FA feature)
- [ ] Go to Supabase Dashboard → Authentication → Providers
- [ ] Scroll to "Multi-Factor Authentication"
- [ ] Enable TOTP (Time-based One-Time Password)
- [ ] Save changes

## 💻 Frontend Verification

### Step 1: Check Files Exist
- [ ] `frontend/src/components/account/AuthModals.tsx`
- [ ] `frontend/src/components/account/Enable2FAModal.tsx`
- [ ] `frontend/src/components/account/ManageSessionsModal.tsx`
- [ ] `frontend/src/components/account/PrivacySettingsModal.tsx`
- [ ] `frontend/src/components/account/ProfileMediaUpload.tsx`
- [ ] `frontend/src/components/account/DisplayNameEditor.tsx`
- [ ] `frontend/src/components/account/ProfileAvatar.tsx`
- [ ] `frontend/src/hooks/useActivityTracker.ts`
- [ ] `frontend/src/types/account.ts`
- [ ] `frontend/src/utils/accountUtils.ts`
- [ ] `frontend/src/ui/pages/Account.tsx` (modified)

### Step 2: Build Check
Run the development server:
```bash
cd frontend
npm run dev
```
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Server starts successfully
- [ ] No console errors on page load

## 🧪 Feature Testing

### Test 1: Display Name
- [ ] Log in to your account
- [ ] Navigate to Account page
- [ ] See your email prefix as default display name
- [ ] Click edit icon next to name
- [ ] Change display name
- [ ] Click save (checkmark)
- [ ] Refresh page
- [ ] Display name persists

### Test 2: Profile Media Upload
- [ ] On Account page, click upload icon on avatar
- [ ] Upload section expands
- [ ] Click "Upload Media" button
- [ ] Select an image file (JPG/PNG)
- [ ] Image uploads and shows preview
- [ ] Refresh page
- [ ] Image persists
- [ ] Try uploading a GIF
- [ ] GIF animates in preview
- [ ] Try uploading a video (MP4)
- [ ] Video auto-plays muted in preview
- [ ] Click "Remove" button
- [ ] Media is removed

### Test 3: User Statistics
- [ ] Check stats on Account page
- [ ] All stats show 0 for new user
- [ ] Navigate to a company detail page
- [ ] Return to Account page
- [ ] Click Refresh
- [ ] "Total Views" increments by 1
- [ ] Use AI prediction feature
- [ ] Return to Account page
- [ ] Click Refresh
- [ ] "AI Predictions Used" increments

### Test 4: Change Password
- [ ] Click "Change Password" in Settings
- [ ] Modal opens
- [ ] Enter new password (less than 8 chars)
- [ ] See validation error
- [ ] Enter valid password
- [ ] Enter different confirmation
- [ ] See "passwords do not match" error
- [ ] Enter matching passwords
- [ ] Click "Update Password"
- [ ] Success - modal closes
- [ ] Log out and log in with new password

### Test 5: Change Email
- [ ] Click "Change Email" in Settings
- [ ] Modal opens
- [ ] Current email is shown (disabled)
- [ ] Enter same email as current
- [ ] See validation error
- [ ] Enter new valid email
- [ ] Click "Update Email"
- [ ] See confirmation message
- [ ] Check new email inbox for confirmation

### Test 6: Enable 2FA
- [ ] Click "Enable 2FA" in Settings
- [ ] Modal opens showing instructions
- [ ] Click "Continue"
- [ ] QR code is displayed
- [ ] Manual code is shown
- [ ] Open authenticator app (Google Authenticator, Authy, etc.)
- [ ] Scan QR code or enter manual code
- [ ] Enter 6-digit code from app
- [ ] Click "Enable 2FA"
- [ ] Success - modal closes
- [ ] See "2FA Enabled" badge on Account page
- [ ] "Enable 2FA" button is now disabled

### Test 7: Manage Active Sessions
- [ ] Click "Manage Active Sessions" in Settings
- [ ] Modal opens
- [ ] Current session is listed
- [ ] Device type icon is shown
- [ ] Browser name is detected
- [ ] "Current Session" badge is visible
- [ ] Active since date is shown
- [ ] Click "Close"

### Test 8: Privacy Settings
- [ ] Click "Privacy Settings" in Settings
- [ ] Modal opens
- [ ] Analytics toggle is visible
- [ ] Toggle analytics off
- [ ] See success message
- [ ] Toggle analytics on
- [ ] Click "Download Data"
- [ ] JSON file downloads
- [ ] Open JSON file
- [ ] Verify it contains user data
- [ ] Click "Delete Activity"
- [ ] Confirm deletion
- [ ] See success message
- [ ] Return to Account page
- [ ] Stats are now 0

### Test 9: Account Details Removed
- [ ] On Account page
- [ ] No "Account Details" section visible
- [ ] Layout spacing looks correct
- [ ] No gaps or misalignment

### Test 10: Mobile Responsiveness
- [ ] Open Account page on mobile (or resize browser)
- [ ] All elements are visible
- [ ] No horizontal scroll
- [ ] Buttons are tappable
- [ ] Modals fit on screen
- [ ] Text is readable

## 🐛 Error Handling

### Test Error States
- [ ] Try uploading file > 10MB → See error message
- [ ] Try uploading unsupported format → See error message
- [ ] Try changing password with weak password → See validation
- [ ] Try changing email to invalid format → See validation
- [ ] Try entering wrong 2FA code → See error message
- [ ] Disconnect internet and try action → See error message

## 📱 Integration Testing

### Test Activity Tracking Hook
Create a test component:
```typescript
import { useActivityTracker } from '../hooks/useActivityTracker'

function TestComponent() {
  const { trackCompanyView } = useActivityTracker()
  
  useEffect(() => {
    trackCompanyView('TEST')
  }, [])
  
  return <div>Testing...</div>
}
```
- [ ] Component renders without errors
- [ ] Activity is tracked in database
- [ ] Stats update on Account page

### Test Profile Avatar Component
Use the avatar component:
```typescript
import { ProfileAvatar } from '../components/account/ProfileAvatar'

<ProfileAvatar
  mediaUrl="https://example.com/image.jpg"
  displayName="Test User"
  size="lg"
  showOnlineIndicator
/>
```
- [ ] Avatar renders correctly
- [ ] Online indicator shows
- [ ] Different sizes work (sm, md, lg, xl)

## 🔍 Console Checks

### Browser Console
- [ ] No errors in console
- [ ] No warnings about missing dependencies
- [ ] No TypeScript errors
- [ ] Network requests succeed (200 status)

### Supabase Logs
- [ ] Go to Supabase Dashboard → Logs
- [ ] Check for any errors
- [ ] Verify RLS policies are working
- [ ] Check storage upload logs

## 📊 Performance Checks

- [ ] Account page loads in < 2 seconds
- [ ] Stats query completes quickly
- [ ] Image uploads complete in reasonable time
- [ ] Modals open/close smoothly
- [ ] No lag when typing in inputs
- [ ] Animations are smooth

## 🔒 Security Checks

- [ ] Cannot access other users' data
- [ ] RLS policies prevent unauthorized access
- [ ] File uploads validate file type
- [ ] File uploads validate file size
- [ ] Password change requires authentication
- [ ] Email change sends confirmation
- [ ] 2FA codes expire after use

## ✅ Final Verification

- [ ] All features work as expected
- [ ] No console errors
- [ ] Database is properly configured
- [ ] Storage is working
- [ ] Authentication is secure
- [ ] UI is responsive
- [ ] Documentation is complete

## 🎉 Success Criteria

When all items above are checked:
- ✅ Account enhancements are fully functional
- ✅ Database is properly set up
- ✅ Storage is configured
- ✅ All features tested and working
- ✅ No errors or warnings
- ✅ Ready for production use

---

## 📞 Troubleshooting

If any checklist item fails, refer to:
- `QUICK_START_ACCOUNT.md` - Setup instructions
- `ACCOUNT_ENHANCEMENTS.md` - Full documentation
- `ARCHITECTURE_ACCOUNT.md` - Technical architecture
- Browser console for error messages
- Supabase Dashboard logs

## 📝 Notes

- Take your time with each step
- Don't skip verification steps
- Test thoroughly before deploying
- Keep documentation handy
- Report any issues found

**Good luck! 🚀**
