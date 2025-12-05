# Account Page Component Architecture

## Component Hierarchy

```
Account.tsx (Main Page)
│
├── Hero Section
│   ├── ProfileAvatar
│   │   ├── Image/GIF/Video Rendering
│   │   └── Online Indicator
│   │
│   ├── DisplayNameEditor
│   │   ├── Display Mode (with edit button)
│   │   └── Edit Mode (input + save/cancel)
│   │
│   ├── User Info
│   │   ├── Role Badge
│   │   ├── Last Login
│   │   ├── Access Status
│   │   └── 2FA Status Badge
│   │
│   ├── Action Buttons
│   │   ├── Refresh Button
│   │   └── Sign Out Button
│   │
│   └── ProfileMediaUpload (expandable)
│       ├── Media Preview
│       ├── Upload Button
│       └── Remove Button
│
├── Stats Section
│   ├── StatCard (Total Views)
│   ├── StatCard (Companies Tracked)
│   └── StatCard (AI Predictions Used)
│
├── Settings Section
│   ├── SettingItem (Change Password) → ChangePasswordModal
│   ├── SettingItem (Change Email) → ChangeEmailModal
│   ├── SettingItem (Enable 2FA) → Enable2FAModal
│   ├── SettingItem (Manage Sessions) → ManageSessionsModal
│   └── SettingItem (Privacy Settings) → PrivacySettingsModal
│
└── Modals (Conditional Rendering)
    ├── ChangePasswordModal
    │   ├── New Password Input
    │   ├── Confirm Password Input
    │   └── Submit/Cancel Buttons
    │
    ├── ChangeEmailModal
    │   ├── Current Email (disabled)
    │   ├── New Email Input
    │   └── Submit/Cancel Buttons
    │
    ├── Enable2FAModal
    │   ├── Step 1: Setup
    │   │   ├── Instructions
    │   │   └── Continue Button
    │   └── Step 2: Verify
    │       ├── QR Code Display
    │       ├── Manual Code Display
    │       ├── Verification Input
    │       └── Enable/Back Buttons
    │
    ├── ManageSessionsModal
    │   ├── Session List
    │   │   ├── Session Item
    │   │   │   ├── Device Icon
    │   │   │   ├── Device Name
    │   │   │   ├── Active Since
    │   │   │   └── Sign Out Button
    │   │   └── Current Session Badge
    │   └── Close Button
    │
    └── PrivacySettingsModal
        ├── Analytics Toggle
        ├── Delete Activity Button
        ├── Download Data Button
        └── Close Button
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Actions                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Account.tsx (State)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ - profile (UserProfile)                               │  │
│  │ - stats (UserStats)                                   │  │
│  │ - modal states (boolean flags)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Utility Functions                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ accountUtils.ts                                       │  │
│  │ - getUserStats()                                      │  │
│  │ - updateDisplayName()                                 │  │
│  │ - uploadProfileMedia()                                │  │
│  │ - updateUserPreferences()                             │  │
│  │ - deleteUserActivity()                                │  │
│  │ - downloadAccountData()                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Client                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Database Operations:                                  │  │
│  │ - users table (profile data)                          │  │
│  │ - user_activity table (stats)                         │  │
│  │ - user_preferences table (settings)                   │  │
│  │                                                        │  │
│  │ Storage Operations:                                   │  │
│  │ - profiles bucket (media files)                       │  │
│  │                                                        │  │
│  │ Auth Operations:                                      │  │
│  │ - updateUser() (password/email)                       │  │
│  │ - MFA enroll/verify                                   │  │
│  │ - Session management                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Activity Tracking Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Any Component in Application                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  useActivityTracker Hook                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ trackCompanyView(symbol)                              │  │
│  │ trackPredictionUsed(symbol)                           │  │
│  │ trackCompanyTracked(symbol)                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  trackActivity() Function                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Insert into user_activity:                            │  │
│  │ - user_id                                             │  │
│  │ - activity_type                                       │  │
│  │ - company_symbol                                      │  │
│  │ - timestamp                                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   user_activity Table                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Stores all user interactions                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              get_user_stats() PostgreSQL Function            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Aggregates activity data:                             │  │
│  │ - COUNT(company_viewed) → total_views                 │  │
│  │ - COUNT(DISTINCT company_tracked) → companies_tracked │  │
│  │ - COUNT(prediction_used) → predictions_used           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Account Page Stats Display                 │
└─────────────────────────────────────────────────────────────┘
```

## File Dependencies

```
Account.tsx
├── Imports
│   ├── React (useState, useEffect)
│   ├── react-router-dom (useNavigate)
│   ├── lucide-react (Icons)
│   ├── ../../lib/supabase (getSupabase)
│   ├── ../../lib/apiClient (apiFetch)
│   ├── ../../utils/accountUtils (all utility functions)
│   ├── ../../types/account (TypeScript types)
│   ├── ../../hooks/useActivityTracker (activity tracking)
│   └── ../../components/account/* (all modals & components)
│
└── Exports
    └── default Account (main component)

accountUtils.ts
├── Imports
│   ├── ../../lib/supabase (getSupabase)
│   └── ../../types/account (TypeScript types)
│
└── Exports
    ├── getUserStats()
    ├── trackActivity()
    ├── getUserPreferences()
    ├── updateUserPreferences()
    ├── uploadProfileMedia()
    ├── updateDisplayName()
    ├── updateProfileMediaUrl()
    ├── getActiveSessions()
    ├── signOutSession()
    ├── deleteUserActivity()
    ├── downloadAccountData()
    └── getMediaType()

useActivityTracker.ts
├── Imports
│   ├── React (useCallback)
│   ├── ../lib/supabase (getSupabase)
│   └── ../utils/accountUtils (trackActivity)
│
└── Exports
    └── useActivityTracker() hook
        ├── trackCompanyView()
        ├── trackPredictionUsed()
        └── trackCompanyTracked()
```

## State Management

```
Account.tsx State:
├── profile: UserProfile | null
│   ├── id: string
│   ├── email: string
│   ├── display_name: string
│   ├── profile_media_url: string | null
│   ├── role: string
│   ├── two_factor_enabled: boolean
│   └── last_login_at: string | null
│
├── stats: UserStats
│   ├── total_views: number
│   ├── companies_tracked: number
│   └── predictions_used: number
│
├── access: Access | null
│   ├── status?: string
│   └── trial_ends_at?: string
│
├── msg: string (error messages)
├── mounted: boolean (animation trigger)
│
└── Modal States (all boolean)
    ├── showPasswordModal
    ├── showEmailModal
    ├── show2FAModal
    ├── showSessionsModal
    ├── showPrivacyModal
    └── showMediaUpload
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                          users                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ id (PK)                                               │  │
│  │ email                                                 │  │
│  │ display_name          ← NEW                           │  │
│  │ profile_media_url     ← NEW                           │  │
│  │ two_factor_enabled    ← NEW                           │  │
│  │ role                                                  │  │
│  │ last_login_at                                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (1:N)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      user_activity                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ id (PK)                                               │  │
│  │ user_id (FK) → users.id                               │  │
│  │ activity_type                                         │  │
│  │ company_symbol                                        │  │
│  │ metadata (jsonb)                                      │  │
│  │ created_at                                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    user_preferences                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ user_id (PK, FK) → users.id                           │  │
│  │ allow_analytics                                       │  │
│  │ created_at                                            │  │
│  │ updated_at                                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Auth Check                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Verify JWT token                                      │  │
│  │ Extract user_id from auth.uid()                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Row Level Security (RLS) Policies               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ users:                                                │  │
│  │ - SELECT: auth.uid() = id                             │  │
│  │ - UPDATE: auth.uid() = id                             │  │
│  │                                                        │  │
│  │ user_activity:                                        │  │
│  │ - SELECT: auth.uid() = user_id                        │  │
│  │ - INSERT: auth.uid() = user_id                        │  │
│  │                                                        │  │
│  │ user_preferences:                                     │  │
│  │ - SELECT: auth.uid() = user_id                        │  │
│  │ - INSERT: auth.uid() = user_id                        │  │
│  │ - UPDATE: auth.uid() = user_id                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Operation                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Only returns/modifies user's own data                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Type-safe operations
- ✅ Secure data access
- ✅ Efficient database queries
- ✅ Scalable design
